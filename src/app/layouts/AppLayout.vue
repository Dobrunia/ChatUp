<template>
  <div class="app-shell dbru-bg">
    <AppHeader v-if="!isFullscreen" />
    <main :class="['app-main', { 'app-main--fullscreen': isFullscreen }]">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { App as CapacitorApp } from '@capacitor/app'
import AppHeader from '../../components/AppHeader.vue'
import { useSessionStore } from '../../stores/session-store'
import { useConversationsStore } from '../../stores/conversations-store'
import { useAppRealtime } from '../../shared/composables/use-app-realtime'
import { initBootProviders } from '../providers/boot-provider'

const route = useRoute()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const appRealtime = useAppRealtime()

const isFullscreen = computed(() => route.meta.fullscreen === true)

let appStateListener: { remove: () => void } | null = null

onMounted(async () => {
  const userId = sessionStore.userId
  if (!userId) return

  await conversationsStore.load(userId)
  conversationsStore.startRealtime(userId)
  void initBootProviders(userId)

  // Re-sync when app returns to foreground (e.g. after a call or lock screen)
  appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive && sessionStore.userId) {
      void conversationsStore.load(sessionStore.userId)
    }
  })
})

onUnmounted(() => {
  conversationsStore.stopRealtime()
  appStateListener?.remove()
  appRealtime.stopAll()
})
</script>

<style scoped>
.app-shell {
  min-height: 100dvh;
}

.app-main {
  width: min(100%, var(--app-content-max-width));
  margin: 0 auto;
  padding: var(--dbru-space-3);
}

.app-main--fullscreen {
  width: 100%;
  max-width: 100%;
  padding: 0;
}

@media (min-width: 768px) {
  .app-main {
    padding: var(--dbru-space-4);
  }

  .app-main--fullscreen {
    padding: 0;
  }
}
</style>
