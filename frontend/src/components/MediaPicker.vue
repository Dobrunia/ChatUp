<template>
  <div class="media-picker">
    <input 
      type="file" 
      ref="fileInput" 
      style="display: none" 
      multiple 
      accept="image/*,video/*"
      @change="handleFileSelect"
    />
    
    <button class="icon-btn" @click="triggerSelect" :disabled="disabled" title="Прикрепить файл">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.4354 2.58198C20.9254 2.06298 20.0854 2.06298 19.5754 2.58198L3.43536 18.722C2.02536 20.132 2.02536 22.422 3.43536 23.832C4.14536 24.542 5.06536 24.892 6.00536 24.892C6.94536 24.892 7.86536 24.532 8.57536 23.832L21.4354 10.972C22.6854 9.72198 22.6854 7.68198 21.4354 6.43198L17.5654 2.56198C16.3154 1.31198 14.2754 1.31198 13.0254 2.56198L3.43536 12.152L4.85536 13.572L14.4454 3.98198C14.9154 3.51198 15.6854 3.51198 16.1554 3.98198L20.0254 7.85198C20.4954 8.32198 20.4954 9.09198 20.0254 9.56198L7.16536 22.422C6.84536 22.742 6.42536 22.892 6.00536 22.892C5.58536 22.892 5.16536 22.732 4.85536 22.422C4.22536 21.792 4.22536 20.762 4.85536 20.132L21.0054 3.99198L21.4354 2.58198Z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMediaStore } from '@/stores/media';
import { LIMITS, TOAST_MESSAGES, fileTooLargeToastMessage } from '@chatup/shared';
import { notifyError } from '@/utils/errorHandler';

defineProps<{
  disabled?: boolean;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const mediaStore = useMediaStore();

const triggerSelect = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  
  // Basic validation
  if (target.files.length > 5) {
    notifyError(TOAST_MESSAGES.MAX_ATTACHMENTS_REACHED);
    return;
  }

  for (const file of Array.from(target.files)) {
    const sizeMb = file.size / (1024 * 1024);
    let maxMb: number = LIMITS.FILE_MAX_SIZE_MB;
    if (file.type.startsWith('image/')) {
      maxMb = LIMITS.IMAGE_MAX_SIZE_MB;
    } else if (file.type.startsWith('video/')) {
      maxMb = LIMITS.VIDEO_MAX_SIZE_MB;
    }
    if (sizeMb > maxMb) {
      notifyError(fileTooLargeToastMessage(file.name, maxMb));
      continue;
    }
    mediaStore.addDraft(file);
  }
  
  // Clear input so same file can be selected again
  target.value = '';
};
</script>

<style scoped>
.icon-btn {
  background: none;
  border: none;
  color: var(--ru-color-text-secondary);
  padding: var(--ru-spacing-8);
  border-radius: var(--ru-radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover:not(:disabled) {
  background-color: var(--ru-color-bg-secondary);
  color: var(--ru-color-brand-primary);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
