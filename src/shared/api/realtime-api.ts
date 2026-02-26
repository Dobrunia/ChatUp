import type { RealtimeChannel } from '@supabase/supabase-js'
import type { RecordingEventPayload, TypingEventPayload } from '../types/chat'
import { supabase } from './supabase-client'

type MessageInsertHandler = (messageId: string) => void
type TypingHandler = (payload: TypingEventPayload) => void
type RecordingHandler = (payload: RecordingEventPayload) => void

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

export async function sendTyping(payload: TypingEventPayload): Promise<void> {
  const channel = supabase.channel(`typing:${payload.conversationId}`)
  await channel.send({ type: 'broadcast', event: 'typing', payload })
}

export async function sendRecording(payload: RecordingEventPayload): Promise<void> {
  const channel = supabase.channel(`recording:${payload.conversationId}`)
  await channel.send({ type: 'broadcast', event: 'recording', payload })
}
