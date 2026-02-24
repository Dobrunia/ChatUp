import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { config } from '../config';
import { trpc } from '../api';

export type PushInitFailureReason =
  | 'insecure_context'
  | 'unsupported'
  | 'permission_denied'
  | 'public_key_missing'
  | 'register_failed';

export type PushInitResult =
  | { ok: true }
  | { ok: false; reason: PushInitFailureReason };

export class PushService {
  private base64UrlToUint8Array(base64Url: string): Uint8Array {
    const padding = '='.repeat((4 - base64Url.length % 4) % 4);
    const base64 = (base64Url + padding).replaceAll('-', '+').replaceAll('_', '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      output[i] = rawData.codePointAt(i) ?? 0;
    }
    return output;
  }

  private async initWebPush(): Promise<PushInitResult> {
    if (!globalThis.isSecureContext) {
      return { ok: false, reason: 'insecure_context' };
    }

    if (!('Notification' in globalThis) || !('serviceWorker' in navigator) || !('PushManager' in globalThis)) {
      return { ok: false, reason: 'unsupported' };
    }

    if (!config.webPush.publicKey) {
      return { ok: false, reason: 'public_key_missing' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { ok: false, reason: 'permission_denied' };
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      let subscription = existing;
      subscription ??= await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.base64UrlToUint8Array(config.webPush.publicKey) as BufferSource,
      });

      if (subscription) {
        const json = subscription.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await trpc.push.registerWebSubscription.mutate({
            endpoint: json.endpoint,
            keys: {
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
            },
          });
        }
      }

      return { ok: true };
    } catch (error) {
      console.error('Web push init failed', error);
      return { ok: false, reason: 'register_failed' };
    }
  }

  public async initPush(): Promise<PushInitResult> {
    if (Capacitor.getPlatform() === 'web') {
      return this.initWebPush();
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return { ok: false, reason: 'permission_denied' };
      }

      await PushNotifications.register();
      return { ok: true };
    } catch (error) {
      console.error('Native push init failed', error);
      return { ok: false, reason: 'register_failed' };
    }
  }

  public registerListeners() {
    if (Capacitor.getPlatform() === 'web') return;

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
    });
  }
}

export const pushService = new PushService();
