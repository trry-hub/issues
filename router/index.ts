import { createRouter, createWebHistory } from 'vue-router'

const history = createWebHistory()
const router = createRouter({
  history,
  routes: [{
    path: '/components',
    name: 'components',
    component: () => import('@/views/components.vue'),
  }, {
    path: '/hooks',
    name: 'hooks',
    component: () => import('@/views/hooks.vue'),
  }, {
    path: '/directives',
    name: 'directives',
    component: () => import('@/views/directives.vue'),
  }, {
    path: '/utils',
    name: 'utils',
    component: () => import('@/views/utils.vue'),
  },],
})

export default router
