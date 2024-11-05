<script lang="ts" setup>
import { vWaves } from "qxs-bns/directives";
import 'qxs-bns/directives/style.css'
import { watermark } from "qxs-bns/utils";
import { onMounted } from "vue";
const init = watermark()
onMounted(() => {
  console.log("vWaves: ", vWaves);
  init.addMark({
    text: "qxs-bns111",
    parent_node: document.getElementById("page1"),
  });
});
</script>
<template>
  <div id="page1">
    <div v-waves class="block">page1</div>

    <button v-waves>test button</button>
  </div>
</template>

<style lang="scss" scoped>
.block {
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
  border: 1px solid #ccc;
}
</style>
