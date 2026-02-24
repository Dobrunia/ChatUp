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
              placeholder="example" 
              @input="onUsernameInput(loginForm, 'username', $event)"
              :disabled="loading"
            />
            <Input 
              v-model="loginForm.password" 
              type="password" 
              label="Пароль" 
              placeholder="******" 
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
              placeholder="ivan123" 
              hint="Только a-z (минимум 3 символа)"
              :error="usernameError"
              @input="onUsernameInput(signupForm, 'username', $event)"
              @blur="checkUsernameAvailability"
              :disabled="loading"
            />
            <Input 
              v-model="signupForm.password" 
              type="password" 
              label="Пароль" 
              placeholder="******" 
              hint="Минимум 6 символов"
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
import { trpc } from '@/api/trpc';
import { useDebounceFn } from '@vueuse/core';
import { toast } from 'vue-sonner';

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

const onUsernameInput = (form: Record<string, string>, key: string, val: string) => {
  form[key] = val.toLowerCase().replace(/[^a-z]/g, '');
  usernameError.value = '';
};

const checkUsernameAvailability = useDebounceFn(async () => {
  if (mode.value !== 'signup') return;
  if (signupForm.username.length < 3) return;
  
  try {
    const res = await trpc.auth.checkUsername.query({ username: signupForm.username });
    if (!res.available) {
      usernameError.value = 'Логин уже занят';
    } else {
      usernameError.value = '';
    }
  } catch (err: any) {
    if (err.data?.httpStatus === 429) {
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
  return loginForm.username.length >= 3 && loginForm.password.length >= 6;
});

const isSignupValid = computed(() => {
  return signupForm.displayName.trim().length > 0 && 
         signupForm.username.length >= 3 && 
         !usernameError.value &&
         signupForm.password.length >= 6 && 
         !passwordMatchError.value;
});

const handleLogin = async () => {
  if (!isLoginValid.value) return;
  
  loading.value = true;
  try {
    const res = await trpc.auth.login.mutate(loginForm);
    authStore.setTokens(res.accessToken, res.refreshToken);
    router.replace('/chats');
  } catch (error) {
    // Errors are already handled globally by vue-sonner in trpc link
  } finally {
    loading.value = false;
  }
};

const handleSignup = async () => {
  if (!isSignupValid.value) return;
  
  loading.value = true;
  try {
    const res = await trpc.auth.signup.mutate({
      username: signupForm.username,
      displayName: signupForm.displayName,
      password: signupForm.password,
      passwordConfirm: signupForm.passwordConfirm
    });
    authStore.setTokens(res.accessToken, res.refreshToken);
    router.replace('/chats');
  } catch (error) {
    // global error handler
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
