import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',

    proxy: {
      '/datasearch': {
        target: 'https://www.nmpa.gov.cn/',
        changeOrigin: true,
        rewrite: (path) => {
          console.log(path)
          return path
        }
      }
    },
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  }
})
