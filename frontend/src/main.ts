import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import { wsClient } from './ws/client'

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

/* RussianUI Tokens */
import './theme/russianui.tokens.css';

const app = createApp(App)
const pinia = createPinia()

app.use(IonicVue)
app.use(pinia)
app.use(router) // Router must be used after pinia is initialized so guards can use stores

async function bootstrapClientApp() {
  await router.isReady();
  app.mount('#app')

  // Watch for auth changes to connect/disconnect WS
  const authStore = pinia.state.value.auth;
  if (authStore?.isAuthenticated) {
    wsClient.connect();
  }

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
