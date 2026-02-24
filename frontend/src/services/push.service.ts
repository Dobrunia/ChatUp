import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { config } from '../config';
import { trpc } from '../api';

export class PushService {
  private base64UrlToUint8Array(base64Url: string): Uint8Array {
    const padding = '='.repeat((4 - base64Url.length % 4) % 4);
    const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      output[i] = rawData.charCodeAt(i);
    }
    return output;
  }

  private async initWebPush(): Promise<boolean> {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push is not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    if (config.webPush.publicKey) {
      const existing = await registration.pushManager.getSubscription();
      let subscription = existing;
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.base64UrlToUint8Array(config.webPush.publicKey) as BufferSource,
        });
      }

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
    }

    return true;
  }

  public async initPush(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return this.initWebPush();
    }

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return false;
    }

    await PushNotifications.register();
    return true;
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
