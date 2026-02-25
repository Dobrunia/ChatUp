<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="screen-center">
        <div class="card screen-card">
          <h2>Профиль</h2>
          <input v-model.trim="username" class="input" placeholder="@username" />
          <div style="height: var(--space-2)" />
          <input v-model.trim="displayName" class="input" placeholder="Отображаемое имя" />
          <div style="height: var(--space-2)" />
          <input v-model.trim="avatarUrl" class="input" placeholder="Ссылка на аватар" />
          <div style="height: var(--space-3)" />
          <label style="display: flex; gap: var(--space-2)">
            <input v-model="notificationsEnabled" type="checkbox" />
            Уведомления включены
          </label>
          <div style="height: var(--space-2)" />
          <label style="display: flex; gap: var(--space-2)">
            <input :checked="isDarkTheme" type="checkbox" @change="toggleTheme" />
            Темная тема
          </label>
          <div style="height: var(--space-3)" />
          <div style="display: flex; gap: var(--space-2)">
            <button class="btn btn-primary" @click="save">Сохранить</button>
            <button class="btn btn-ghost" @click="router.push('/conversations')">Назад</button>
            <button class="btn btn-danger" @click="logout">Выйти</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useProfileStore } from '../../stores/profile-store'
import { useSessionStore } from '../../stores/session-store'
import { useTheme } from '../../shared/composables/use-theme'

const router = useRouter()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const theme = useTheme()

const username = ref('')
const displayName = ref('')
const avatarUrl = ref('')
const notificationsEnabled = ref(true)
const isDarkTheme = computed(() => theme.themeMode.value === 'dark')

watchEffect(() => {
  const profile = profileStore.profile
  if (!profile) {
    return
  }
  username.value = profile.username ?? ''
  displayName.value = profile.displayName ?? ''
  avatarUrl.value = profile.avatarUrl ?? ''
  notificationsEnabled.value = profile.notificationsEnabled
})

async function save(): Promise<void> {
  if (!sessionStore.userId) {
    return
  }
  await profileStore.save({
    userId: sessionStore.userId,
    username: username.value || null,
    displayName: displayName.value || null,
    avatarUrl: avatarUrl.value || null,
    notificationsEnabled: notificationsEnabled.value,
  })
}

async function logout(): Promise<void> {
  await sessionStore.logout()
  await router.replace('/auth')
}

async function toggleTheme(): Promise<void> {
  await theme.toggleTheme()
}
</script>
