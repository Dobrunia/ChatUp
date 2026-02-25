<template>
  <ion-page>
    <Header :title="dialogTitle" back @back="$router.replace('/chats')" />
    
    <ion-content class="chat-content">
      <VirtualMessageList 
        :messages="chatStore.messages" 
        :currentUserId="profileStore.profile?.id || ''"
        :receiptStateByMessageId="chatStore.receiptStateByMessageId"
        @load-more="handleLoadMore"
      />
    </ion-content>

    <footer class="chat-footer">
      <AttachmentPreview />
      <div class="composer-container">
        <!-- Attachment placeholder for Stage 7 media flow MVP constraint -->
        <MediaPicker disabled />

        <Input 
          v-model="messageText" 
          placeholder="Сообщение..." 
          class="composer-input"
          @keydown.enter.prevent="sendMessage"
        />

        <button 
          class="icon-btn send-btn" 
          :class="{ 'is-active': messageText.trim().length > 0 }"
          @click="sendMessage"
          :disabled="messageText.trim().length === 0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Input from '@/components/ui/Input.vue';
import VirtualMessageList from '@/components/VirtualMessageList.vue';
import MediaPicker from '@/components/MediaPicker.vue';
import AttachmentPreview from '@/components/AttachmentPreview.vue';
import { useChatStore } from '@/stores/chat';
import { useProfileStore } from '@/stores/profile';
import { useDialogsStore } from '@/stores/dialogs';
import { trpc } from '@/api';
import { resilienceService } from '@/services/resilience.service';
import { useMediaStore } from '@/stores/media';
import { ERROR_MESSAGES } from '@chatup/shared';
import { notifyError } from '@/utils/errorHandler';

const route = useRoute();
const chatStore = useChatStore();
const profileStore = useProfileStore();
const dialogsStore = useDialogsStore();
const mediaStore = useMediaStore();

const dialogId = route.params.dialogId as string;
const messageText = ref('');
const readMarkInFlight = ref(false);
const markedIncomingIds = ref(new Set<string>());

const dialogTitle = computed(() => {
  const d = dialogsStore.dialogs.find(x => x.id === dialogId);
  return d ? (d.title || 'Чат') : 'Чат';
});

onMounted(() => {
  chatStore.setDialogId(dialogId);
  chatStore.fetchMessages();
  if (!profileStore.profile) {
    profileStore.fetchProfile();
  }
});

const markIncomingAsRead = async () => {
  if (readMarkInFlight.value) return;
  const profileId = profileStore.profile?.id;
  if (!profileId) return;
  const incomingIdsToMark = chatStore.messages
    .filter((msg) => msg.id && msg.senderId !== profileId)
    .map((msg) => msg.id as string)
    .filter((id) => !markedIncomingIds.value.has(id));
  if (incomingIdsToMark.length === 0) return;

  readMarkInFlight.value = true;
  try {
    await Promise.all(
      incomingIdsToMark.map((messageId) =>
        trpc.message.markRead.mutate({ dialogId, messageId })
      )
    );
    for (const id of incomingIdsToMark) {
      markedIncomingIds.value.add(id);
    }
    await dialogsStore.fetchDialogs();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('markIncomingAsRead failed', error);
    }
  } finally {
    readMarkInFlight.value = false;
  }
};

watch(
  () => chatStore.messages.map((m) => m.id || m.clientMessageId).join('|'),
  () => {
    void markIncomingAsRead();
  },
  { immediate: true }
);

const handleLoadMore = () => {
  if (!chatStore.isLoading && chatStore.hasMore) {
    chatStore.fetchMessages();
  }
};

const sendMessage = async () => {
  const text = messageText.value.trim();
  // In the future, we will allow sending just attachments without text
  // For MVP, if we have a text, send it. If we had ready attachments, we'd include them.
  if (!text) return;
  
  messageText.value = ''; // clear immediately for UX
  
  // Hand off to resilience layer (which will optimistic UI via chatStore)
  // mediaStore.getReadyAttachmentIds() would be passed here, but blocked by constraint
  try {
    await resilienceService.enqueueMessage(dialogId, text, []);
  } catch (error) {
    messageText.value = text;
    notifyError(ERROR_MESSAGES.MESSAGE_SEND_FAILED);
    if (import.meta.env.DEV) {
      console.debug('sendMessage failed', error);
    }
  }
};
</script>

<style scoped>
.chat-content {
  --background: var(--ru-color-bg-secondary);
}

.chat-footer {
  background-color: var(--ru-color-bg-primary);
  border-top: 1px solid var(--ru-color-bg-tertiary);
  padding: var(--ru-spacing-8) var(--ru-spacing-16);
  padding-bottom: calc(var(--ru-spacing-8) + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: column;
}

.composer-container {
  display: flex;
  align-items: center;
  gap: var(--ru-spacing-8);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.composer-input {
  flex: 1;
}

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

.send-btn.is-active {
  color: var(--ru-color-brand-primary);
}
</style>
