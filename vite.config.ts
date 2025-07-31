import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import commonjs from 'rollup-plugin-commonjs'
import externalGlobals from 'rollup-plugin-external-globals'

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
    sourcemap: false,
    rollupOptions: {
      external: [
        '@mediapipe/face_mesh',
      ],
      plugins: [
        commonjs(),
        externalGlobals({
          '@mediapipe/face_mesh': 'face_mesh',
        }),
      ],
    },
  },
  // 配置静态资源处理
  assetsInclude: ['**/*.wasm', '**/*.task'],
  // 配置开发服务器静态文件服务
  publicDir: 'public'
})
