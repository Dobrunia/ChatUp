import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/chats'
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/views/Welcome.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/chats',
    name: 'ChatsList',
    component: () => import('@/views/ChatsList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:dialogId',
    name: 'Chat',
    component: () => import('@/views/ChatScreen.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'SearchUser',
    component: () => import('@/views/SearchUser.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:userId',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/edit',
    name: 'MyProfileEdit',
    component: () => import('@/views/MyProfileEdit.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Route Guards depending only on AuthStore session state
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  // Ensure session state is initialized before checking guards
  // In a real app this might be async if restoring from DB, but for MVP it's sync via localStorage
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.initSession();
  }

  const isAuth = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuth) {
    next('/welcome');
  } else if (to.meta.requiresGuest && isAuth) {
    next('/chats');
  } else {
    next();
  }
});

export default router;
