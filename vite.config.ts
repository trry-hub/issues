import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from "@vitejs/plugin-legacy"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  }
})
