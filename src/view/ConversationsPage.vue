<template>
  <main class="page-shell">
    <div class="page-narrow page-stack">
      <page-header title="Диалоги" subtitle="Личные сообщения">
        <template #left>
          <dbr-icon-button label="Новый чат" variant="ghost" @click="router.push('/search')">
            <template #iconBefore>+</template>
          </dbr-icon-button>
        </template>
        <template #right>
          <dbr-theme-toggle :model-value="isDarkTheme" :persist="false" @change="onThemeChange" />
          <button class="avatar-nav-btn" @click="router.push('/profile')">
            <dbr-avatar
              :src="profileStore.profile?.avatarUrl || undefined"
              :name="profileStore.profile?.displayName || avatarInitials"
              shape="rounded"
            />
          </button>
        </template>
      </page-header>
      <p v-if="loadError">{{ loadError }}</p>
      <ul v-if="isLoading" class="conversation-list">
        <li v-for="index in 6" :key="`skeleton-${index}`">
          <dbr-card class="conversation-card">
            <dbr-chat-list-item :loading="true" />
          </dbr-card>
        </li>
      </ul>
      <ul v-else-if="conversationsStore.sortedConversations.length > 0" class="conversation-list">
        <li v-for="item in conversationsStore.sortedConversations" :key="item.id">
          <dbr-card class="conversation-card" @click="open(item.id)">
            <dbr-chat-list-item
              :id="item.id"
              :key="`${item.id}-${peerName(item)}-${getPeerProfile(item)?.avatarUrl || ''}`"
              :avatar="getPeerProfile(item)?.avatarUrl || undefined"
              avatar-shape="rounded"
              :name="peerName(item)"
              :last-message="{
                text: messagePreview(item),
                type: messageType(item),
              }"
              :timestamp="new Date(item.lastMessage?.createdAt ?? item.updatedAt)"
              :message-status="listItemStatus(item)"
              :is-outgoing="isOwnLastMessage(item)"
              :unread-count="item.unreadCount"
              status="offline"
              :is-typing="false"
            />
          </dbr-card>
        </li>
      </ul>
      <div v-else class="empty-state">
        <div>Диалогов пока нет</div>
        <div>Найди пользователя и начни переписку.</div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  DbrAvatar,
  DbrCard,
  DbrChatListItem,
  DbrIconButton,
  DbrThemeToggle,
} from 'dobruniaui-vue'
import PageHeader from '../components/PageHeader.vue'
import { useConversationsStore } from '../stores/conversations-store'
import { useSessionStore } from '../stores/session-store'
import { useProfileStore } from '../stores/profile-store'
import { useTheme } from '../shared/composables/use-theme'
import { fetchProfile } from '../shared/api/profile-api'
import { resolveUserTitle } from '../shared/utils/profile'
import type { Conversation, Profile } from '../shared/types/chat'

const router = useRouter()
const conversationsStore = useConversationsStore()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()
const theme = useTheme()
const loadError = ref<string | null>(null)
const isLoading = ref(true)
const peerProfiles = ref<Record<string, Profile>>({})
const isDarkTheme = computed(() => theme.themeMode.value === 'dark')

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
    isLoading.value = true
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
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await bootstrapConversations()
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

function messageType(conversation: Conversation): 'text' | 'image' | 'voice' {
  const type = conversation.lastMessage?.type
  if (type === 'image') {
    return 'image'
  }
  if (type === 'audio') {
    return 'voice'
  }
  return 'text'
}

function isOwnLastMessage(conversation: Conversation): boolean {
  return Boolean(conversation.lastMessage && conversation.lastMessage.senderId === sessionStore.userId)
}

function listItemStatus(conversation: Conversation): 'unread' | 'read' | 'error' {
  if (!conversation.lastMessage) {
    return 'read'
  }
  if (isOwnLastMessage(conversation)) {
    return conversation.lastMessage.status === 'failed'
      ? 'error'
      : conversation.lastMessage.status === 'read'
        ? 'read'
        : 'unread'
  }
  return conversation.unreadCount > 0 ? 'unread' : 'read'
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

async function onThemeChange(value: boolean): Promise<void> {
  await theme.setTheme(value ? 'dark' : 'light')
}
</script>
