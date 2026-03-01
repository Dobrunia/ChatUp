import { supabase } from './supabase-client'
import type { PresenceState } from '../types/chat'

interface PresenceRow {
  user_id: string
  is_online: boolean
  updated_at: string
}

function normalizePresence(row: PresenceRow): PresenceState {
  return {
    userId: row.user_id,
    isOnline: row.is_online,
    updatedAt: row.updated_at,
  }
}

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
    .maybeSingle<PresenceRow>()
  if (error) {
    throw error
  }
  return data ? normalizePresence(data) : null
}

export async function fetchPresenceBatch(userIds: string[]): Promise<PresenceState[]> {
  if (userIds.length === 0) {
    return []
  }
  const { data, error } = await supabase
    .from('presence')
    .select('user_id,is_online,updated_at')
    .in('user_id', userIds)
  if (error) {
    throw error
  }
  return (data as PresenceRow[]).map(normalizePresence)
}
