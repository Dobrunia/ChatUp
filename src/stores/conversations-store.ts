import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useConversations } from '../shared/composables/use-conversations'
import type { Conversation } from '../shared/types/chat'

export const useConversationsStore = defineStore('conversations', () => {
  const composable = useConversations()
  const activeConversationId = ref<string | null>(null)
  const sortedConversations = computed(() =>
    [...composable.conversations.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  async function load(userId: string): Promise<void> {
    await composable.loadConversations(userId)
  }

  async function open(currentUserId: string, peerUserId: string): Promise<string> {
    const id = await composable.openOrCreateConversation(currentUserId, peerUserId)
    activeConversationId.value = id
    return id
  }

  async function markRead(userId: string): Promise<void> {
    if (!activeConversationId.value) {
      return
    }
    await composable.setConversationRead(activeConversationId.value, userId, new Date().toISOString())
  }

  function patchConversation(update: Conversation): void {
    const map = new Map(composable.conversations.value.map((item) => [item.id, item]))
    map.set(update.id, update)
    composable.conversations.value = [...map.values()]
  }

  return {
    conversations: composable.conversations,
    loading: composable.conversationsLoading,
    activeConversationId,
    sortedConversations,
    load,
    open,
    markRead,
    patchConversation,
  }
})
