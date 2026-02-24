<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="welcome-container">
        <h1 class="welcome-title">ChatUp</h1>
        <p class="welcome-subtitle">Общайтесь легко и безопасно</p>
        
        <div class="welcome-actions">
          <Button variant="primary" size="lg" @click="$router.push('/auth')">
            Начать
          </Button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import Button from '@/components/ui/Button.vue';
</script>

<style scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}
.welcome-title {
  font-family: var(--ru-font-family);
  font-size: 32px;
  font-weight: 700;
  color: var(--ru-color-brand-primary);
  margin-bottom: var(--ru-spacing-8);
}
.welcome-subtitle {
  font-family: var(--ru-font-family);
  font-size: var(--ru-text-md);
  color: var(--ru-color-text-secondary);
  margin-bottom: var(--ru-spacing-48);
}
.welcome-actions {
  width: 100%;
  max-width: 300px;
}
</style>
