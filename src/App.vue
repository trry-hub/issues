<script setup lang="ts">
import { onMounted, ref } from 'vue';

const count = ref(0)
onMounted(() => {
  console.log(count.value)
})
</script>

<template>
  <div>
    <p>这是第一行内容</p>
    <div class="container">
      123
    </div>
    <span>这是最后一行内容</span>
  </div>
</template>

<style scoped>
.container {
  height: 10vh;
  background-color: #ff6700;
  position: sticky;
  bottom: 0;
}
</style>