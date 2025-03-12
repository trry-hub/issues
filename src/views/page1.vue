<script setup>
import { pajax } from "@/utils/ajax.js";
import api from "@/utils/api";

const params = {
  itemId: 'ff80808183cad75001840881f848179f',
  isSenior: "N",
  searchValue: "齐鲁",
  pageNum: 1,
  pageSize: 10,
};
console.log(pajax)
pajax.get(api.queryList, params).then((res) => {
  console.log(res);
});
</script>
<template>
  <div>page1</div>
</template>
