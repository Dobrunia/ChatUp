import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchPresence, fetchPresenceBatch } from '../shared/api/presence-api'
import { useAppRealtime } from '../shared/composables/use-app-realtime'
import type { PresenceState } from '../shared/types/chat'

export const usePresenceStore = defineStore('presence', () => {
  const presenceMap = ref<Record<string, boolean>>({})
  const realtime = useAppRealtime()

  /** Load initial presence for many users at once (for conversations list). */
  async function loadBatch(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return
    try {
      const states = await fetchPresenceBatch(userIds)
      const next: Record<string, boolean> = {}
      states.forEach((s) => {
        next[s.userId] = s.isOnline
      })
      // Mark users without a row as offline
      userIds.forEach((id) => {
        if (!(id in next)) next[id] = false
      })
      Object.assign(presenceMap.value, next)
    } catch {
      // Don't block UI on presence fetch failure
    }
  }

  /** Subscribe to a single peer's presence in real-time (for chat page). */
  async function trackPeer(peerUserId: string): Promise<void> {
    try {
      const state = await fetchPresence(peerUserId)
      presenceMap.value[peerUserId] = state?.isOnline ?? false
    } catch {
      presenceMap.value[peerUserId] = false
    }

    realtime.startPresence(peerUserId, (state: PresenceState) => {
      presenceMap.value[state.userId] = state.isOnline
    })
  }

  function stopTracking(): void {
    realtime.stopPresence()
  }

  function isOnline(userId: string): boolean {
    return presenceMap.value[userId] ?? false
  }

  return { presenceMap, loadBatch, trackPeer, stopTracking, isOnline }
})
