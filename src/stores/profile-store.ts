import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useProfile } from '../shared/composables/use-profile'
import { useSessionStore } from './session-store'
import type { Profile } from '../shared/types/chat'

export const useProfileStore = defineStore('profile', () => {
  const profileComposable = useProfile()
  const sessionStore = useSessionStore()
  const ready = computed(() => Boolean(profileComposable.profile.value))

  async function load(): Promise<void> {
    if (!sessionStore.userId) {
      return
    }
    const userId = sessionStore.userId
    if (!userId) {
      return
    }
    await profileComposable.loadProfile(userId)
  }

  async function save(profile: Profile): Promise<void> {
    await profileComposable.saveProfile(profile)
  }

  return {
    profile: profileComposable.profile,
    loading: profileComposable.profileLoading,
    ready,
    load,
    save,
  }
})
