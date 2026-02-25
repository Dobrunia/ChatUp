import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const frontendPkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string };
const githubRepo = 'https://github.com/Dobrunia/ChatUp';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(frontendPkg.version),
    __GITHUB_REPO__: JSON.stringify(githubRepo),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ChatUp',
        short_name: 'ChatUp',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'ru',
        background_color: '#0f1115',
        theme_color: '#5b7fa6',
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
