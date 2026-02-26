<template>
  <header class="app-header ornamented">
    <div class="app-header-left">
      <slot name="left" />
    </div>
    <div class="app-header-center">
      <div class="app-header-title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.subtitle || subtitle" class="app-header-subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </div>
    </div>
    <div class="app-header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>
