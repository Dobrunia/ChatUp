import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { App as CapacitorApp } from '@capacitor/app'

export function useSwipeBack(): void {
  const router = useRouter()

  let backListener: { remove: () => void } | null = null
  let startX = 0
  let startY = 0

  function onTouchStart(e: TouchEvent): void {
    const t = e.touches[0]
    startX = t.clientX
    startY = t.clientY
  }

  function onTouchEnd(e: TouchEvent): void {
    const t = e.changedTouches[0]
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (startX < 40 && dx > 60 && Math.abs(dy) < 80) {
      router.back()
    }
  }

  onMounted(async () => {
    backListener = await CapacitorApp.addListener('backButton', () => {
      router.back()
    })
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    backListener?.remove()
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchend', onTouchEnd)
  })
}
