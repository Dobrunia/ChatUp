<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="search-layout">
        <div class="card screen-card">
          <button class="btn btn-ghost" @click="router.back()">Назад</button>
          <div style="height: var(--space-2)" />
          <h2>Поиск пользователя</h2>
          <p v-if="actionError">{{ actionError }}</p>
          <input v-model.trim="query" class="input" placeholder="@username или display_name" />
          <div style="height: var(--space-2)" />
          <button class="btn btn-primary" @click="searchStore.run(query)">Найти</button>
          <ul>
            <li v-for="user in searchStore.results" :key="user.userId">
              <button class="btn btn-ghost" @click="openChat(user)">
                {{ user.displayName || '@' + (user.username || '') }}
              </button>
            </li>
          </ul>
        </div>

        <div class="card screen-card" style="margin-top: var(--space-3)">
          <h3 style="margin-top: 0">Случайные пользователи</h3>
          <ul>
            <li v-for="user in searchStore.randomUsers" :key="`random-${user.userId}`">
              <button class="btn btn-ghost" @click="openChat(user)">
                {{ user.displayName || '@' + (user.username || '') }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useSearchStore } from '../../stores/search-store'
import { useSessionStore } from '../../stores/session-store'
import { useConversationsStore } from '../../stores/conversations-store'
import type { Profile } from '../../shared/types/chat'

const router = useRouter()
const query = ref('')
const searchStore = useSearchStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const actionError = ref<string | null>(null)

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

<style scoped>
.search-layout {
  width: min(100%, 480px);
  margin: 0 auto;
}
</style>
