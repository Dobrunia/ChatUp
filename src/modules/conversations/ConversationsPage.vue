<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="conversations-topbar">
        <h2 class="conversations-title">Диалоги</h2>
        <button class="icon-btn icon-btn-ghost" @click="router.push('/profile')">
          <img
            v-if="profileStore.profile?.avatarUrl"
            :src="profileStore.profile.avatarUrl"
            alt="Профиль"
            class="avatar-image"
          />
          <span v-else class="avatar-fallback">{{ avatarInitials }}</span>
        </button>
      </div>

      <div class="conversations-content">
        <p v-if="loadError">{{ loadError }}</p>
        <div class="new-chat-row">
          <button class="btn btn-primary" @click="router.push('/search')">Новый чат</button>
        </div>
        <ul>
          <li v-for="item in conversationsStore.sortedConversations" :key="item.id">
            <button class="btn btn-ghost" @click="open(item.id)">
              {{ item.id }} · непрочитанные: {{ item.unreadCount }}
            </button>
          </li>
        </ul>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonContent, IonPage } from '@ionic/vue';
import { useConversationsStore } from '../../stores/conversations-store';
import { useSessionStore } from '../../stores/session-store';
import { useProfileStore } from '../../stores/profile-store';

const router = useRouter();
const conversationsStore = useConversationsStore();
const sessionStore = useSessionStore();
const profileStore = useProfileStore();
const loadError = ref<string | null>(null);
const avatarInitials = computed(() => {
  const displayName = profileStore.profile?.displayName?.trim() ?? '';
  const username = profileStore.profile?.username?.trim() ?? '';
  const source = displayName || username || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
});

onMounted(async () => {
  if (!sessionStore.userId) {
    await router.replace('/auth');
    return;
  }
  try {
    if (!profileStore.profile) {
      await profileStore.load();
    }
    await conversationsStore.load(sessionStore.userId);
    loadError.value = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка загрузки диалогов';
    if (message.includes('PGRST205') || message.includes('public.conversations')) {
      loadError.value = 'В Supabase не создана таблица conversations. Примени SQL-схему проекта.';
      return;
    }
    loadError.value = message;
  }
});

async function open(conversationId: string): Promise<void> {
  try {
    await router.push(`/chat/${conversationId}`);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Не удалось открыть диалог';
  }
}
</script>

<style scoped>
.conversations-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto var(--space-3);
  width: min(100%, 480px);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.conversations-title {
  margin: 0;
  color: var(--color-surface-text);
}

.conversations-content {
  margin: 0 auto;
  width: min(100%, 480px);
}

.new-chat-row {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-3);
}

.avatar-image,
.avatar-fallback {
  width: 100%;
  height: 100%;
}

.avatar-image {
  border-radius: 999px;
  object-fit: cover;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
</style>
