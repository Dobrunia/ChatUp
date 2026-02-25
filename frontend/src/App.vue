<template>
  <ion-app>
    <ion-router-outlet />
    <Toaster
      position="top-center"
      expand
      rich-colors
      :offset="toasterOffset"
      class="ru-sonner"
    />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { Toaster } from 'vue-sonner'

const toasterOffset = 'calc(env(safe-area-inset-top, 0px) + 12px)';
</script>

<style>
.ru-sonner {
  z-index: 2147483647 !important;
}

[data-sonner-toaster] {
  z-index: 2147483647 !important;
}
</style>
