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
import { computed, ref } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { Toaster } from 'vue-sonner'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const toasterOffset = 'calc(env(safe-area-inset-top, 0px) + 12px)';
const dismissed = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW();

const showUpdateBanner = computed(() => needRefresh.value && !dismissed.value);

const dismissUpdateBanner = () => {
  dismissed.value = true;
};

const applyUpdate = () => {
  void updateServiceWorker(true);
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
