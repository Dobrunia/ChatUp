import type { MediaMeta, Message, MessageType } from '../types/chat'
import { supabase } from './supabase-client'

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  body: string | null
  media_url: string | null
  media_size: number | null
  media_duration: number | null
  created_at: string
}

function normalizeMedia(row: MessageRow): MediaMeta | null {
  if (!row.media_url || row.media_size === null) {
    return null
  }
  return {
    url: row.media_url,
    type: row.type,
    size: row.media_size,
    duration: row.media_duration ?? undefined,
  }
}

function normalizeMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    type: row.type,
    body: row.body,
    media: normalizeMedia(row),
    createdAt: row.created_at,
    status: 'sent',
  }
}

export async function fetchMessages(conversationId: string, limit = 30): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(
      'id,conversation_id,sender_id,type,body,media_url,media_size,media_duration,created_at',
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<MessageRow[]>()
  if (error) {
    throw error
  }
  return data.reverse().map(normalizeMessage)
}

export async function insertMessage(message: Message): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      type: message.type,
      body: message.body,
      media_url: message.media?.url ?? null,
      media_size: message.media?.size ?? null,
      media_duration: message.media?.duration ?? null,
    })
    .select('id,conversation_id,sender_id,type,body,media_url,media_size,media_duration,created_at')
    .single<MessageRow>()
  if (error) {
    throw error
  }
  return normalizeMessage(data)
}
