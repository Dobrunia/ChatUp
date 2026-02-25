<template>
  <ion-page>
    <Header title="Мой Профиль" back @back="$router.replace('/settings')" />
    <ion-content class="ion-padding">
      <div v-if="profileStore.profile" class="profile-container">
        
        <Card class="profile-card">
          <div class="avatar-section">
            <Avatar :name="profileStore.profile.displayName" :src="profileStore.profile.avatarUrl" size="xl" />
          </div>
          
          <form @submit.prevent="handleUpdateProfile" class="profile-form">
            <Input 
              v-model="editForm.displayName" 
              label="Отображаемое имя" 
              :disabled="loading"
            />
            <Button type="submit" :loading="loading" :disabled="!hasProfileChanges">
              Сохранить
            </Button>
          </form>
        </Card>

        <Card class="username-card">
          <template #header>Изменить логин (username)</template>
          <form @submit.prevent="handleUpdateUsername" class="profile-form">
            <Input 
              v-model="usernameForm.username" 
              label="Уникальный логин" 
              :hint="USERNAME_HINT"
              :error="usernameFieldError"
              @update:modelValue="onUsernameInput"
              @blur="checkUsernameAvailability"
              :disabled="usernameLoading"
            />
            <div class="username-checklist" v-if="usernameTouched">
              <span
                class="check-item"
                :class="{ valid: usernameForm.username.length >= LIMITS.USERNAME_MIN_LENGTH && usernameForm.username.length <= LIMITS.USERNAME_MAX_LENGTH }"
              >
                {{ `Длина ${LIMITS.USERNAME_MIN_LENGTH}-${LIMITS.USERNAME_MAX_LENGTH} символов` }}
              </span>
              <span
                class="check-item"
                :class="{
                  valid: !usernameInvalidChars && usernameForm.username.length > 0,
                  error: usernameInvalidChars,
                }"
              >
                Только строчные латинские буквы (a-z)
              </span>
            </div>
            <Button type="submit" variant="secondary" :loading="usernameLoading" :disabled="!hasUsernameChanges || !!usernameFieldError">
              Сменить логин
            </Button>
          </form>
        </Card>
      </div>
      <div v-else-if="profileStore.isLoading" class="loading-state">
        Загрузка профиля...
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Card from '@/components/ui/Card.vue';
import Input from '@/components/ui/Input.vue';
import Button from '@/components/ui/Button.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { useProfileStore } from '@/stores/profile';
import { useDebounceFn } from '@vueuse/core';
import { toast } from 'vue-sonner';
import {
  ERROR_MESSAGES,
  LIMITS,
  TOAST_MESSAGES,
  USERNAME_CHARS_ONLY_MESSAGE,
  USERNAME_HINT,
  USERNAME_VALIDATION_MESSAGE,
  isRateLimitError,
  isValidUsername,
  normalizeUsername,
} from '@chatup/shared/src/protocol';
import { extractUserErrorMessage, notifyError } from '@/utils/errorHandler';

const profileStore = useProfileStore();

const loading = ref(false);
const usernameLoading = ref(false);

const editForm = reactive({
  displayName: ''
});

const usernameForm = reactive({
  username: ''
});

const usernameError = ref('');
const usernameTouched = ref(false);
const usernameInvalidChars = ref(false);

onMounted(async () => {
  await profileStore.fetchProfile();
  if (profileStore.profile) {
    editForm.displayName = profileStore.profile.displayName;
    usernameForm.username = profileStore.profile.username;
  }
});

const hasProfileChanges = computed(() => {
  return profileStore.profile && editForm.displayName !== profileStore.profile.displayName && editForm.displayName.trim().length > 0;
});

const hasUsernameChanges = computed(() => {
  return (
    profileStore.profile &&
    usernameForm.username !== profileStore.profile.username &&
    usernameForm.username.length >= LIMITS.USERNAME_MIN_LENGTH &&
    !usernameFieldError.value
  );
});

const onUsernameInput = (val: unknown) => {
  const raw = typeof val === 'string' ? val : '';
  usernameForm.username = normalizeUsername(raw);
  usernameTouched.value = true;
  const usernameRawWithoutAt = raw.replace(/^@+/, '').toLowerCase();
  usernameInvalidChars.value = /[^a-z]/.test(usernameRawWithoutAt);
  usernameError.value = '';
};

const usernameValidationError = computed(() => {
  if (!usernameTouched.value) return '';
  if (usernameInvalidChars.value) return USERNAME_CHARS_ONLY_MESSAGE;
  if (!isValidUsername(usernameForm.username)) return USERNAME_VALIDATION_MESSAGE;
  return '';
});

const usernameFieldError = computed(() => {
  return usernameValidationError.value || usernameError.value;
});

const checkUsernameAvailability = useDebounceFn(async () => {
  if (!hasUsernameChanges.value) return;
  if (usernameValidationError.value) return;
  
  try {
    const res = await profileStore.checkUsernameAvailability(usernameForm.username);
    if (res.available) {
      usernameError.value = '';
    } else {
      usernameError.value = 'Логин уже занят';
    }
  } catch (err: unknown) {
    if (isRateLimitError(err)) {
      toast.warning(TOAST_MESSAGES.TOO_MANY_USERNAME_CHECKS);
    }
  }
}, 500);

const handleUpdateProfile = async () => {
  loading.value = true;
  try {
    await profileStore.updateProfile(editForm.displayName);
    toast.success(TOAST_MESSAGES.PROFILE_UPDATED);
  } catch (error: unknown) {
    notifyError(error);
    if (import.meta.env.DEV) {
      console.debug('Profile update failed', error);
    }
  } finally {
    loading.value = false;
  }
};

const handleUpdateUsername = async () => {
  usernameLoading.value = true;
  try {
    await profileStore.updateUsername(usernameForm.username);
    usernameError.value = '';
    toast.success(TOAST_MESSAGES.USERNAME_UPDATED);
  } catch (error: unknown) {
    const message = extractUserErrorMessage(error);
    if (message === ERROR_MESSAGES.USERNAME_TAKEN) {
      usernameError.value = ERROR_MESSAGES.USERNAME_TAKEN;
      notifyError(ERROR_MESSAGES.USERNAME_TAKEN);
      return;
    }
    notifyError(message);
    if (import.meta.env.DEV) {
      console.debug('Username update failed', error);
    }
  } finally {
    usernameLoading.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-16);
  max-width: 600px;
  margin: 0 auto;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--ru-spacing-24);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-16);
}

.username-checklist {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-4);
  margin-top: calc(var(--ru-spacing-16) * -1);
}

.check-item {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-xs);
  color: var(--ru-color-semantic-error);
}

.check-item.valid {
  color: var(--ru-color-semantic-success);
}

.loading-state {
  text-align: center;
  padding: var(--ru-spacing-48);
  color: var(--ru-color-text-secondary);
}
</style>
