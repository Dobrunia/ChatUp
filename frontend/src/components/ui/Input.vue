<template>
  <div class="ru-input-wrapper" :class="{ 'has-error': error }">
    <label v-if="label" class="ru-input-label" :for="id">{{ label }}</label>
    <div class="ru-input-container">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        class="ru-input-field"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
    </div>
    <span v-if="error" class="ru-input-error">{{ error }}</span>
    <span v-else-if="hint" class="ru-input-hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string | number;
  label?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  autocomplete?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
}>(), {
  type: 'text',
  disabled: false
});

defineEmits(['update:modelValue', 'blur', 'focus']);

// Default random ID if not provided, for a11y label linking
const id = computed(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`);
</script>

<style scoped>
.ru-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-4);
  width: 100%;
}

.ru-input-label {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  font-weight: 500;
  color: var(--ru-color-text-primary);
}

.ru-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.ru-input-field {
  width: 100%;
  height: 48px;
  padding: 0 var(--ru-spacing-16);
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  color: var(--ru-color-text-primary);
  background-color: var(--ru-color-bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--ru-radius-md);
  transition: all 0.2s ease;
  outline: none;
}

.ru-input-field::placeholder {
  color: var(--ru-color-text-tertiary);
}

.ru-input-field:focus {
  background-color: var(--ru-color-bg-primary);
  border-color: var(--ru-color-brand-primary);
  box-shadow: 0 0 0 2px var(--ru-color-brand-secondary);
}

.ru-input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.has-error .ru-input-field {
  background-color: var(--ru-color-semantic-error-bg);
  border-color: var(--ru-color-semantic-error);
  color: var(--ru-color-semantic-error);
}
.has-error .ru-input-field:focus {
  box-shadow: 0 0 0 2px var(--ru-color-semantic-error-bg);
}

.ru-input-error {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-xs);
  color: var(--ru-color-semantic-error);
}

.ru-input-hint {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-xs);
  color: var(--ru-color-text-secondary);
}
</style>
