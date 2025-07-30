import { createRouter, createWebHistory } from 'vue-router'

const history = createWebHistory()
const router = createRouter({
  history,
  routes: [ 
    {
      path: '/',
      name: 'index',
      component: () => import('@/views/page3.vue'),
    }, {
      path: '/page3',
      name: 'page3',
      component: () => import('@/views/page3.vue'),
    }, {
      path: '/page3-copy',
      component: () => import('@/views/page3-copy.vue')
    }, { 
      path: '/mediapipe-face-demo',
      component: () => import('@/views/mediapipe/face-demo.vue') 
    }, {
      path: '/simple-face-demo',
      component: () => import('@/views/mediapipe/simple-face-demo.vue')
    }
  ],
})

export default router
