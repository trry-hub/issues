<template>
  <div class="flex flex-col items-center justify-center">
    <h2>人脸检测 Demo (MediaPipe FaceMesh)</h2>
    
    <!-- 调试模式切换 -->
    <div class="debug-controls mb-4">
      <button 
        @click="toggleDebugMode" 
        :class="['debug-toggle', { 'active': debugMode }]"
      >
        {{ debugMode ? '关闭' : '开启' }}调试日志
      </button>
    </div>
    
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
  createDetectionLoop,
  setDebugMode,
  DEBUG_MODE
} from '@/utils/tensorflow-face'
import FaceVerification from '@/components/FaceVerification/index.vue'

// 调试模式控制
const debugMode = ref(DEBUG_MODE);

// 切换调试模式
function toggleDebugMode() {
  debugMode.value = !debugMode.value;
  setDebugMode(debugMode.value);
}

// 调试日志函数
function debugLog(...args: any[]) {
  if (debugMode.value) {
    console.log(...args);
  }
}

// 调试错误日志函数
function debugError(...args: any[]) {
  if (debugMode.value) {
    console.error(...args);
  }
}

// 组件引用
const verificationRef = ref()
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

// 获取 FaceVerification 组件暴露的 refs
const getVideoAndCanvas = () => {
  if (verificationRef.value) {
    video.value = verificationRef.value.videoRef
    canvas.value = verificationRef.value.canvasRef
    debugLog('获取到 video ref:', video.value)
    debugLog('获取到 canvas ref:', canvas.value)
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
    debugLog('人脸关键点检测器加载成功')

    // 自动启动摄像头
    await enableCam()
  } catch (error) {
    // Error is already handled in createFaceDetector
  }
}

// 重试加载
async function retryLoading() {
  debugLog('重试加载 Face Detector...')
  try {
    detector = await createFaceDetector(isLoading, loadError)
    debugLog('人脸关键点检测器加载成功')

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
        debugLog('视频加载完成，尺寸:', video.value?.videoWidth, 'x', video.value?.videoHeight)
        
        // 同步 canvas 尺寸
        if (verificationRef.value) {
          verificationRef.value.syncCanvasSize()
        }
        
        // 等待视频开始播放后再启动检测
        if (video.value) {
          video.value.addEventListener("playing", () => {
            debugLog('视频开始播放，启动检测')
            startDetection()
          }, { once: true })
        }
      })
    }
  } catch (error) {
    debugError('访问摄像头时出错:', error)
  }
}

// 绘制关键点函数
function drawLandmarks(landmarks: any[]) {
  if (!canvas.value) {
    debugError('[drawLandmarks] canvas is null');
    return;
  }

  const ctx = canvas.value.getContext('2d');
  if (!ctx) {
    debugError('[drawLandmarks] ctx is null');
    return;
  }

  // 只在第一次或尺寸变化时调整 canvas 尺寸
  if (video.value) {
    const videoWidth = video.value.videoWidth || video.value.clientWidth;
    const videoHeight = video.value.videoHeight || video.value.clientHeight;
    
    if (canvas.value.width !== videoWidth || canvas.value.height !== videoHeight) {
      debugLog(`[drawLandmarks] 调整 canvas 尺寸: ${canvas.value.width}x${canvas.value.height} -> ${videoWidth}x${videoHeight}`);
      canvas.value.width = videoWidth;
      canvas.value.height = videoHeight;
    }
  }

  // 清除画布 - 只在有内容时清除
  if (landmarks.length > 0) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  } else {
    return; // 如果没有关键点，直接返回，不进行绘制
  }

  // 检查视频是否有镜像变换 - 缓存结果
  const computedStyle = window.getComputedStyle(video.value!);
  const transform = computedStyle.transform;
  const hasMirror = transform.includes('-1');

  // 批量绘制关键点，减少状态切换
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#FF0000';

  // 使用路径批量绘制，提高性能
  ctx.beginPath();
  
  landmarks.forEach((landmark: any) => {
    // 如果视频有镜像变换，对关键点坐标也应用镜像
    let x = landmark.x;
    if (hasMirror) {
      x = canvas.value!.width - x;
    }
    
    ctx.moveTo(x + 1.5, landmark.y);
    ctx.arc(x, landmark.y, 1.5, 0, 2 * Math.PI);
  });
  
  ctx.fill();

  // 减少日志输出频率
  if (Math.random() < 0.1) { // 只输出 10% 的日志
    debugLog(`[drawLandmarks] 绘制了 ${landmarks.length} 个关键点${hasMirror ? '（已应用镜像变换）' : ''}`);
  }
}

// 启动检测
function startDetection() {
  if (!video.value || !canvas.value || !detector) {
    debugError('启动检测失败：缺少必要的元素')
    return
  }

  debugLog('启动人脸检测循环')
  
  // 启动检测循环 - 在 page3 中处理绘制
  stopDetection = createDetectionLoop(
    video.value, 
    detector, 
    canvas.value,
    (error) => {
      debugError('检测错误:', error)
    },
    (faces) => {
      // 当检测到人脸时，绘制关键点并调用验证组件的动作检测
      if (faces.length > 0) {
        // 绘制关键点
        const landmarks = faces[0].keypoints.map((kp: any) => ({
          x: kp.x,
          y: kp.y,
          z: kp.z || 0
        }))
        
        drawLandmarks(landmarks);
        
        // 调用验证组件的动作检测
        if (verificationRef.value) {
          verificationRef.value.detectActions(landmarks)
        }
      }
    },
    false // 不启用 tensorflow-face 的绘制，由 page3 自己处理
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
  debugLog('验证完成:', success, steps)
  if (success) {
    debugLog('验证成功！')
  }
}

function onActionDetected(action: string) {
  debugLog('检测到动作:', action)
}

function onVerificationStarted(steps: string[]) {
  debugLog('验证开始，步骤:', steps)
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

.debug-controls {
  margin-bottom: 1rem;
  
  .debug-toggle {
    padding: 8px 16px;
    border: 2px solid #007f8b;
    background: white;
    color: #007f8b;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
    
    &:hover {
      background: #007f8b;
      color: white;
    }
    
    &.active {
      background: #007f8b;
      color: white;
    }
  }
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
