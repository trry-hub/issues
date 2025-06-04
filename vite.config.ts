import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// or use unplugin-element-plus
import ElementPlus from 'unplugin-element-plus/vite'
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [
    vue(),
    ElementPlus({
      useSource: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
})
