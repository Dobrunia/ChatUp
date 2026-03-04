import { ref } from 'vue'
import { nanoid } from 'nanoid'
import { fetchMessages, insertMessage } from '../api/message-api'
import { uploadMedia } from '../api/media-api'
import type { Message, MessageType } from '../types/chat'

const messages = ref<Message[]>([])
const messageLoading = ref(false)
const messageOlderLoading = ref(false)
const hasMoreMessages = ref(true)
const activeConversationId = ref<string | null>(null)
const PAGE_SIZE = 20

export function useChat() {
  async function loadMessages(conversationId: string): Promise<void> {
    activeConversationId.value = conversationId
    messageLoading.value = true
    try {
      const chunk = await fetchMessages(conversationId, PAGE_SIZE)
      messages.value = chunk
      hasMoreMessages.value = chunk.length >= PAGE_SIZE
    } finally {
      messageLoading.value = false
    }
  }

  // Background refresh — no loading spinner, preserves scroll position feel
  async function refreshMessages(conversationId: string): Promise<void> {
    const chunk = await fetchMessages(conversationId, PAGE_SIZE)
    messages.value = chunk
    hasMoreMessages.value = chunk.length >= PAGE_SIZE
  }

  async function loadOlderMessages(): Promise<boolean> {
    const conversationId = activeConversationId.value
    if (!conversationId || messageOlderLoading.value || !hasMoreMessages.value) {
      return false
    }
    const oldest = messages.value[0]
    if (!oldest) {
      return false
    }

    messageOlderLoading.value = true
    try {
      const chunk = await fetchMessages(conversationId, PAGE_SIZE, oldest.createdAt)
      hasMoreMessages.value = chunk.length >= PAGE_SIZE
      if (chunk.length === 0) {
        return false
      }
      const existingIds = new Set(messages.value.map((item) => item.id))
      const uniqueChunk = chunk.filter((item) => !existingIds.has(item.id))
      if (uniqueChunk.length === 0) {
        return false
      }
      messages.value = [...uniqueChunk, ...messages.value]
      return true
    } finally {
      messageOlderLoading.value = false
    }
  }

  async function sendTextMessage(conversationId: string, senderId: string, text: string): Promise<void> {
    await sendMessage(conversationId, senderId, 'text', text, null)
  }

  async function sendImageMessages(conversationId: string, senderId: string, files: File[]): Promise<void> {
    if (files.length > 4) {
      throw new Error('Max 4 images per send')
    }
    for (const file of files) {
      const mediaUrl = await uploadMedia(`images/${conversationId}`, file)
      await sendMessage(conversationId, senderId, 'image', null, {
        url: mediaUrl,
        type: 'image',
        size: file.size,
      })
    }
  }

  async function sendAudioMessage(
    conversationId: string,
    senderId: string,
    file: File,
    duration: number,
  ): Promise<void> {
    if (duration > 120) {
      throw new Error('Audio max duration is 2 minutes')
    }
    const mediaUrl = await uploadMedia(`audio/${conversationId}`, file)
    // Явно указываем type: 'audio', т.к. Supabase может определить неправильно по content-type
    await sendMessage(conversationId, senderId, 'audio', null, {
      url: mediaUrl,
      type: 'audio', // принудительно audio
      size: file.size,
      duration,
    })
  }

  async function sendMessage(
    conversationId: string,
    senderId: string,
    type: MessageType,
    body: string | null,
    media: Message['media'],
  ): Promise<void> {
    const localId = nanoid()
    const optimistic: Message = {
      id: localId,
      conversationId,
      senderId,
      type,
      body,
      media,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }
    messages.value.push(optimistic)

    try {
      const saved = await insertMessage({
        ...optimistic,
        id: localId,
        status: 'sent',
      })
      messages.value = messages.value.map((item) =>
        item.id === localId ? { ...saved, status: 'sent' } : item,
      )
    } catch (error) {
      messages.value = messages.value.map((item) =>
        item.id === localId ? { ...item, status: 'failed' } : item,
      )
      throw error
    }
  }

  async function retryFailedMessage(messageId: string): Promise<void> {
    const target = messages.value.find((item) => item.id === messageId)
    if (!target) {
      return
    }
    await sendMessage(target.conversationId, target.senderId, target.type, target.body, target.media)
  }

  return {
    messages,
    messageLoading,
    messageOlderLoading,
    hasMoreMessages,
    loadMessages,
    refreshMessages,
    loadOlderMessages,
    sendTextMessage,
    sendImageMessages,
    sendAudioMessage,
    retryFailedMessage,
  }
}
