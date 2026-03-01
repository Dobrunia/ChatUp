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
import { useProfileStore } from '../../stores/profile-store'
import { useAppRealtime } from '../../shared/composables/use-app-realtime'
import { setPresence } from '../../shared/api/presence-api'
import { initBootProviders } from '../providers/boot-provider'

const route = useRoute()
const sessionStore = useSessionStore()
const conversationsStore = useConversationsStore()
const profileStore = useProfileStore()
const appRealtime = useAppRealtime()

const isFullscreen = computed(() => route.meta.fullscreen === true)

let appStateListener: { remove: () => void } | null = null

onMounted(async () => {
  const userId = sessionStore.userId
  if (!userId) return

  await conversationsStore.load(userId)
  conversationsStore.startRealtime(userId)
  void profileStore.load()
  void initBootProviders(userId)

  appStateListener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    const uid = sessionStore.userId
    if (!uid) return
    if (isActive) {
      void conversationsStore.load(uid)
      void setPresence(uid, true)
    } else {
      void setPresence(uid, false)
    }
  })
})

onUnmounted(() => {
  conversationsStore.stopRealtime()
  appStateListener?.remove()
  appRealtime.stopAll()
  const uid = sessionStore.userId
  if (uid) {
    void setPresence(uid, false)
  }
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
