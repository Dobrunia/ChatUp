<template>
  <div class="chat-page">
    <!-- ── Header ── -->
    <div class="chat-page__topbar dbru-surface">
      <DbrButton variant="ghost" size="sm" @click="router.back()">←</DbrButton>

      <div class="chat-page__peer">
        <DbrAvatar
          :src="peerProfile?.avatarUrl ?? undefined"
          :name="peerProfile?.displayName ?? '?'"
          size="sm"
          shape="rounded"
        />
        <div class="chat-page__peer-info">
          <span class="chat-page__peer-name dbru-text-base dbru-text-main">
            {{ peerProfile?.displayName ?? peerProfile?.username ?? '...' }}
          </span>
          <span class="dbru-text-sm dbru-text-muted">
            {{ peerIsOnline ? 'В сети' : 'Не в сети' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Messages ── -->
    <div class="chat-page__messages" ref="messagesEl">
      <div v-if="chatStore.loading" class="chat-page__center">
        <DbrLoader />
      </div>

      <template v-else>
        <!-- Sentinel: IntersectionObserver fires when user scrolls to top -->
        <div ref="sentinelEl" class="chat-page__sentinel" />

        <div v-if="chatStore.loadingOlder" class="chat-page__older-loader">
          <DbrLoader />
        </div>

        <template v-for="item in messageItems" :key="item.key">
          <div v-if="item.kind === 'divider'" class="chat-page__divider">
            <DbrChip variant="ghost">{{ item.label }}</DbrChip>
          </div>
          <DbrChatBubble
            v-else
            :text="item.msg.body ?? ''"
            :kind="item.msg.type"
            :mediaSrc="item.msg.media?.url ?? ''"
            :time="formatTime(item.msg.createdAt)"
            :direction="item.msg.senderId === currentUserId ? 'out' : 'in'"
            :status="item.msg.senderId === currentUserId ? toBubbleStatus(item.msg.status) : 'none'"
            class="chat-page__bubble"
            @click="item.msg.status === 'failed' ? retryMessage(item.msg.id) : undefined"
          />
        </template>

        <div v-if="typingText" class="chat-page__typing dbru-text-sm dbru-text-muted">
          {{ typingText }}
        </div>
      </template>
    </div>

    <!-- ── Composer ── -->
    <div class="chat-page__footer">
      <DbrChatComposer
        v-model="draftText"
        placeholder="Написать..."
        @send="handleSend"
        @typing="handleTyping"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  DbrAvatar,
  DbrChip,
  DbrButton,
  DbrChatBubble,
  DbrChatComposer,
  DbrLoader,
} from 'dobruniaui-vue';
import type { DbrChatAttachment } from 'dobruniaui-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useChatStore } from '../stores/chat-store';
import { useConversationsStore } from '../stores/conversations-store';
import { useSessionStore } from '../stores/session-store';
import { usePresenceStore } from '../stores/presence-store';
import { fetchProfile } from '../shared/api/profile-api';
import { useSwipeBack } from '../shared/composables/use-swipe-back';
import type { Message, MessageStatus, Profile } from '../shared/types/chat';

dayjs.locale('ru');

type BubbleStatus = 'none' | 'sending' | 'sent' | 'read';
type DividerItem = { kind: 'divider'; key: string; label: string };
type MessageItem = { kind: 'message'; key: string; msg: Message };
type ListItem = DividerItem | MessageItem;

const route = useRoute();
const router = useRouter();

const chatStore = useChatStore();
const conversationsStore = useConversationsStore();
const sessionStore = useSessionStore();
const presenceStore = usePresenceStore();

const { conversations } = storeToRefs(conversationsStore);

const conversationId = route.params.conversationId as string;
const currentUserId = sessionStore.userId!;

const draftText = ref('');
const messagesEl = ref<HTMLElement | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);
const peerProfile = ref<Profile | null>(null);

// Flag to skip auto-scroll-to-bottom while prepending older messages
let prepending = false;

const conversation = computed(() => conversations.value.find((c) => c.id === conversationId));

const peerUserId = computed(() => {
  if (!conversation.value) return null;
  return conversation.value.memberIds.find((id) => id !== currentUserId) ?? null;
});

const peerIsOnline = computed(() =>
  peerUserId.value ? presenceStore.isOnline(peerUserId.value) : false
);

const typingText = computed(() => {
  const typing = chatStore.typingUsers.filter((id) => id !== currentUserId);
  return typing.length > 0 ? 'Печатает...' : '';
});

const messageItems = computed((): ListItem[] => {
  const result: ListItem[] = [];
  let lastDay = '';
  for (const msg of chatStore.messages) {
    const day = dayjs(msg.createdAt).format('YYYY-MM-DD');
    if (day !== lastDay) {
      lastDay = day;
      result.push({ kind: 'divider', key: `divider-${day}`, label: formatDay(day) });
    }
    result.push({ kind: 'message', key: msg.id, msg });
  }
  return result;
});

function formatDay(day: string): string {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  if (day === today) return 'Сегодня';
  if (day === yesterday) return 'Вчера';
  return dayjs(day).format('D MMMM YYYY');
}

function formatTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm');
}

function toBubbleStatus(status: MessageStatus): BubbleStatus {
  if (status === 'failed') return 'none';
  return status;
}

function isNearBottom(): boolean {
  const el = messagesEl.value;
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

async function loadOlderWithScrollPreserve(): Promise<void> {
  const el = messagesEl.value;
  if (!el) return;
  const prevScrollHeight = el.scrollHeight;
  const prevScrollTop = el.scrollTop;
  prepending = true;
  const loaded = await chatStore.loadOlder();
  prepending = false;
  if (loaded) {
    await nextTick();
    el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
  }
}

async function retryMessage(messageId: string): Promise<void> {
  await chatStore.retryFailed(messageId);
}

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration));
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(audio.src);
    };
    audio.src = URL.createObjectURL(file);
  });
}

async function handleSend(payload: {
  text: string;
  attachments: DbrChatAttachment[];
}): Promise<void> {
  if (!currentUserId) return;
  try {
    // Обрабатываем вложения по типам
    for (const attachment of payload.attachments) {
      if (attachment.kind === 'image') {
        await chatStore.sendImages(conversationId, currentUserId, [attachment.file]);
      } else if (attachment.kind === 'audio') {
        const duration = await getAudioDuration(attachment.file);
        await chatStore.sendAudio(conversationId, currentUserId, attachment.file, duration);
      }
      // kind === 'file' не поддерживается в текущей версии
    }
    const text = payload.text.trim();
    if (text) {
      await chatStore.sendText(conversationId, currentUserId, text);
      draftText.value = '';
    }
    await conversationsStore.markRead(currentUserId, conversationId);
    await scrollToBottom();
  } catch {
    // use-chat marks the message as 'failed' — user can tap to retry
  }
}

async function handleTyping(isTyping: boolean): Promise<void> {
  if (!isTyping || !currentUserId) return;
  await chatStore.onTyping(conversationId, currentUserId);
}

// IntersectionObserver: load older messages when sentinel scrolls into view
watchEffect(
  (onCleanup) => {
    const sentinel = sentinelEl.value;
    const container = messagesEl.value;
    if (!sentinel || !container) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && chatStore.hasMoreMessages && !chatStore.loadingOlder) {
          void loadOlderWithScrollPreserve();
        }
      },
      { root: container, threshold: 0 }
    );
    obs.observe(sentinel);
    onCleanup(() => obs.disconnect());
  },
  { flush: 'post' }
);

// Scroll to bottom when new messages arrive (but not when prepending older ones)
watch(
  () => chatStore.messages.length,
  async (newLen, oldLen) => {
    if (newLen <= oldLen || prepending) return;
    if (isNearBottom()) await scrollToBottom();
  }
);

// AppLayout (parent) mounts after ChatPage (child), so conversations may not be
// loaded yet when onMounted runs. Watch reactively so profile loads as soon as
// the conversation appears in the store (or immediately if already there).
watch(
  peerUserId,
  async (peerId) => {
    if (!peerId) return;
    try {
      peerProfile.value = await fetchProfile(peerId);
    } catch {
      // Show placeholder if profile fetch fails
    }
    await presenceStore.trackPeer(peerId);
  },
  { immediate: true }
);

onMounted(async () => {
  await chatStore.enterConversation(conversationId);
  await scrollToBottom();
  await conversationsStore.markRead(currentUserId, conversationId);
});

onUnmounted(() => {
  chatStore.leaveConversation();
  presenceStore.stopTracking();
});

useSwipeBack();
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

/* ── Topbar ── */
.chat-page__topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--dbru-space-2);
  padding: var(--dbru-space-2) var(--dbru-space-3);
  min-height: var(--app-header-height);
  border-bottom: 1px solid var(--dbru-color-border);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.chat-page__peer {
  display: flex;
  align-items: center;
  gap: var(--dbru-space-2);
  min-width: 0;
}

.chat-page__peer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.chat-page__peer-name {
  font-weight: var(--dbru-font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Messages ── */
.chat-page__messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-1);
  padding: var(--dbru-space-3);
  padding-bottom: var(--dbru-space-2);
}

.chat-page__sentinel {
  flex-shrink: 0;
  height: 1px;
}

.chat-page__center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.chat-page__older-loader {
  display: flex;
  justify-content: center;
  padding: var(--dbru-space-2) 0;
}

.chat-page__divider {
  display: flex;
  justify-content: center;
  padding: var(--dbru-space-2) 0;
}

.chat-page__bubble {
  max-width: 80%;
}

.chat-page__typing {
  align-self: flex-start;
  padding: var(--dbru-space-1) var(--dbru-space-2);
  font-style: italic;
}

/* ── Footer ── */
.chat-page__footer {
  flex-shrink: 0;
  border-top: 1px solid var(--dbru-color-border);
  padding: var(--dbru-space-2) var(--dbru-space-3);
}
</style>
