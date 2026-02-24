import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import type { DialogItem } from '../api/types';

export const useDialogsStore = defineStore('dialogs', () => {
  const dialogs = ref<DialogItem[]>([]);
  const isLoading = ref(false);
  const error = ref('');

  const fetchDialogs = async () => {
    isLoading.value = true;
    error.value = '';
    try {
      const data = await trpc.dialog.list.query({});
      dialogs.value = data;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки диалогов';
    } finally {
      isLoading.value = false;
    }
  };

  const getOrCreateDirectDialog = async (targetUserId: string) => {
    return trpc.dialog.getOrCreateDirect.mutate({ userId: targetUserId });
  };

  return {
    dialogs,
    isLoading,
    error,
    fetchDialogs,
    getOrCreateDirectDialog
  };
});
