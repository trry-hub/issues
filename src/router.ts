import { createRouter, createWebHistory } from 'vue-router'

const routes = [{
  path: '/',
  name: 'home',
  component: () => import('@/views/video.vue')
},{
  path: '/test',
  name: 'test',
  component: () => import('@/views/test.vue')
}]


const router = createRouter({
  history: createWebHistory(),
  routes
})

export {
  routes
}

export default router

