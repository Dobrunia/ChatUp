import type { Conversation, ConversationReadState, MediaMeta, Message, MessageType } from '../types/chat'
import { supabase } from './supabase-client'

interface ConversationViewRow {
  conversation_id: string
  member_ids: string[]
  unread_count: number
  updated_at: string
  last_message_id: string | null
  last_message_sender_id: string | null
  last_message_type: MessageType | null
  last_message_body: string | null
  last_message_media: {
    url?: string
    type?: MessageType
    size?: number
    duration?: number
  } | null
  last_message_created_at: string | null
}

interface DirectConversationRow {
  conversation_id: string
  user_a?: string
  user_b?: string
}

function isDuplicateInsertError(error: { code?: string; status?: number } | null): boolean {
  if (!error) {
    return false
  }
  return error.code === '23505' || error.status === 409
}

async function ensureMembers(conversationId: string, currentUserId: string, peerUserId: string): Promise<void> {
  const selfMemberInsert = await supabase
    .from('conversation_members')
    .insert({ conversation_id: conversationId, user_id: currentUserId })
  if (selfMemberInsert.error && !isDuplicateInsertError(selfMemberInsert.error)) {
    throw selfMemberInsert.error
  }

  const peerMemberInsert = await supabase
    .from('conversation_members')
    .insert({ conversation_id: conversationId, user_id: peerUserId })
  if (peerMemberInsert.error && !isDuplicateInsertError(peerMemberInsert.error)) {
    throw peerMemberInsert.error
  }
}

async function ensureSelfMemberships(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('direct_conversations')
    .select('conversation_id,user_a,user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  if (error) {
    throw error
  }

  const rows = data as DirectConversationRow[]
  for (const row of rows) {
    const insertOwnMembership = await supabase
      .from('conversation_members')
      .insert({ conversation_id: row.conversation_id, user_id: userId })
    if (insertOwnMembership.error && !isDuplicateInsertError(insertOwnMembership.error)) {
      throw insertOwnMembership.error
    }
  }
}

function normalizeConversation(row: ConversationViewRow): Conversation {
  const members = row.member_ids.length >= 2 ? [row.member_ids[0], row.member_ids[1]] : ['', '']
  const media: MediaMeta | null =
    row.last_message_media?.url && row.last_message_media?.size !== undefined
      ? {
          url: row.last_message_media.url,
          type: row.last_message_media.type ?? (row.last_message_type ?? 'text'),
          size: row.last_message_media.size,
          duration: row.last_message_media.duration,
        }
      : null

  const lastMessage: Message | null =
    row.last_message_id && row.last_message_sender_id && row.last_message_type && row.last_message_created_at
      ? {
          id: row.last_message_id,
          conversationId: row.conversation_id,
          senderId: row.last_message_sender_id,
          type: row.last_message_type,
          body: row.last_message_body,
          media,
          createdAt: row.last_message_created_at,
          status: 'sent',
        }
      : null

  return {
    id: row.conversation_id,
    memberIds: [members[0], members[1]],
    lastMessage,
    unreadCount: row.unread_count ?? 0,
    updatedAt: row.updated_at,
  }
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  try {
    await ensureSelfMemberships(userId)
  } catch {
    // Не блокируем загрузку списка, если heal membership не удался.
  }
  const { data, error } = await supabase
    .from('v_conversations_for_user')
    .select(
      'conversation_id,member_ids,unread_count,updated_at,last_message_id,last_message_sender_id,last_message_type,last_message_body,last_message_media,last_message_created_at',
    )
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
    const peerUserId = userA === pair[0] ? pair[1] : pair[0]
    try {
      await ensureMembers(existing.data.conversation_id, userA, peerUserId)
    } catch {
      // Не блокируем открытие уже существующего диалога, если self-heal membership не прошел.
    }
    return existing.data.conversation_id
  }

  const conversationId = crypto.randomUUID()
  const createdConversation = await supabase
    .from('conversations')
    .insert({ id: conversationId, kind: 'direct' })
  if (createdConversation.error) {
    throw createdConversation.error
  }

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
    const peerUserId = userA === pair[0] ? pair[1] : pair[0]
    try {
      await ensureMembers(maybeDuplicate.data.conversation_id, userA, peerUserId)
    } catch {
      // Не блокируем открытие существующего диалога, если self-heal membership не прошел.
    }
    return maybeDuplicate.data.conversation_id
  }

  const peerUserId = userA === pair[0] ? pair[1] : pair[0]
  await ensureMembers(conversationId, userA, peerUserId)

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
