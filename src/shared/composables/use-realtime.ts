import type { RealtimeChannel } from '@supabase/supabase-js'
import { ref } from 'vue'
import {
  sendRecording,
  sendTyping,
  subscribeMessages,
  subscribeRecording,
  subscribeTyping,
} from '../api/realtime-api'
import type { RecordingEventPayload, TypingEventPayload } from '../types/chat'

const typingByConversation = ref<Record<string, string[]>>({})
const recordingByConversation = ref<Record<string, string[]>>({})
let typingStopTimer: ReturnType<typeof setTimeout> | null = null

export function useRealtime() {
  const channels = new Set<RealtimeChannel>()

  function subscribeToConversation(
    conversationId: string,
    onMessageInsert: (id: string) => void,
  ): () => void {
    const msgChannel = subscribeMessages(conversationId, onMessageInsert)
    const typingChannel = subscribeTyping(conversationId, (payload) => {
      updateTyping(payload)
    })
    const recordingChannel = subscribeRecording(conversationId, (payload) => {
      updateRecording(payload)
    })
    channels.add(msgChannel)
    channels.add(typingChannel)
    channels.add(recordingChannel)

    return () => {
      msgChannel.unsubscribe()
      typingChannel.unsubscribe()
      recordingChannel.unsubscribe()
      channels.delete(msgChannel)
      channels.delete(typingChannel)
      channels.delete(recordingChannel)
    }
  }

  function clearAllSubscriptions(): void {
    channels.forEach((channel) => {
      channel.unsubscribe()
    })
    channels.clear()
  }

  function updateTyping(payload: TypingEventPayload): void {
    const previous = typingByConversation.value[payload.conversationId] ?? []
    typingByConversation.value[payload.conversationId] =
      payload.state === 'start'
        ? [...new Set([...previous, payload.userId])]
        : previous.filter((id) => id !== payload.userId)
  }

  function updateRecording(payload: RecordingEventPayload): void {
    const previous = recordingByConversation.value[payload.conversationId] ?? []
    recordingByConversation.value[payload.conversationId] =
      payload.state === 'start'
        ? [...new Set([...previous, payload.userId])]
        : previous.filter((id) => id !== payload.userId)
  }

  async function emitTypingStart(conversationId: string, userId: string): Promise<void> {
    const payload: TypingEventPayload = {
      conversationId,
      userId,
      state: 'start',
      sentAt: new Date().toISOString(),
    }
    await sendTyping(payload)
  }

  async function emitTypingDebouncedStop(conversationId: string, userId: string): Promise<void> {
    if (typingStopTimer) {
      clearTimeout(typingStopTimer)
      typingStopTimer = null
    }
    typingStopTimer = setTimeout(async () => {
      const payload: TypingEventPayload = {
        conversationId,
        userId,
        state: 'stop',
        sentAt: new Date().toISOString(),
      }
      await sendTyping(payload)
    }, 3000)
  }

  async function emitRecording(conversationId: string, userId: string, state: 'start' | 'stop'): Promise<void> {
    await sendRecording({
      conversationId,
      userId,
      state,
      sentAt: new Date().toISOString(),
    })
  }

  return {
    typingByConversation,
    recordingByConversation,
    subscribeToConversation,
    clearAllSubscriptions,
    emitTypingStart,
    emitTypingDebouncedStop,
    emitRecording,
  }
}
