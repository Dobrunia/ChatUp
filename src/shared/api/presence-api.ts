import { supabase } from './supabase-client'
import type { PresenceState } from '../types/chat'

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

export async function fetchPresence(userId: string): Promise<PresenceState | null> {
  const { data, error } = await supabase
    .from('presence')
    .select('user_id,is_online,updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    throw error
  }
  if (!data) {
    return null
  }
  return {
    userId: data.user_id,
    isOnline: data.is_online,
    updatedAt: data.updated_at,
  }
}
