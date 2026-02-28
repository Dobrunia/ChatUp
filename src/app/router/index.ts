import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/boot' },
  { path: '/boot', component: () => import('../../view/BootPage.vue') },
  { path: '/onboarding', component: () => import('../../view/OnboardingPage.vue') },
  { path: '/auth', component: () => import('../../view/AuthPage.vue') },
  { path: '/conversations', component: () => import('../../view/ConversationsPage.vue') },
  { path: '/search', component: () => import('../../view/SearchPage.vue') },
  { path: '/chat/:conversationId', component: () => import('../../view/ChatRoomPage.vue') },
  { path: '/profile', component: () => import('../../view/ProfilePage.vue') },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(() => {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement) {
    activeElement.blur()
  }
  return true
})
