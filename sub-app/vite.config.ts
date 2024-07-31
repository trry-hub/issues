import path from 'node:path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './vite-plugins'

// https://vitejs.dev/config/
export default async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  return defineConfig({
    server: {
      host: '0.0.0.0',
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    },
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  })
}
