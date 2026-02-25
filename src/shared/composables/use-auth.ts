import type { Session } from '@supabase/supabase-js'
import { ref } from 'vue'
import { restoreSession, signIn, signOut, signUp } from '../api/auth-api'
import { saveInitialDisplayName } from '../api/profile-api'
import { generateRandomDisplayName } from '../utils/random-display-name'

const session = ref<Session | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

export function useAuth() {
  async function bootSession(): Promise<void> {
    loading.value = true
    errorMessage.value = null
    try {
      session.value = await restoreSession()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Не удалось восстановить сессию'
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    errorMessage.value = null
    try {
      session.value = await signIn(email, password)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Ошибка входа'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string): Promise<void> {
    loading.value = true
    errorMessage.value = null
    try {
      const user = await signUp(email, password)
      session.value = await restoreSession()
      if (session.value?.user.id === user.id) {
        try {
          await saveInitialDisplayName(user.id, generateRandomDisplayName())
        } catch {
          // Не блокируем регистрацию, если стартовое имя не сохранилось.
        }
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Ошибка регистрации'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await signOut()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Ошибка выхода'
    } finally {
      session.value = null
    }
  }

  return { session, loading, errorMessage, bootSession, login, register, logout }
}
