import type { Profile } from '../types/chat'
import { supabase } from './supabase-client'

interface SearchRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

function normalizeRow(row: SearchRow): Profile {
  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    notificationsEnabled: true,
  }
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const likeValue = `%${query.toLowerCase()}%`
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url')
    .or(`username.ilike.${likeValue},display_name.ilike.${likeValue}`)
    .limit(30)
  if (error) {
    throw error
  }
  return (data as SearchRow[]).map(normalizeRow)
}
