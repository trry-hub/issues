import { createApp } from "vue";
import pinia from "./store";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);

// Open it and report an error
app.use(pinia);

app.mount("#app");
