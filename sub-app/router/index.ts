import { createRouter, createWebHistory } from 'vue-router'

let routerBase = window.__MICRO_APP_BASE_ROUTE__
console.log('routerBase: ', routerBase)
const history = createWebHistory(routerBase)
const router = createRouter({
  history,
  routes: [{
    path: '/page1',
    name: 'page1',
    component: () => import('@/views/page1.vue'),
  }, {
    path: '/page2',
    name: 'page2',
    component: () => import('@/views/page2.vue'),
  }],
})

export default router
export {router, history}