import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import type { MessageItem } from '../api/types';

export const useChatStore = defineStore('chat', () => {
  const messages = ref<MessageItem[]>([]);
  const currentDialogId = ref<string | null>(null);
  const isLoading = ref(false);
  const nextCursorId = ref<string | undefined>(undefined);
  const hasMore = ref(true);

  const setDialogId = (dialogId: string) => {
    if (currentDialogId.value !== dialogId) {
      currentDialogId.value = dialogId;
      messages.value = [];
      nextCursorId.value = undefined;
      hasMore.value = true;
    }
  };

  const fetchMessages = async () => {
    if (!currentDialogId.value || isLoading.value || !hasMore.value) return;
    
    isLoading.value = true;
    try {
      const data = await trpc.message.list.query({
        dialogId: currentDialogId.value,
        cursorId: nextCursorId.value,
        limit: 50
      });
      
      if (data.length < 50) {
        hasMore.value = false;
      }

      if (data.length > 0) {
        nextCursorId.value = data[data.length - 1].id;
      }
      
      messages.value.push(...data);
    } finally {
      isLoading.value = false;
    }
  };

  const addOptimisticMessage = (msg: MessageItem) => {
    if (msg.dialogId !== currentDialogId.value) return;
    messages.value.unshift(msg);
  };

  const updateMessageStatus = (clientMessageId: string, updates: Partial<MessageItem>) => {
    const idx = messages.value.findIndex(m => m.clientMessageId === clientMessageId);
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], ...updates };
    }
  };

  const handleIncomingMessage = (msg: MessageItem) => {
    if (msg.dialogId !== currentDialogId.value) return;
    
    const exists = messages.value.some(m => m.clientMessageId === msg.clientMessageId);
    if (!exists) {
      messages.value.unshift(msg);
    } else {
      updateMessageStatus(msg.clientMessageId, msg);
    }
  };

  return {
    messages,
    currentDialogId,
    isLoading,
    hasMore,
    setDialogId,
    fetchMessages,
    addOptimisticMessage,
    updateMessageStatus,
    handleIncomingMessage
  };
});
