import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useConversations } from '../shared/composables/use-conversations'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Conversation } from '../shared/types/chat'
import { supabase } from '../shared/api/supabase-client'

export const useConversationsStore = defineStore('conversations', () => {
  const composable = useConversations()
  const activeConversationId = ref<string | null>(null)
  const realtimeChannel = ref<RealtimeChannel | null>(null)
  const realtimeUserId = ref<string | null>(null)
  const reloadTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const fallbackPoller = ref<ReturnType<typeof setInterval> | null>(null)
  const sortedConversations = computed(() =>
    [...composable.conversations.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  async function load(userId: string): Promise<void> {
    await composable.loadConversations(userId)
  }

  function scheduleRealtimeReload(userId: string): void {
    if (reloadTimer.value) {
      clearTimeout(reloadTimer.value)
      reloadTimer.value = null
    }
    reloadTimer.value = setTimeout(() => {
      void load(userId)
    }, 180)
  }

  function startRealtime(userId: string): void {
    if (realtimeChannel.value && realtimeUserId.value === userId) {
      return
    }
    stopRealtime()
    realtimeUserId.value = userId
    const channel = supabase
      .channel(`conversations-global:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        scheduleRealtimeReload(userId)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        scheduleRealtimeReload(userId)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members' }, () => {
        scheduleRealtimeReload(userId)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members' }, () => {
        scheduleRealtimeReload(userId)
      })
      .subscribe()
    realtimeChannel.value = channel
    fallbackPoller.value = setInterval(() => {
      void load(userId)
    }, 2500)
  }

  function stopRealtime(): void {
    if (reloadTimer.value) {
      clearTimeout(reloadTimer.value)
      reloadTimer.value = null
    }
    if (fallbackPoller.value) {
      clearInterval(fallbackPoller.value)
      fallbackPoller.value = null
    }
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe()
      realtimeChannel.value = null
    }
    realtimeUserId.value = null
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
    const targetConversationId = conversationId ?? activeConversationId.value
    if (!targetConversationId) {
      return
    }
    await composable.setConversationRead(targetConversationId, userId, lastReadAt)
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
    startRealtime,
    stopRealtime,
    open,
    setActiveConversation,
    markRead,
    patchConversation,
  }
})
