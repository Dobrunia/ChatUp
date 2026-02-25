<template>
  <ion-page>
    <ion-content class="ion-padding chat-room-content">
      <div v-if="!network.isOnline" class="card" style="margin-bottom: var(--space-3)">
        Офлайн: отправка сообщений недоступна.
      </div>

      <div class="card chat-room-card">
        <button class="btn btn-ghost" @click="goBack">Назад</button>
        <div style="height: var(--space-2)" />
        <h2>Чат</h2>
        <p v-if="chatStore.typingUsers.length > 0">печатает...</p>
        <p v-if="chatStore.recordingUsers.length > 0">записывает голосовое...</p>
        <ul>
          <li v-for="item in chatStore.messages" :key="item.id">
            {{ item.type }} · {{ item.body || item.media?.url }} · {{ item.status }}
            <button
              v-if="item.status === 'failed'"
              class="btn btn-danger"
              @click="chatStore.retryFailed(item.id)"
            >
              Повторить
            </button>
          </li>
        </ul>

        <textarea
          v-model="text"
          class="textarea"
          placeholder="Введите сообщение"
          @input="onInput"
        />
        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2)">
          <button class="btn btn-primary" :disabled="!network.isOnline" @click="sendText">
            Отправить текст
          </button>
          <button class="btn btn-ghost" :disabled="!network.isOnline" @click="pickImages">
            Отправить фото
          </button>
          <button class="btn btn-ghost" :disabled="!network.isOnline" @click="sendDemoAudio">
            Отправить голосовое
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useChatStore } from '../../stores/chat-store'
import { useSessionStore } from '../../stores/session-store'
import { useConversationsStore } from '../../stores/conversations-store'
import { useNetwork } from '../../shared/composables/use-network'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const network = useNetwork()
const text = ref('')

const conversationId = route.params.conversationId as string

onMounted(async () => {
  await chatStore.enterConversation(conversationId)
  if (sessionStore.userId) {
    await conversationsStore.markRead(sessionStore.userId)
  }
})

onUnmounted(() => {
  chatStore.leaveConversation()
})

async function onInput(): Promise<void> {
  if (!sessionStore.userId) {
    return
  }
  await chatStore.onTyping(conversationId, sessionStore.userId)
}

async function sendText(): Promise<void> {
  if (!text.value.trim() || !sessionStore.userId || !network.isOnline) {
    return
  }
  await chatStore.sendText(conversationId, sessionStore.userId, text.value.trim())
  text.value = ''
}

async function pickImages(): Promise<void> {
  if (!sessionStore.userId || !network.isOnline) {
    return
  }
  const mock = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
  await chatStore.sendImages(conversationId, sessionStore.userId, [mock])
}

async function sendDemoAudio(): Promise<void> {
  if (!sessionStore.userId || !network.isOnline) {
    return
  }
  await chatStore.setRecording(conversationId, sessionStore.userId, 'start')
  const mock = new File(['audio-bytes'], 'voice.webm', { type: 'audio/webm' })
  await chatStore.sendAudio(conversationId, sessionStore.userId, mock, 30)
  await chatStore.setRecording(conversationId, sessionStore.userId, 'stop')
}

function goBack(): void {
  router.back()
}
</script>
