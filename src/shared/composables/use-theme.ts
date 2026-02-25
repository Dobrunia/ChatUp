import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

type ThemeMode = 'light' | 'dark'

const THEME_MODE_KEY = 'theme_mode'
const themeMode = ref<ThemeMode>('light')

function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
  themeMode.value = mode
}

async function initTheme(): Promise<void> {
  const stored = await Preferences.get({ key: THEME_MODE_KEY })
  if (stored.value === 'light' || stored.value === 'dark') {
    applyTheme(stored.value)
    return
  }
  const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(prefersDark ? 'dark' : 'light')
}

async function setTheme(mode: ThemeMode): Promise<void> {
  applyTheme(mode)
  await Preferences.set({ key: THEME_MODE_KEY, value: mode })
}

async function toggleTheme(): Promise<void> {
  await setTheme(themeMode.value === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  return {
    themeMode,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
