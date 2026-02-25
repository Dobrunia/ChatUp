import { PushNotifications } from '@capacitor/push-notifications'
import { savePushToken } from '../api/push-api'

export function usePush() {
  async function requestAndRegisterPush(userId: string): Promise<void> {
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      throw new Error('Push permission denied')
    }
    await PushNotifications.register()
    await PushNotifications.addListener('registration', async (token) => {
      await savePushToken(userId, token.value)
    })
  }

  return { requestAndRegisterPush }
}
