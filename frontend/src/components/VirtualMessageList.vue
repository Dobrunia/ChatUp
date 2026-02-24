<template>
  <div class="virtual-list-container" ref="container" @scroll="onScroll">
    <div class="virtual-list-spacer" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="{ transform: 'translateY(' + offsetY + 'px)' }">
      <div v-for="item in visibleItems" :key="item.id" class="virtual-list-item">
        <slot :item="item"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
  items: any[];
  itemHeight: number;
}>();

const container = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const containerHeight = ref(800); // fallback

onMounted(() => {
  if (container.value) {
    containerHeight.value = container.value.clientHeight;
  }
});

const onScroll = () => {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
};

const totalHeight = computed(() => props.items.length * props.itemHeight);

const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const visibleCount = Math.ceil(containerHeight.value / props.itemHeight);
  return props.items.slice(start, start + visibleCount + 5);
});

const offsetY = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  return start * props.itemHeight;
});
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  position: relative;
  height: 100%;
}
.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
