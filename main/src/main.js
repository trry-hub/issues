import Vue from 'vue'
import App from './App.vue'

import microApp from '@micro-zoe/micro-app'
microApp.start()

Vue.config.ignoredElements = ['micro-app']

Vue.config.productionTip = false
export default new Vue({
  render: h => h(App)
}).$mount('#app')
