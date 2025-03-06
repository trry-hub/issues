<script setup lang="ts">
import { json } from "./videojson.js";
import { excelToJson } from "@qxs-bns/utils";
console.log("excelToJson: ", excelToJson);

const handleClick = (item: any) => {
  window.open(item.video_url, "_blank");
};
</script>

<template>
  <div class="video-list">
    <div v-for="item in json" :key="item.video_id">
      <video @click="handleClick(item)" :src="`${item.video_url}#t=3`"></video>
      {{ item.video_id }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.video-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  video {
    width: 200px;
    height: 200px;
  }
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
