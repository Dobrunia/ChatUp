<template>
  <div class="virtual-message-list" ref="containerRef" @scroll="onScroll">
    <div class="messages-inner">
      <div 
        class="message-wrapper" 
        v-for="item in messages" 
        :key="item.id || item.clientMessageId"
      >
        <div 
          class="message-bubble" 
          :class="{ 'is-mine': item.senderId === currentUserId }"
        >
          <div class="message-content">{{ item.content }}</div>
          <div class="message-meta">
            <span class="message-time">{{ formatTime(item.createdAt) }}</span>
            <span v-if="item.senderId === currentUserId" class="message-status">
              {{ getStatusIcon(item) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { MessageItem } from '@/api/types';

// Native rendering for MVP instead of complex virtualization.
// The list is displayed bottom-up using flex-direction: column-reverse on the inner container.

const props = defineProps<{
  messages: MessageItem[];
  currentUserId: string;
}>();

const emit = defineEmits(['load-more']);

const containerRef = ref<HTMLElement | null>(null);

const onScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  // Because flex-direction is column-reverse, scrolling "up" towards older messages
  // means scrollTop goes towards negative in some browsers or towards max in others.
  // Standard CSS column-reverse makes scrollTop=0 at bottom, increasing as you scroll up.
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
    emit('load-more');
  }
};

const formatTime = (dateStr: string | Date) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getStatusIcon = (msg: MessageItem) => {
  // Mock status logic based on MVP plan
  if (!msg.id) return '⏳'; // sending
  // Normally read receipts determine read status
  return '✓'; // sent
};
</script>

<style scoped>
.virtual-message-list {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse; /* Scroll starts at bottom */
}

.messages-inner {
  display: flex;
  flex-direction: column-reverse; /* Newest messages at bottom */
  padding: var(--ru-spacing-16);
  gap: var(--ru-spacing-8);
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-bubble {
  max-width: 80%;
  padding: var(--ru-spacing-8) var(--ru-spacing-12);
  border-radius: var(--ru-radius-md);
  background-color: var(--ru-color-bg-primary);
  color: var(--ru-color-text-primary);
  box-shadow: var(--ru-shadow-card);
}

.message-bubble.is-mine {
  margin-left: auto;
  background-color: var(--ru-color-brand-secondary);
  border-bottom-right-radius: 0;
}

.message-bubble:not(.is-mine) {
  margin-right: auto;
  border-bottom-left-radius: 0;
}

.message-content {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  line-height: 1.4;
  word-break: break-word;
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--ru-spacing-4);
  margin-top: var(--ru-spacing-4);
  font-family: var(--ru-font-family);
  font-size: 10px;
  color: var(--ru-color-text-secondary);
}

.message-status {
  color: var(--ru-color-brand-primary);
}
</style>
