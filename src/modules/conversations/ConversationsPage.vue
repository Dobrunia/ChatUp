<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="screen-center">
        <div class="card screen-card">
          <h2>Диалоги</h2>
          <p v-if="loadError">{{ loadError }}</p>
          <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3)">
            <button class="btn btn-primary" @click="router.push('/search')">Новый чат</button>
            <button class="btn btn-ghost" @click="router.push('/profile')">Профиль</button>
          </div>
          <ul>
            <li v-for="item in conversationsStore.sortedConversations" :key="item.id">
              <button class="btn btn-ghost" @click="open(item.id)">
                {{ item.id }} · непрочитанные: {{ item.unreadCount }}
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
import { useConversationsStore } from '../../stores/conversations-store'
import { useSessionStore } from '../../stores/session-store'

const router = useRouter()
const conversationsStore = useConversationsStore()
const sessionStore = useSessionStore()
const loadError = ref<string | null>(null)

onMounted(async () => {
  if (!sessionStore.userId) {
    await router.replace('/auth')
    return
  }
  try {
    await conversationsStore.load(sessionStore.userId)
    loadError.value = null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки диалогов'
    if (message.includes('PGRST205') || message.includes('public.conversations')) {
      loadError.value = 'В Supabase не создана таблица conversations. Примени SQL-схему проекта.'
      return
    }
    loadError.value = message
  }
})

async function open(conversationId: string): Promise<void> {
  try {
    await router.push(`/chat/${conversationId}`)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Не удалось открыть диалог'
  }
}
</script>
