<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="screen-center">
        <div class="card screen-card form-card ornamented">
          <h2 class="card-title">Вход</h2>
          <p class="card-subtitle">Доступ к диалогам и профилю</p>
          <div class="form-fields">
            <input v-model.trim="email" class="input" type="email" placeholder="Почта" />
            <input v-model="password" class="input" type="password" placeholder="Пароль" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" :disabled="sessionStore.authLoading" @click="login">
              Войти
            </button>
            <button class="btn btn-ghost" :disabled="sessionStore.authLoading" @click="register">
              Создать аккаунт
            </button>
          </div>
          <p v-if="formError" class="notice-bar notice-bar-error">{{ formError }}</p>
          <p v-if="sessionStore.authError" class="notice-bar notice-bar-error">
            {{ sessionStore.authError }}
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { useSessionStore } from '../../stores/session-store'

const router = useRouter()
const sessionStore = useSessionStore()
const email = ref('')
const password = ref('')
const formError = ref<string | null>(null)

function validate(): string | null {
  const normalizedEmail = email.value.trim().toLowerCase()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(normalizedEmail)) {
    return 'Некорректная почта'
  }
  if (password.value.length < 6) {
    return 'Пароль слишком короткий'
  }
  email.value = normalizedEmail
  return null
}

async function login(): Promise<void> {
  formError.value = validate()
  if (formError.value) {
    return
  }

  try {
    await sessionStore.login(email.value, password.value)
    await router.replace('/conversations')
  } catch {
    // Error state is already set in session store.
  }
}

async function register(): Promise<void> {
  formError.value = validate()
  if (formError.value) {
    return
  }

  try {
    await sessionStore.register(email.value, password.value)
    await router.replace('/conversations')
  } catch {
    // Error state is already set in session store.
  }
}
</script>
