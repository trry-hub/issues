<script setup lang="ts">
// import QxsDesign from '../../business-vue3/dist'
import { onMounted, ref } from 'vue';
// import { ElButton } from 'element-plus'
// import { QxsFixedActionBar } from "business-vue3";
// import 'business-vue3/es/base.css'
// import 'business-vue3/es/fixed-action-bar.css'
// console.log('QxsBusiness: ', QxsFixedActionBar)

const count = ref(0)
onMounted(() => {
  console.log(count.value)
})
</script>

<template>
  <div>
    <div class="container">
      <qxs-rich-editor></qxs-rich-editor>
    </div>
    <qxs-fixed-action-bar>test</qxs-fixed-action-bar>
  </div>
</template>

<style scoped>
.container {
  height: 100vh;
  background-color: #ff6700;
}
</style>