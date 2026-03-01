import { createRouter, createWebHistory } from 'vue-router';
import { useSessionStore } from '../../stores/session-store';
import AppLayout from '../layouts/AppLayout.vue';
import ConversationsPage from '../../view/ConversationsPage.vue';
import ProfilePage from '../../view/ProfilePage.vue';
import ChatPage from '../../view/ChatPage.vue';
import LoginPage from '../../view/LoginPage.vue';
import RegisterPage from '../../view/RegisterPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { public: true },
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'conversations',
        component: ConversationsPage,
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfilePage,
      },
      {
        path: 'chat/:conversationId',
        name: 'chat',
        component: ChatPage,
        meta: { fullscreen: true },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }

  const sessionStore = useSessionStore();
  const isAuthenticated = sessionStore.userId !== null;

  if (!isAuthenticated && !to.meta.public) {
    return { name: 'login' };
  }

  if (isAuthenticated && to.meta.public) {
    return { name: 'conversations' };
  }

  return true;
});
