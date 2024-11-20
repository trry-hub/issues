<!-- 
 复现步骤：
  1. 测试的注释移到跟标签同级，transition 会渲染失败
  2. 测试的标签移到跟标签下，transition 会渲染失败，仅仅提示了 warning 警告
 预期：
  1. 测试的注释移到跟标签同级，transition 正常渲染非注释外的内容
  2. 测试的标签移到跟标签下，transition 渲染失败，但提示 error 级别警告
-->
<script lang="ts" setup>
import { QxsImageUpload } from '@qxs-bns/components'
// import Component from '@playground/src/views/components.vue'
</script>

<template>
  <div>
    <QxsImageUpload action="https://qxs-bns.oss-cn-beijing.aliyuncs.com/qxs-bns/image/upload" />
    <!-- 测试的注释 -->
    <div>测试的标签</div>
    <div>page2</div>
  </div>
</template>