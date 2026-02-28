<template>
  <dbr-card class="page-header page-header-layout">
    <div class="page-header-side">
      <slot name="left">
        <dbr-icon-button v-if="backButton" label="Назад" variant="ghost" @click="emit('back')">
          <template #iconBefore>←</template>
        </dbr-icon-button>
      </slot>
    </div>
    <div class="page-title-wrap">
      <h2 class="dbru-text-lg dbru-text-main">{{ title }}</h2>
      <p v-if="subtitle" class="dbru-text-sm dbru-text-muted">{{ subtitle }}</p>
    </div>
    <div class="page-header-side page-header-side-right">
      <slot name="right" />
    </div>
  </dbr-card>
</template>

<script setup lang="ts">
import { DbrCard, DbrIconButton } from 'dobruniaui-vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    backButton?: boolean
  }>(),
  {
    subtitle: '',
    backButton: false,
  },
)

const emit = defineEmits<{
  (event: 'back'): void
}>()
</script>

<style scoped>
.page-header-layout {
  display: grid;
  grid-template-columns: minmax(90px, auto) 1fr minmax(90px, auto);
  align-items: center;
  gap: var(--space-3);
}

.page-header-side {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.page-header-side-right {
  justify-content: flex-end;
}
</style>
