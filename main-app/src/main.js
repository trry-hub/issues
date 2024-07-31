import Vue from 'vue'
import router from './router'
import App from './App.vue'
import './utils/micro-app'
Vue.config.ignoredElements = ['micro-app']

Vue.config.productionTip = false


new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
