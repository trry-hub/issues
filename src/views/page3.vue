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
import * as FaceDetectionModule from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';
import { drawRectangle, drawLandmarks } from '@mediapipe/drawing_utils';

const video = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const error = ref('');
let camera: Camera | null = null;
let faceDetection: any = null;

function drawResults(results: any) {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  if (results.detections && results.detections.length > 0) {
    for (const detection of results.detections) {
      drawRectangle(ctx, detection.boundingBox, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(ctx, detection.landmarks, { color: '#FF0000', radius: 2 });
    }
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    faceDetection = new FaceDetectionModule.FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });
    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });
    faceDetection.onResults(drawResults);

    if (video.value) {
      camera = new Camera(video.value, {
        onFrame: async () => {
          if (faceDetection && video.value) {
            await faceDetection.send({ image: video.value });
          }
        },
        width: 480,
        height: 360
      });
      await camera.start();
    }
    loading.value = false;
  } catch (e) {
    error.value = '初始化失败: ' + (e as Error).message;
  }
});

onBeforeUnmount(() => {
  if (camera) camera.stop();
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