<template>
  <div class="video-container" :style="{ width: width + 'px', height: height + 'px' }">
    <video ref="video" autoplay playsinline style="border:1px solid #ccc"></video>
    <canvas ref="canvas" style="position:absolute;left:0;top:0;"></canvas>
    <div v-if="error" style="color:red;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')
let faceLandmarker: FaceLandmarker | null = null
let stream: MediaStream | null = null
let running = true
const width = 320
const height = 240

onMounted(async () => {
  try {
    // 加载模型
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-assets/face_landmarker.task'
      },
      runningMode: 'VIDEO',
      numFaces: 1
    })

    // 获取摄像头
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        facingMode: 'user',
        // width,
        // height
      },
      audio: false
    })
    video.value!.srcObject = stream
    video.value!.onloadedmetadata = () => {
      video.value!.play()
      console.log(`🚀 ~ video.value:`, video.value?.videoWidth, video.value?.videoHeight)
      renderLoop()
    }
  } catch (e: any) {
    error.value = e?.message || '初始化失败'
  }
})

async function renderLoop() {
  if (!video.value || !canvas.value || !faceLandmarker || !running) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // 检测人脸
  const results = faceLandmarker.detectForVideo(video.value, performance.now())
  ctx.clearRect(0, 0, width, height)
  if (results.faceLandmarks) {
    const drawingUtils = new DrawingUtils(ctx)
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#0FF', lineWidth: 0.2 })
      drawingUtils.drawLandmarks(landmarks, { color: '#3D60E3', radius: 0.2 })
    }
  }
  requestAnimationFrame(renderLoop)
}

onBeforeUnmount(() => {
  running = false
  if (stream) stream.getTracks().forEach(track => track.stop())
})
</script> 

<style lang="scss" scoped>
.video-container {
  position: relative;
  video, canvas {
    width: 100%;
    height: 100%;
  }
}
</style>