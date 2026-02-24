<template>
  <div class="ru-card" :class="{ 'is-clickable': clickable }" @click="clickable && $emit('click')">
    <div v-if="$slots.header" class="ru-card-header">
      <slot name="header"></slot>
    </div>
    <div class="ru-card-content">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="ru-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  clickable?: boolean;
}>();

defineEmits(['click']);
</script>

<style scoped>
.ru-card {
  background-color: var(--ru-color-bg-primary);
  border-radius: var(--ru-radius-lg);
  box-shadow: var(--ru-shadow-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.is-clickable {
  cursor: pointer;
}

.is-clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--ru-shadow-modal);
}

.ru-card-header {
  padding: var(--ru-spacing-16) var(--ru-spacing-16) 0;
  font-family: var(--ru-font-family);
  font-weight: 600;
  font-size: var(--ru-text-lg);
  color: var(--ru-color-text-primary);
}

.ru-card-content {
  padding: var(--ru-spacing-16);
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  color: var(--ru-color-text-secondary);
}

.ru-card-footer {
  padding: 0 var(--ru-spacing-16) var(--ru-spacing-16);
  border-top: 1px solid var(--ru-color-bg-secondary);
  margin-top: auto;
  padding-top: var(--ru-spacing-16);
}
</style>
