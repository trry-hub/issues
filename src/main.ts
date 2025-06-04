import { createApp } from "vue";
import App from "./App.vue";
import router from './router/index'

import '@/styles/element/index.scss'
import ElementPlus from 'element-plus'


let app = createApp(App)

app.use(router).use(ElementPlus)

app.mount('#app')