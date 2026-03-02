<template>
  <section class="page">
    <h2 class="page__title dbru-text-lg dbru-text-main">Профиль</h2>

    <div v-if="!userId" class="page__state dbru-surface dbru-text-sm dbru-text-muted">
      Нужна авторизация.
    </div>

    <div v-else-if="loading" class="page__state dbru-surface">
      <DbrLoader />
    </div>

    <div v-else-if="loadError" class="page__state dbru-surface dbru-text-sm dbru-text-muted">
      {{ loadError }}
    </div>

    <DbrCard v-else-if="profile" class="profile-card">
      <div class="profile-card__header">
        <DbrAvatar
          :src="form.avatarUrl || undefined"
          :alt="form.displayName || 'Профиль'"
          :name="form.displayName || 'Профиль'"
          shape="rounded"
        />
        <div class="profile-card__avatar-input">
          <DbrInput
            v-model="form.avatarUrl"
            label="URL аватара"
            name="avatarUrl"
            autocomplete="url"
          />
        </div>
      </div>

      <div class="profile-card__fields">
        <DbrInput
          v-model="form.displayName"
          label="Display name"
          name="displayName"
          autocomplete="name"
        />
        <DbrInput v-model="form.username" label="Username" name="username" autocomplete="username">
          <template #icon>
            <span class="profile-card__input-icon dbru-text-sm dbru-text-main">@</span>
          </template>
        </DbrInput>
        <DbrCheckbox
          v-model="form.notificationsEnabled"
          label="Уведомления включены"
          name="notificationsEnabled"
        />
      </div>

      <div class="profile-card__actions">
        <span
          v-if="saveMessage"
          :class="['profile-card__save-message dbru-text-sm', saveIsError ? 'profile-card__save-message--error' : 'profile-card__save-message--success']"
        >{{ saveMessage }}</span>
        <div class="profile-card__action-row">
          <DbrButton variant="danger" @click="handleLogout">Выйти</DbrButton>
          <DbrButton
            variant="primary"
            :disabled="saving || !isDirty"
            @click="saveProfile"
          >
            {{ saving ? 'Сохраняю...' : 'Сохранить' }}
          </DbrButton>
        </div>
      </div>
    </DbrCard>

    <div v-else class="page__state dbru-surface dbru-text-sm dbru-text-muted">
      Профиль не найден.
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DbrAvatar, DbrButton, DbrCard, DbrCheckbox, DbrInput, DbrLoader } from 'dobruniaui-vue'
import { useProfileStore } from '../stores/profile-store'
import { useSessionStore } from '../stores/session-store'
import { useSwipeBack } from '../shared/composables/use-swipe-back'

const router = useRouter()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()

const { profile, loading } = storeToRefs(profileStore)
const userId = computed(() => sessionStore.userId)

const loadError = ref<string | null>(null)
const saving = ref(false)
const saveMessage = ref<string | null>(null)
const saveIsError = ref(false)

const form = reactive({
  displayName: '',
  username: '',
  avatarUrl: '',
  notificationsEnabled: true,
})

watch(
  profile,
  (p) => {
    if (!p) return
    form.displayName = p.displayName ?? ''
    form.username = p.username ?? ''
    form.avatarUrl = p.avatarUrl ?? ''
    form.notificationsEnabled = p.notificationsEnabled
  },
  { immediate: true },
)

const isDirty = computed(() => {
  if (!profile.value) return false
  return (
    form.displayName !== (profile.value.displayName ?? '') ||
    form.username !== (profile.value.username ?? '') ||
    form.avatarUrl !== (profile.value.avatarUrl ?? '') ||
    form.notificationsEnabled !== profile.value.notificationsEnabled
  )
})

async function saveProfile(): Promise<void> {
  if (!profile.value || !userId.value) return
  saving.value = true
  saveMessage.value = null
  try {
    await profileStore.save({
      ...profile.value,
      displayName: form.displayName || null,
      username: form.username || null,
      avatarUrl: form.avatarUrl || null,
      notificationsEnabled: form.notificationsEnabled,
    })
    saveMessage.value = 'Сохранено'
    saveIsError.value = false
  } catch (error) {
    saveMessage.value = error instanceof Error ? error.message : 'Ошибка сохранения'
    saveIsError.value = true
  } finally {
    saving.value = false
  }
}

async function handleLogout(): Promise<void> {
  await sessionStore.logout()
  await router.push({ name: 'login' })
}

onMounted(async () => {
  if (!userId.value) return
  loadError.value = null
  try {
    await profileStore.load()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Не удалось загрузить профиль'
  }
})

useSwipeBack()
</script>

<style scoped>
.page {
  display: grid;
  gap: var(--dbru-space-3);
}

.page__title {
  margin: 0;
}

.page__state {
  border: 1px solid var(--dbru-color-border);
  border-radius: var(--dbru-radius-md);
  padding: var(--dbru-space-4);
}

.profile-card {
  display: grid;
  gap: var(--dbru-space-4);
  padding: var(--dbru-space-4);
}

.profile-card__header {
  display: flex;
  align-items: center;
  gap: var(--dbru-space-3);
}

.profile-card__avatar-input {
  min-width: 0;
  flex: 1;
}

.profile-card__fields {
  display: grid;
  gap: var(--dbru-space-3);
}

.profile-card__actions {
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-2);
  padding-top: var(--dbru-space-3);
  border-top: 1px solid var(--dbru-color-border);
}

.profile-card__save-message {
  text-align: center;
}

.profile-card__save-message--success {
  color: var(--dbru-color-primary);
}

.profile-card__save-message--error {
  color: var(--dbru-color-danger);
}

.profile-card__action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-card__input-icon {
  font-weight: var(--dbru-font-weight-semibold);
}
</style>
