import { createApp } from "vue";
import type { App as VueApp } from 'vue'
import App from "./App.vue";

// 这行代码注释掉就可以正常使用 umd 模式了
import 'virtual:uno.css'

let app: VueApp | null = null
window.mount = () => {
  app = createApp(App)
  app.mount('#app')
}

// 👇 将卸载操作放入 unmount 函数，就是上面步骤2中的卸载函数
window.unmount = () => {
  app?.unmount()
  app = null
}

// 如果不在微前端环境，则直接执行mount渲染
if (!window.__MICRO_APP_ENVIRONMENT__) {
  window.mount()
}
