import { createRouter, createWebHashHistory } from 'vue-router'

const history = createWebHashHistory()
const router = createRouter({
  history,
  routes: [ {
    path: '/',
    name: 'index',
    component: () => import('@/views/page3.vue'),
  },{
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
