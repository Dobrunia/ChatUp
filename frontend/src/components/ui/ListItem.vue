<template>
  <div class="ru-list-item" :class="{ 'is-clickable': clickable }" @click="clickable && $emit('click')">
    <div v-if="$slots.leading" class="ru-list-item-leading">
      <slot name="leading"></slot>
    </div>
    
    <div class="ru-list-item-content">
      <div class="ru-list-item-title-row">
        <span class="ru-list-item-title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="$slots.trailingTop" class="ru-list-item-trailing-top">
          <slot name="trailingTop"></slot>
        </span>
      </div>
      
      <div v-if="subtitle || $slots.subtitle" class="ru-list-item-subtitle-row">
        <span class="ru-list-item-subtitle" :class="{ 'is-truncate': truncateSubtitle }">
          <slot name="subtitle">{{ subtitle }}</slot>
        </span>
        <span v-if="$slots.trailingBottom" class="ru-list-item-trailing-bottom">
          <slot name="trailingBottom"></slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  clickable?: boolean;
  truncateSubtitle?: boolean;
}>();

defineEmits(['click']);
</script>

<style scoped>
.ru-list-item {
  display: flex;
  align-items: center;
  padding: var(--ru-spacing-12) var(--ru-spacing-16);
  background-color: var(--ru-color-bg-primary);
  transition: background-color 0.2s ease;
  width: 100%;
}

.is-clickable {
  cursor: pointer;
}

.is-clickable:hover {
  background-color: var(--ru-color-bg-secondary);
}

.ru-list-item-leading {
  margin-right: var(--ru-spacing-12);
  flex-shrink: 0;
}

.ru-list-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-4);
}

.ru-list-item-title-row, .ru-list-item-subtitle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.ru-list-item-title {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  font-weight: 500;
  color: var(--ru-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ru-list-item-subtitle {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  color: var(--ru-color-text-secondary);
}

.is-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ru-list-item-trailing-top {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-xs);
  color: var(--ru-color-text-tertiary);
  margin-left: var(--ru-spacing-8);
  flex-shrink: 0;
}

.ru-list-item-trailing-bottom {
  margin-left: var(--ru-spacing-8);
  flex-shrink: 0;
}
</style>
