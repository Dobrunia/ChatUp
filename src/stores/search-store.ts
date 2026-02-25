import { defineStore } from 'pinia'
import { useSearch } from '../shared/composables/use-search'

export const useSearchStore = defineStore('search', () => {
  const search = useSearch()

  async function run(query: string): Promise<void> {
    await search.runSearch(query)
  }

  return {
    results: search.results,
    loading: search.searchLoading,
    run,
  }
})
