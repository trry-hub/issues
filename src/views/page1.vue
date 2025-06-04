<script setup lang="ts">
import PDFViewer from './components/PDFViewer'


</script>

<template>
  <div v-waves class="block">
    <PDFViewer :url="pdfUrl" />
  </div>
</template>

<style scoped lang="scss">
.block {
  padding: 20px;
  border: 1px solid #ccc;
}
</style>
