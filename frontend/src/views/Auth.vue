<template>
  <ion-page>
    <Header title="Вход или Регистрация" />
    <ion-content class="ion-padding" color="light">
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
              v-model="loginForm.username" 
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
              v-model="signupForm.username" 
              label="Уникальный логин" 
              placeholder="@ivan"
              :hint="USERNAME_HINT"
              :error="usernameError"
              @update:modelValue="onUsernameInput(signupForm, 'username', $event)"
              @blur="checkUsernameAvailability"
              :disabled="loading"
            />
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
  USERNAME_HINT,
  isRateLimitError,
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

const onUsernameInput = (form: Record<string, string>, key: string, val: unknown) => {
  form[key] = normalizeUsername(val);
  usernameError.value = '';
};

const checkUsernameAvailability = useDebounceFn(async () => {
  if (mode.value !== 'signup') return;
  if (signupForm.username.length < LIMITS.USERNAME_MIN_LENGTH) return;
  
  try {
    const res = await authStore.checkUsernameAvailability(signupForm.username);
    if (res.available) {
      usernameError.value = '';
    } else {
      usernameError.value = 'Логин уже занят';
    }
  } catch (err: unknown) {
    if (isRateLimitError(err)) {
      toast.warning('Слишком частые проверки. Подождите немного.');
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
         !usernameError.value &&
         isValidPasswordLength(signupForm.password) && 
         !passwordMatchError.value;
});

const handleLogin = async () => {
  if (!isLoginValid.value) return;
  
  loading.value = true;
  try {
    await authStore.login(loginForm.username, loginForm.password);
    router.replace('/chats');
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
</style>
