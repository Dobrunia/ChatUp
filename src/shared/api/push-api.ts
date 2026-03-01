import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase-client'

type DevicePlatform = 'android' | 'ios'

function getPlatform(): DevicePlatform {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') {
    return platform
  }
  return 'android'
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('device_tokens').upsert(
    {
      user_id: userId,
      token,
      platform: getPlatform(),
    },
    { onConflict: 'token' },
  )
  if (error) {
    throw error
  }
}
