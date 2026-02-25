<template>
  <button 
    class="ru-btn" 
    :class="[`variant-${variant}`, `size-${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span class="ru-btn-content">
      <slot></slot>
    </span>
    <span v-if="loading" class="ru-btn-spinner">...</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
});

defineEmits(['click']);
</script>

<style scoped>
.ru-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--ru-font-family);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  width: 100%; /* mobile first default */
}

/* Sizes */
.size-sm {
  padding: var(--ru-spacing-4) var(--ru-spacing-12);
  font-size: var(--ru-text-sm);
  border-radius: var(--ru-radius-sm);
  height: 32px;
}
.size-md {
  padding: var(--ru-spacing-8) var(--ru-spacing-16);
  font-size: var(--ru-text-md);
  border-radius: var(--ru-radius-md);
  height: 48px;
}
.size-lg {
  padding: var(--ru-spacing-12) var(--ru-spacing-24);
  font-size: var(--ru-text-lg);
  border-radius: var(--ru-radius-lg);
  height: 56px;
}

/* Variants */
.variant-primary {
  background-color: var(--ru-color-brand-primary);
  color: var(--ru-color-text-inverse);
}
.variant-primary:hover:not(:disabled) {
  background-color: var(--ru-color-brand-primary-hover);
}
.variant-primary:active:not(:disabled) {
  background-color: var(--ru-color-brand-primary-active);
}

.variant-secondary {
  background-color: var(--ru-color-brand-secondary);
  color: var(--ru-color-brand-primary);
}
.variant-secondary:hover:not(:disabled) {
  background-color: var(--ru-color-bg-tertiary);
}

.variant-ghost {
  background-color: transparent;
  color: var(--ru-color-brand-primary);
}
.variant-ghost:hover:not(:disabled) {
  background-color: var(--ru-color-bg-secondary);
}

.variant-danger {
  background-color: var(--ru-color-semantic-error-bg);
  color: var(--ru-color-semantic-error);
}
.variant-danger:hover:not(:disabled) {
  background-color: var(--ru-color-semantic-error);
  color: var(--ru-color-text-inverse);
}

/* States */
.ru-btn:disabled {
  opacity: 1;
  cursor: not-allowed;
  background-color: var(--ru-color-bg-tertiary) !important;
  color: var(--ru-color-text-tertiary) !important;
  border: 1px dashed var(--ru-color-text-tertiary);
  box-shadow: none;
}

.is-loading .ru-btn-content {
  opacity: 0;
}

.ru-btn-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Desktop override where width auto is preferred */
@media (min-width: 768px) {
  .ru-btn {
    width: auto;
  }
}
</style>
