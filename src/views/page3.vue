<template>
  <div class="flex flex-col items-center justify-center">
    <h2>人脸检测 Demo (MediaPipe FaceMesh)</h2>
    
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
        <FaceVerification 
          ref="verificationRef" 
          :actions="selectedModel.actions" 
          :enable-drawing="true"
          @verification-complete="onVerificationComplete" 
          @action-detected="onActionDetected"
          @verification-started="onVerificationStarted"
        />

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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { 
  createFaceDetector, 
  startVideoStream, 
  createDetectionLoop 
} from '@/utils/tensorflow-face'
import FaceVerification from '@/components/FaceVerification/index.vue'

// 组件引用
const verificationRef = ref()
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

// 获取 FaceVerification 组件暴露的 refs
const getVideoAndCanvas = () => {
  if (verificationRef.value) {
    video.value = verificationRef.value.videoRef
    canvas.value = verificationRef.value.canvasRef
    console.log('获取到 video ref:', video.value)
    console.log('获取到 canvas ref:', canvas.value)
  }
}

// TensorFlow.js 相关
let detector: any = null
let stream: MediaStream | null = null
let stopDetection: (() => void) | null = null

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
async function createFaceDetectorWithFallback() {
  try {
    detector = await createFaceDetector(isLoading, loadError)
    console.log('人脸关键点检测器加载成功')

    // 自动启动摄像头
    await enableCam()
  } catch (error) {
    // Error is already handled in createFaceDetector
  }
}

// 重试加载
async function retryLoading() {
  console.log('重试加载 Face Detector...')
  try {
    detector = await createFaceDetector(isLoading, loadError)
    console.log('人脸关键点检测器加载成功')

    // 自动启动摄像头
    await enableCam()
  } catch (error) {
    // Error is already handled in createFaceDetector
  }
}

// 启用摄像头
async function enableCam() {
  if (!detector) return

  try {
    stream = await startVideoStream({ 
      width: selectedModel.value.videoWidth, 
      height: selectedModel.value.videoWidth 
    })
    
    // 获取 FaceVerification 组件的 video 和 canvas refs
    getVideoAndCanvas()
    
    if (video.value) {
      video.value.srcObject = stream
      video.value.addEventListener("loadedmetadata", () => {
        console.log('视频加载完成，尺寸:', video.value?.videoWidth, 'x', video.value?.videoHeight)
        
        // 同步 canvas 尺寸
        if (verificationRef.value) {
          verificationRef.value.syncCanvasSize()
        }
        
        startDetection()
      })
    }
  } catch (error) {
    console.error('访问摄像头时出错:', error)
  }
}

// 启动检测
function startDetection() {
  if (!video.value || !canvas.value || !detector) {
    console.error('启动检测失败：缺少必要的元素')
    return
  }

  console.log('启动人脸检测循环')
  
  // 启动检测循环
  stopDetection = createDetectionLoop(
    video.value, 
    detector, 
    canvas.value,
    (error) => {
      console.error('检测错误:', error)
    },
    (faces) => {
      // 当检测到人脸时，调用验证组件的动作检测
      if (verificationRef.value && faces.length > 0) {
        // TensorFlow.js 返回的是 keypoints 数组，需要转换为 MediaPipe 格式
        const landmarks = faces[0].keypoints.map((kp: any) => ({
          x: kp.x,
          y: kp.y,
          z: kp.z || 0
        }))
        
        verificationRef.value.detectActions(landmarks)
      }
    }
  )
}

// 初始化
onMounted(async () => {
  await createFaceDetectorWithFallback()
})

// 清理
onBeforeUnmount(() => {
  if (stream) stream.getTracks().forEach(track => track.stop())
  if (stopDetection) stopDetection()
  if (detector) detector.dispose?.()
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

<style scoped lang="scss">
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
