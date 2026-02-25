<template>
  <ion-app>
    <ion-router-outlet />
    <output v-if="showUpdateBanner" class="update-banner" aria-live="polite">
      <span class="update-banner-text">Доступна новая версия приложения</span>
      <div class="update-banner-actions">
        <button class="update-btn update-btn-secondary" type="button" @click="dismissUpdateBanner">
          Позже
        </button>
        <button class="update-btn update-btn-primary" type="button" @click="applyUpdate">
          Обновить
        </button>
      </div>
    </output>
    <Toaster
      position="top-center"
      expand
      rich-colors
      :offset="toasterOffset"
      class="ru-sonner"
    />
  </ion-app>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { Toaster } from 'vue-sonner'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { config } from '@/config'

const toasterOffset = 'calc(env(safe-area-inset-top, 0px) + 12px)';
const dismissed = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW();
const needNativeUpdate = ref(false);
const releaseUrl = ref('');

const showUpdateBanner = computed(() => (needRefresh.value || needNativeUpdate.value) && !dismissed.value);

function parseVersion(version: string): number[] {
  const normalized = version.trim().replace(/^v/i, '');
  return normalized.split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function isVersionGreater(current: string, next: string): boolean {
  const a = parseVersion(current);
  const b = parseVersion(next);
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (bv > av) return true;
    if (bv < av) return false;
  }
  return false;
}

function getRepoPath(repoUrl: string): string {
  return repoUrl
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/+$/, '');
}

onMounted(async () => {
  try {
    const repoPath = getRepoPath(config.app.githubRepo);
    if (!repoPath) return;
    const res = await fetch(`https://api.github.com/repos/${repoPath}/releases/latest`);
    if (!res.ok) return;
    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    if (!data.tag_name) return;
    if (isVersionGreater(config.app.version, data.tag_name)) {
      needNativeUpdate.value = true;
      releaseUrl.value = data.html_url || `${config.app.githubRepo.replace(/\/+$/, '')}/releases/latest`;
    }
  } catch {
    // Ignore network/API errors: SW-based update banner still works.
  }
});

const dismissUpdateBanner = () => {
  dismissed.value = true;
};

const applyUpdate = () => {
  if (needRefresh.value) {
    void updateServiceWorker(true);
    return;
  }
  if (releaseUrl.value) {
    globalThis.location.href = releaseUrl.value;
  }
};
</script>

<style>
.ru-sonner {
  z-index: 2147483647 !important;
}

[data-sonner-toaster] {
  z-index: 2147483647 !important;
}

.update-banner {
  position: fixed;
  left: var(--ru-spacing-16);
  right: var(--ru-spacing-16);
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--ru-spacing-16));
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ru-spacing-12);
  padding: var(--ru-spacing-12) var(--ru-spacing-16);
  border-radius: var(--ru-radius-lg);
  background: var(--ru-color-bg-primary);
  border: 1px solid var(--ru-color-bg-tertiary);
  box-shadow: var(--ru-shadow-modal);
}

.update-banner-text {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  color: var(--ru-color-text-primary);
}

.update-banner-actions {
  display: flex;
  gap: var(--ru-spacing-8);
}

.update-btn {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  padding: var(--ru-spacing-8) var(--ru-spacing-12);
  border-radius: var(--ru-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
}

.update-btn-primary {
  background: var(--ru-color-brand-primary);
  color: var(--ru-color-text-inverse);
}

.update-btn-secondary {
  background: var(--ru-color-bg-secondary);
  color: var(--ru-color-text-primary);
  border-color: var(--ru-color-bg-tertiary);
}
</style>
