<template>
  <section class="page">
    <div class="page__header">
      <h2 class="page__title dbru-text-lg dbru-text-main">Диалоги</h2>
      <DbrInput
        v-model="searchQuery"
        placeholder="Поиск пользователя..."
        name="search"
        @input="handleSearch"
      />
    </div>

    <!-- Existing conversations -->
    <div v-if="conversationsStore.loading" class="page__center">
      <DbrLoader />
    </div>

    <template v-else>
      <div v-if="sortedConversations.length === 0 && !searchQuery" class="page__empty dbru-surface dbru-text-sm dbru-text-muted">
        Нет диалогов. Найдите пользователя выше и начните чат.
      </div>

      <div v-else-if="sortedConversations.length > 0" class="page__list">
        <DbrChatListItem
          v-for="conv in sortedConversations"
          :key="conv.id"
          :avatar="peerProfiles[getPeerId(conv)]?.avatarUrl ?? ''"
          :avatarAlt="peerProfiles[getPeerId(conv)]?.displayName ?? ''"
          :name="getDisplayName(peerProfiles[getPeerId(conv)])"
          :lastMessage="getLastMessagePreview(conv)"
          :timestamp="new Date(conv.updatedAt)"
          :messageStatus="getMessageStatus(conv)"
          :isOutgoing="conv.lastMessage?.senderId === currentUserId"
          :status="presenceStore.isOnline(getPeerId(conv)) ? 'online' : 'offline'"
          :unreadCount="conv.unreadCount"
          :loading="profilesLoading"
          @click="openConversation(conv.id)"
        />
      </div>

      <!-- Search results (new conversations) -->
      <template v-if="searchQuery">
        <div v-if="searchStore.loading" class="page__center">
          <DbrLoader />
        </div>

        <div v-else-if="searchStore.results.length > 0">
          <h3 class="page__section-title dbru-text-sm dbru-text-muted">Найти пользователя</h3>
          <div class="page__list">
            <DbrChatListItem
              v-for="user in searchStore.results"
              :key="user.userId"
              :avatar="user.avatarUrl ?? ''"
              :avatarAlt="user.displayName ?? ''"
              :name="getDisplayName(user)"
              :status="presenceStore.isOnline(user.userId) ? 'online' : 'offline'"
              @click="startConversation(user.userId)"
            />
          </div>
        </div>

        <div v-else class="page__empty dbru-surface dbru-text-sm dbru-text-muted">
          Пользователь не найден.
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DbrChatListItem, DbrInput, DbrLoader } from 'dobruniaui-vue'
import { useConversationsStore } from '../stores/conversations-store'
import { useSearchStore } from '../stores/search-store'
import { useSessionStore } from '../stores/session-store'
import { usePresenceStore } from '../stores/presence-store'
import { fetchProfilesBatch } from '../shared/api/profile-api'
import type { Conversation, Profile } from '../shared/types/chat'

const router = useRouter()
const conversationsStore = useConversationsStore()
const searchStore = useSearchStore()
const sessionStore = useSessionStore()
const presenceStore = usePresenceStore()

const { sortedConversations } = storeToRefs(conversationsStore)

const currentUserId = sessionStore.userId!
const searchQuery = ref('')
const peerProfiles = ref<Record<string, Profile>>({})
const profilesLoading = ref(false)

function getPeerId(conv: Conversation): string {
  return conv.memberIds.find((id) => id !== currentUserId) ?? conv.memberIds[0]
}

function getDisplayName(profile: Profile | undefined): string {
  if (!profile) return '...'
  return profile.displayName ?? profile.username ?? 'Пользователь'
}

function getLastMessagePreview(
  conv: Conversation,
): { text?: string; type?: 'text' | 'image' | 'file' | 'voice' } | undefined {
  if (!conv.lastMessage) return undefined
  const msg = conv.lastMessage
  if (msg.type === 'text') return { text: msg.body ?? '', type: 'text' }
  if (msg.type === 'image') return { text: 'Фото', type: 'image' }
  if (msg.type === 'audio') return { text: 'Голосовое', type: 'voice' }
  return { text: '', type: 'text' }
}

function getMessageStatus(conv: Conversation): 'unread' | 'read' | 'error' {
  const msg = conv.lastMessage
  if (!msg) return 'read'
  if (msg.status === 'failed') return 'error'
  if (conv.unreadCount > 0) return 'unread'
  return 'read'
}

async function loadPeerProfiles(): Promise<void> {
  const peerIds = sortedConversations.value.map(getPeerId)
  if (peerIds.length === 0) return

  profilesLoading.value = true
  try {
    const profiles = await fetchProfilesBatch(peerIds)
    const next: Record<string, Profile> = {}
    profiles.forEach((p) => {
      next[p.userId] = p
    })
    peerProfiles.value = next
    // Load initial presence (no realtime subscription — the list refreshes via conversations realtime)
    await presenceStore.loadBatch(peerIds)
  } finally {
    profilesLoading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleSearch(): void {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  if (!searchQuery.value.trim()) {
    return
  }
  searchTimer = setTimeout(async () => {
    await searchStore.run(searchQuery.value)
  }, 350)
}

async function openConversation(conversationId: string): Promise<void> {
  conversationsStore.setActiveConversation(conversationId)
  await router.push({ name: 'chat', params: { conversationId } })
}

async function startConversation(peerUserId: string): Promise<void> {
  if (!currentUserId) return
  const conversationId = await conversationsStore.open(currentUserId, peerUserId)
  searchQuery.value = ''
  await router.push({ name: 'chat', params: { conversationId } })
}

// Reload peer profiles whenever conversations change
watch(sortedConversations, () => {
  void loadPeerProfiles()
})

onMounted(async () => {
  await loadPeerProfiles()
})

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})
</script>

<style scoped>
.page {
  display: grid;
  gap: var(--dbru-space-3);
}

.page__header {
  display: grid;
  gap: var(--dbru-space-2);
}

.page__title {
  margin: 0;
}

.page__section-title {
  margin: 0;
  padding: var(--dbru-space-2) 0;
}

.page__center {
  display: flex;
  justify-content: center;
  padding: var(--dbru-space-4);
}

.page__empty {
  border: 1px solid var(--dbru-color-border);
  border-radius: var(--dbru-radius-md);
  padding: var(--dbru-space-4);
}

.page__list {
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-1);
}
</style>
