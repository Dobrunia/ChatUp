<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="screen-center">
        <div class="card screen-card">
          <h2>Запуск</h2>
          <p>Подготовка сессии и сервисов...</p>
          <p v-if="bootWarning">{{ bootWarning }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useSessionStore } from '../../stores/session-store'
import { useProfileStore } from '../../stores/profile-store'
import { useNetwork } from '../../shared/composables/use-network'
import { initBootProviders } from '../../app/providers/boot-provider'

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
