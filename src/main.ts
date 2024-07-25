import { createApp } from "vue";
import App from "./App.vue";

import QxsBusiness from 'business-vue3'
import 'business-vue3/es/index.css'

let app = createApp(App)

app.use(QxsBusiness)

app.mount('#app')