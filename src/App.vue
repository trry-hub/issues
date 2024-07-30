<script setup lang="ts">
import { ref } from 'vue'
const active = ref('')
</script>

<template>
  <RouterView />
  <van-tabbar fixed v-model="active">
    <van-tabbar-item replace to="/" icon="home-o">home</van-tabbar-item>
    <van-tabbar-item replace to="/test" icon="search">test</van-tabbar-item>
    <van-tabbar-item icon="friends-o">标签</van-tabbar-item>
    <van-tabbar-item icon="setting-o">标签</van-tabbar-item>
  </van-tabbar>
</template>