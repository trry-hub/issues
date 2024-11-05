<script lang="ts" setup>
import { vWaves,vCopy } from "qxs-bns/directives";
import 'qxs-bns/directives/style.css'

</script>
<template>
  <div>
    <div v-waves class="block">page1</div>
    <button v-waves>水波纹按钮</button>
    <hr/>

    <button v-copy="'hello world'" >复制文本</button>
  </div>
</template>

<style lang="scss" scoped>
.block {
  width: 100px;
  height: 100px;
  text-align: center;
  border: 1px solid #ccc;
  display: inline-block;
}

button {
  padding: 10px;

}
</style>
