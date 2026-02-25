import { supabase } from './supabase-client'

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').upsert({
    user_id: userId,
    token,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    throw error
  }
}
