import { supabase } from './supabase-client'

export async function setPresence(userId: string, isOnline: boolean): Promise<void> {
  const { error } = await supabase.from('presence').upsert({
    user_id: userId,
    is_online: isOnline,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    throw error
  }
}
