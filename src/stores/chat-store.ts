import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useChat } from '../shared/composables/use-chat'
import { useRealtime } from '../shared/composables/use-realtime'
import type { Message } from '../shared/types/chat'

export const useChatStore = defineStore('chat', () => {
  const chat = useChat()
  const realtime = useRealtime()
  const typingUsers = ref<string[]>([])
  const recordingUsers = ref<string[]>([])
  const activeCleanup = ref<null | (() => void)>(null)

  async function enterConversation(conversationId: string): Promise<void> {
    if (activeCleanup.value) {
      activeCleanup.value()
      activeCleanup.value = null
    }
    await chat.loadMessages(conversationId)
    activeCleanup.value = realtime.subscribeToConversation(conversationId, async () => {
      await chat.loadMessages(conversationId)
    })
  }

  function leaveConversation(): void {
    if (activeCleanup.value) {
      activeCleanup.value()
      activeCleanup.value = null
    }
  }

  async function sendText(conversationId: string, senderId: string, text: string): Promise<void> {
    await chat.sendTextMessage(conversationId, senderId, text)
  }

  async function sendImages(conversationId: string, senderId: string, files: File[]): Promise<void> {
    await chat.sendImageMessages(conversationId, senderId, files)
  }

  async function sendAudio(
    conversationId: string,
    senderId: string,
    file: File,
    duration: number,
  ): Promise<void> {
    await chat.sendAudioMessage(conversationId, senderId, file, duration)
  }

  async function retryFailed(messageId: string): Promise<void> {
    await chat.retryFailedMessage(messageId)
  }

  async function onTyping(conversationId: string, userId: string): Promise<void> {
    await realtime.emitTypingStart(conversationId, userId)
    await realtime.emitTypingDebouncedStop(conversationId, userId)
    typingUsers.value = realtime.typingByConversation.value[conversationId] ?? []
  }

  async function setRecording(conversationId: string, userId: string, state: 'start' | 'stop'): Promise<void> {
    await realtime.emitRecording(conversationId, userId, state)
    recordingUsers.value = realtime.recordingByConversation.value[conversationId] ?? []
  }

  return {
    messages: chat.messages,
    loading: chat.messageLoading,
    typingUsers,
    recordingUsers,
    enterConversation,
    leaveConversation,
    sendText,
    sendImages,
    sendAudio,
    retryFailed,
    onTyping,
    setRecording,
  }
})
