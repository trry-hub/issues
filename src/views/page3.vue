<template>
  <div>
    <h2>人脸检测 Demo (MediaPipe)</h2>
    <video ref="video" autoplay playsinline width="480" height="360" style="border:1px solid #ccc;"></video>
    <canvas ref="canvas" width="480" height="360" style="position:absolute;left:0;top:0;"></canvas>
    <div v-if="loading">模型加载中...</div>
    <div v-if="error" style="color:red;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

const video = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const error = ref('');
let stream: MediaStream | null = null;
let model: blazeface.BlazeFaceModel | null = null;
let detectInterval: number | null = null;

async function startVideo() {
  if (!video.value) return;
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
  video.value.srcObject = stream;
}

function drawResults(predictions: blazeface.NormalizedFace[]) {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  for (const prediction of predictions) {
    let topLeft: [number, number];
    let bottomRight: [number, number];
    if (Array.isArray(prediction.topLeft)) {
      topLeft = prediction.topLeft as [number, number];
    } else if (prediction.topLeft && typeof prediction.topLeft.arraySync === 'function') {
      const arr = prediction.topLeft.arraySync();
      topLeft = [arr[0], arr[1]];
    } else {
      continue;
    }
    if (Array.isArray(prediction.bottomRight)) {
      bottomRight = prediction.bottomRight as [number, number];
    } else if (prediction.bottomRight && typeof prediction.bottomRight.arraySync === 'function') {
      const arr = prediction.bottomRight.arraySync();
      bottomRight = [arr[0], arr[1]];
    } else {
      continue;
    }
    const [x, y] = topLeft;
    const [w, h] = bottomRight;
    ctx.strokeRect(x, y, w - x, h - y);
    // 绘制关键点
    if (prediction.landmarks) {
      ctx.fillStyle = '#FF0000';
      for (const [lx, ly] of prediction.landmarks as [number, number][]) {
        ctx.beginPath();
        ctx.arc(lx, ly, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

async function detectFace() {
  if (!video.value || !model) return;
  const predictions = await model.estimateFaces(video.value, false);
  drawResults(predictions);
}

onMounted(async () => {
  loading.value = true;
  try {
    await startVideo();
    model = await blazeface.load();
    detectInterval = window.setInterval(detectFace, 100);
    loading.value = false;
  } catch (e: any) {
    error.value = '初始化失败: ' + e.message;
  }
});

onBeforeUnmount(() => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (detectInterval) {
    clearInterval(detectInterval);
  }
});
</script>

<style scoped>
div {
  position: relative;
  width: 480px;
  height: 360px;
}
video, canvas {
  position: absolute;
  left: 0;
  top: 0;
}
</style> 