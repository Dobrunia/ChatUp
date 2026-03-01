import type { RealtimeChannel } from '@supabase/supabase-js'
import type { PresenceState, RecordingEventPayload, TypingEventPayload } from '../types/chat'
import { supabase } from './supabase-client'

type MessageInsertHandler = (messageId: string) => void
type TypingHandler = (payload: TypingEventPayload) => void
type RecordingHandler = (payload: RecordingEventPayload) => void
type ConversationsUpdateHandler = () => void
type PresenceUpdateHandler = (state: PresenceState) => void

export function subscribeMessages(conversationId: string, handler: MessageInsertHandler): RealtimeChannel {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const id = payload.new.id as string
        handler(id)
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const id = payload.new.id as string
        handler(id)
      },
    )
    .subscribe()
}

export function subscribeTyping(conversationId: string, handler: TypingHandler): RealtimeChannel {
  return supabase
    .channel(`typing:${conversationId}`)
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      handler(payload as TypingEventPayload)
    })
    .subscribe()
}

export function subscribeRecording(
  conversationId: string,
  handler: RecordingHandler,
): RealtimeChannel {
  return supabase
    .channel(`recording:${conversationId}`)
    .on('broadcast', { event: 'recording' }, ({ payload }) => {
      handler(payload as RecordingEventPayload)
    })
    .subscribe()
}

export async function sendTyping(
  channel: RealtimeChannel,
  payload: TypingEventPayload,
): Promise<void> {
  await channel.send({ type: 'broadcast', event: 'typing', payload })
}

export async function sendRecording(
  channel: RealtimeChannel,
  payload: RecordingEventPayload,
): Promise<void> {
  await channel.send({ type: 'broadcast', event: 'recording', payload })
}

export function subscribeConversationsGlobal(
  userId: string,
  handler: ConversationsUpdateHandler,
): RealtimeChannel {
  return supabase
    .channel(`conversations-global:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, handler)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversation_members' },
      handler,
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversation_members' },
      handler,
    )
    .subscribe()
}

export function subscribePeerPresence(
  peerUserId: string,
  handler: PresenceUpdateHandler,
): RealtimeChannel {
  return supabase
    .channel(`peer-presence:${peerUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'presence',
        filter: `user_id=eq.${peerUserId}`,
      },
      (payload) => {
        handler({
          userId: payload.new.user_id as string,
          isOnline: payload.new.is_online as boolean,
          updatedAt: payload.new.updated_at as string,
        })
      },
    )
    .subscribe()
}
