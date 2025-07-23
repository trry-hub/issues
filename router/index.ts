import { createRouter, createWebHistory } from 'vue-router'

const history = createWebHistory()
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
  }, {
    path: '/page3',
    name: 'page3',
    component: () => import('@/views/page3.vue'),
  }],
})

export default router
