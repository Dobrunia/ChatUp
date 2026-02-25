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

export async function fetchRandomUsers(limit: number, excludeUserId?: string): Promise<Profile[]> {
  let queryBuilder = supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url')
    .limit(20)

  if (excludeUserId) {
    queryBuilder = queryBuilder.neq('id', excludeUserId)
  }

  const { data, error } = await queryBuilder
  if (error) {
    throw error
  }

  const users = (data as SearchRow[]).map(normalizeRow)
  const shuffled = [...users]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled.slice(0, limit)
}
