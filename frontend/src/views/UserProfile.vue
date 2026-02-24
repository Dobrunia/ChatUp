<template>
  <ion-page>
    <Header title="Профиль" back @back="$router.back()" />
    <ion-content class="ion-padding">
      <div v-if="user" class="profile-container">
        
        <Card class="profile-card">
          <div class="avatar-section">
            <Avatar :name="user.displayName" :src="user.avatarUrl" size="xl" />
          </div>
          
          <div class="profile-info">
            <h2 class="profile-name">{{ user.displayName }}</h2>
            <p class="profile-username">@{{ user.username }}</p>
          </div>

          <div class="profile-actions">
            <Button variant="primary" :loading="chatLoading" @click="openChat">
              Написать сообщение
            </Button>
            
            <Button 
              v-if="!user.isBlocked" 
              variant="danger" 
              :loading="blockLoading" 
              @click="toggleBlock(true)"
            >
              Заблокировать
            </Button>
            <Button 
              v-else 
              variant="secondary" 
              :loading="blockLoading" 
              @click="toggleBlock(false)"
            >
              Разблокировать
            </Button>
          </div>
        </Card>

      </div>
      <div v-else-if="isLoading" class="loading-state">
        Загрузка...
      </div>
      <div v-else class="error-state">
        Пользователь не найден
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { trpc } from '@/api';
import { useSearchStore } from '@/stores/search';
import { useDialogsStore } from '@/stores/dialogs';
import type { UserSearchResultLocal } from '@/api/types';
import { toast } from 'vue-sonner';
import { TOAST_MESSAGES } from '@chatup/shared/src/protocol';

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();
const dialogsStore = useDialogsStore();

const userId = route.params.userId as string;
const user = ref<UserSearchResultLocal | null>(null);
const isLoading = ref(true);
const chatLoading = ref(false);
const blockLoading = ref(false);

onMounted(async () => {
  // First, try to find user in existing search/suggestion lists to avoid extra query
  const existingUser = searchStore.searchResults.find(u => u.id === userId);
  const suggestedUser = searchStore.suggestions.find(u => u.id === userId);
  if (existingUser || suggestedUser) {
    user.value = existingUser || suggestedUser || null;
    isLoading.value = false;
    return;
  }

  try {
    const fetched = await trpc.profile.getById.query({ userId });
    user.value = { ...fetched, isBlocked: false };
  } catch {
    toast.error(TOAST_MESSAGES.USER_NOT_LOADED_FOR_PROFILE);
  } finally {
    isLoading.value = false;
  }
});

const openChat = async () => {
  if (!user.value) return;
  chatLoading.value = true;
  try {
    const dialog = await dialogsStore.getOrCreateDirectDialog(user.value.id);
    router.push(`/chat/${dialog.dialogId}`);
  } catch (error) {
    if (import.meta.env.DEV) console.debug('openChat failed', error);
  } finally {
    chatLoading.value = false;
  }
};

const toggleBlock = async (block: boolean) => {
  if (!user.value) return;
  blockLoading.value = true;
  try {
    if (block) {
      await searchStore.blockUser(user.value.id);
      user.value.isBlocked = true;
      toast.success(TOAST_MESSAGES.USER_BLOCKED);
    } else {
      await searchStore.unblockUser(user.value.id);
      user.value.isBlocked = false;
      toast.success(TOAST_MESSAGES.USER_UNBLOCKED);
    }
  } catch (error) {
    if (import.meta.env.DEV) console.debug('toggleBlock failed', error);
  } finally {
    blockLoading.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  padding-bottom: var(--ru-spacing-24);
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin: var(--ru-spacing-24) 0 var(--ru-spacing-16);
}

.profile-info {
  text-align: center;
  margin-bottom: var(--ru-spacing-32);
}

.profile-name {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-xl);
  font-weight: 700;
  color: var(--ru-color-text-primary);
  margin: 0 0 var(--ru-spacing-4);
}

.profile-username {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  color: var(--ru-color-text-secondary);
  margin: 0;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-16);
  padding: 0 var(--ru-spacing-24);
}

.loading-state, .error-state {
  text-align: center;
  padding: var(--ru-spacing-48);
  font-family: var(--ru-font-family);
  color: var(--ru-color-text-secondary);
}
</style>
