<template>
  <div class="face-demo">
    <h1>面部验证系统</h1>

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
      </div>

      <div v-else>
        <!-- 验证组件 -->
        <FaceVerification ref="verificationRef" :actions="selectedModel.actions" :enable-drawing="true"
                          @verification-complete="onVerificationComplete" @action-detected="onActionDetected"
                          @verification-started="onVerificationStarted">
          <!-- 视频显示插槽 -->
          <template #video-display>
            <div class="video-wrapper">
              <video ref="video" autoplay playsinline style="transform: scaleX(-1)"></video>
              <canvas ref="canvas" class="output-canvas"></canvas>
            </div>
          </template>
        </FaceVerification>

        <!-- 控制面板 -->
        <div class="control-panel">
          <button @click="resetVerification" class="reset-button">
            重置验证
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'
import { createFaceLandmarker } from '@/utils/mediapipe'
import FaceVerification from '@/components/FaceVerification/index.vue'

// 组件引用
const verificationRef = ref()
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

// MediaPipe 相关
let faceLandmarker: FaceLandmarker | null = null
let stream: MediaStream | null = null
let animationFrameId: number | null = null
let running = true
let drawingUtils: any = null
let lastVideoTime = -1
let results: any = undefined

// 状态
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// 标准模型配置
const selectedModel = ref({
  name: '标准模型',
  actions: [
    'blink', 
    'mouthOpen', 'headLeft', 'headRight', 'headUp', 'headDown'
  ],
  videoWidth: 320 // 更新为圆形尺寸
})

// 初始化人脸检测器
async function createFaceLandmarkerWithFallback() {
  try {
    faceLandmarker = await createFaceLandmarker(isLoading, loadError, true) // 使用本地模型
    console.log('人脸关键点检测器加载成功')

    // 自动启动摄像头
    await enableCam()
  } catch (error) {
    // Error is already handled in createFaceLandmarker
  }
}

// 重试加载
async function retryLoading() {
  console.log('重试加载 Face Landmarker...')
  try {
    faceLandmarker = await createFaceLandmarker(isLoading, loadError, true)
    console.log('人脸关键点检测器加载成功')

    // 自动启动摄像头
    await enableCam()
  } catch (error) {
    // Error is already handled in createFaceLandmarker
  }
}

// 启用摄像头
async function enableCam() {
  if (!faceLandmarker) return

  const constraints = {
    video: {
      facingMode: 'user',
      width: { ideal: selectedModel.value.videoWidth },
      height: { ideal: selectedModel.value.videoWidth },
    },
    audio: false
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (video.value) {
      video.value.srcObject = stream
      video.value.addEventListener("loadedmetadata", () => {
        console.log('视频加载完成，尺寸:', video.value?.videoWidth, 'x', video.value?.videoHeight)
        predictWebcam()
      })
    }
  } catch (error) {
    console.error('访问摄像头时出错:', error)
  }
}

// 预测摄像头
async function predictWebcam() {
  if (!video.value || !canvas.value || !faceLandmarker || !running) {
    if (running) {
      animationFrameId = requestAnimationFrame(predictWebcam)
    }
    return
  }

  const videoElement = video.value
  const canvasElement = canvas.value
  const ctx = canvasElement.getContext('2d')

  if (!ctx) return

  drawingUtils = new DrawingUtils(ctx)

  // 确保 canvas 尺寸与视频的实际尺寸完全匹配
  canvasElement.width = videoElement.videoWidth
  canvasElement.height = videoElement.videoHeight

  // 设置显示尺寸 - 适应圆形容器
  const containerSize = 320 // 圆形容器的尺寸
  videoElement.style.width = containerSize + "px"
  videoElement.style.height = containerSize + "px"
  canvasElement.style.width = containerSize + "px"
  canvasElement.style.height = containerSize + "px"

  let startTimeMs = performance.now()

  if (lastVideoTime !== videoElement.currentTime) {
    lastVideoTime = videoElement.currentTime
    results = faceLandmarker.detectForVideo(videoElement, startTimeMs)
  }

  // 清除画布
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  if (results?.faceLandmarks) {
    // 应用镜像变换
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvasElement.width, 0)

    for (const landmarks of results.faceLandmarks) {
      // 调用验证组件的动作检测
      if (verificationRef.value) {
        verificationRef.value.detectActions(landmarks)
      }

      // 绘制面部标记
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: '#0FF', lineWidth: 1 }
      )

      // 始终绘制面部网格，无论验证状态如何
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: '#0FF', lineWidth: 0.2 }
      )
    }

    // 恢复变换
    ctx.restore()
  }

  animationFrameId = requestAnimationFrame(predictWebcam)
}

// 初始化
onMounted(async () => {
  await createFaceLandmarkerWithFallback()
})

// 清理
onBeforeUnmount(() => {
  running = false
  if (stream) stream.getTracks().forEach(track => track.stop())
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (faceLandmarker) faceLandmarker.close()
})

// 事件处理
function onVerificationComplete(success: boolean, steps: string[]) {
  console.log('验证完成:', success, steps)
  if (success) {
    console.log('验证成功！')
  }
}

function onActionDetected(action: string) {
  console.log('检测到动作:', action)
}

function onVerificationStarted(steps: string[]) {
  console.log('验证开始，步骤:', steps)
}

function resetVerification() {
  if (verificationRef.value) {
    verificationRef.value.resetVerification()
  }
}
</script>

<style lang="scss" scoped>
.face-demo {
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

.video-container {
  text-align: center;
  margin-bottom: 20px;
}

.loading-state,
.error-state {
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-tip,
.error-tip {
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

.video-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 auto;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #007f8b;
  box-shadow: 0 0 20px rgba(0, 127, 139, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 30px rgba(0, 127, 139, 0.5);
    transform: scale(1.02);
  }
  
  // 人脸轮廓
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 240px;
    border: 2px dashed rgba(255, 255, 255, 0.6);
    border-radius: 48% 48% 50% 50% / 42% 42% 54% 54%;
    pointer-events: none;
    z-index: 10;
    animation: pulse 2s ease-in-out infinite;
  }
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  
  .output-canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    border-radius: 50%;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.control-panel {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;

  .reset-button {
    padding: 8px 16px;
    background: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;

    &:hover {
      background: #f57c00;
    }
  }
}
</style>
