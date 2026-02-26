<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="page-narrow page-stack">
        <app-header class="page-header" title="Профиль" subtitle="Настройки аккаунта">
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
        </app-header>
        <div class="card screen-card form-card ornamented settings-card">
          <h2 class="card-title">Профиль</h2>
          <div class="settings-section">
            <div class="settings-title">Аккаунт</div>
            <div class="form-fields">
              <input v-model.trim="username" class="input" placeholder="@username" />
              <input v-model.trim="displayName" class="input" placeholder="Отображаемое имя" />
            </div>
          </div>
          <div class="settings-section">
            <div class="settings-title">Аватар</div>
            <div class="input-row">
              <span class="input-icon" aria-hidden="true">
                <img v-if="avatarUrl" :src="avatarUrl" alt="" class="avatar-preview-image" />
                <svg v-else class="icon" viewBox="0 0 24 24">
                  <path
                    d="M4 6h4l2-2h4l2 2h4v12H4z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="1.5" fill="none" />
                </svg>
              </span>
              <input v-model.trim="avatarUrl" class="input" placeholder="Ссылка на аватар" />
            </div>
          </div>
          <div class="settings-section">
            <div class="settings-title">Уведомления</div>
            <label class="inline-label">
              <input v-model="notificationsEnabled" class="checkbox" type="checkbox" />
              Уведомления включены
            </label>
          </div>
          <div class="settings-section">
            <div class="settings-title">Тема</div>
            <label class="inline-label">
              <input :checked="isDarkTheme" class="checkbox" type="checkbox" @change="toggleTheme" />
              Темная тема
            </label>
          </div>
          <p v-if="actionError" class="notice-bar notice-bar-error">{{ actionError }}</p>
          <div class="action-row">
            <button class="btn btn-primary" @click="save">Сохранить</button>
            <button class="btn btn-ghost-danger" @click="logout">Выйти</button>
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
import AppHeader from '../../shared/ui/components/app-header.vue'
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
const actionError = ref<string | null>(null)

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
  try {
    actionError.value = null
    await profileStore.save({
      userId: sessionStore.userId,
      username: username.value || null,
      displayName: displayName.value || null,
      avatarUrl: avatarUrl.value || null,
      notificationsEnabled: notificationsEnabled.value,
    })
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось сохранить профиль'
  }
}

async function logout(): Promise<void> {
  try {
    actionError.value = null
    await sessionStore.logout()
    await router.replace('/auth')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось выйти из аккаунта'
  }
}

async function toggleTheme(): Promise<void> {
  await theme.toggleTheme()
}
</script>
