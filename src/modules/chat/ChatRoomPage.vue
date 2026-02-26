<template>
  <ion-page>
    <ion-content class="chat-room-content">
      <div class="chat-shell">
        <div class="chat-header">
          <button class="btn btn-ghost" @click="goBack">Назад</button>
          <div class="chat-peer">
            <img
              v-if="peerAvatarUrl"
              :src="peerAvatarUrl"
              alt="Аватар собеседника"
              class="chat-peer-avatar"
            />
            <div v-else class="chat-peer-avatar chat-peer-avatar-fallback">{{ peerInitials }}</div>
            <div class="chat-peer-meta">
              <strong class="chat-peer-name">{{ peerTitle }}</strong>
              <span class="chat-presence">онлайн</span>
            </div>
          </div>
        </div>

        <p v-if="!network.isOnline" class="chat-banner">Офлайн: отправка сообщений недоступна.</p>
        <p v-if="actionError" class="chat-banner chat-banner-error">{{ actionError }}</p>
        <p v-if="chatStore.typingUsers.length > 0" class="chat-indicator">печатает...</p>
        <p v-if="chatStore.recordingUsers.length > 0" class="chat-indicator">записывает голосовое...</p>

        <div ref="messagesListEl" class="messages-list">
          <div
            v-for="item in chatStore.messages"
            :key="item.id"
            class="message-row"
            :class="{ 'message-row-own': item.senderId === sessionStore.userId }"
          >
            <div
              class="message-bubble"
              :class="{ 'message-bubble-own': item.senderId === sessionStore.userId }"
            >
              <p v-if="item.type === 'text'" class="message-text">{{ item.body }}</p>
              <p v-else-if="item.type === 'image'" class="message-text">Фото: {{ item.media?.url }}</p>
              <p v-else class="message-text">Голосовое сообщение</p>
              <div class="message-meta">
                <span
                  v-if="item.senderId === sessionStore.userId"
                  class="message-status-icon"
                  :class="statusIconClass(item.status)"
                  :title="messageStatusLabel(item.status)"
                >
                  {{ messageStatusIcon(item.status) }}
                </span>
                <button
                  v-if="item.status === 'failed'"
                  class="btn btn-danger message-retry"
                  @click="retryMessage(item.id)"
                >
                  Повторить
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-composer">
          <button class="icon-btn icon-btn-ghost" :disabled="!network.isOnline" @click="pickImages">
            🖼
          </button>
          <textarea
            v-model="text"
            class="textarea composer-input"
            placeholder="Сообщение"
            @input="onInput"
            @keydown.enter.exact.prevent="sendText"
          />
          <button class="icon-btn icon-btn-ghost" :disabled="!network.isOnline" @click="sendDemoAudio">
            🎤
          </button>
          <button class="icon-btn icon-btn-primary" :disabled="!network.isOnline" @click="sendText">
            ➤
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useChatStore } from '../../stores/chat-store'
import { useSessionStore } from '../../stores/session-store'
import { useConversationsStore } from '../../stores/conversations-store'
import { useNetwork } from '../../shared/composables/use-network'
import { fetchProfile } from '../../shared/api/profile-api'
import { resolveUserTitle } from '../../shared/utils/profile'
import type { Profile } from '../../shared/types/chat'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const network = useNetwork()
const text = ref('')
const actionError = ref<string | null>(null)
const peerProfile = ref<Profile | null>(null)
const messagesListEl = ref<HTMLElement | null>(null)
let markReadPoller: ReturnType<typeof setInterval> | null = null
let messageSyncPoller: ReturnType<typeof setInterval> | null = null
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
  chatStore.leaveConversation()
  conversationsStore.stopRealtime()
})

async function onInput(): Promise<void> {
  if (!sessionStore.userId) {
    return
  }
  try {
    await chatStore.onTyping(conversationId, sessionStore.userId)
  } catch {
    // typing-индикатор не должен ломать ввод.
  }
}

async function sendText(): Promise<void> {
  if (!text.value.trim() || !sessionStore.userId || !network.isOnline) {
    return
  }
  try {
    actionError.value = null
    await chatStore.sendText(conversationId, sessionStore.userId, text.value.trim())
    text.value = ''
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось отправить сообщение'
  }
}

async function pickImages(): Promise<void> {
  if (!sessionStore.userId || !network.isOnline) {
    return
  }
  try {
    actionError.value = null
    const mock = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
    await chatStore.sendImages(conversationId, sessionStore.userId, [mock])
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось отправить фото'
  }
}

async function sendDemoAudio(): Promise<void> {
  if (!sessionStore.userId || !network.isOnline) {
    return
  }
  try {
    actionError.value = null
    await chatStore.setRecording(conversationId, sessionStore.userId, 'start')
    const mock = new File(['audio-bytes'], 'voice.webm', { type: 'audio/webm' })
    await chatStore.sendAudio(conversationId, sessionStore.userId, mock, 30)
    await chatStore.setRecording(conversationId, sessionStore.userId, 'stop')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось отправить голосовое'
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

function messageStatusLabel(status: string): string {
  if (status === 'sending') {
    return 'Отправляется'
  }
  if (status === 'sent') {
    return 'Отправлено'
  }
  if (status === 'read') {
    return 'Прочитано'
  }
  return 'Ошибка'
}

function messageStatusIcon(status: string): string {
  if (status === 'sending') {
    return '⌛'
  }
  if (status === 'sent') {
    return '✔'
  }
  if (status === 'read') {
    return '✔✔'
  }
  return '⚠'
}

function statusIconClass(status: string): string {
  if (status === 'read') {
    return 'message-status-read'
  }
  if (status === 'failed') {
    return 'message-status-failed'
  }
  return 'message-status-default'
}

async function loadPeerProfile(currentUserId: string): Promise<void> {
  // Если мы уже пришли из поиска с данными собеседника, не дёргаем profiles повторно.
  if (queryPeerDisplayName.value || queryPeerUsername.value || queryPeerAvatarUrl.value) {
    return
  }

  let conversation = conversationsStore.conversations.find((item) => item.id === conversationId)
  if (!conversation) {
    await conversationsStore.load(currentUserId)
    conversation = conversationsStore.conversations.find((item) => item.id === conversationId)
  }
  const peerUserId = conversation?.memberIds.find((id) => id !== currentUserId)
  if (!peerUserId) {
    return
  }
  try {
    peerProfile.value = await fetchProfile(peerUserId)
  } catch {
    // Профиль собеседника не критичен для открытия чата.
  }
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
</script>

<style scoped>
.chat-shell {
  width: min(100%, 560px);
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3) calc(var(--space-2) + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.chat-peer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.chat-peer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.chat-peer-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 12px;
  font-weight: 700;
}

.chat-peer-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-peer-name {
  color: var(--color-surface-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-presence {
  color: var(--color-muted);
  font-size: 12px;
}

.chat-banner {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.chat-banner-error {
  border-color: var(--color-danger);
}

.chat-indicator {
  margin: 0;
  color: var(--color-muted);
  font-size: 12px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--space-1);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.messages-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-row-own {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 78%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-surface-text);
}

.message-bubble-own {
  background: var(--color-primary);
  color: var(--color-on-primary) !important;
  border-color: transparent;
}

.message-text {
  color: inherit;
  margin: 0;
  overflow-wrap: anywhere;
}

.message-bubble-own .message-text {
  color: var(--color-on-primary) !important;
}

.message-meta {
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  opacity: 0.9;
}

.message-status-icon {
  min-width: 24px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.message-status-default {
  color: var(--color-muted);
}

.message-status-read {
  color: var(--color-success);
}

.message-status-failed {
  color: var(--color-danger);
}

.message-bubble-own .message-status-default,
.message-bubble-own .message-status-read,
.message-bubble-own .message-status-failed {
  color: var(--color-on-primary);
}

.message-retry {
  padding: 2px 8px;
}

.chat-composer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.composer-input {
  min-height: 40px;
  max-height: 100px;
}
</style>
