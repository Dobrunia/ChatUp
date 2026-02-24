<template>
  <span class="ru-badge" :class="[`variant-${variant}`]">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text?: string | number;
  variant?: 'primary' | 'error' | 'success' | 'warning' | 'neutral';
}>(), {
  variant: 'primary'
});
</script>

<style scoped>
.ru-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--ru-spacing-8);
  height: 20px;
  border-radius: var(--ru-radius-round);
  font-family: var(--ru-font-family);
  font-weight: 600;
  font-size: var(--ru-text-xs);
  min-width: 20px;
  box-sizing: border-box;
}

.variant-primary {
  background-color: var(--ru-color-brand-primary);
  color: var(--ru-color-text-inverse);
}

.variant-error {
  background-color: var(--ru-color-semantic-error);
  color: var(--ru-color-text-inverse);
}

.variant-success {
  background-color: var(--ru-color-semantic-success);
  color: var(--ru-color-text-inverse);
}

.variant-warning {
  background-color: var(--ru-color-semantic-warning);
  color: var(--ru-color-text-primary);
}

.variant-neutral {
  background-color: var(--ru-color-bg-tertiary);
  color: var(--ru-color-text-secondary);
}
</style>
