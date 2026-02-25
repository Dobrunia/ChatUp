import type { Profile } from '../types/chat'
import { supabase } from './supabase-client'

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  notifications_enabled: boolean | null
}

function normalizeProfile(row: ProfileRow): Profile {
  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    notificationsEnabled: row.notifications_enabled ?? true,
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url,notifications_enabled')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()
  if (error) {
    throw error
  }
  return data ? normalizeProfile(data) : null
}

export async function isUsernameAvailable(username: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', userId)
    .limit(1)
  if (error) {
    throw error
  }
  return data.length === 0
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: profile.userId,
    username: profile.username,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    notifications_enabled: profile.notificationsEnabled,
  })
  if (error) {
    throw error
  }
}

export async function saveInitialDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
  if (error) {
    throw error
  }
}
