<template>
  <output class="ru-loader" aria-live="polite">
    <span class="spinner" aria-hidden="true" />
    <span class="label">{{ label }}</span>
  </output>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: 'Загрузка...',
  }
);
</script>

<style scoped>
.ru-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ru-spacing-8);
  color: var(--ru-color-text-secondary);
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--ru-color-bg-tertiary);
  border-top-color: var(--ru-color-brand-primary);
  animation: ru-spin 0.8s linear infinite;
}

@keyframes ru-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
