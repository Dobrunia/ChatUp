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

const ROUTE_BACKGROUND_CLASSES = ['ru-bg-bogatyr2', 'ru-bg-kokoshnik', 'ru-bg-khokhloma'] as const;

function resolveBackgroundClass(path: string): (typeof ROUTE_BACKGROUND_CLASSES)[number] {
  if (path.startsWith('/chat') || path.startsWith('/chats')) {
    return 'ru-bg-bogatyr2';
  }
  if (path.startsWith('/search') || path.startsWith('/user') || path.startsWith('/settings') || path.startsWith('/profile')) {
    return 'ru-bg-khokhloma';
  }
  return 'ru-bg-kokoshnik';
}

function applyRouteBackground(path: string) {
  if (typeof document === 'undefined') return;
  const nextClass = resolveBackgroundClass(path);
  document.body.classList.remove(...ROUTE_BACKGROUND_CLASSES);
  document.body.classList.add(nextClass);
}

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

router.afterEach((to) => {
  applyRouteBackground(to.path);
});

export default router;
