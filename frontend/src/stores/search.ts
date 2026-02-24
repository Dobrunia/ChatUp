import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import type { UserSearchResultLocal } from '../api/types';

export const useSearchStore = defineStore('search', () => {
  const searchResults = ref<UserSearchResultLocal[]>([]);
  const suggestions = ref<UserSearchResultLocal[]>([]);
  const isLoadingSuggestions = ref(false);
  const isSearching = ref(false);
  const hasSearched = ref(false);
  const searchError = ref('');

  const searchUsers = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    const usernameOnly = trimmed.startsWith('@');
    const query = usernameOnly ? trimmed.replace(/^@+/, '') : trimmed;
    if (!query || query.length < 1) {
      searchResults.value = [];
      hasSearched.value = false;
      return;
    }

    isSearching.value = true;
    searchError.value = '';
    
    try {
      const data = await trpc.search.users.query({ query, usernameOnly });
      searchResults.value = data.map(u => ({ ...u, isBlocked: false }));
      hasSearched.value = true;
    } catch (err: unknown) {
      searchError.value = err instanceof Error ? err.message : 'Ошибка поиска';
      searchResults.value = [];
      hasSearched.value = true;
    } finally {
      isSearching.value = false;
    }
  };

  const loadSuggestions = async () => {
    isLoadingSuggestions.value = true;
    try {
      const data = await trpc.search.suggestions.query({ limit: 2 });
      suggestions.value = data.map(u => ({ ...u, isBlocked: false }));
    } catch {
      suggestions.value = [];
    } finally {
      isLoadingSuggestions.value = false;
    }
  };

  const blockUser = async (userId: string) => {
    await trpc.search.blockUser.mutate({ userId });
    const index = searchResults.value.findIndex(u => u.id === userId);
    if (index !== -1) {
      searchResults.value[index] = { ...searchResults.value[index], isBlocked: true };
    }
  };

  const unblockUser = async (userId: string) => {
    await trpc.search.unblockUser.mutate({ userId });
    const index = searchResults.value.findIndex(u => u.id === userId);
    if (index !== -1) {
      searchResults.value[index] = { ...searchResults.value[index], isBlocked: false };
    }
  };

  const clearSearch = () => {
    searchResults.value = [];
    searchError.value = '';
    hasSearched.value = false;
  };

  return {
    searchResults,
    suggestions,
    isLoadingSuggestions,
    isSearching,
    hasSearched,
    searchError,
    searchUsers,
    loadSuggestions,
    blockUser,
    unblockUser,
    clearSearch
  };
});
