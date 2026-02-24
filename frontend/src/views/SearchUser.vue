<template>
  <ion-page>
    <Header title="Поиск людей" back @back="$router.replace('/chats')" />
    <ion-content class="ion-padding" color="light">
      <div class="search-container">
        
        <Input 
          v-model="searchQuery" 
          placeholder="Введите логин или @username" 
          @input="onSearchInput"
        />

        <div v-if="searchStore.isSearching" class="search-state">
          <Loader label="Ищем пользователей..." />
        </div>

        <div v-else-if="searchStore.searchError" class="search-state error">
          {{ searchStore.searchError }}
        </div>

        <div v-else-if="searchStore.hasSearched && searchStore.searchResults.length === 0" class="search-state">
          Никого не нашли. Проверьте логин и попробуйте другой запрос.
        </div>

        <div v-else-if="showSuggestions" class="search-results">
          <div class="section-title">Предложения</div>
          <div v-if="searchStore.isLoadingSuggestions" class="search-state">
            <Loader label="Подбираем пользователей..." />
          </div>
          <div v-else-if="searchStore.suggestions.length === 0" class="search-state">
            Пока нет предложений.
          </div>
          <ListItem 
            v-for="user in searchStore.suggestions" 
            :key="`suggestion-${user.id}`"
            :title="user.displayName"
            :subtitle="`@${user.username}`"
            clickable
            @click="$router.push(`/user/${user.id}`)"
          >
            <template #leading>
              <Avatar :name="user.displayName" :src="user.avatarUrl" size="md" />
            </template>
          </ListItem>
        </div>

        <div v-else class="search-results">
          <div class="section-title">Результаты</div>
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import Header from '@/components/ui/Header.vue';
import Input from '@/components/ui/Input.vue';
import ListItem from '@/components/ui/ListItem.vue';
import Avatar from '@/components/ui/Avatar.vue';
import Loader from '@/components/ui/Loader.vue';
import { useSearchStore } from '@/stores/search';
import { useDebounceFn } from '@vueuse/core';

const searchStore = useSearchStore();
const searchQuery = ref('');
const showSuggestions = computed(() => searchQuery.value.trim().length === 0 && !searchStore.hasSearched);

const performSearch = useDebounceFn(() => {
  searchStore.searchUsers(searchQuery.value);
}, 400);

const onSearchInput = () => {
  if (searchQuery.value.trim().length >= 1) {
    performSearch();
  } else {
    searchStore.clearSearch();
    searchStore.loadSuggestions();
  }
};

onMounted(() => {
  searchStore.loadSuggestions();
});

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

.section-title {
  padding: var(--ru-spacing-12) var(--ru-spacing-16);
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-sm);
  font-weight: 600;
  color: var(--ru-color-text-secondary);
  border-bottom: 1px solid var(--ru-color-bg-tertiary);
}

.search-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--ru-spacing-24);
  color: var(--ru-color-text-secondary);
  font-family: var(--ru-font-family);
}

.search-state.error {
  color: var(--ru-color-semantic-error);
}
</style>
