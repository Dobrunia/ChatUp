import { ref } from 'vue'
import { nanoid } from 'nanoid'
import { fetchMessages, insertMessage } from '../api/message-api'
import { uploadMedia } from '../api/media-api'
import type { Message, MessageType } from '../types/chat'

const messages = ref<Message[]>([])
const messageLoading = ref(false)

export function useChat() {
  async function loadMessages(conversationId: string): Promise<void> {
    messageLoading.value = true
    try {
      messages.value = await fetchMessages(conversationId)
    } finally {
      messageLoading.value = false
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
    await sendMessage(conversationId, senderId, 'audio', null, {
      url: mediaUrl,
      type: 'audio',
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
    loadMessages,
    sendTextMessage,
    sendImageMessages,
    sendAudioMessage,
    retryFailedMessage,
  }
}
