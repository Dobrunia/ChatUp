<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="page-narrow page-stack">
        <app-header class="page-header" title="Диалоги" subtitle="Личные сообщения">
          <template #left>
            <button class="icon-btn icon-btn-ghost" @click="router.push('/search')" aria-label="Новый чат">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </template>
          <template #right>
            <button class="icon-btn icon-btn-ghost avatar-btn" @click="router.push('/profile')">
              <img
                v-if="profileStore.profile?.avatarUrl"
                :src="profileStore.profile.avatarUrl"
                alt="Профиль"
                class="avatar-image"
              />
              <span v-else class="avatar-fallback">{{ avatarInitials }}</span>
            </button>
          </template>
        </app-header>
        <p v-if="loadError" class="notice-bar notice-bar-error">{{ loadError }}</p>
        <ul v-if="conversationsStore.sortedConversations.length > 0" class="list-card conversation-list">
          <li v-for="item in conversationsStore.sortedConversations" :key="item.id">
            <button class="list-item conversation-item" @click="open(item.id)">
              <div class="conversation-avatar">
                <img
                  v-if="getPeerProfile(item)?.avatarUrl"
                  :src="getPeerProfile(item)?.avatarUrl || ''"
                  alt="Аватар"
                  class="conversation-avatar-image avatar-image"
                />
                <span v-else class="conversation-avatar-fallback avatar-fallback">{{ peerInitials(item) }}</span>
              </div>
              <div class="conversation-main">
                <div class="list-row conversation-row">
                  <strong class="conversation-name">{{ peerName(item) }}</strong>
                  <span class="list-meta conversation-meta">
                    <span
                      v-if="isOwnLastMessage(item)"
                      class="conversation-status-icon"
                      :class="conversationStatusClass(item)"
                      :title="conversationStatusLabel(item)"
                    >
                      {{ conversationStatusIcon(item) }}
                    </span>
                    <span class="conversation-time meta-time">{{ timeLabel(item) }}</span>
                  </span>
                </div>
                <div class="list-row conversation-row">
                  <span class="conversation-preview">
                    <span class="conversation-preview-text">{{ messagePreview(item) }}</span>
                  </span>
                  <span v-if="item.unreadCount > 0" class="conversation-unread">{{ item.unreadCount }}</span>
                </div>
              </div>
            </button>
          </li>
        </ul>
        <div v-else class="empty-state">
          <div class="empty-state-title">Диалогов пока нет</div>
          <div class="empty-state-text">Найди пользователя и начни переписку.</div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue'
import AppHeader from '../../shared/ui/components/app-header.vue'
import { useConversationsStore } from '../../stores/conversations-store'
import { useSessionStore } from '../../stores/session-store'
import { useProfileStore } from '../../stores/profile-store'
import { fetchProfile } from '../../shared/api/profile-api'
import { resolveUserTitle } from '../../shared/utils/profile'
import type { Conversation, Profile } from '../../shared/types/chat'

const router = useRouter()
const conversationsStore = useConversationsStore()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()
const loadError = ref<string | null>(null)
const peerProfiles = ref<Record<string, Profile>>({})

const avatarInitials = computed(() => {
  const displayName = profileStore.profile?.displayName?.trim() ?? ''
  const username = profileStore.profile?.username?.trim() ?? ''
  const source = displayName || username || 'U'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
})

async function bootstrapConversations(): Promise<void> {
  if (!sessionStore.userId) {
    await router.replace('/auth')
    return
  }
  try {
    if (!profileStore.profile) {
      await profileStore.load()
    }
    await conversationsStore.load(sessionStore.userId)
    conversationsStore.startRealtime(sessionStore.userId)
    await hydrateMissingPeerProfiles()
    loadError.value = null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки диалогов'
    if (message.includes('PGRST205') || message.includes('public.conversations')) {
      loadError.value = 'В Supabase не создана таблица conversations. Примени SQL-схему проекта.'
      return
    }
    loadError.value = message
  }
}

onMounted(async () => {
  await bootstrapConversations()
})

onIonViewWillEnter(() => {
  void bootstrapConversations()
})

onUnmounted(() => {
  conversationsStore.stopRealtime()
})

watch(
  () => conversationsStore.sortedConversations.map((item) => item.id).join('|'),
  () => {
    void hydrateMissingPeerProfiles()
  },
)

function getPeerId(conversation: Conversation): string | null {
  const currentUserId = sessionStore.userId
  if (!currentUserId) {
    return null
  }
  return conversation.memberIds.find((id) => id !== currentUserId) ?? null
}

function getPeerProfile(conversation: Conversation): Profile | null {
  const peerId = getPeerId(conversation)
  if (!peerId) {
    return null
  }
  return peerProfiles.value[peerId] ?? null
}

function peerName(conversation: Conversation): string {
  const peer = getPeerProfile(conversation)
  return resolveUserTitle(peer?.username ?? null, peer?.displayName ?? null)
}

function peerInitials(conversation: Conversation): string {
  const peer = getPeerProfile(conversation)
  const base = (peer?.displayName || peer?.username || 'U').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return base.slice(0, 2).toUpperCase()
}

function messagePreview(conversation: Conversation): string {
  const last = conversation.lastMessage
  if (!last) {
    return 'Сообщений пока нет'
  }
  const peerId = getPeerId(conversation)
  const fromPeer = peerId ? last.senderId === peerId : false
  if (fromPeer) {
    if (last.type === 'text') {
      return `${peerName(conversation)}: ${last.body ?? ''}`.trim()
    }
    if (last.type === 'image') {
      return `${peerName(conversation)}: Фото`
    }
    return `${peerName(conversation)}: Голосовое`
  }
  if (last.type === 'text') {
    return `${last.body ?? ''}`.trim()
  }
  if (last.type === 'image') {
    return 'Фото'
  }
  return 'Голосовое'
}

function isOwnLastMessage(conversation: Conversation): boolean {
  return Boolean(conversation.lastMessage && conversation.lastMessage.senderId === sessionStore.userId)
}

function conversationStatusLabel(conversation: Conversation): string {
  const status = conversation.lastMessage?.status ?? 'sent'
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

function conversationStatusIcon(conversation: Conversation): string {
  const status = conversation.lastMessage?.status ?? 'sent'
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

function conversationStatusClass(conversation: Conversation): string {
  const status = conversation.lastMessage?.status ?? 'sent'
  if (status === 'read') {
    return 'conversation-status-read'
  }
  if (status === 'failed') {
    return 'conversation-status-failed'
  }
  return 'conversation-status-default'
}

function timeLabel(conversation: Conversation): string {
  const lastDateIso = conversation.lastMessage?.createdAt ?? conversation.updatedAt
  const date = new Date(lastDateIso)
  const now = new Date()
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  if (sameDay) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(date)
}

async function hydrateMissingPeerProfiles(): Promise<void> {
  const peers = conversationsStore.sortedConversations
    .map((conversation) => getPeerId(conversation))
    .filter((id): id is string => Boolean(id))
  const uniquePeerIds = [...new Set(peers)].filter((peerId) => !peerProfiles.value[peerId])
  if (uniquePeerIds.length === 0) {
    return
  }
  const profileEntries = await Promise.all(
    uniquePeerIds.map(async (peerId) => {
      try {
        const profile = await fetchProfile(peerId)
        return [peerId, profile] as const
      } catch {
        return [peerId, null] as const
      }
    }),
  )

  const map: Record<string, Profile> = { ...peerProfiles.value }
  profileEntries.forEach(([peerId, profile]) => {
    if (profile) {
      map[peerId] = profile
    }
  })
  peerProfiles.value = map
}

async function open(conversationId: string): Promise<void> {
  try {
    await router.push(`/chat/${conversationId}`)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Не удалось открыть диалог'
  }
}
</script>

<style scoped>
.conversation-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.conversation-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.conversation-main {
  min-width: 0;
  flex: 1;
}

.conversation-meta {
  gap: var(--space-1);
}

.conversation-name {
  color: var(--color-surface-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-preview {
  color: var(--color-muted);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
}

.conversation-preview-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-status-icon {
  min-width: 16px;
  text-align: center;
  line-height: 1;
  font-weight: 700;
}

.conversation-status-default {
  color: var(--color-muted);
}

.conversation-status-read {
  color: var(--color-success);
}

.conversation-status-failed {
  color: var(--color-danger);
}

.conversation-unread {
  min-width: 18px;
  height: 18px;
  border-radius: var(--radius-xl);
  background: var(--color-unread);
  color: var(--color-on-primary);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  flex-shrink: 0;
}

</style>
