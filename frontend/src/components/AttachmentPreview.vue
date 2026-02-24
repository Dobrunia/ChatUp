<template>
  <div class="attachment-preview-container" v-if="mediaStore.drafts.length > 0">
    <div 
      v-for="draft in mediaStore.drafts" 
      :key="draft.id" 
      class="draft-item"
    >
      <div class="draft-thumbnail">
        <span class="file-ext">{{ getExtension(draft.file.name) }}</span>
      </div>
      
      <div class="draft-info">
        <div class="draft-name">{{ draft.file.name }}</div>
        
        <div class="draft-progress-container" v-if="draft.state === 'UPLOADING' || draft.state === 'CONFIRMING'">
          <div class="draft-progress-bar" :style="{ width: draft.progress + '%' }"></div>
        </div>
        <div v-else-if="draft.state === 'FAILED'" class="draft-error">
          {{ draft.error || 'Ошибка' }}
          <button class="retry-btn" @click="mediaStore.uploadDraft(draft.id)">Повторить</button>
        </div>
        <div v-else-if="draft.state === 'READY'" class="draft-ready">
          Готово
        </div>
      </div>
      
      <button class="remove-btn" @click="mediaStore.removeDraft(draft.id)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaStore } from '@/stores/media';

const mediaStore = useMediaStore();

const getExtension = (filename: string) => {
  return filename.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE';
};
</script>

<style scoped>
.attachment-preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-8);
  padding: var(--ru-spacing-8) var(--ru-spacing-16);
  background-color: var(--ru-color-bg-primary);
  border-top: 1px solid var(--ru-color-bg-tertiary);
  max-height: 150px;
  overflow-y: auto;
}

.draft-item {
  display: flex;
  align-items: center;
  gap: var(--ru-spacing-12);
  background-color: var(--ru-color-bg-secondary);
  padding: var(--ru-spacing-8);
  border-radius: var(--ru-radius-md);
}

.draft-thumbnail {
  width: 40px;
  height: 40px;
  background-color: var(--ru-color-bg-tertiary);
  border-radius: var(--ru-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-ext {
  font-family: var(--ru-font-family);
  font-size: 10px;
  font-weight: 700;
  color: var(--ru-color-text-secondary);
}

.draft-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-4);
}

.draft-name {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  color: var(--ru-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.draft-progress-container {
  height: 4px;
  background-color: var(--ru-color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.draft-progress-bar {
  height: 100%;
  background-color: var(--ru-color-brand-primary);
  transition: width 0.3s ease;
}

.draft-error {
  font-family: var(--ru-font-family);
  font-size: 10px;
  color: var(--ru-color-semantic-error);
  display: flex;
  justify-content: space-between;
}

.retry-btn {
  background: none;
  border: none;
  color: var(--ru-color-text-secondary);
  font-size: 10px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.draft-ready {
  font-family: var(--ru-font-family);
  font-size: 10px;
  color: var(--ru-color-semantic-success);
}

.remove-btn {
  background: none;
  border: none;
  color: var(--ru-color-text-secondary);
  cursor: pointer;
  padding: var(--ru-spacing-4);
  border-radius: var(--ru-radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background-color: var(--ru-color-bg-tertiary);
  color: var(--ru-color-text-primary);
}
</style>
