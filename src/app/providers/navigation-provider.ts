import type { Router } from 'vue-router'
import { App as CapacitorApp } from '@capacitor/app'

export async function initNavigationProvider(router: Router): Promise<void> {
  await CapacitorApp.addListener('backButton', async ({ canGoBack }) => {
    if (canGoBack) {
      router.back()
      return
    }
    await CapacitorApp.minimizeApp()
  })
}
