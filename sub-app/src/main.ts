import type { Router, createWebHistory } from 'vue-router'
import type { App as VueApp } from 'vue'
import { createApp } from "vue"
import App from "./App.vue"
import {history as historySource, router as routerSource } from '../router/index'



import 'virtual:uno.css'


let app: VueApp | null = null
let router: Router | null = null
let history: ReturnType<typeof createWebHistory> | null = null

window.mount = () => {
  router = routerSource
  history = historySource

  app = createApp(App)
  app.use(routerSource)

  app.mount('#app')
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  app?.unmount()
  history?.destroy()
  app = null
  router = null
  history = null
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
