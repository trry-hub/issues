import { createApp } from "vue";
import router from './router'
import App from "./App.vue";
import Vant from 'vant';
import 'vant/lib/index.css';


let app = createApp(App)

app.use(Vant).use(router)

app.mount('#app')