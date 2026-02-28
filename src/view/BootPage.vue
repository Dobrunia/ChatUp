<template>
  <main class="page-shell">
    <div class="screen-center">
      <dbr-card class="screen-card form-card dbru-text-base dbru-text-main">
        <h2 class="dbru-text-lg dbru-text-main">Запуск</h2>
        <p class="dbru-text-sm dbru-text-muted">Подготовка сессии и сервисов...</p>
        <dbr-loader />
        <p v-if="bootWarning" class="dbru-text-sm dbru-text-main">{{ bootWarning }}</p>
      </dbr-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DbrCard, DbrLoader } from 'dobruniaui-vue'
import { useSessionStore } from '../stores/session-store'
import { useProfileStore } from '../stores/profile-store'
import { useNetwork } from '../shared/composables/use-network'
import { initBootProviders } from '../app/providers/boot-provider'

const router = useRouter()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()
const network = useNetwork()
const bootWarning = ref<string | null>(null)

onMounted(async () => {
  await sessionStore.boot()
  await network.initNetwork()

  if (!sessionStore.onboardingDone) {
    await router.replace('/onboarding')
    return
  }
  if (!sessionStore.userId) {
    await router.replace('/auth')
    return
  }
  const issues = await initBootProviders(sessionStore.userId)
  if (issues.length > 0) {
    bootWarning.value = issues.join('. ')
  }
  try {
    await profileStore.load()
  } catch {
    bootWarning.value = 'Профиль не загружен, но сессия активна'
  }
  await router.replace('/conversations')
})
</script>
