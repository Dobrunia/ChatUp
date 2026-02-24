<template>
  <ion-page>
    <Header title="Вход или Регистрация" />
    <ion-content class="ion-padding">
      <div class="auth-container">
        
        <!-- Toggle Tabs -->
        <div class="auth-tabs">
          <Button 
            variant="ghost" 
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'"
          >
            Вход
          </Button>
          <Button 
            variant="ghost" 
            :class="{ active: mode === 'signup' }"
            @click="mode = 'signup'"
          >
            Регистрация
          </Button>
        </div>

        <Card class="auth-card">
          <!-- Login Form -->
          <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
            <Input 
              :model-value="loginForm.username" 
              label="Логин (username)" 
              placeholder="@ivan"
              :hint="USERNAME_HINT"
              @update:modelValue="onUsernameInput(loginForm, 'username', $event)"
              :disabled="loading"
            />
            <Input 
              v-model="loginForm.password" 
              type="password" 
              label="Пароль" 
              placeholder="******" 
              :hint="PASSWORD_HINT"
              :disabled="loading"
            />
            
            <div class="auth-actions">
              <Button type="submit" variant="primary" :loading="loading" :disabled="!isLoginValid">
                Войти
              </Button>
            </div>
          </form>

          <!-- Signup Form -->
          <form v-else @submit.prevent="handleSignup" class="auth-form">
            <Input 
              v-model="signupForm.displayName" 
              label="Имя (отображаемое)" 
              placeholder="Иван Иванов" 
              :disabled="loading"
            />
            <Input 
              :model-value="signupForm.username" 
              label="Уникальный логин" 
              placeholder="@ivan"
              :hint="USERNAME_HINT"
              :error="signupUsernameError"
              @update:modelValue="onUsernameInput(signupForm, 'username', $event)"
              @blur="checkUsernameAvailability"
              :disabled="loading"
            />
            <div class="username-checklist">
              <div class="check-item" :class="{ valid: !signupUsernameInvalidChars && signupUsernameTouched }">
                Только строчные латинские буквы (a-z)
              </div>
              <div
                class="check-item"
                :class="{ valid: signupForm.username.length >= LIMITS.USERNAME_MIN_LENGTH && signupForm.username.length <= LIMITS.USERNAME_MAX_LENGTH }"
              >
                Длина: {{ LIMITS.USERNAME_MIN_LENGTH }}-{{ LIMITS.USERNAME_MAX_LENGTH }} символов
              </div>
            </div>
            <Input 
              v-model="signupForm.password" 
              type="password" 
              label="Пароль" 
              placeholder="******" 
              :hint="PASSWORD_HINT"
              :disabled="loading"
            />
            <Input 
              v-model="signupForm.passwordConfirm" 
              type="password" 
              label="Повторите пароль" 
              placeholder="******" 
              :error="passwordMatchError"
              :disabled="loading"
            />
            
            <div class="auth-actions">
              <Button type="submit" variant="primary" :loading="loading" :disabled="!isSignupValid">
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Card from '@/components/ui/Card.vue';
import Input from '@/components/ui/Input.vue';
import Button from '@/components/ui/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { useDebounceFn } from '@vueuse/core';
import { toast } from 'vue-sonner';
import {
  LIMITS,
  PASSWORD_HINT,
  TOAST_MESSAGES,
  USERNAME_CHARS_ONLY_MESSAGE,
  USERNAME_HINT,
  USERNAME_VALIDATION_MESSAGE,
  isRateLimitError,
  isValidUsername,
  isValidPasswordLength,
  normalizeUsername,
} from '@chatup/shared/src/protocol';

const router = useRouter();
const authStore = useAuthStore();

const mode = ref<'login' | 'signup'>('login');
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const signupForm = reactive({
  displayName: '',
  username: '',
  password: '',
  passwordConfirm: ''
});

const usernameError = ref('');
const signupUsernameTouched = ref(false);
const signupUsernameInvalidChars = ref(false);

const onUsernameInput = (form: Record<string, string>, key: string, val: unknown) => {
  const raw = typeof val === 'string' ? val : '';
  form[key] = normalizeUsername(raw);

  if (form === signupForm && key === 'username') {
    signupUsernameTouched.value = true;
    const usernameRawWithoutAt = raw.replace(/^@+/, '').toLowerCase();
    signupUsernameInvalidChars.value = /[^a-z]/.test(usernameRawWithoutAt);
    usernameError.value = '';
  }
};

const signupUsernameValidationError = computed(() => {
  if (!signupUsernameTouched.value) return '';
  if (signupUsernameInvalidChars.value) return USERNAME_CHARS_ONLY_MESSAGE;
  if (!isValidUsername(signupForm.username)) return USERNAME_VALIDATION_MESSAGE;
  return '';
});

const signupUsernameError = computed(() => {
  return signupUsernameValidationError.value || usernameError.value;
});

const checkUsernameAvailability = useDebounceFn(async () => {
  if (mode.value !== 'signup') return;
  if (signupForm.username.length < LIMITS.USERNAME_MIN_LENGTH) return;
  if (signupUsernameValidationError.value) return;
  
  try {
    const res = await authStore.checkUsernameAvailability(signupForm.username);
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

const passwordMatchError = computed(() => {
  if (signupForm.password && signupForm.passwordConfirm && signupForm.password !== signupForm.passwordConfirm) {
    return 'Пароли не совпадают';
  }
  return '';
});

const isLoginValid = computed(() => {
  return loginForm.username.length >= LIMITS.USERNAME_MIN_LENGTH && isValidPasswordLength(loginForm.password);
});

const isSignupValid = computed(() => {
  return signupForm.displayName.trim().length > 0 && 
         signupForm.username.length >= LIMITS.USERNAME_MIN_LENGTH && 
         !signupUsernameError.value &&
         isValidPasswordLength(signupForm.password) && 
         signupForm.passwordConfirm.length > 0 &&
         !passwordMatchError.value;
});

const handleLogin = async () => {
  if (!isLoginValid.value) return;
  
  loading.value = true;
  try {
    await authStore.login(loginForm.username, loginForm.password);
    router.replace('/chats');
  } catch {
    // Error is handled by global tRPC error link.
  } finally {
    loading.value = false;
  }
};

const handleSignup = async () => {
  if (!isSignupValid.value) return;
  
  loading.value = true;
  try {
    await authStore.signup({
      username: signupForm.username,
      displayName: signupForm.displayName,
      password: signupForm.password,
      passwordConfirm: signupForm.passwordConfirm
    });
    router.replace('/chats');
  } catch {
    // Error is handled by global tRPC error link.
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  padding-top: var(--ru-spacing-24);
  gap: var(--ru-spacing-24);
}

.auth-tabs {
  display: flex;
  background-color: var(--ru-color-bg-primary);
  border-radius: var(--ru-radius-md);
  padding: var(--ru-spacing-4);
}

.auth-tabs .ru-btn {
  flex: 1;
}
.auth-tabs .ru-btn.active {
  background-color: var(--ru-color-bg-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-16);
}

.auth-actions {
  margin-top: var(--ru-spacing-8);
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
</style>
