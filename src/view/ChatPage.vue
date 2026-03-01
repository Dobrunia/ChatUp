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
        <DbrButton
          v-if="chatStore.hasMoreMessages"
          variant="ghost"
          size="sm"
          :disabled="chatStore.loadingOlder"
          class="chat-page__load-more"
          @click="loadOlderMessages"
        >
          {{ chatStore.loadingOlder ? 'Загружаю...' : 'Загрузить ещё' }}
        </DbrButton>

        <DbrChatBubble
          v-for="msg in chatStore.messages"
          :key="msg.id"
          :text="msg.body ?? ''"
          :kind="msg.type"
          :mediaSrc="msg.media?.url ?? ''"
          :time="formatTime(msg.createdAt)"
          :direction="msg.senderId === currentUserId ? 'out' : 'in'"
          :status="msg.senderId === currentUserId ? toBubbleStatus(msg.status) : 'none'"
          class="chat-page__bubble"
          @click="msg.status === 'failed' ? retryMessage(msg.id) : undefined"
        />

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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DbrAvatar, DbrButton, DbrChatBubble, DbrChatComposer, DbrLoader } from 'dobruniaui-vue'
import type { DbrChatAttachment } from 'dobruniaui-vue'
import dayjs from 'dayjs'
import { useChatStore } from '../stores/chat-store'
import { useConversationsStore } from '../stores/conversations-store'
import { useSessionStore } from '../stores/session-store'
import { usePresenceStore } from '../stores/presence-store'
import { fetchProfile } from '../shared/api/profile-api'
import type { MessageStatus, Profile } from '../shared/types/chat'

type BubbleStatus = 'none' | 'sending' | 'sent' | 'read'

const route = useRoute()
const router = useRouter()

const chatStore = useChatStore()
const conversationsStore = useConversationsStore()
const sessionStore = useSessionStore()
const presenceStore = usePresenceStore()

const { conversations } = storeToRefs(conversationsStore)

const conversationId = route.params.conversationId as string
const currentUserId = sessionStore.userId!

const draftText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const peerProfile = ref<Profile | null>(null)

const conversation = computed(() => conversations.value.find((c) => c.id === conversationId))

const peerUserId = computed(() => {
  if (!conversation.value) return null
  return conversation.value.memberIds.find((id) => id !== currentUserId) ?? null
})

const peerIsOnline = computed(() =>
  peerUserId.value ? presenceStore.isOnline(peerUserId.value) : false,
)

const typingText = computed(() => {
  const typing = chatStore.typingUsers.filter((id) => id !== currentUserId)
  return typing.length > 0 ? 'Печатает...' : ''
})

function formatTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm')
}

function toBubbleStatus(status: MessageStatus): BubbleStatus {
  if (status === 'failed') return 'none'
  return status
}

async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

async function loadOlderMessages(): Promise<void> {
  await chatStore.loadOlder()
}

async function retryMessage(messageId: string): Promise<void> {
  await chatStore.retryFailed(messageId)
}

async function handleSend(payload: { text: string; attachments: DbrChatAttachment[] }): Promise<void> {
  if (!currentUserId) return

  try {
    if (payload.attachments.length > 0) {
      const files = payload.attachments.map((a) => a.file)
      await chatStore.sendImages(conversationId, currentUserId, files)
    }

    const text = payload.text.trim()
    if (text) {
      await chatStore.sendText(conversationId, currentUserId, text)
      draftText.value = ''
    }

    await conversationsStore.markRead(currentUserId, conversationId)
    await scrollToBottom()
  } catch {
    // use-chat marks the message as 'failed' — user can tap to retry
  }
}

async function handleTyping(isTyping: boolean): Promise<void> {
  if (!isTyping || !currentUserId) return
  await chatStore.onTyping(conversationId, currentUserId)
}

watch(
  () => chatStore.messages.length,
  async (newLen, oldLen) => {
    if (newLen > oldLen) {
      await scrollToBottom()
    }
  },
)

onMounted(async () => {
  await chatStore.enterConversation(conversationId)
  await scrollToBottom()
  await conversationsStore.markRead(currentUserId, conversationId)

  const peerId = peerUserId.value
  if (peerId) {
    try {
      peerProfile.value = await fetchProfile(peerId)
    } catch {
      // Show placeholder if profile fetch fails
    }
    await presenceStore.trackPeer(peerId)
  }
})

onUnmounted(() => {
  chatStore.leaveConversation()
  presenceStore.stopTracking()
})
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

.chat-page__center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.chat-page__load-more {
  align-self: center;
  margin-bottom: var(--dbru-space-2);
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
