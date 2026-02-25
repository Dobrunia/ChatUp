<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="screen-center">
        <div class="card screen-card">
          <h2>Добро пожаловать</h2>
          <p>Разрешите push-уведомления для входящих сообщений.</p>
          <button class="btn btn-primary" @click="complete">Продолжить</button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../../stores/session-store'

const router = useRouter()
const sessionStore = useSessionStore()

async function complete(): Promise<void> {
  await sessionStore.completeOnboarding()
  await router.replace('/auth')
}
</script>
