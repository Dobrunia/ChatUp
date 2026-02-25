import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import { wsClient } from './ws/client'
import { handleGlobalError } from './utils/errorHandler'
import { useAuthStore } from './stores/auth'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import 'vue-sonner/style.css';

/* RussianUI Tokens */
import './theme/russianui.tokens.css';

const app = createApp(App)
const pinia = createPinia()

app.use(IonicVue)
app.use(pinia)
app.use(router) // Router must be used after pinia is initialized so guards can use stores

if (globalThis.window !== undefined) {
  const hasRouterBackEntry = () => Boolean(globalThis.history.state?.back);
  const goBackOrFallback = async () => {
    if (hasRouterBackEntry()) {
      await router.back();
      return;
    }
    const fallbackPath = localStorage.getItem('token') ? '/chats' : '/welcome';
    if (router.currentRoute.value.path !== fallbackPath) {
      await router.replace(fallbackPath);
    }
  };

  globalThis.window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason);
    event.preventDefault();
  });

  globalThis.window.addEventListener('error', (event) => {
    if (event.error) {
      handleGlobalError(event.error);
    }
  });

  let edgeSwipeStartX = 0;
  let edgeSwipeStartY = 0;
  globalThis.window.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      edgeSwipeStartX = touch.clientX;
      edgeSwipeStartY = touch.clientY;
    },
    { passive: true }
  );

  globalThis.window.addEventListener(
    'touchend',
    (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      const deltaX = touch.clientX - edgeSwipeStartX;
      const deltaY = Math.abs(touch.clientY - edgeSwipeStartY);
      const startedFromLeftEdge = edgeSwipeStartX <= 24;
      const isHorizontalBackSwipe = deltaX >= 70 && deltaY <= 36;
      if (startedFromLeftEdge && isHorizontalBackSwipe) {
        void goBackOrFallback();
      }
    },
    { passive: true }
  );

  document.addEventListener('ionBackButton', (event: Event) => {
    const ionEvent = event as Event & {
      detail?: { register: (priority: number, handler: () => void) => void };
    };
    ionEvent.detail?.register(10, () => {
      void goBackOrFallback();
    });
  });
}

async function bootstrapClientApp() {
  await router.isReady();
  const authStore = useAuthStore();
  authStore.initSession();
  app.mount('#app')

  if (authStore.isAuthenticated) wsClient.connect();

  // Init resilience layer
  import('./services/resilience.service').then(({ resilienceService }) => {
    resilienceService.init();
    void resilienceService.restoreStateOnStart().catch((error: unknown) => {
      if (import.meta.env.DEV) {
        console.debug('Resilience restore failed', error);
      }
    });
  });

  // Load settings
  import('./stores/settings').then(({ useSettingsStore }) => {
    useSettingsStore().loadSettings();
  });
}

void bootstrapClientApp();
