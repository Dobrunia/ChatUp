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
        <DbrButton
          :disabled="saving || !isDirty"
          :variant="isDirty ? 'primary' : 'ghost'"
          @click="saveProfile"
        >
          {{ saving ? 'Сохраняю...' : 'Сохранить' }}
        </DbrButton>
      </div>
      <span v-if="saveMessage" class="dbru-text-sm dbru-text-muted">{{ saveMessage }}</span>
    </DbrCard>

    <div v-else class="page__state dbru-surface dbru-text-sm dbru-text-muted">
      Профиль не найден.
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { DbrAvatar, DbrButton, DbrCard, DbrCheckbox, DbrInput, DbrLoader } from 'dobruniaui-vue'
import { useProfileStore } from '../stores/profile-store'
import { useSessionStore } from '../stores/session-store'

const sessionStore = useSessionStore()
const profileStore = useProfileStore()

const { profile, loading } = storeToRefs(profileStore)
const userId = computed(() => sessionStore.userId)

const loadError = ref<string | null>(null)
const saving = ref(false)
const saveMessage = ref<string | null>(null)

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
  } catch (error) {
    saveMessage.value = error instanceof Error ? error.message : 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
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
  align-items: center;
  justify-content: flex-end;
  gap: var(--dbru-space-3);
  padding-top: var(--dbru-space-3);
  border-top: 1px solid var(--dbru-color-border);
}

.profile-card__input-icon {
  font-weight: var(--dbru-font-weight-semibold);
}
</style>
