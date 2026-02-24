<template>
  <header class="ru-header">
    <div class="ru-header-left">
      <slot name="left">
        <button v-if="back" class="ru-header-back-btn" @click="$emit('back')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </slot>
    </div>
    <div class="ru-header-title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="ru-header-right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  back?: boolean;
}>();

defineEmits(['back']);
</script>

<style scoped>
.ru-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--ru-spacing-16);
  background-color: var(--ru-color-bg-primary);
  border-bottom: 1px solid var(--ru-color-bg-secondary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.ru-header-left, .ru-header-right {
  display: flex;
  align-items: center;
  min-width: 48px; /* Touch target size min */
}

.ru-header-right {
  justify-content: flex-end;
}

.ru-header-title {
  flex: 1;
  text-align: center;
  font-family: var(--ru-font-family);
  font-weight: 600;
  font-size: var(--ru-text-lg);
  color: var(--ru-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 var(--ru-spacing-16);
}

.ru-header-back-btn {
  background: none;
  border: none;
  padding: var(--ru-spacing-8);
  margin-left: calc(-1 * var(--ru-spacing-8));
  cursor: pointer;
  color: var(--ru-color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ru-radius-round);
  transition: background-color 0.2s ease;
}

.ru-header-back-btn:hover {
  background-color: var(--ru-color-bg-secondary);
}
</style>
