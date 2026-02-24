<template>
  <div class="ru-avatar" :class="[`size-${size}`]" :style="styleObj">
    <img v-if="src" :src="src" :alt="alt || name" class="ru-avatar-img" @error="handleImageError" />
    <span v-else class="ru-avatar-initials">{{ initials }}</span>
    <span v-if="status" class="ru-avatar-status" :class="[`status-${status}`]"></span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  src?: string | null;
  name?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  color?: string; // fallback color if no image
}>(), {
  size: 'md',
  name: 'User'
});

const imageLoadError = ref(false);

const handleImageError = () => {
  imageLoadError.value = true;
};

const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return props.name.substring(0, 2).toUpperCase();
});

// Deterministic color based on name if no explicit color provided
const bgColor = computed(() => {
  if (props.color) return props.color;
  
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#009688', 
    '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#795548'
  ];
  
  let hash = 0;
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
});

const styleObj = computed(() => {
  if (props.src && !imageLoadError.value) return {};
  return {
    backgroundColor: bgColor.value,
    color: '#ffffff'
  };
});
</script>

<style scoped>
.ru-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ru-radius-round);
  background-color: var(--ru-color-bg-tertiary);
  color: var(--ru-color-text-secondary);
  font-family: var(--ru-font-family);
  font-weight: 600;
  flex-shrink: 0;
}

.ru-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

/* Sizes */
.size-sm {
  width: 32px;
  height: 32px;
  font-size: var(--ru-text-xs);
}
.size-md {
  width: 48px;
  height: 48px;
  font-size: var(--ru-text-md);
}
.size-lg {
  width: 64px;
  height: 64px;
  font-size: var(--ru-text-lg);
}
.size-xl {
  width: 96px;
  height: 96px;
  font-size: var(--ru-text-xl);
}

.ru-avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 25%;
  height: 25%;
  border-radius: 50%;
  border: 2px solid var(--ru-color-bg-primary);
}

.status-online {
  background-color: var(--ru-color-semantic-success);
}
.status-offline {
  background-color: var(--ru-color-text-tertiary);
}
.status-away {
  background-color: var(--ru-color-semantic-warning);
}
</style>
