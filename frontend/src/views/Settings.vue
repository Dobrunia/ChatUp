<template>
  <ion-page>
    <Header title="Настройки" back @back="$router.replace('/chats')" />
    <ion-content class="ion-padding">
      <div class="settings-container">
        
        <Card class="settings-card">
          <div class="profile-summary" @click="$router.push('/profile/edit')">
            <Avatar :name="profileStore.profile?.displayName || 'User'" :src="profileStore.profile?.avatarUrl" size="lg" />
            <div class="profile-info">
              <h3 class="profile-name">{{ profileStore.profile?.displayName || 'Загрузка...' }}</h3>
              <p class="profile-username" v-if="profileStore.profile">@{{ profileStore.profile.username }}</p>
            </div>
            <div class="edit-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </Card>

        <Card class="settings-card">
          <ListItem 
            title="Push-уведомления" 
            subtitle="Получать уведомления о новых сообщениях"
          >
            <template #trailingTop>
              <div class="ru-toggle" :class="{ 'is-active': settingsStore.notificationsEnabled }" @click="togglePush">
                <div class="ru-toggle-knob"></div>
              </div>
            </template>
          </ListItem>
          
          <ListItem 
            title="Темная тема" 
            subtitle="Системная или выбранная вручную"
          >
            <template #trailingTop>
              <div class="ru-toggle" :class="{ 'is-active': settingsStore.darkModeEnabled }" @click="toggleTheme">
                <div class="ru-toggle-knob"></div>
              </div>
            </template>
          </ListItem>
        </Card>

        <div class="logout-section">
          <Button variant="danger" size="lg" @click="handleLogout">Выйти из аккаунта</Button>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Card from '@/components/ui/Card.vue';
import ListItem from '@/components/ui/ListItem.vue';
import Button from '@/components/ui/Button.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { useSettingsStore } from '@/stores/settings';
import { pushService } from '@/services/push.service';
import { toast } from 'vue-sonner';
import { TOAST_MESSAGES } from '@chatup/shared/src/protocol';
import { notifyError } from '@/utils/errorHandler';

const router = useRouter();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const settingsStore = useSettingsStore();

onMounted(() => {
  if (!profileStore.profile) {
    profileStore.fetchProfile();
  }
});

const togglePush = async () => {
  if (settingsStore.notificationsEnabled) {
    settingsStore.toggleNotifications(false);
    toast.success(TOAST_MESSAGES.PUSH_DISABLED);
    return;
  }

  const result = await pushService.initPush();
  if (result.ok) {
    settingsStore.toggleNotifications(true);
    toast.success(TOAST_MESSAGES.PUSH_ENABLED);
    return;
  }

  const pushErrorMessageByReason = {
    insecure_context: TOAST_MESSAGES.PUSH_INSECURE_CONTEXT,
    unsupported: TOAST_MESSAGES.PUSH_UNSUPPORTED,
    permission_denied: TOAST_MESSAGES.PUSH_PERMISSION_DENIED,
    public_key_missing: TOAST_MESSAGES.PUSH_PUBLIC_KEY_MISSING,
    register_failed: TOAST_MESSAGES.PUSH_INIT_FAILED,
  } as const;

  notifyError(pushErrorMessageByReason[result.reason] ?? TOAST_MESSAGES.PUSH_INIT_FAILED);
};

const toggleTheme = () => {
  settingsStore.toggleDarkMode(!settingsStore.darkModeEnabled);
  document.body.classList.toggle('dark', settingsStore.darkModeEnabled);
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.replace('/welcome');
  } catch (error) {
    notifyError(error);
    if (import.meta.env.DEV) {
      console.debug('Logout failed', error);
    }
  }
};
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-24);
  max-width: 600px;
  margin: 0 auto;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: var(--ru-spacing-16);
  padding: var(--ru-spacing-16);
  cursor: pointer;
}

.profile-summary:hover {
  background-color: var(--ru-color-bg-secondary);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-lg);
  font-weight: 600;
  color: var(--ru-color-text-primary);
  margin: 0 0 var(--ru-spacing-4);
}

.profile-username {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  color: var(--ru-color-text-secondary);
  margin: 0;
}

.edit-icon {
  color: var(--ru-color-text-tertiary);
}

.logout-section {
  padding: 0 var(--ru-spacing-16);
}

/* Very simple custom toggle for MVP without bringing in another dependency */
.ru-toggle {
  width: 44px;
  height: 24px;
  background-color: var(--ru-color-bg-tertiary);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ru-toggle.is-active {
  background-color: var(--ru-color-semantic-success);
}

.ru-toggle-knob {
  width: 20px;
  height: 20px;
  background-color: var(--ru-color-bg-primary);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
  box-shadow: var(--ru-shadow-card);
}

.ru-toggle.is-active .ru-toggle-knob {
  transform: translateX(20px);
}
</style>
