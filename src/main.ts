import { createApp } from "vue";
import App from "./App.vue";
import router from '../router/index'

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

let app = createApp(App)

app.use(router).use(Antd)

app.mount('#app')