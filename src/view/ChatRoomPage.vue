<template>
  <main class="page-shell chat-page">
    <div class="chat-shell">
      <dbr-card class="chat-header">
        <dbr-icon-button label="Назад" variant="ghost" @click="goBack">
          <template #iconBefore>←</template>
        </dbr-icon-button>
        <div class="chat-peer-title">
          <span>{{ peerTitle }}</span>
          <span class="chat-peer-status">
            <span>{{ isPeerOnline ? '●' : '○' }}</span>
            <span>{{ peerStatusLabel }}</span>
          </span>
        </div>
        <dbr-avatar
          :src="peerAvatarUrl || undefined"
          :name="peerInitials"
          shape="rounded"
        />
      </dbr-card>

      <p v-if="!network.isOnline">
        Офлайн: отправка сообщений недоступна.
      </p>
      <p v-if="actionError">{{ actionError }}</p>
      <p v-if="chatStore.typingUsers.length > 0">печатает...</p>
      <p v-if="chatStore.recordingUsers.length > 0">записывает голосовое...</p>

      <div ref="messagesListEl" class="messages-list" @scroll.passive="onMessagesScroll">
        <template v-for="entry in messageRenderItems" :key="entry.key">
          <div v-if="entry.kind === 'separator'">
            {{ entry.label }}
          </div>
          <div
            v-else
            class="message-row"
            :class="{ 'message-row-own': entry.message.senderId === sessionStore.userId }"
          >
            <dbr-chat-bubble
              :text="messageText(entry.message)"
              :kind="bubbleKind(entry.message)"
              :media-src="entry.message.media?.url || ''"
              :time="formatMessageTime(entry.message.createdAt)"
              :direction="entry.message.senderId === sessionStore.userId ? 'out' : 'in'"
              :status="bubbleStatus(entry.message)"
            />
            <dbr-button
              v-if="entry.message.status === 'failed'"
              variant="danger"
              size="sm"
              @click="retryMessage(entry.message.id)"
            >
              Повторить
            </dbr-button>
          </div>
        </template>
      </div>

      <div class="chat-composer">
        <dbr-chat-composer
          v-model="text"
          :disabled="!network.isOnline"
          placeholder="Сообщение"
          @typing="onTypingState"
          @send="onComposerSend"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DbrAvatar,
  DbrButton,
  DbrCard,
  DbrChatBubble,
  DbrChatComposer,
  DbrIconButton,
} from 'dobruniaui-vue'
import { useChatStore } from '../stores/chat-store'
import { useSessionStore } from '../stores/session-store'
import { useConversationsStore } from '../stores/conversations-store'
import { useNetwork } from '../shared/composables/use-network'
import { fetchPresence } from '../shared/api/presence-api'
import { fetchProfile } from '../shared/api/profile-api'
import { resolveUserTitle } from '../shared/utils/profile'
import type { Message, PresenceState, Profile } from '../shared/types/chat'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const network = useNetwork()
const text = ref('')
const actionError = ref<string | null>(null)
const peerProfile = ref<Profile | null>(null)
const peerPresence = ref<PresenceState | null>(null)
const peerUserId = ref<string | null>(null)
const messagesListEl = ref<HTMLElement | null>(null)
const loadingOlder = ref(false)
let markReadPoller: ReturnType<typeof setInterval> | null = null
let messageSyncPoller: ReturnType<typeof setInterval> | null = null
let presencePoller: ReturnType<typeof setInterval> | null = null
const queryPeerDisplayName = computed(() =>
  typeof route.query.peerDisplayName === 'string' ? route.query.peerDisplayName : '',
)
const queryPeerUsername = computed(() =>
  typeof route.query.peerUsername === 'string' ? route.query.peerUsername : '',
)
const queryPeerAvatarUrl = computed(() =>
  typeof route.query.peerAvatarUrl === 'string' ? route.query.peerAvatarUrl : '',
)

const peerTitle = computed(() => {
  const username = peerProfile.value?.username ?? queryPeerUsername.value
  const displayName = peerProfile.value?.displayName ?? queryPeerDisplayName.value
  return resolveUserTitle(username || null, displayName || null)
})

const peerAvatarUrl = computed(() => peerProfile.value?.avatarUrl ?? queryPeerAvatarUrl.value)
const isPeerOnline = computed(() => peerPresence.value?.isOnline ?? false)
const peerStatusLabel = computed(() => (isPeerOnline.value ? 'онлайн' : 'оффлайн'))
type MessageRenderItem =
  | { kind: 'separator'; key: string; label: string }
  | { kind: 'message'; key: string; message: Message }

const messageRenderItems = computed<MessageRenderItem[]>(() => {
  const items: MessageRenderItem[] = []
  let previousDayKey = ''
  for (const message of chatStore.messages) {
    const dayKey = toDayKey(message.createdAt)
    if (dayKey !== previousDayKey) {
      items.push({
        kind: 'separator',
        key: `day-${dayKey}`,
        label: formatMessageDay(message.createdAt),
      })
      previousDayKey = dayKey
    }
    items.push({
      kind: 'message',
      key: message.id,
      message,
    })
  }
  return items
})

const peerInitials = computed(() => {
  const base = (
    peerProfile.value?.displayName ||
    queryPeerDisplayName.value ||
    peerProfile.value?.username ||
    queryPeerUsername.value ||
    'U'
  ).trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return base.slice(0, 2).toUpperCase()
})

const conversationId = route.params.conversationId as string

onMounted(async () => {
  try {
    actionError.value = null
    if (sessionStore.userId) {
      conversationsStore.startRealtime(sessionStore.userId)
    }
    conversationsStore.setActiveConversation?.(conversationId)
    await chatStore.enterConversation(conversationId)
    await nextTick()
    scrollMessagesToBottom()
    const currentUserId = sessionStore.userId
    if (currentUserId) {
      await markConversationAsRead(currentUserId)
      await loadPeerProfile(currentUserId)
      markReadPoller = setInterval(() => {
        markConversationAsRead(currentUserId).catch(() => {
          // Ошибки read-receipt уже обрабатываются внутри.
        })
      }, 2000)
      messageSyncPoller = setInterval(() => {
        chatStore.reload?.(conversationId).catch(() => {
          // Не блокируем UI, если sync временно не удался.
        })
      }, 2000)
    }
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось открыть чат'
  }
})

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  },
)

onUnmounted(() => {
  if (markReadPoller) {
    clearInterval(markReadPoller)
    markReadPoller = null
  }
  if (messageSyncPoller) {
    clearInterval(messageSyncPoller)
    messageSyncPoller = null
  }
  if (presencePoller) {
    clearInterval(presencePoller)
    presencePoller = null
  }
  chatStore.leaveConversation()
  conversationsStore.stopRealtime()
})

async function onTypingState(isTyping: boolean): Promise<void> {
  if (!isTyping || !sessionStore.userId) {
    return
  }
  try {
    await chatStore.onTyping(conversationId, sessionStore.userId)
  } catch {
    // typing-индикатор не должен ломать ввод.
  }
}

async function onComposerSend(payload: {
  text: string
  attachments: Array<{ kind: 'image' | 'file' | 'audio'; file: File }>
}): Promise<void> {
  if (!sessionStore.userId || !network.isOnline) {
    return
  }
  try {
    actionError.value = null
    const messageTextValue = payload.text.trim()
    if (messageTextValue) {
      await chatStore.sendText(conversationId, sessionStore.userId, messageTextValue)
    }

    const imageFiles = payload.attachments
      .filter((attachment) => attachment.kind === 'image')
      .map((attachment) => attachment.file)
    if (imageFiles.length > 0) {
      await chatStore.sendImages(conversationId, sessionStore.userId, imageFiles)
    }

    const audioFiles = payload.attachments
      .filter((attachment) => attachment.kind === 'audio')
      .map((attachment) => attachment.file)
    for (const audioFile of audioFiles) {
      await chatStore.sendAudio(conversationId, sessionStore.userId, audioFile, 30)
    }

    const hasUnsupportedFiles = payload.attachments.some((attachment) => attachment.kind === 'file')
    if (hasUnsupportedFiles) {
      actionError.value = 'Файлы без медиа-типа пока не поддерживаются.'
    }
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось отправить сообщение'
  }
}

function goBack(): void {
  router.back()
}

async function retryMessage(messageId: string): Promise<void> {
  try {
    actionError.value = null
    await chatStore.retryFailed(messageId)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Повторная отправка не удалась'
  }
}

function bubbleStatus(message: Message): 'none' | 'sending' | 'sent' | 'read' {
  if (message.senderId !== sessionStore.userId) {
    return 'none'
  }
  if (message.status === 'sending') {
    return 'sending'
  }
  if (message.status === 'read') {
    return 'read'
  }
  if (message.status === 'sent') {
    return 'sent'
  }
  return 'none'
}

function bubbleKind(message: Message): 'text' | 'image' | 'audio' {
  if (message.type === 'image') {
    return 'image'
  }
  if (message.type === 'audio') {
    return 'audio'
  }
  return 'text'
}

function messageText(message: Message): string {
  if (message.type === 'text') {
    return message.body ?? ''
  }
  if (message.type === 'image') {
    return message.body ?? ''
  }
  return message.body ?? 'Голосовое сообщение'
}

function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt)
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatMessageDay(createdAt: string): string {
  const date = new Date(createdAt)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function toDayKey(createdAt: string): string {
  const date = new Date(createdAt)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadPeerProfile(currentUserId: string): Promise<void> {
  let conversation = conversationsStore.conversations.find((item) => item.id === conversationId)
  if (!conversation) {
    await conversationsStore.load(currentUserId)
    conversation = conversationsStore.conversations.find((item) => item.id === conversationId)
  }
  const peerId = conversation?.memberIds.find((id) => id !== currentUserId) ?? null
  peerUserId.value = peerId
  if (!peerId) {
    return
  }
  try {
    if (!queryPeerDisplayName.value && !queryPeerUsername.value && !queryPeerAvatarUrl.value) {
      peerProfile.value = await fetchProfile(peerId)
    }
  } catch {
    // Профиль собеседника не критичен для открытия чата.
  }
  await loadPeerPresence(peerId)
  startPresencePolling(peerId)
}

async function loadPeerPresence(peerId: string): Promise<void> {
  try {
    peerPresence.value = await fetchPresence(peerId)
  } catch {
    peerPresence.value = null
  }
}

function startPresencePolling(peerId: string): void {
  if (presencePoller) {
    return
  }
  presencePoller = setInterval(() => {
    void loadPeerPresence(peerId)
  }, 15000)
}

async function markConversationAsRead(currentUserId: string): Promise<void> {
  const latestMessageDateMs = chatStore.messages.reduce((maxMs, message) => {
    const messageMs = new Date(message.createdAt).getTime()
    return Number.isFinite(messageMs) ? Math.max(maxMs, messageMs) : maxMs
  }, 0)
  const nowMs = Date.now()
  const readAtIso = new Date(Math.max(nowMs, latestMessageDateMs) + 1000).toISOString()
  try {
    await conversationsStore.markRead(currentUserId, conversationId, readAtIso)
  } catch {
    // Не ломаем чат из-за временной ошибки read-receipt.
  }
}

function scrollMessagesToBottom(): void {
  if (!messagesListEl.value) {
    return
  }
  messagesListEl.value.scrollTop = messagesListEl.value.scrollHeight
}

async function onMessagesScroll(event: Event): Promise<void> {
  const element = event.target as HTMLElement | null
  if (!element || loadingOlder.value || !chatStore.hasMoreMessages) {
    return
  }
  if (element.scrollTop > 40) {
    return
  }
  loadingOlder.value = true
  const previousHeight = element.scrollHeight
  const previousScrollTop = element.scrollTop
  try {
    const loaded = await chatStore.loadOlder()
    if (!loaded) {
      return
    }
    await nextTick()
    const nextHeight = element.scrollHeight
    element.scrollTop = nextHeight - previousHeight + previousScrollTop
  } finally {
    loadingOlder.value = false
  }
}
</script>
