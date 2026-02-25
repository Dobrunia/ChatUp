import type { Conversation, ConversationReadState } from '../types/chat'
import { supabase } from './supabase-client'

interface ConversationViewRow {
  conversation_id: string
  member_ids: string[]
  unread_count: number
  updated_at: string
}

interface DirectConversationRow {
  conversation_id: string
}

function normalizeConversation(row: ConversationViewRow): Conversation {
  const members = row.member_ids.length >= 2 ? [row.member_ids[0], row.member_ids[1]] : ['', '']
  return {
    id: row.conversation_id,
    memberIds: [members[0], members[1]],
    lastMessage: null,
    unreadCount: row.unread_count ?? 0,
    updatedAt: row.updated_at,
  }
}

export async function fetchConversations(_userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('v_conversations_for_user')
    .select('conversation_id,member_ids,unread_count,updated_at')
    .order('updated_at', { ascending: false })
  if (error) {
    throw error
  }
  return (data as ConversationViewRow[]).map(normalizeConversation)
}

export async function ensureConversation(userA: string, userB: string): Promise<string> {
  const pair = [userA, userB].sort((a, b) => a.localeCompare(b))
  const pairKey = `${pair[0]}:${pair[1]}`

  const existing = await supabase
    .from('direct_conversations')
    .select('conversation_id')
    .eq('pair_key', pairKey)
    .maybeSingle<DirectConversationRow>()
  if (existing.error) {
    throw existing.error
  }
  if (existing.data?.conversation_id) {
    return existing.data.conversation_id
  }

  const createdConversation = await supabase
    .from('conversations')
    .insert({ kind: 'direct' })
    .select('id')
    .single<{ id: string }>()
  if (createdConversation.error) {
    throw createdConversation.error
  }

  const conversationId = createdConversation.data.id

  const createdDirect = await supabase.from('direct_conversations').insert({
    conversation_id: conversationId,
    user_a: pair[0],
    user_b: pair[1],
    pair_key: pairKey,
  })
  if (createdDirect.error) {
    const maybeDuplicate = await supabase
      .from('direct_conversations')
      .select('conversation_id')
      .eq('pair_key', pairKey)
      .maybeSingle<DirectConversationRow>()
    if (maybeDuplicate.error || !maybeDuplicate.data?.conversation_id) {
      throw createdDirect.error
    }
    return maybeDuplicate.data.conversation_id
  }

  const membersInsert = await supabase.from('conversation_members').upsert(
    [
      { conversation_id: conversationId, user_id: pair[0] },
      { conversation_id: conversationId, user_id: pair[1] },
    ],
    { onConflict: 'conversation_id,user_id' },
  )
  if (membersInsert.error) {
    throw membersInsert.error
  }

  return conversationId
}

export async function updateLastReadAt(readState: ConversationReadState): Promise<void> {
  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: readState.lastReadAt })
    .eq('conversation_id', readState.conversationId)
    .eq('user_id', readState.userId)
  if (error) {
    throw error
  }
}
