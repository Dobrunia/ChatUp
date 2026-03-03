<template>
  <div class="app-brand" :class="`app-brand--${size}`">
    <div class="app-brand__icon">
      <svg :width="iconSize" :height="iconSize" viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="10" fill="var(--dbru-color-primary)" />
        <path
          d="M9 11.5C9 10.1193 10.1193 9 11.5 9H24.5C25.8807 9 27 10.1193 27 11.5V20.5C27 21.8807 25.8807 23 24.5 23H20L16 27V23H11.5C10.1193 23 9 21.8807 9 20.5V11.5Z"
          fill="var(--dbru-color-on-primary)"
        />
      </svg>
    </div>
    <span class="app-brand__name dbru-text-main">ChatUp</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ size?: 'sm' | 'lg' }>(), { size: 'lg' })

const iconSize = computed(() => (props.size === 'sm' ? 24 : 36))
</script>

<style scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: var(--dbru-space-3);
}

.app-brand__icon {
  line-height: 0;
  flex-shrink: 0;
}

.app-brand__name {
  font-weight: var(--dbru-font-weight-semibold);
  letter-spacing: -0.3px;
}

.app-brand--lg .app-brand__name {
  font-size: 22px;
}

.app-brand--sm .app-brand__name {
  font-size: 16px;
}
</style>
