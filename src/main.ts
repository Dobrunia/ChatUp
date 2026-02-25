import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import './shared/ui/styles/tokens.css'
import './shared/ui/styles/primitives.css'
import App from './App.vue'
import { router } from './app/router'
import { initNavigationProvider } from './app/providers/navigation-provider'
import { useTheme } from './shared/composables/use-theme'
import { useSessionStore } from './stores/session-store'

const app = createApp(App)
const pinia = createPinia()
app.use(IonicVue, { swipeBackEnabled: true })
app.use(pinia)
app.use(router)

const theme = useTheme()
const sessionStore = useSessionStore(pinia)

await theme.initTheme()
await sessionStore.boot()
await router.isReady()
await initNavigationProvider(router)
app.mount('#app')
