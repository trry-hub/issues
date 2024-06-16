<script setup lang="ts">
import { onMounted, ref } from 'vue';

const count = ref(0)
onMounted(() => {
  console.log(count.value)
})
</script>

<template>
  <div>
    <div>name</div>
    <!-- test -->
    <div>page2:{{ count }}</div>
  </div>
</template>

<style lang="scss" scoped></style>