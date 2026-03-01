import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useChat } from '../shared/composables/use-chat'
import { useAppRealtime } from '../shared/composables/use-app-realtime'

export const useChatStore = defineStore('chat', () => {
  const chat = useChat()
  const realtime = useAppRealtime()
  const activeConversationId = ref<string | null>(null)

  const typingUsers = computed(
    () => realtime.typingByConversation.value[activeConversationId.value ?? ''] ?? [],
  )
  const recordingUsers = computed(
    () => realtime.recordingByConversation.value[activeConversationId.value ?? ''] ?? [],
  )

  async function enterConversation(conversationId: string): Promise<void> {
    activeConversationId.value = conversationId
    await chat.loadMessages(conversationId)
    realtime.startConversation(conversationId, async () => {
      await chat.loadMessages(conversationId)
    })
  }

  function leaveConversation(): void {
    activeConversationId.value = null
    realtime.stopConversation()
  }

  async function loadOlder(): Promise<boolean> {
    return chat.loadOlderMessages()
  }

  async function sendText(conversationId: string, senderId: string, text: string): Promise<void> {
    await chat.sendTextMessage(conversationId, senderId, text)
  }

  async function sendImages(
    conversationId: string,
    senderId: string,
    files: File[],
  ): Promise<void> {
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
  }

  async function setRecording(
    conversationId: string,
    userId: string,
    state: 'start' | 'stop',
  ): Promise<void> {
    await realtime.emitRecording(conversationId, userId, state)
  }

  return {
    messages: chat.messages,
    loading: chat.messageLoading,
    loadingOlder: chat.messageOlderLoading,
    hasMoreMessages: chat.hasMoreMessages,
    typingUsers,
    recordingUsers,
    enterConversation,
    leaveConversation,
    loadOlder,
    sendText,
    sendImages,
    sendAudio,
    retryFailed,
    onTyping,
    setRecording,
  }
})
