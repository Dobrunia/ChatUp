import { ref } from 'vue'
import { fetchProfile, isUsernameAvailable, upsertProfile } from '../api/profile-api'
import type { Profile } from '../types/chat'
import { isValidUsername, sanitizeDisplayName } from '../utils/profile'

const profile = ref<Profile | null>(null)
const profileLoading = ref(false)

export function useProfile() {
  async function loadProfile(userId: string): Promise<void> {
    profileLoading.value = true
    try {
      profile.value = await fetchProfile(userId)
    } finally {
      profileLoading.value = false
    }
  }

  async function saveProfile(nextProfile: Profile): Promise<void> {
    if (nextProfile.username && !isValidUsername(nextProfile.username)) {
      throw new Error('Username must match ^[a-z]+$')
    }
    if (nextProfile.username) {
      const available = await isUsernameAvailable(nextProfile.username, nextProfile.userId)
      if (!available) {
        throw new Error('Username already used')
      }
    }

    const sanitized: Profile = {
      ...nextProfile,
      displayName: nextProfile.displayName ? sanitizeDisplayName(nextProfile.displayName) : null,
    }
    await upsertProfile(sanitized)
    profile.value = sanitized
  }

  return { profile, profileLoading, loadProfile, saveProfile }
}
