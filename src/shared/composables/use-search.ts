import { ref } from 'vue'
import { fetchRandomUsers, searchUsers } from '../api/search-api'
import type { Profile } from '../types/chat'

const results = ref<Profile[]>([])
const randomUsers = ref<Profile[]>([])
const searchLoading = ref(false)

export function useSearch() {
  async function runSearch(query: string): Promise<void> {
    if (!query.trim()) {
      results.value = []
      return
    }
    searchLoading.value = true
    try {
      results.value = await searchUsers(query)
    } finally {
      searchLoading.value = false
    }
  }

  async function loadRandom(excludeUserId?: string): Promise<void> {
    randomUsers.value = await fetchRandomUsers(2, excludeUserId)
  }

  return { results, randomUsers, searchLoading, runSearch, loadRandom }
}
