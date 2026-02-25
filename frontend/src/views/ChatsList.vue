<template>
  <ion-page>
    <Header title="Чаты">
      <template #right>
        <button class="icon-btn" @click="$router.push('/search')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21.0004 20.9999L16.6504 16.6499" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn" @click="$router.push('/settings')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.4 15A1.65 1.65 0 0 0 19 16.5C18.6 17.2 18 17.8 17.3 18.2C16.8 18.5 16.2 18.7 15.6 18.8C15 18.9 14.4 19 13.7 19.3L12.5 21H11.5L10.3 19.3C9.6 19 9 18.9 8.4 18.8C7.8 18.7 7.2 18.5 6.7 18.2C6 17.8 5.4 17.2 5 16.5A1.65 1.65 0 0 0 4.6 15L3 13.5V10.5L4.6 9A1.65 1.65 0 0 0 5 7.5C5.4 6.8 6 6.2 6.7 5.8C7.2 5.5 7.8 5.3 8.4 5.2C9 5.1 9.6 5 10.3 4.7L11.5 3H12.5L13.7 4.7C14.4 5 15 5.1 15.6 5.2C16.2 5.3 16.8 5.5 17.3 5.8C18 6.2 18.6 6.8 19 7.5A1.65 1.65 0 0 0 19.4 9L21 10.5V13.5L19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </template>
    </Header>
    
    <ion-content class="ion-padding">
      
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="chats-container">
        <div v-if="dialogsStore.isLoading && dialogsStore.dialogs.length === 0" class="state-msg">
          Загрузка чатов...
        </div>
        
        <div v-else-if="dialogsStore.dialogs.length === 0" class="state-msg empty">
          <p>У вас пока нет чатов.</p>
          <Button variant="primary" size="md" @click="$router.push('/search')">Найти друзей</Button>
        </div>

        <div v-else class="chats-list">
          <ListItem 
            v-for="dialog in dialogsStore.dialogs" 
            :key="dialog.id"
            :title="dialog.title || 'Чат'"
            truncateSubtitle
            clickable
            @click="$router.push(`/chat/${dialog.id}`)"
          >
            <template #leading>
              <Avatar :name="dialog.title" size="md" />
            </template>
            <template #trailingTop v-if="dialog.lastMessage">
              {{ formatTime(dialog.lastMessage.createdAt) }}
            </template>
            <template #trailingBottom v-if="dialog.unreadCount > 0">
              <Badge variant="primary" :text="dialog.unreadCount" />
            </template>
            <template #subtitle>
              <span
                class="dialog-subtitle"
                :class="{
                  'mine-unread': isLastMessageMine(dialog) && !isLastMessageReadByOthers(dialog),
                  'mine-read': isLastMessageMine(dialog) && isLastMessageReadByOthers(dialog),
                  incoming: !isLastMessageMine(dialog),
                }"
              >
                {{
                  dialog.lastMessage
                    ? `${isLastMessageMine(dialog) ? 'Вы: ' : 'Вам: '}${dialog.lastMessage.content || ''}`
                    : 'Нет сообщений'
                }}
              </span>
            </template>
          </ListItem>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import ListItem from '@/components/ui/ListItem.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import { useDialogsStore } from '@/stores/dialogs';
import { useProfileStore } from '@/stores/profile';

const dialogsStore = useDialogsStore();
const profileStore = useProfileStore();

onMounted(() => {
  dialogsStore.fetchDialogs();
  if (!profileStore.profile) {
    profileStore.fetchProfile();
  }
});

const handleRefresh = async (event: CustomEvent) => {
  await dialogsStore.fetchDialogs();
  (event.target as any)?.complete();
};

const formatTime = (dateStr: string | Date) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const isLastMessageMine = (dialog: {
  lastMessage: null | { senderId?: string; readByOthers?: boolean | null };
}) => {
  return dialog.lastMessage?.senderId === profileStore.profile?.id;
};

const isLastMessageReadByOthers = (dialog: {
  lastMessage: null | { senderId?: string; readByOthers?: boolean | null };
}) => {
  return dialog.lastMessage?.readByOthers === true;
};
</script>

<style scoped>
.icon-btn {
  background: none;
  border: none;
  color: var(--ru-color-text-primary);
  padding: var(--ru-spacing-8);
  margin-left: var(--ru-spacing-4);
  cursor: pointer;
  border-radius: var(--ru-radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--ru-color-bg-secondary);
}

.chats-container {
  max-width: 600px;
  margin: 0 auto;
}

.chats-list {
  background-color: var(--ru-color-bg-primary);
  border-radius: var(--ru-radius-md);
  overflow: hidden;
  box-shadow: var(--ru-shadow-card);
}

.state-msg {
  text-align: center;
  padding: var(--ru-spacing-48);
  color: var(--ru-color-text-secondary);
  font-family: var(--ru-font-family);
}

.state-msg.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ru-spacing-16);
}

.dialog-subtitle {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-subtitle.mine-unread {
  color: var(--ru-color-semantic-error);
  font-weight: 500;
}

.dialog-subtitle.mine-read {
  color: var(--ru-color-text-secondary);
  font-weight: 400;
}

.dialog-subtitle.incoming {
  color: var(--ru-color-text-secondary);
}
</style>
