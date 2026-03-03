import { ref } from 'vue'
import { ensureConversation, fetchConversations, updateLastReadAt } from '../api/conversation-api'
import type { Conversation } from '../types/chat'

const conversations = ref<Conversation[]>([])
const conversationsLoading = ref(false)

export function useConversations() {
  async function loadConversations(userId: string): Promise<void> {
    conversationsLoading.value = true
    try {
      conversations.value = await fetchConversations(userId)
    } finally {
      conversationsLoading.value = false
    }
  }

  async function refreshConversations(userId: string): Promise<void> {
    conversations.value = await fetchConversations(userId)
  }

  async function openOrCreateConversation(currentUserId: string, peerUserId: string): Promise<string> {
    return ensureConversation(currentUserId, peerUserId)
  }

  async function setConversationRead(conversationId: string, userId: string, lastReadAt: string): Promise<void> {
    await updateLastReadAt({ conversationId, userId, lastReadAt })
  }

  return {
    conversations,
    conversationsLoading,
    loadConversations,
    refreshConversations,
    openOrCreateConversation,
    setConversationRead,
  }
}
