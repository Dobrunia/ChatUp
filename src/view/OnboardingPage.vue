<template>
  <main class="page-shell">
    <div class="screen-center">
      <dbr-card class="screen-card form-card ornamented">
        <h2 class="card-title">Добро пожаловать</h2>
        <p class="card-subtitle">Разрешите push-уведомления для входящих сообщений.</p>
        <dbr-button class="btn-wide" @click="complete">Продолжить</dbr-button>
      </dbr-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DbrButton, DbrCard } from 'dobruniaui-vue'
import { useSessionStore } from '../stores/session-store'

const router = useRouter()
const sessionStore = useSessionStore()

async function complete(): Promise<void> {
  await sessionStore.completeOnboarding()
  await router.replace('/auth')
}
</script>
