import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useConversations } from '../shared/composables/use-conversations'
import { useAppRealtime } from '../shared/composables/use-app-realtime'
export const useConversationsStore = defineStore('conversations', () => {
  const composable = useConversations()
  const realtime = useAppRealtime()
  const activeConversationId = ref<string | null>(null)
  const reloadTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const sortedConversations = computed(() =>
    [...composable.conversations.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  async function load(userId: string): Promise<void> {
    await composable.loadConversations(userId)
  }

  function scheduleReload(userId: string): void {
    if (reloadTimer.value) {
      clearTimeout(reloadTimer.value)
      reloadTimer.value = null
    }
    // Debounce rapid-fire events (e.g. multiple messages arriving at once)
    reloadTimer.value = setTimeout(() => {
      void load(userId)
    }, 200)
  }

  function startRealtime(userId: string): void {
    realtime.startGlobal(userId, () => scheduleReload(userId))
  }

  function stopRealtime(): void {
    if (reloadTimer.value) {
      clearTimeout(reloadTimer.value)
      reloadTimer.value = null
    }
    realtime.stopGlobal()
  }

  async function open(currentUserId: string, peerUserId: string): Promise<string> {
    const id = await composable.openOrCreateConversation(currentUserId, peerUserId)
    activeConversationId.value = id
    return id
  }

  function setActiveConversation(conversationId: string | null): void {
    activeConversationId.value = conversationId
  }

  async function markRead(
    userId: string,
    conversationId?: string,
    lastReadAt: string = new Date().toISOString(),
  ): Promise<void> {
    const targetId = conversationId ?? activeConversationId.value
    if (!targetId) return
    await composable.setConversationRead(targetId, userId, lastReadAt)
  }

  return {
    conversations: composable.conversations,
    loading: composable.conversationsLoading,
    activeConversationId,
    sortedConversations,
    load,
    startRealtime,
    stopRealtime,
    open,
    setActiveConversation,
    markRead,
  }
})
