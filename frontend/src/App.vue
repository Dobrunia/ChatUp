<template>
  <ion-app>
    <ion-router-outlet />
    <Toaster position="top-center" expand />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { Toaster } from 'vue-sonner'
</script>
