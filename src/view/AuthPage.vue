<template>
  <main class="page-shell">
    <div class="screen-center">
      <dbr-card class="screen-card form-card ornamented">
        <h2 class="card-title">Вход</h2>
        <p class="card-subtitle">Доступ к диалогам и профилю</p>
        <div class="form-fields">
          <dbr-input v-model="email" type="email" label="Почта" />
          <dbr-input v-model="password" type="password" label="Пароль" />
        </div>
        <div class="form-actions">
          <dbr-button :disabled="sessionStore.authLoading" @click="login">Войти</dbr-button>
          <dbr-button variant="ghost" :disabled="sessionStore.authLoading" @click="register">
            Создать аккаунт
          </dbr-button>
        </div>
        <p v-if="formError" class="notice-bar notice-bar-error">{{ formError }}</p>
        <p v-if="sessionStore.authError" class="notice-bar notice-bar-error">
          {{ sessionStore.authError }}
        </p>
      </dbr-card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { DbrButton, DbrCard, DbrInput } from 'dobruniaui-vue'
import { useSessionStore } from '../stores/session-store'

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
