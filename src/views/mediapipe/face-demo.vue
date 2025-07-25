<template>
  <div class="face-demo">
    <div style="display: flex;flex-direction: column; justify-content: center; align-items: center;">
      <!-- 动作提示 -->
      <div v-if="verificationState.isVerifying && !verificationState.completed" class="action-prompt">
        <div class="prompt-content">
          <div class="prompt-title">请执行以下动作:</div>
          <div class="current-action">{{ currentActionName }}</div>
          <div class="progress">步骤 {{ verificationState.currentStep + 1 }}/{{ verificationState.steps.length }}</div>
        </div>
      </div>
      <div class="video-container" :style="{ width: width + 'px', height: height + 'px' }">
        <video ref="video" autoplay playsinline></video>
        <canvas ref="canvas"></canvas>
      </div>
    </div>
    <div v-if="error" style="color:red;">{{ error }}</div>

    <!-- 验证控制按钮 -->
    <div class="verification-controls">
      <button v-if="!verificationState.isVerifying" @click="startVerification" class="verify-button">
        开始验证
      </button>
    </div>

    <!-- 动作确认按钮 -->
    <div v-if="verificationState.isVerifying &&
      !verificationState.actionConfirmed &&
      currentAction &&
      actionState[currentAction as keyof typeof actionState]" class="action-confirm">
      <button @click="confirmAction" class="confirm-button">
        确认已完成 {{ currentActionName }}
      </button>
    </div>

    <!-- 成功提示 -->
    <div v-if="verificationState.showSuccess" class="success-message">
      <div class="success-content">
        <h2>验证成功!</h2>
        <p>您已完成所有动作验证</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import * as verification from './verification'

// 组件引用
const video = ref<HTMLVideoElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')
let faceLandmarker: FaceLandmarker | null = null
let stream: MediaStream | null = null
let running = true
const width = 320
const height = 320
const originalWidth = ref(0)
const originalHeight = ref(0)

// 动作检测状态
const actionState = ref({
  blink: false,
  mouthOpen: false,
  headLeft: false,
  headRight: false,
  headUp: false,
  headDown: false
})

// 验证流程状态
const verificationState = ref({
  isVerifying: false,      // 是否正在进行验证
  currentStep: -1,         // 当前步骤索引
  steps: [] as string[],   // 动作序列
  completed: false,        // 是否完成验证
  showSuccess: false,      // 是否显示成功提示
  actionConfirmed: false   // 当前动作是否已确认
})

// 动作名称中英文转换
function actionToChinese(action: string): string {
  const map: Record<string, string> = {
    blink: '眨眼',
    mouthOpen: '张嘴',
    headLeft: '向左转头',
    headRight: '向右转头',
    headUp: '抬头',
    headDown: '低头'
  };
  return map[action] || action;
}

// 可用的动作列表
const availableActions = ref([
  'blink',
  'mouthOpen',
  'headLeft',
  'headRight',
  'headUp',
  'headDown'
])

// 开始验证流程
function startVerification() {
  // 重置状态
  verificationState.value = {
    isVerifying: true,
    currentStep: 0,
    steps: [],
    completed: false,
    showSuccess: false,
    actionConfirmed: false
  }

  // 生成随机动作序列 (3-5个动作)
  const stepCount = 3 + Math.floor(Math.random() * 3);
  const shuffledActions = [...availableActions.value].sort(() => Math.random() - 0.5);
  verificationState.value.steps = shuffledActions.slice(0, stepCount);

  console.log('验证序列:', verificationState.value.steps.map(actionToChinese));
}

// 确认当前动作完成
function confirmAction() {
  if (!verificationState.value.isVerifying ||
    verificationState.value.completed) return;

  verificationState.value.actionConfirmed = true;

  // 显示动作完成提示
  showActionCompleted();

  // 延迟后进入下一步
  setTimeout(() => {
    if (verificationState.value.currentStep < verificationState.value.steps.length - 1) {
      // 移动到下一步
      verificationState.value.currentStep++;
      verificationState.value.actionConfirmed = false;
    } else {
      // 完成所有步骤
      verificationState.value.completed = true;
      verificationState.value.showSuccess = true;

      // 3秒后隐藏成功提示
      setTimeout(() => {
        verificationState.value.showSuccess = false;
        verificationState.value.isVerifying = false;
      }, 3000);
    }
  }, 1000); // 1秒延迟
}

// 添加动作完成提示方法
function showActionCompleted() {
  // 创建提示元素
  const prompt = document.createElement('div');
  prompt.className = 'action-completed-prompt';
  prompt.innerHTML = `
    <div class="checkmark">✓</div>
    <div>动作完成!</div>
  `;

  // 添加到页面
  document.getElementsByClassName('prompt-content')[0].appendChild(prompt);

  // 1.5秒后移除提示
  setTimeout(() => {
    prompt.remove();
  }, 1500);
}

// 当前需要执行的动作
const currentAction = computed(() => {
  if (!verificationState.value.isVerifying ||
    verificationState.value.currentStep < 0 ||
    verificationState.value.currentStep >= verificationState.value.steps.length) {
    return null;
  }
  return verificationState.value.steps[verificationState.value.currentStep];
});

// 当前动作的中文名称
const currentActionName = computed(() => {
  return currentAction.value ? actionToChinese(currentAction.value) : '';
});

// 动作检测函数
function detectActions(landmarks: any) {
  const actions = {
    blink: false,
    mouthOpen: false,
    headLeft: false,
    headRight: false,
    headUp: false,
    headDown: false
  };

  // 根据当前验证状态决定检测哪些动作
  if (verificationState.value.isVerifying &&
    !verificationState.value.completed &&
    !verificationState.value.actionConfirmed &&
    currentAction.value) {
    // 验证模式下只检测当前动作
    switch (currentAction.value) {
      case 'blink':
        actions.blink = verification.detectBlink(landmarks);
        if (actions.blink) {
          confirmAction()
        }
        break;
      case 'mouthOpen':
        actions.mouthOpen = verification.detectMouthOpen(landmarks);
        if (actions.mouthOpen) {
          confirmAction()
        }
        break;
      case 'headLeft':
        actions.headLeft = verification.detectHeadLeft(landmarks);
        if (actions.headLeft) {
          confirmAction()
        }
        break;
      case 'headRight':
        actions.headRight = verification.detectHeadRight(landmarks);
        if (actions.headRight) {
          confirmAction()
        }
        break;
      case 'headUp':
        actions.headUp = verification.detectHeadUp(landmarks);
        if (actions.headUp) {
          confirmAction()
        }
        break;
      case 'headDown':
        actions.headDown = verification.detectHeadDown(landmarks);
        if (actions.headDown) {
          confirmAction()
        }
        break;
    }
  }

  return actions;
}

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
      numFaces: 1,
    })

    // 获取摄像头
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
      },
      audio: false
    })
    
    // 确保 video ref 存在
    if (!video.value) {
      error.value = 'Video element not found'
      return
    }
    
    video.value.srcObject = stream
    video.value.onloadedmetadata = () => {
      // 捕获原始视频尺寸
      originalWidth.value = video.value!.videoWidth
      originalHeight.value = video.value!.videoHeight

      // 设置画布尺寸匹配原始视频
      if (canvas.value) {
        canvas.value.width = originalWidth.value
        canvas.value.height = originalHeight.value
      }
      renderLoop()
    }
  } catch (e: any) {
    error.value = e?.message || '初始化失败'
  }
})

async function renderLoop() {
  // 添加更严格的 null 检查
  if (!video.value || !canvas.value || !faceLandmarker || !running) {
    // 如果 video 为 null，延迟重试而不是直接返回
    if (!video.value) {
      setTimeout(renderLoop, 100)
    }
    return
  }
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, originalWidth.value, originalHeight.value)

  const results = faceLandmarker.detectForVideo(video.value, performance.now())
  if (results.faceLandmarks) {
    const drawingUtils = new DrawingUtils(ctx)

    // We are only processing the first face? Actually, we loop over all, but numFaces=1 so one.
    for (const landmarks of results.faceLandmarks) {
      // 使用封装好的函数检测动作
      actionState.value = detectActions(landmarks);

      // 绘制面部标记
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: '#0FF', lineWidth: 0.2 }
      )
      drawingUtils.drawLandmarks(
        landmarks,
        {
          color: '#3D60E3',
          radius: Math.max(originalWidth.value, originalHeight.value) * 0.001
        }
      )
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
  border-radius: 50%;
  overflow: hidden;

  video,
  canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid #ccc;
    border-radius: 8px;
    transform: scaleX(-1); // Add mirror effect
  }

  canvas {
    position: absolute;
    left: 0;
    top: 0;
  }

}

.verification-controls {
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .verify-button {
    width: 70%;
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
      background: #45a049;
    }
  }
}

.success-message {
  position: absolute;
  margin-bottom: 20px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  .success-content {
    background: white;
    padding: 20px; /* Adjusted padding */
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Adjusted shadow */

    h2 {
      color: #4CAF50;
      font-size: 28px;
      margin-bottom: 15px;
    }

    p {
      font-size: 18px;
      color: #333;
    }
  }
}

.action-confirm {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;

  .confirm-button {
    padding: 12px 24px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(33, 150, 243, 0.4);
    transition: all 0.3s;

    &:hover {
      background: #0b7dda;
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(33, 150, 243, 0.5);
    }
  }
}

.action-prompt {
  // position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 5;

  .prompt-content {
    background: rgba(0, 0, 0, 0.7);
    padding: 15px 30px;
    border-radius: 10px;
    color: white;
    text-align: center;

    .prompt-title {
      font-size: 18px;
      margin-bottom: 5px;
    }

    .current-action {
      font-size: 24px;
      font-weight: bold;
      color: #FFD700;
      /* 金色 */
      margin-bottom: 5px;
    }

    .progress {
      font-size: 16px;
      color: #ccc;
    }
  }
}
</style>