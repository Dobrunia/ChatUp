import type { Session } from '@supabase/supabase-js'
import { ref } from 'vue'
import { restoreSession, signIn, signOut, signUp } from '../api/auth-api'

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
      await signUp(email, password)
      session.value = await restoreSession()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Ошибка регистрации'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    await signOut()
    session.value = null
  }

  return { session, loading, errorMessage, bootSession, login, register, logout }
}
