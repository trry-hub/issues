import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'history',
  routes: [{
    path: '/',
    name: 'home',
    redirect: '/page1'
  }, {
    path: '/page1',
    name: 'page1',
    component: () => import('../views/page1.vue')
  }, {
    path: '/page2',
    name: 'page2',
    component: () => import('../views/page2.vue')
  }, {
    path: '/sub-app/*',
    name: 'micro-app',
    component: () => import('../views/micro-app.vue'),
  }],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

export default router