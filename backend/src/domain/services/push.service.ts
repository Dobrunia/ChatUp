import webpush from 'web-push';
import { config } from '../../config';
import { prisma } from '../../db/prisma';

type WebPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

class PushServiceClass {
  private vapidConfigured = false;

  constructor() {
    this.setupVapidIfConfigured();
  }

  private setupVapidIfConfigured() {
    if (config.webPush.publicKey && config.webPush.privateKey && config.webPush.subject) {
      webpush.setVapidDetails(config.webPush.subject, config.webPush.publicKey, config.webPush.privateKey);
      this.vapidConfigured = true;
    }
  }

  async registerWebSubscription(userId: string, subscription: WebPushSubscription) {
    await prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async unregisterWebSubscription(userId: string, endpoint: string) {
    await prisma.webPushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async notifyUsersNewMessage(userIds: string[], payload: { title: string; body: string; dialogId: string }) {
    if (!this.vapidConfigured) return;
    if (userIds.length === 0) return;

    const notificationPayload = JSON.stringify({
      type: 'NEW_MESSAGE',
      ...payload,
    });

    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    const staleIds: string[] = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    }

    if (staleIds.length > 0) {
      await prisma.webPushSubscription.deleteMany({
        where: { id: { in: staleIds } },
      });
    }
  }
}

export const PushService = new PushServiceClass();
