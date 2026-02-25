import { createRouter, createWebHistory } from '@ionic/vue-router'

const routes = [
  { path: '/', redirect: '/boot' },
  { path: '/boot', component: () => import('../../modules/boot/BootPage.vue') },
  { path: '/onboarding', component: () => import('../../modules/onboarding/OnboardingPage.vue') },
  { path: '/auth', component: () => import('../../modules/auth/AuthPage.vue') },
  { path: '/conversations', component: () => import('../../modules/conversations/ConversationsPage.vue') },
  { path: '/search', component: () => import('../../modules/search/SearchPage.vue') },
  { path: '/chat/:conversationId', component: () => import('../../modules/chat/ChatRoomPage.vue') },
  { path: '/profile', component: () => import('../../modules/profile/ProfilePage.vue') },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
