import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { trpc } from '../api';

export class PushService {
  public async initPush() {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('Push notifications not available on web for MVP');
      return;
    }

    // Check permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    // Register with Apple / Google to receive token
    await PushNotifications.register();
  }

  public registerListeners() {
    if (Capacitor.getPlatform() === 'web') return;

    // On success, we should send the token to our server
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // For MVP: Send this to backend to associate with userId
      // trpc.profile.updateDeviceToken.mutate({ token: token.value });
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
      // Handle navigation to chat...
    });
  }
}

export const pushService = new PushService();
