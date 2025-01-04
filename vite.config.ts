
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import process from 'node:process'

// https://vitejs.dev/config/
export default async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const isServer = command === 'serve' && mode.startsWith('dev')
  return defineConfig({

    server: {
      port: 8080,
      proxy: {
        '/proxy/mock': {
          target: 'https://yapi.yaomaitong.net/',
          changeOrigin: command === 'serve' && env.VITE_OPEN_PROXY === 'true',
          rewrite: (path) => {
            return path.replace(/\/proxy/, '')
          },
        },
        '/proxy': {
          target: env.VITE_APP_API_PROXY_DOMAIN,
          changeOrigin: command === 'serve' && env.VITE_OPEN_PROXY === 'true',
          rewrite: (path) => {
            return path.replace(/\/proxy/, '')
          },
        },
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
}
