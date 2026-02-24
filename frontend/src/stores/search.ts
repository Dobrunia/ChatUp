import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import type { UserSearchResultLocal } from '../api/types';

export const useSearchStore = defineStore('search', () => {
  const searchResults = ref<UserSearchResultLocal[]>([]);
  const isSearching = ref(false);
  const searchError = ref('');

  const searchUsers = async (query: string) => {
    if (!query || query.length < 3) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;
    searchError.value = '';
    
    try {
      const data = await trpc.search.users.query({ query });
      searchResults.value = data.map(u => ({ ...u, isBlocked: false }));
    } catch (err: unknown) {
      searchError.value = err instanceof Error ? err.message : 'Ошибка поиска';
      searchResults.value = [];
    } finally {
      isSearching.value = false;
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
  };

  return {
    searchResults,
    isSearching,
    searchError,
    searchUsers,
    blockUser,
    unblockUser,
    clearSearch
  };
});
