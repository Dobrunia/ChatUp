<template>
  <header class="app-header dbru-surface">
    <div class="app-header__left">
      <h1 class="app-header__title dbru-text-base dbru-text-main">ChatUp</h1>
    </div>

    <div class="app-header__right">
      <RouterLink class="dbru-btn dbru-btn--ghost dbru-size-sm dbru-text-sm dbru-text-main" to="/">
        Чаты
      </RouterLink>
      <DbrThemeToggle size="sm" shape="rounded" />
      <RouterLink to="/profile" aria-label="Профиль" style="display: flex; align-items: center;">
        <DbrAvatar
          :src="profile?.avatarUrl ?? undefined"
          :name="profile?.displayName ?? 'Профиль'"
          size="sm"
          shape="rounded"
        />
      </RouterLink>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DbrAvatar, DbrThemeToggle } from 'dobruniaui-vue'
import { useProfileStore } from '../stores/profile-store'

const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dbru-space-2);
  min-height: var(--app-header-height);
  padding: var(--dbru-space-2) var(--dbru-space-3);
  border-bottom: 1px solid var(--dbru-color-border);
  backdrop-filter: blur(8px);
}

.app-header__left {
  min-width: 0;
}

.app-header__title {
  margin: 0;
  font-weight: var(--dbru-font-weight-semibold);
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--dbru-space-2);
}

.app-header__profile-link {
  padding-inline: var(--dbru-space-2);
}

@media (min-width: 768px) {
  .app-header {
    padding: var(--dbru-space-3) var(--dbru-space-4);
  }
}
</style>
