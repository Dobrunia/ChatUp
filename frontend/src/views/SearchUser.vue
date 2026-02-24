<template>
  <ion-page>
    <Header title="Поиск людей" back @back="$router.replace('/chats')" />
    <ion-content class="ion-padding" color="light">
      <div class="search-container">
        
        <Input 
          v-model="searchQuery" 
          placeholder="Логин или Имя (от 3 букв)" 
          @input="onSearchInput"
        />

        <div v-if="searchStore.isSearching" class="search-state">
          Ищем...
        </div>

        <div v-else-if="searchStore.searchError" class="search-state error">
          {{ searchStore.searchError }}
        </div>

        <div v-else-if="searchQuery.length >= 3 && searchStore.searchResults.length === 0" class="search-state">
          Ничего не найдено
        </div>

        <div v-else class="search-results">
          <ListItem 
            v-for="user in searchStore.searchResults" 
            :key="user.id"
            :title="user.displayName"
            :subtitle="`@${user.username}`"
            clickable
            @click="$router.push(`/user/${user.id}`)"
          >
            <template #leading>
              <Avatar :name="user.displayName" :src="user.avatarUrl" size="md" />
            </template>
            <template #trailingTop v-if="user.isBlocked">
              Заблокирован
            </template>
          </ListItem>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Input from '@/components/ui/Input.vue';
import ListItem from '@/components/ui/ListItem.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { useSearchStore } from '@/stores/search';
import { useDebounceFn } from '@vueuse/core';

const searchStore = useSearchStore();
const searchQuery = ref('');

const performSearch = useDebounceFn(() => {
  searchStore.searchUsers(searchQuery.value);
}, 400);

const onSearchInput = () => {
  if (searchQuery.value.length >= 3) {
    performSearch();
  } else {
    searchStore.clearSearch();
  }
};

onUnmounted(() => {
  searchStore.clearSearch();
});
</script>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  gap: var(--ru-spacing-16);
  max-width: 600px;
  margin: 0 auto;
}

.search-results {
  display: flex;
  flex-direction: column;
  background-color: var(--ru-color-bg-primary);
  border-radius: var(--ru-radius-md);
  overflow: hidden;
  box-shadow: var(--ru-shadow-card);
}

.search-state {
  text-align: center;
  padding: var(--ru-spacing-24);
  color: var(--ru-color-text-secondary);
  font-family: var(--ru-font-family);
}

.search-state.error {
  color: var(--ru-color-semantic-error);
}
</style>
