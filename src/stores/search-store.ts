import { defineStore } from 'pinia'
import { useSearch } from '../shared/composables/use-search'

export const useSearchStore = defineStore('search', () => {
  const search = useSearch()

  async function run(query: string): Promise<void> {
    await search.runSearch(query)
  }

  async function loadRandom(excludeUserId?: string): Promise<void> {
    await search.loadRandom(excludeUserId)
  }

  return {
    results: search.results,
    randomUsers: search.randomUsers,
    loading: search.searchLoading,
    run,
    loadRandom,
  }
})
