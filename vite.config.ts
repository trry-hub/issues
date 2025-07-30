import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 MediaPipe 相关代码分离到单独的 chunk
          'mediapipe': ['@mediapipe/tasks-vision'],
          // 将 Vue 相关代码分离
          'vue': ['vue', 'vue-router'],
          // 将 TensorFlow 相关代码分离
          'tensorflow': ['@tensorflow-models/face-landmarks-detection', '@tensorflow/tfjs-backend-webgl']
        }
      }
    },
    // 增加 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 gzip 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
