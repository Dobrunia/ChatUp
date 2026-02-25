import webpush from 'web-push';
import { config } from '../../config';
import { prisma } from '../../db/prisma';
import { ServiceAccount, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

type WebPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type NativePushToken = {
  token: string;
  platform: string;
};

class PushServiceClass {
  private vapidConfigured = false;
  private firebaseConfigured = false;

  constructor() {
    this.setupVapidIfConfigured();
    this.setupFirebaseIfConfigured();
  }

  private setupVapidIfConfigured() {
    if (config.webPush.publicKey && config.webPush.privateKey && config.webPush.subject) {
      webpush.setVapidDetails(config.webPush.subject, config.webPush.publicKey, config.webPush.privateKey);
      this.vapidConfigured = true;
    }
  }

  private setupFirebaseIfConfigured() {
    const fromBase64 = config.firebase.serviceAccountBase64
      ? Buffer.from(config.firebase.serviceAccountBase64, 'base64').toString('utf8')
      : '';
    const rawJson = config.firebase.serviceAccountJson || fromBase64;
    if (!rawJson) return;

    try {
      const parsed = JSON.parse(rawJson) as ServiceAccount;
      const serviceAccount: ServiceAccount = {
        projectId: parsed.projectId,
        clientEmail: parsed.clientEmail,
        privateKey: parsed.privateKey?.split(String.raw`\n`).join('\n'),
      };
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        return;
      }

      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        getApp();
      }
      this.firebaseConfigured = true;
    } catch {
      this.firebaseConfigured = false;
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

  async registerNativeToken(userId: string, payload: NativePushToken) {
    await prisma.nativePushToken.upsert({
      where: { token: payload.token },
      update: {
        userId,
        platform: payload.platform,
      },
      create: {
        userId,
        token: payload.token,
        platform: payload.platform,
      },
    });
  }

  async unregisterNativeToken(userId: string, token: string) {
    await prisma.nativePushToken.deleteMany({
      where: { userId, token },
    });
  }

  async notifyUsersNewMessage(userIds: string[], payload: { title: string; body: string; dialogId: string }) {
    if (userIds.length === 0) return;

    const payloadData = {
      type: 'NEW_MESSAGE',
      ...payload,
    };

    await this.sendWebPush(userIds, payloadData);
    await this.sendNativePush(userIds, payloadData);
  }

  private async sendWebPush(userIds: string[], payloadData: { title: string; body: string; dialogId: string; type: string }) {
    if (!this.vapidConfigured) return;

    const notificationPayload = JSON.stringify(payloadData);
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

  private async sendNativePush(userIds: string[], payloadData: { title: string; body: string; dialogId: string; type: string }) {
    if (!this.firebaseConfigured) return;

    const tokens = await prisma.nativePushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const tokenList = tokens.map((item) => item.token);
    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: {
        title: payloadData.title,
        body: payloadData.body,
      },
      data: {
        type: payloadData.type,
        dialogId: payloadData.dialogId,
      },
      android: {
        priority: 'high',
      },
    });

    const staleTokens: string[] = [];
    response.responses.forEach((result, idx) => {
      if (result.success) return;
      const code = result.error?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        staleTokens.push(tokenList[idx]);
      }
    });

    if (staleTokens.length > 0) {
      await prisma.nativePushToken.deleteMany({
        where: { token: { in: staleTokens } },
      });
    }
  }
}

export const PushService = new PushServiceClass();
