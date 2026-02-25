import { ref } from 'vue'
import { searchUsers } from '../api/search-api'
import type { Profile } from '../types/chat'

const results = ref<Profile[]>([])
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

  return { results, searchLoading, runSearch }
}
