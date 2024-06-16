<script setup lang="ts">
import { onMounted, ref } from 'vue';

const count = ref(0)
onMounted(() => {
  console.log(count.value)
})
</script>

<template>
  <div>page1:{{ count }}</div>
</template>

<style lang="scss" scoped>

</style>