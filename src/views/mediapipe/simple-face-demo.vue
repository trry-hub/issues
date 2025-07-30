<template>
  <div class="simple-face-demo">
    <h1>简单人脸关键点检测</h1>
    
    <div class="demo-section">
      <h2>实时人脸关键点检测</h2>
      <p>将您的脸部对准摄像头，即可获得实时人脸关键点检测。</p>
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
                <li>用户代理: {{ deviceInfo.userAgent }}</li>
                <li>平台: {{ deviceInfo.platform }}</li>
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
            {{ webcamRunning ? '关闭摄像头' : '开启摄像头' }}
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
        <h3>面部表情参数</h3>
        <ul class="blend-shapes-list">
          <li 
            v-for="shape in blendShapes" 
            :key="shape.categoryName"
            class="blend-shapes-item"
          >
            <span class="blend-shapes-label">
              {{ getBlendShapeDisplayName(shape.categoryName) }}
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

const videoWidth = ref(280)

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
      connection: (navigator as any).connection?.effectiveType || '未知'
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
    
    console.log('人脸关键点检测器加载成功 (GPU)')
    isLoading.value = false
  } catch (error) {
    console.error('加载人脸关键点检测器时出错:', error)
    console.error('错误详情:', {
      name: error instanceof Error ? error.name : '未知',
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
      name: error instanceof Error ? error.name : '未知',
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
      console.log("人脸关键点检测器正在加载中...")
      return
    }
    if (loadError.value) {
      console.log("人脸关键点检测器加载失败:", loadError.value)
      return
    }
    console.log("请等待！人脸关键点检测器尚未加载完成。")
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
    console.warn("您的浏览器不支持 getUserMedia()")
    return
  }

  const constraints = {
    video: {
      facingMode: 'user', // 优先使用前置摄像头
      // 移除固定分辨率设置，让浏览器使用默认分辨率
      width: { ideal: videoWidth.value },
      height: { ideal: videoWidth.value },
    },
    audio: false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      // 等待视频元数据加载完成后再开始检测
      videoElement.value.addEventListener("loadedmetadata", () => {
        console.log('视频加载完成，尺寸:', videoElement.value?.videoWidth, 'x', videoElement.value?.videoHeight)
        predictWebcam()
      })
    }
  } catch (error) {
    console.error('访问摄像头时出错:', error)
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
    console.log('视频尺寸:', video.videoWidth, 'x', video.videoHeight)
    console.log('画布尺寸:', canvas.width, 'x', canvas.height)
    console.log('显示尺寸:', currentVideoWidth, 'x', currentVideoWidth * radio)
    console.log('画布样式变换:', canvas.style.transform)
    console.log('视频样式变换:', video.style.transform)
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

// 获取面部表情参数的中文显示名称
const getBlendShapeDisplayName = (categoryName: string): string => {
  const nameMap: { [key: string]: string } = {
    // 眼睛相关
    'eyeBlinkLeft': '左眼眨眼',
    'eyeBlinkRight': '右眼眨眼',
    'eyeLookDownLeft': '左眼向下看',
    'eyeLookDownRight': '右眼向下看',
    'eyeLookInLeft': '左眼向内看',
    'eyeLookInRight': '右眼向内看',
    'eyeLookOutLeft': '左眼向外看',
    'eyeLookOutRight': '右眼向外看',
    'eyeLookUpLeft': '左眼向上看',
    'eyeLookUpRight': '右眼向上看',
    'eyeSquintLeft': '左眼眯眼',
    'eyeSquintRight': '右眼眯眼',
    'eyeWideLeft': '左眼睁大',
    'eyeWideRight': '右眼睁大',
    
    // 嘴巴相关
    'mouthClose': '闭嘴',
    'mouthFrown': '嘴角下垂',
    'mouthFunnel': '撅嘴',
    'mouthLeft': '嘴向左',
    'mouthLowerDownLeft': '左下唇下垂',
    'mouthLowerDownRight': '右下唇下垂',
    'mouthPressLeft': '左唇压紧',
    'mouthPressRight': '右唇压紧',
    'mouthPucker': '撅嘴',
    'mouthRight': '嘴向右',
    'mouthRollLower': '下唇卷起',
    'mouthRollUpper': '上唇卷起',
    'mouthShrugLower': '下唇耸肩',
    'mouthShrugUpper': '上唇耸肩',
    'mouthSmile': '微笑',
    'mouthStretchLeft': '左嘴拉伸',
    'mouthStretchRight': '右嘴拉伸',
    'mouthUpperUpLeft': '左上唇上扬',
    'mouthUpperUpRight': '右上唇上扬',
    
    // 鼻子相关
    'noseSneerLeft': '左鼻翼收缩',
    'noseSneerRight': '右鼻翼收缩',
    
    // 脸颊相关
    'cheekPuff': '脸颊鼓起',
    'cheekSquintLeft': '左脸颊收缩',
    'cheekSquintRight': '右脸颊收缩',
    
    // 下巴相关
    'jawForward': '下巴前伸',
    'jawLeft': '下巴向左',
    'jawOpen': '张嘴',
    'jawRight': '下巴向右',
    
    // 舌头相关
    'tongueOut': '伸舌头',
    
    // 眉毛相关
    'browDownLeft': '左眉下垂',
    'browDownRight': '右眉下垂',
    'browInnerUp': '眉毛内扬',
    'browOuterUpLeft': '左眉外扬',
    'browOuterUpRight': '右眉外扬',
    
    // 其他
    'dimpler': '酒窝',
    'lipCornerPuller': '嘴角上扬',
    'lipCornerPullerLeft': '左嘴角上扬',
    'lipCornerPullerRight': '右嘴角上扬',
    'lipStretcher': '嘴唇拉伸',
    'lipStretcherLeft': '左唇拉伸',
    'lipStretcherRight': '右唇拉伸',
    'lipTightener': '嘴唇收紧',
    'lipTightenerLeft': '左唇收紧',
    'lipTightenerRight': '右唇收紧',
    'lipsToward': '嘴唇向前',
    'lowerLipDepressorLeft': '左下唇下垂',
    'lowerLipDepressorRight': '右下唇下垂',
    'mouthDimpleLeft': '左嘴角酒窝',
    'mouthDimpleRight': '右嘴角酒窝',
    'mouthFrownLeft': '左嘴角下垂',
    'mouthFrownRight': '右嘴角下垂',
    'mouthSmileLeft': '左嘴角上扬',
    'mouthSmileRight': '右嘴角上扬'
  }
  
  return nameMap[categoryName] || categoryName
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