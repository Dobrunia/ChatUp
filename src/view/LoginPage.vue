<template>
  <div class="auth-page dbru-bg">
    <DbrThemeToggle class="auth-page__theme" />

    <div class="auth-wrap">
      <div class="auth-brand">
        <div class="auth-brand__icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--dbru-color-primary)" />
            <path
              d="M9 11.5C9 10.1193 10.1193 9 11.5 9H24.5C25.8807 9 27 10.1193 27 11.5V20.5C27 21.8807 25.8807 23 24.5 23H20L16 27V23H11.5C10.1193 23 9 21.8807 9 20.5V11.5Z"
              fill="var(--dbru-color-on-primary)"
            />
          </svg>
        </div>
        <span class="auth-brand__name dbru-text-lg dbru-text-main">ChatUp</span>
      </div>

      <DbrCard as="section" class="auth-card">
        <div class="auth-card__inner">
          <h1 class="auth-card__title dbru-text-lg dbru-text-main">Войти в аккаунт</h1>

          <form class="auth-card__form" @submit.prevent="handleSubmit">
            <DbrInput
              v-model="email"
              label="Email"
              name="email"
              type="email"
              autocomplete="email"
              :disabled="sessionStore.authLoading"
              required
            />
            <DbrInput
              v-model="password"
              label="Пароль"
              name="password"
              type="password"
              autocomplete="current-password"
              :disabled="sessionStore.authLoading"
              required
            />

            <p v-if="sessionStore.authError" class="auth-card__error dbru-text-sm">
              {{ sessionStore.authError }}
            </p>

            <DbrButton nativeType="submit" :disabled="sessionStore.authLoading" size="lg">
              <DbrLoader v-if="sessionStore.authLoading" size="sm" />
              <span v-else>Войти</span>
            </DbrButton>
          </form>

          <p class="auth-card__footer dbru-text-sm dbru-text-muted">
            Нет аккаунта?
            <RouterLink class="auth-card__link" :to="{ name: 'register' }">Зарегистрироваться</RouterLink>
          </p>
        </div>
      </DbrCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { DbrCard, DbrInput, DbrButton, DbrLoader, DbrThemeToggle } from 'dobruniaui-vue'
import { useSessionStore } from '../stores/session-store'

const router = useRouter()
const sessionStore = useSessionStore()

const email = ref('')
const password = ref('')

async function handleSubmit(): Promise<void> {
  try {
    await sessionStore.login(email.value, password.value)
    await router.push({ name: 'conversations' })
  } catch {
    // authError is set by the store
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dbru-space-4);
  position: relative;
}

.auth-page__theme {
  position: absolute;
  top: var(--dbru-space-4);
  right: var(--dbru-space-4);
}

.auth-wrap {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-4);
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--dbru-space-3);
}

.auth-brand__icon {
  line-height: 0;
}

.auth-brand__name {
  font-size: 22px;
  font-weight: var(--dbru-font-weight-semibold);
  letter-spacing: -0.3px;
}

.auth-card {
  box-shadow: 0 4px 32px color-mix(in oklab, var(--dbru-color-text) 8%, transparent);
}

.auth-card__inner {
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-5);
  padding: var(--dbru-space-5);
}

.auth-card__title {
  margin: 0;
  text-align: center;
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: var(--dbru-space-3);
}

.auth-card__error {
  margin: 0;
  color: var(--dbru-color-danger);
}

.auth-card__footer {
  margin: 0;
  text-align: center;
}

.auth-card__link {
  color: var(--dbru-color-primary);
}

.auth-card__link:hover {
  text-decoration: underline;
}
</style>
