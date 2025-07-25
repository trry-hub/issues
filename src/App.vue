<script setup lang="ts">
import eruda from 'eruda'
import { useRouter } from 'vue-router'

const router = useRouter()

eruda.init()
</script>

<template>
  <div>
    <div class="button-group">
      <router-link to="/page1">page1</router-link>
      <router-link to="/page2">page2</router-link>
      <router-link to="/page3">page3</router-link>
      <router-link to="/mediapipe-face-demo">mediapipe-face-demo</router-link>
    </div>
    <hr>
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped lang="scss">
.button-group {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
/* 主内容区动画 */
.fade-enter-active,
.slide-left-enter-active,
.slide-right-enter-active,
.slide-top-enter-active,
.slide-bottom-enter-active {
  transition: 0.2s;
}

.fade-leave-active,
.slide-left-leave-active,
.slide-right-leave-active,
.slide-top-leave-active,
.slide-bottom-leave-active {
  transition: 0.15s;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
}
</style>
