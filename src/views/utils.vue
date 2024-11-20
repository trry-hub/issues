<script lang="ts" setup>
import { watermark } from "@qxs-bns/utils";
import { onMounted } from "vue";
const init = watermark()
onMounted(() => {
  init.addMark({
    text: "qxs-bns111",
    y_space: 80,
    parent_node: document.getElementById("watermark"),
  });
});
</script>
<template>
  <div>
    <div id="watermark">
      watermark
    </div>
  </div>
</template>

<style lang="scss" scoped>
#watermark {
  height: 300px;
  text-align: center;
  line-height: 100px;
  border: 1px solid #ccc;
}
</style>
