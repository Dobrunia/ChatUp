import { PushNotifications } from '@capacitor/push-notifications'
import { savePushToken } from '../api/push-api'

let pushInitialized = false

export function usePush() {
  async function requestAndRegisterPush(userId: string): Promise<void> {
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      throw new Error('Push permission denied')
    }

    if (!pushInitialized) {
      pushInitialized = true
      await PushNotifications.addListener('registration', async (token) => {
        await savePushToken(userId, token.value)
      })
    }

    await PushNotifications.register()
  }

  return { requestAndRegisterPush }
}
