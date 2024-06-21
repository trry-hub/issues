<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div>
    <button class="button" @click="router.push({ name: 'page1' })">page1</button>
    <button class="button" @click="router.push({ name: 'page2' })">page2</button>
    <hr>
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.button {
  height: 2em;
  will-change: filter;
  margin-right: 10px;
  transition: filter 300ms;
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
