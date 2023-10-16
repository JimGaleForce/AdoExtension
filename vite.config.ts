import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        iterationSummary: 'src/pages/summary/iteration/index.html',
        dateRangeSummary: 'src/pages/summary/daterange/index.html'
      }
    }
  },
  plugins: [
    react(),
    crx({ manifest })
  ],
})
