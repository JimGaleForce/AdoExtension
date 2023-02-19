import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        summary: 'src/pages/summary/index.html'
      }
    }
  },
  plugins: [
    react(),
    crx({ manifest })
  ],
})
