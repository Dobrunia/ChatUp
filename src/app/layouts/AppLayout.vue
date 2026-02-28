<template>
  <div class="app-shell dbru-bg">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../../components/AppHeader.vue'
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

@media (min-width: 768px) {
  .app-main {
    padding: var(--dbru-space-4);
  }
}
</style>
