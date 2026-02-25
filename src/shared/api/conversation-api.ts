import type { Conversation, ConversationReadState } from '../types/chat'
import { supabase } from './supabase-client'

interface ConversationRow {
  id: string
  user_a: string
  user_b: string
  updated_at: string
}

function normalizeConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    memberIds: [row.user_a, row.user_b],
    lastMessage: null,
    unreadCount: 0,
    updatedAt: row.updated_at,
  }
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id,user_a,user_b,updated_at')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .returns<ConversationRow[]>()
  if (error) {
    throw error
  }
  return data.map(normalizeConversation)
}

export async function ensureConversation(userA: string, userB: string): Promise<string> {
  const pair = [userA, userB].sort()
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      {
        user_a: pair[0],
        user_b: pair[1],
      },
      { onConflict: 'user_a,user_b' },
    )
    .select('id')
    .single<{ id: string }>()
  if (error) {
    throw error
  }
  return data.id
}

export async function updateLastReadAt(readState: ConversationReadState): Promise<void> {
  const { error } = await supabase.from('conversation_reads').upsert({
    conversation_id: readState.conversationId,
    user_id: readState.userId,
    last_read_at: readState.lastReadAt,
  })
  if (error) {
    throw error
  }
}
