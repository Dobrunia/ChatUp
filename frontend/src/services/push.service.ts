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
  private readonly nativeTokenStorageKey = 'native.push.token';
  private nativeListenersAttached = false;

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
      this.registerListeners();
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
    if (Capacitor.getPlatform() === 'web' || this.nativeListenersAttached) return;
    this.nativeListenersAttached = true;

    PushNotifications.addListener('registration', async (token) => {
      localStorage.setItem(this.nativeTokenStorageKey, token.value);
      try {
        await trpc.push.registerNativeToken.mutate({
          token: token.value,
          platform: Capacitor.getPlatform(),
        });
      } catch (error) {
        console.error('Failed to register native push token on backend', error);
      }
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

  public async disablePush(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        try {
          await trpc.push.unregisterWebSubscription.mutate({ endpoint });
        } catch (error) {
          console.error('Failed to unregister web push subscription', error);
        }
      }
      return;
    }

    const token = localStorage.getItem(this.nativeTokenStorageKey);
    if (!token) return;
    try {
      await trpc.push.unregisterNativeToken.mutate({ token });
    } catch (error) {
      console.error('Failed to unregister native push token', error);
    } finally {
      localStorage.removeItem(this.nativeTokenStorageKey);
    }
  }
}

export const pushService = new PushService();
