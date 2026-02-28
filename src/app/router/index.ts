import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import ConversationsPage from '../../view/ConversationsPage.vue';
import ProfilePage from '../../view/ProfilePage.vue';

const routes = [
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
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(() => {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
  return true;
});
