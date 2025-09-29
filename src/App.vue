<script setup lang="ts">
import { reactive } from 'vue'

const data = reactive({
  angle: 0
})
</script>

<template>
  <div class="app">
    <div class="demo">
      <div class="demo-content">
        旋转流光
      </div>
    </div>

    <div class="demo2">
      <div class="demo2-content">
        平移流光
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --outer-radius: 0.5rem;
  --border-size: 5px;
}
</style>
<style scoped lang="scss">
.app {
  background-color: black;
}


@property --border-gradient-angle {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0turn;
}

.demo {
  background-image: conic-gradient(from var(--border-gradient-angle) at 50% 50%, transparent, #70ffaf 14%, transparent 17%);
  border-radius: var(--outer-radius);
  background-size: contain;
  padding: var(--border-size);
  animation: button-order-spin 9s linear infinite 0ms;
  width: 300px;
  height: 200px;
}

@keyframes button-order-spin {
  0% {
    --border-gradient-angle: 0turn;
  }

  100% {
    --border-gradient-angle: 1turn;
  }
}

.demo-content {
  width: 100%;
  height: 100%;
  background-color: black;
  color: aliceblue;
  text-align: center;
  line-height: 200px;
  font-size: 32px;
  font-family: Georgia, 'Times New Roman', Times, serif;
  border-radius: var(--outer-radius);
}

/* ----------------------------------- */

.demo2 {
  margin-top: 10px;
  height: 50px;
  width: 300px;
  background-image: conic-gradient(from var(--border-gradient-angle) at 30% -30%, transparent 25%, #70ffaf 75%, transparent);
  animation: badgeBorderSpin 10s linear infinite;
  border-radius: var(--outer-radius);
  padding: var(--border-size);
}

@keyframes badgeBorderSpin {
  0% {
    --border-gradient-angle: 0turn;
  }

  100% {
    --border-gradient-angle: -1turn;
  }
}

.demo2-content {
  width: 100%;
  height: 100%;
  background-color: black;
  color: aliceblue;
  text-align: center;
  font-size: 32px;
  font-family: Georgia, 'Times New Roman', Times, serif;
  border-radius: var(--outer-radius);
}
</style>
