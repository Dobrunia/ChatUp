<template>
  <main class="page-shell">
    <div class="page-narrow page-stack">
      <page-header title="Поиск" subtitle="Найти пользователя" back-button @back="router.back()">
        <template #right>
          <dbr-theme-toggle :model-value="isDarkTheme" :persist="false" @change="onThemeChange" />
          <button class="avatar-nav-btn" @click="router.push('/profile')">
            <dbr-avatar
              :src="profileStore.profile?.avatarUrl || undefined"
              :name="avatarInitials"
              shape="rounded"
            />
          </button>
        </template>
      </page-header>
      <dbr-card class="screen-card form-card">
        <h2>Поиск пользователя</h2>
        <p v-if="actionError">{{ actionError }}</p>
        <div class="form-fields search-form-row">
          <dbr-input v-model="query" type="search" label="@username или имя" />
          <dbr-button @click="searchStore.run(query)">Найти</dbr-button>
        </div>
        <ul v-if="searchStore.results.length > 0" class="list-card">
          <li v-for="user in searchStore.results" :key="user.userId">
            <button class="list-item user-row" @click="openChat(user)">
              <dbr-avatar :src="user.avatarUrl || undefined" :name="userInitials(user)" shape="rounded" />
              <div class="user-meta">
                <div>{{ userTitle(user) }}</div>
                <div v-if="userHandle(user)">{{ userHandle(user) }}</div>
              </div>
            </button>
          </li>
        </ul>
        <div v-else class="empty-state">
          <div>Нет результатов</div>
          <div>Попробуй другой запрос.</div>
        </div>
      </dbr-card>

      <dbr-card class="screen-card form-card">
        <h3>Случайные пользователи</h3>
        <ul v-if="searchStore.randomUsers.length > 0" class="list-card">
          <li v-for="user in searchStore.randomUsers" :key="`random-${user.userId}`">
            <button class="list-item user-row" @click="openChat(user)">
              <dbr-avatar :src="user.avatarUrl || undefined" :name="userInitials(user)" shape="rounded" />
              <div class="user-meta">
                <div>{{ userTitle(user) }}</div>
                <div v-if="userHandle(user)">{{ userHandle(user) }}</div>
              </div>
            </button>
          </li>
        </ul>
        <div v-else class="empty-state">
          <div>Пока пусто</div>
          <div>Позже появятся случайные пользователи.</div>
        </div>
      </dbr-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DbrAvatar,
  DbrButton,
  DbrInput,
  DbrThemeToggle,
} from 'dobruniaui-vue'
import PageHeader from '../components/PageHeader.vue'
import { useSearchStore } from '../stores/search-store'
import { useSessionStore } from '../stores/session-store'
import { useConversationsStore } from '../stores/conversations-store'
import { useProfileStore } from '../stores/profile-store'
import { useTheme } from '../shared/composables/use-theme'
import type { Profile } from '../shared/types/chat'

const router = useRouter()
const query = ref('')
const searchStore = useSearchStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const profileStore = useProfileStore()
const theme = useTheme()
const actionError = ref<string | null>(null)
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

function userTitle(user: Profile): string {
  const displayName = user.displayName?.trim() ?? ''
  if (displayName) {
    return displayName
  }
  if (user.username) {
    return `@${user.username}`
  }
  return 'User'
}

function userHandle(user: Profile): string {
  if (user.displayName && user.username) {
    return `@${user.username}`
  }
  return ''
}

function userInitials(user: Profile): string {
  const base = (user.displayName || user.username || 'U').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return base.slice(0, 2).toUpperCase()
}

onMounted(async () => {
  await searchStore.loadRandom(sessionStore.userId ?? undefined)
})

async function openChat(user: Profile): Promise<void> {
  if (!sessionStore.userId) {
    await router.replace('/auth')
    return
  }
  try {
    actionError.value = null
    const conversationId = await conversationsStore.open(sessionStore.userId, user.userId)
    await router.push({
      path: `/chat/${conversationId}`,
      query: {
        peerDisplayName: user.displayName ?? '',
        peerUsername: user.username ?? '',
        peerAvatarUrl: user.avatarUrl ?? '',
      },
    })
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось открыть чат'
  }
}

async function onThemeChange(value: boolean): Promise<void> {
  await theme.setTheme(value ? 'dark' : 'light')
}
</script>
