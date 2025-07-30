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
    // 增加 chunk 大小警告限制
    chunkSizeWarningLimit: 2000,
    // 使用 esbuild 压缩（默认，不需要额外依赖）
    minify: 'esbuild',
    // 禁用 source map 以减少文件大小
    sourcemap: false
  }
})
