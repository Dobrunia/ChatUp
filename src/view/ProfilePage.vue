<template>
  <main class="page-shell">
    <div class="page-narrow page-stack">
      <page-header title="Профиль" subtitle="Настройки аккаунта" back-button @back="router.back()" />
      <dbr-card class="screen-card form-card ornamented settings-card">
        <div class="settings-section">
          <div class="settings-title">Аккаунт</div>
          <div class="form-fields">
            <dbr-input v-model="username" label="@username" />
            <dbr-input v-model="displayName" label="Отображаемое имя" />
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-title">Аватар</div>
          <div class="input-row">
            <dbr-avatar
              :src="avatarPreviewUrl"
              :name="displayName || username || 'User'"
              shape="rounded"
            />
            <dbr-input v-model="avatarUrl" label="Ссылка на аватар" />
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-title">Уведомления</div>
          <dbr-checkbox v-model="notificationsEnabled" label="Уведомления включены" />
        </div>
        <p v-if="actionError" class="notice-bar notice-bar-error">{{ actionError }}</p>
        <div class="action-row">
          <dbr-button @click="save">Сохранить</dbr-button>
          <dbr-button variant="danger" @click="logout">Выйти</dbr-button>
        </div>
      </dbr-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import {
  DbrAvatar,
  DbrButton,
  DbrCard,
  DbrCheckbox,
  DbrInput,
} from 'dobruniaui-vue'
import PageHeader from '../components/PageHeader.vue'
import { useProfileStore } from '../stores/profile-store'
import { useSessionStore } from '../stores/session-store'

const router = useRouter()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const username = ref('')
const displayName = ref('')
const avatarUrl = ref('')
const notificationsEnabled = ref(true)
const actionError = ref<string | null>(null)
const avatarPreviewUrl = computed(() => avatarUrl.value.trim() || undefined)

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

</script>
