import type { MediaMeta, Message, MessageType } from '../types/chat'
import { supabase } from './supabase-client'

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  status: 'sent' | 'read'
  body: string | null
  media: {
    url?: string
    type?: MessageType
    size?: number
    duration?: number
  } | null
  client_id: string
  created_at: string
}

function normalizeMedia(row: MessageRow): MediaMeta | null {
  // DEBUG
  console.log('[DEBUG normalizeMedia] row.media:', row.media, 'row.type:', row.type)
  
  if (!row.media?.url || row.media.size === undefined) {
    console.log('[DEBUG normalizeMedia] returning null - url or size missing')
    return null
  }
  return {
    url: row.media.url,
    type: row.media.type ?? row.type,
    size: row.media.size,
    duration: row.media.duration,
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
    status: row.status ?? 'sent',
  }
}

export async function fetchMessages(
  conversationId: string,
  limit = 30,
  beforeCreatedAt?: string,
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('id,conversation_id,sender_id,type,status,body,media,client_id,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt)
  }
  const { data, error } = await query
  if (error) {
    throw error
  }
  return (data as MessageRow[]).reverse().map(normalizeMessage)
}

export async function insertMessage(message: Message): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      type: message.type,
      body: message.body,
      media: message.media
        ? {
            url: message.media.url,
            type: message.media.type,
            size: message.media.size,
            duration: message.media.duration,
          }
        : null,
      status: 'sent',
      client_id: message.id,
    })
    .select('id,conversation_id,sender_id,type,status,body,media,client_id,created_at')
    .single<MessageRow>()
  if (error) {
    throw error
  }
  return normalizeMessage(data)
}
