<template>
  <div class="flex flex-col items-center justify-center">
    <h2>人脸检测 Demo (MediaPipe FaceMesh)</h2>
    <div class="video-container" ref="videoContainer" :style="{ height: videoSize.height + 'px' }">
      <video ref="video" autoplay playsinline :width="videoSize.width" :height="videoSize.height"></video>
      <canvas ref="canvas" :width="videoSize.width" :height="videoSize.height"></canvas>
    </div>
    <div v-if="loading">模型加载中...</div>
    <div v-if="error" style="color:red;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref,useTemplateRef,nextTick, onMounted, onBeforeUnmount } from 'vue';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

const video = useTemplateRef<HTMLVideoElement>('video');
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const videoContainer = useTemplateRef<HTMLDivElement>('videoContainer');
const loading = ref(true);
const error = ref('');
let stream: MediaStream | null = null;
let model: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let detectInterval: number | null = null;
const videoSize = ref({ width: 350, height: 360 });

async function startVideo() {
  if (!videoContainer.value) return;
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: videoSize.value.width, height: videoSize.value.height } });
  video.value && (video.value.srcObject = stream);
}

function drawResults(faces: faceLandmarksDetection.Face[]) {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  faces.forEach(face => {
    if (face.box) {
      const { xMin, yMin, xMax, yMax } = face.box;
      ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
    }
    face.keypoints.forEach((kp: faceLandmarksDetection.Keypoint) => {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
    });
  });
}

let detecting = false;
async function detectFace() {
  if (detecting) return;
  detecting = true;
  if (!video.value || !model) {
    detecting = false;
    return;
  }
  const faces = await model.estimateFaces(video.value);
  drawResults(faces);
  detecting = false;
}

async function loadModel() {
  model = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    { runtime: 'tfjs', refineLandmarks: true }
  );
}

let rafId: number | null = null;

function loop() {
  detectFace();
  rafId = requestAnimationFrame(loop);
}

onMounted(async () => {
  loading.value = true;
  try {
    await nextTick();
    await startVideo();
    await loadModel();
    loop(); // 启动检测循环
    loading.value = false;
  } catch (e: any) {
    error.value = '初始化失败: ' + (e?.message || e);
  }
});

onBeforeUnmount(() => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<style scoped lang="scss">
.video-container {
  width: 100%;
  // aspect-ratio: 16/9;
  max-width: 800px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  video,
  canvas {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>