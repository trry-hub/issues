<template>
  <div class="simple-face-demo">
    <h1>Simple Face Landmark Detection</h1>
    
    <div class="demo-section">
      <h2>Real-time Face Landmark Detection</h2>
      <p>Hold your face in front of your webcam to get real-time face landmark detection.</p>
      <p v-if="isMobile" class="mobile-tip">📱 移动端提示：请确保摄像头权限已开启，并保持设备稳定</p>
      
      <div class="video-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载人脸检测模型...</p>
          <p class="loading-tip">首次加载可能需要一些时间，请耐心等待</p>
        </div>
        
        <div v-else-if="loadError" class="error-state">
          <p class="error-message">❌ {{ loadError }}</p>
          <button @click="retryLoading" class="retry-button">
            重试加载
          </button>
          <p class="error-tip">如果问题持续存在，请检查网络连接或刷新页面</p>
          
          <!-- 调试信息 -->
          <details class="debug-info">
            <summary>调试信息</summary>
            <div class="debug-content">
              <p><strong>设备信息:</strong></p>
              <ul>
                <li>User Agent: {{ deviceInfo.userAgent }}</li>
                <li>Platform: {{ deviceInfo.platform }}</li>
                <li>移动设备: {{ deviceInfo.isMobile ? '是' : '否' }}</li>
                <li>网络类型: {{ deviceInfo.networkType }}</li>
              </ul>
            </div>
          </details>
        </div>
        
        <div v-else>
          <button 
            @click="toggleWebcam" 
            class="webcam-button"
            :class="{ 'active': webcamRunning }"
          >
            {{ webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM' }}
          </button>
          
          <div class="controls">
            <label class="mirror-toggle">
              <input 
                type="checkbox" 
                v-model="isMirrored"
                :disabled="!webcamRunning"
              >
              <span class="toggle-label">镜像显示</span>
            </label>
          </div>
          
          <div class="video-wrapper">
            <video 
              ref="videoElement" 
              autoplay 
              playsinline
              :style="{ transform: isMirrored ? 'scaleX(-1)' : 'none' }"
            ></video>
            <canvas 
              ref="canvasElement" 
              class="output-canvas"
            ></canvas>
          </div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

// Refs
const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()
const webcamRunning = ref(false)
const blendShapes = ref<any[]>([])
const isMobile = ref(false)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isMirrored = ref(true) // 默认开启镜像

// Computed properties
const deviceInfo = computed(() => ({
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
  platform: typeof window !== 'undefined' ? window.navigator.platform : '',
  isMobile: isMobile.value,
  networkType: typeof window !== 'undefined' ? (window.navigator as any).connection?.effectiveType || '未知' : '未知'
}))

// Face landmarker instance
let faceLandmarker: any = null
let drawingUtils: any = null
let lastVideoTime = -1
let results: any = undefined

const videoWidth = ref(300)

// Initialize face landmarker
async function createFaceLandmarker() {
  isLoading.value = true
  loadError.value = null
  
  try {
    console.log('开始加载 Face Landmarker...')
    console.log('设备信息:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: isMobile.value,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    })
    
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    )
    
    console.log('FilesetResolver 创建成功，开始创建 FaceLandmarker...')
    
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    })
    
    console.log('Face landmarker loaded successfully')
    isLoading.value = false
  } catch (error) {
    console.error('Error loading face landmarker:', error)
    console.error('错误详情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    loadError.value = `加载失败: ${error instanceof Error ? error.message : String(error)}`
    isLoading.value = false
    
    // 在移动设备上，可能是网络问题，提供重试选项
    if (isMobile.value) {
      console.log('移动设备加载失败，可能是网络问题')
    }
  }
}

// Retry loading
async function retryLoading() {
  console.log('重试加载 Face Landmarker...')
  await createFaceLandmarker()
}

// Try loading with CPU fallback
async function createFaceLandmarkerWithFallback() {
  isLoading.value = true
  loadError.value = null
  
  try {
    console.log('开始加载 Face Landmarker (GPU)...')
    
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    )
    
    // 首先尝试GPU
    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      })
      console.log('Face landmarker loaded successfully with GPU')
    } catch (gpuError) {
      console.warn('GPU加载失败，尝试使用CPU:', gpuError)
      
      // 如果GPU失败，尝试CPU
      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "CPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      })
      console.log('Face landmarker loaded successfully with CPU')
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading face landmarker:', error)
    console.error('错误详情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    loadError.value = `加载失败: ${error instanceof Error ? error.message : String(error)}`
    isLoading.value = false
    
    // 在移动设备上，可能是网络问题，提供重试选项
    if (isMobile.value) {
      console.log('移动设备加载失败，可能是网络问题')
    }
  }
}

// Check if webcam is supported
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Toggle webcam
async function toggleWebcam() {
  if (!faceLandmarker) {
    if (isLoading.value) {
      console.log("Face landmarker is still loading...")
      return
    }
    if (loadError.value) {
      console.log("Face landmarker failed to load:", loadError.value)
      return
    }
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
    console.log('Canvas style transform:', canvas.style.transform)
    console.log('Video style transform:', video.style.transform)
  }

  let startTimeMs = performance.now()
  
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = faceLandmarker.detectForVideo(video, startTimeMs)
    console.log('检测结果:', results ? '有结果' : '无结果')
  }

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (results?.faceLandmarks) {
    console.log('检测到人脸关键点:', results.faceLandmarks.length, '个')
    
    // 如果开启镜像，在Canvas上应用变换
    if (isMirrored.value) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)
    }
    
    for (const landmarks of results.faceLandmarks) {
      // 直接使用原始坐标，因为Canvas变换会处理镜像
      const adjustedLandmarks = landmarks

      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      )
      drawingUtils.drawConnectors(
        adjustedLandmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      )
    }
    
    // 恢复Canvas变换
    if (isMirrored.value) {
      ctx.restore()
    }
  } else {
    console.log('未检测到人脸关键点')
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

// 检测网络状态
const checkNetworkStatus = () => {
  const connection = (navigator as any).connection
  if (connection) {
    console.log('网络连接信息:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    })
  } else {
    console.log('无法获取网络连接信息')
  }
}

// Lifecycle
onMounted(async () => {
  detectMobile()
  checkNetworkStatus()
  await createFaceLandmarkerWithFallback()
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

.loading-state, .error-state {
  text-align: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007f8b;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-tip, .error-tip {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.error-message {
  color: #d32f2f;
  font-size: 16px;
  margin-bottom: 15px;
}

.retry-button {
  background: #007f8b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background: #005a63;
}

.controls {
  margin-bottom: 15px;
  text-align: center;
}

.mirror-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: all 0.3s;
}

.mirror-toggle:hover {
  background: #e8e8e8;
}

.mirror-toggle input[type="checkbox"] {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

.mirror-toggle input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-label {
  font-size: 14px;
  color: #333;
}

.mirror-toggle:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-info {
  margin-top: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.debug-info summary {
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
  color: #666;
}

.debug-info summary:hover {
  background: #f0f0f0;
}

.debug-content {
  padding: 10px;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #666;
}

.debug-content ul {
  margin: 5px 0;
  padding-left: 20px;
}

.debug-content li {
  margin-bottom: 3px;
  word-break: break-all;
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