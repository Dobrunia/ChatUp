import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import { useAuth } from '../shared/composables/use-auth'

const ONBOARDING_DONE_KEY = 'onboarding_done'

export const useSessionStore = defineStore('session', () => {
  const auth = useAuth()
  const onboardingDone = ref(false)
  const userId = computed(() => auth.session.value?.user.id ?? null)

  // Resolves once boot() finishes, regardless of success/failure.
  // Guards await this before checking auth so reload doesn't redirect to login.
  let bootResolve!: () => void
  const bootPromise = new Promise<void>((res) => { bootResolve = res })

  async function boot(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: ONBOARDING_DONE_KEY })
      onboardingDone.value = value === '1'
      await auth.bootSession()
    } finally {
      bootResolve()
    }
  }

  function awaitBoot(): Promise<void> {
    return bootPromise
  }

  async function login(email: string, password: string): Promise<void> {
    await auth.login(email, password)
  }

  async function register(email: string, password: string): Promise<void> {
    await auth.register(email, password)
  }

  async function logout(): Promise<void> {
    await auth.logout()
  }

  async function completeOnboarding(): Promise<void> {
    onboardingDone.value = true
    await Preferences.set({ key: ONBOARDING_DONE_KEY, value: '1' })
  }

  return {
    session: auth.session,
    authLoading: auth.loading,
    authError: auth.errorMessage,
    onboardingDone,
    userId,
    boot,
    awaitBoot,
    login,
    register,
    logout,
    completeOnboarding,
  }
})
