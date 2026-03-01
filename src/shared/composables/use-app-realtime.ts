import { ref, shallowRef } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  subscribeConversationsGlobal,
  subscribePeerPresence,
  subscribeMessages,
  subscribeTyping,
  subscribeRecording,
  sendTyping,
  sendRecording,
} from '../api/realtime-api'
import type { PresenceState, RecordingEventPayload, TypingEventPayload } from '../types/chat'

// ─── Singleton state (module-level) ──────────────────────────────────────────
// All channels live here so the entire app shares one set of subscriptions.
// shallowRef is used so Vue doesn't deep-proxy RealtimeChannel instances,
// which would break internal Supabase type checks.

const globalChannel = shallowRef<RealtimeChannel | null>(null)
const messageChannel = shallowRef<RealtimeChannel | null>(null)
const typingChannel = shallowRef<RealtimeChannel | null>(null)
const recordingChannel = shallowRef<RealtimeChannel | null>(null)
const presenceChannel = shallowRef<RealtimeChannel | null>(null)

const typingByConversation = ref<Record<string, string[]>>({})
const recordingByConversation = ref<Record<string, string[]>>({})

let typingStopTimer: ReturnType<typeof setTimeout> | null = null

// ─── Internal helpers ─────────────────────────────────────────────────────────

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

// ─── Public composable ────────────────────────────────────────────────────────

export function useAppRealtime() {
  // ── Global: new messages / new conversation members ──────────────────────
  function startGlobal(userId: string, onUpdate: () => void): void {
    if (globalChannel.value) return // already running
    globalChannel.value = subscribeConversationsGlobal(userId, onUpdate)
  }

  function stopGlobal(): void {
    globalChannel.value?.unsubscribe()
    globalChannel.value = null
  }

  // ── Per-conversation: messages, typing, recording ─────────────────────────
  function startConversation(conversationId: string, onMessage: () => void): void {
    stopConversation()
    messageChannel.value = subscribeMessages(conversationId, onMessage)
    typingChannel.value = subscribeTyping(conversationId, updateTyping)
    recordingChannel.value = subscribeRecording(conversationId, updateRecording)
  }

  function stopConversation(): void {
    if (typingStopTimer) {
      clearTimeout(typingStopTimer)
      typingStopTimer = null
    }
    messageChannel.value?.unsubscribe()
    messageChannel.value = null
    typingChannel.value?.unsubscribe()
    typingChannel.value = null
    recordingChannel.value?.unsubscribe()
    recordingChannel.value = null
  }

  // ── Presence: one peer at a time ──────────────────────────────────────────
  function startPresence(peerUserId: string, onPresence: (state: PresenceState) => void): void {
    stopPresence()
    presenceChannel.value = subscribePeerPresence(peerUserId, onPresence)
  }

  function stopPresence(): void {
    presenceChannel.value?.unsubscribe()
    presenceChannel.value = null
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────
  // Use the already-subscribed channel so broadcast is guaranteed to send.

  async function emitTypingStart(conversationId: string, userId: string): Promise<void> {
    if (!typingChannel.value) return
    const payload: TypingEventPayload = {
      conversationId,
      userId,
      state: 'start',
      sentAt: new Date().toISOString(),
    }
    await sendTyping(typingChannel.value, payload)
  }

  async function emitTypingDebouncedStop(conversationId: string, userId: string): Promise<void> {
    if (typingStopTimer) {
      clearTimeout(typingStopTimer)
      typingStopTimer = null
    }
    typingStopTimer = setTimeout(async () => {
      if (!typingChannel.value) return
      const payload: TypingEventPayload = {
        conversationId,
        userId,
        state: 'stop',
        sentAt: new Date().toISOString(),
      }
      await sendTyping(typingChannel.value, payload)
    }, 3000)
  }

  async function emitRecording(
    conversationId: string,
    userId: string,
    state: 'start' | 'stop',
  ): Promise<void> {
    if (!recordingChannel.value) return
    const payload: RecordingEventPayload = {
      conversationId,
      userId,
      state,
      sentAt: new Date().toISOString(),
    }
    await sendRecording(recordingChannel.value, payload)
  }

  // ── Teardown everything ───────────────────────────────────────────────────
  function stopAll(): void {
    stopGlobal()
    stopConversation()
    stopPresence()
  }

  return {
    typingByConversation,
    recordingByConversation,
    startGlobal,
    stopGlobal,
    startConversation,
    stopConversation,
    startPresence,
    stopPresence,
    emitTypingStart,
    emitTypingDebouncedStop,
    emitRecording,
    stopAll,
  }
}
