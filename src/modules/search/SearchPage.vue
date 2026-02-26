<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="page-narrow page-stack">
        <app-header class="page-header" title="Поиск" subtitle="Найти пользователя">
          <template #left>
            <button class="icon-btn icon-btn-ghost" @click="router.back()" aria-label="Назад">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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
        <div class="card screen-card form-card ornamented">
          <h2 class="card-title">Поиск пользователя</h2>
          <p v-if="actionError" class="notice-bar notice-bar-error">{{ actionError }}</p>
          <div class="form-fields">
            <input v-model.trim="query" class="input" placeholder="@username или имя" />
            <button class="btn btn-primary" @click="searchStore.run(query)">Найти</button>
          </div>
          <ul v-if="searchStore.results.length > 0" class="list-card">
            <li v-for="user in searchStore.results" :key="user.userId">
              <button class="list-item user-row" @click="openChat(user)">
                <div class="user-avatar">
                  <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Аватар" class="avatar-image" />
                  <span v-else class="avatar-fallback">{{ userInitials(user) }}</span>
                </div>
                <div class="user-meta">
                  <div class="user-name">{{ userTitle(user) }}</div>
                  <div v-if="userHandle(user)" class="user-handle">{{ userHandle(user) }}</div>
                </div>
              </button>
            </li>
          </ul>
          <div v-else class="empty-state">
            <div class="empty-state-title">Нет результатов</div>
            <div class="empty-state-text">Попробуй другой запрос.</div>
          </div>
        </div>

        <div class="card screen-card form-card">
          <h3 class="card-title">Случайные пользователи</h3>
          <ul v-if="searchStore.randomUsers.length > 0" class="list-card">
            <li v-for="user in searchStore.randomUsers" :key="`random-${user.userId}`">
              <button class="list-item user-row" @click="openChat(user)">
                <div class="user-avatar">
                  <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Аватар" class="avatar-image" />
                  <span v-else class="avatar-fallback">{{ userInitials(user) }}</span>
                </div>
                <div class="user-meta">
                  <div class="user-name">{{ userTitle(user) }}</div>
                  <div v-if="userHandle(user)" class="user-handle">{{ userHandle(user) }}</div>
                </div>
              </button>
            </li>
          </ul>
          <div v-else class="empty-state">
            <div class="empty-state-title">Пока пусто</div>
            <div class="empty-state-text">Позже появятся случайные пользователи.</div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import AppHeader from '../../shared/ui/components/app-header.vue'
import { useSearchStore } from '../../stores/search-store'
import { useSessionStore } from '../../stores/session-store'
import { useConversationsStore } from '../../stores/conversations-store'
import { useProfileStore } from '../../stores/profile-store'
import type { Profile } from '../../shared/types/chat'

const router = useRouter()
const query = ref('')
const searchStore = useSearchStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const profileStore = useProfileStore()
const actionError = ref<string | null>(null)
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
</script>

