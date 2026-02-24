import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { trpc } from '../api';

export class PushService {
  public async initPush(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      /** TODO: implement Web Push API (navigator.serviceWorker + PushManager) for PWA support */
      console.warn('Push notifications not available on web for MVP');
      return false;
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
