import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'dobruniaui-vue/styles.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'    
import { router } from './app/router'
import { initNavigationProvider } from './app/providers/navigation-provider'
import { useTheme } from './shared/composables/use-theme'
import { useSessionStore } from './stores/session-store'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const theme = useTheme()
const sessionStore = useSessionStore(pinia)

await theme.initTheme()
await sessionStore.boot()
await router.isReady()
await initNavigationProvider(router)
app.mount('#app')
