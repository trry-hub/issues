<template>
  <div class="video-container">
    <video ref="video" autoplay playsinline width="320" height="240" style="border:1px solid #ccc"></video>
    <canvas ref="canvas" width="320" height="240" style="position:absolute;left:0;top:0;"></canvas>
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
        facingMode: 'user'
      }
    })
    video.value!.srcObject = stream
    video.value!.onloadedmetadata = () => {
      video.value!.play()
      console.log(`🚀 ~ video.value:`, video.value)
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
  // console.log(`🚀 ~ renderLoop ~ results:`, results.faceLandmarks)
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  if (results.faceLandmarks) {
    const drawingUtils = new DrawingUtils(ctx)
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#0FF', lineWidth: 1 })
      drawingUtils.drawLandmarks(landmarks, { color: '#3D60E3', radius: 1 })
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
  width: 320px;
  height: 240px;
}
</style>