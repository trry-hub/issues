<template>
  <div class="simple-face-demo">
    <h1>Simple Face Landmark Detection</h1>
    
    <div class="demo-section">
      <h2>Real-time Face Landmark Detection</h2>
      <p>Hold your face in front of your webcam to get real-time face landmark detection.</p>
      <p v-if="isMobile" class="mobile-tip">📱 移动端提示：请确保摄像头权限已开启，并保持设备稳定</p>
      
      <div class="video-container">
        <button 
          @click="toggleWebcam" 
          class="webcam-button"
          :class="{ 'active': webcamRunning }"
        >
          {{ webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM' }}
        </button>
        
        <div class="video-wrapper">
          <video 
            ref="videoElement" 
            autoplay 
            playsinline
          ></video>
          <canvas 
            ref="canvasElement" 
            class="output-canvas"
          ></canvas>
        </div>
      </div>
      
      <div class="blend-shapes" v-if="blendShapes.length > 0">
        <h3>Face Blend Shapes</h3>
        <ul class="blend-shapes-list">
          <li 
            v-for="shape in blendShapes" 
            :key="shape.categoryName"
            class="blend-shapes-item"
          >
            <span class="blend-shapes-label">
              {{ shape.displayName || shape.categoryName }}
            </span>
            <span 
              class="blend-shapes-value" 
              :style="{ width: `calc(${shape.score * 100}% - 120px)` }"
            >
              {{ shape.score.toFixed(4) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

// Refs
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()
const webcamRunning = ref(false)
const blendShapes = ref<any[]>([])
const isMobile = ref(false)

// Face landmarker instance
let faceLandmarker: any = null
let drawingUtils: any = null
let lastVideoTime = -1
let results: any = undefined

const videoWidth = ref(300)

// Initialize face landmarker
async function createFaceLandmarker() {
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    )
    
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    })
    
    console.log('Face landmarker loaded successfully')
  } catch (error) {
    console.error('Error loading face landmarker:', error)
  }
}

// Check if webcam is supported
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Toggle webcam
async function toggleWebcam() {
  if (!faceLandmarker) {
    console.log("Wait! Face landmarker not loaded yet.")
    return
  }

  if (webcamRunning.value) {
    webcamRunning.value = false
  } else {
    webcamRunning.value = true
    await enableCam()
  }
}

// Enable webcam
async function enableCam() {
  if (!hasGetUserMedia()) {
    console.warn("getUserMedia() is not supported by your browser")
    return
  }

  const constraints = {
    video: {
      facingMode: 'user', // 优先使用前置摄像头
      // 移除固定分辨率设置，让浏览器使用默认分辨率
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      // 等待视频元数据加载完成后再开始检测
      videoElement.value.addEventListener("loadedmetadata", () => {
        console.log('Video loaded with dimensions:', videoElement.value?.videoWidth, 'x', videoElement.value?.videoHeight)
        predictWebcam()
      })
    }
  } catch (error) {
    console.error('Error accessing webcam:', error)
  }
}

// Predict webcam
async function predictWebcam() {
  if (!videoElement.value || !canvasElement.value || !faceLandmarker) return

  const video = videoElement.value
  const canvas = canvasElement.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return
  
  drawingUtils = new DrawingUtils(ctx)

  // 确保 canvas 尺寸与视频的实际尺寸完全匹配
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // 设置显示尺寸
  const radio = video.videoHeight / video.videoWidth
  const currentVideoWidth = videoWidth.value
  video.style.width = currentVideoWidth + "px"
  video.style.height = currentVideoWidth * radio + "px"
  canvas.style.width = currentVideoWidth + "px"
  canvas.style.height = currentVideoWidth * radio + "px"
  
  // 调试信息（可选）
  if (process.env.NODE_ENV === 'development') {
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight)
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
    console.log('Display dimensions:', currentVideoWidth, 'x', currentVideoWidth * radio)
  }

  let startTimeMs = performance.now()
  
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = faceLandmarker.detectForVideo(video, startTimeMs)
  }

  if (results?.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      )
    }
  }

  // Update blend shapes
  if (results?.faceBlendshapes && results.faceBlendshapes.length > 0) {
    blendShapes.value = results.faceBlendshapes[0].categories
  }

  // Continue prediction if webcam is running
  if (webcamRunning.value) {
    window.requestAnimationFrame(predictWebcam)
  }
}

// 检测移动设备
const detectMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

// Lifecycle
onMounted(async () => {
  detectMobile()
  await createFaceLandmarker()
})

onUnmounted(() => {
  webcamRunning.value = false
})
</script>

<style scoped>
.simple-face-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #007f8b;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #333;
  margin-bottom: 15px;
}

.demo-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.video-container {
  text-align: center;
  margin-bottom: 20px;
}

.webcam-button {
  background: #007f8b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  transition: background-color 0.3s;
}

.webcam-button:hover {
  background: #005a63;
}

.webcam-button.active {
  background: #d32f2f;
}

.webcam-button.active:hover {
  background: #b71c1c;
}

.video-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 auto;
}
.output-canvas {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.blend-shapes {
  margin-top: 20px;
}

.blend-shapes h3 {
  margin-bottom: 10px;
  color: #333;
}

.blend-shapes-list {
  list-style: none;
  padding: 10px;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border-radius: 4px;
}

.blend-shapes-item {
  display: flex;
  align-items: center;
  height: 20px;
  margin-bottom: 5px;
}

.blend-shapes-label {
  display: flex;
  width: 120px;
  justify-content: flex-end;
  align-items: center;
  margin-right: 4px;
  font-size: 12px;
  color: #666;
}

.blend-shapes-value {
  display: flex;
  height: 16px;
  align-items: center;
  background-color: #007f8b;
  color: white;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 2px;
  min-width: 40px;
  justify-content: center;
}

.mobile-tip {
  background: #e3f2fd;
  color: #1976d2;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
}
</style>