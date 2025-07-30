<template>
  <div class="face-verification">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <!-- 动作提示 -->
      <div v-if="verificationState.isVerifying && !verificationState.completed" class="action-prompt">
        <div class="prompt-content">
          <div class="prompt-title">请执行以下动作:</div>
          <div class="current-action">{{ currentActionName }}</div>
          <div class="progress">步骤 {{ verificationState.currentStep + 1 }}/{{ verificationState.steps.length }}</div>
        </div>
      </div>
      
      <!-- 视频显示区域 - 由外部提供 -->
      <div class="video-wrapper">
        <slot name="video-display">
          <!-- 默认插槽，外部可以传入视频和画布 -->
          <div class="placeholder">请提供视频显示组件</div>
        </slot>
      </div>
    </div>

    <!-- 验证控制按钮 -->
    <div class="verification-controls">
      <button v-if="!verificationState.isVerifying" @click="startVerification" class="verify-button">
        开始验证
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
import { ref, computed, readonly, watch } from 'vue'
import * as verification from './verification'

defineOptions({
  name: 'FaceVerification'
})

// Props
interface Props {
  actions?: string[]
  enableDrawing?: boolean
  autoStart?: boolean // 是否自动开始验证
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => ['blink', 'mouthOpen', 'headLeft', 'headRight', 'headUp', 'headDown'],
  enableDrawing: true,
  autoStart: false
})

// Emits
const emit = defineEmits<{
  verificationComplete: [success: boolean, steps: string[]]
  actionDetected: [action: string]
  verificationStarted: [steps: string[]]
}>()

// 验证流程状态
const verificationState = ref({
  isVerifying: false,
  currentStep: -1,
  steps: [] as string[],
  completed: false,
  showSuccess: false,
  actionConfirmed: false
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
  const shuffledActions = [...props.actions].sort(() => Math.random() - 0.5);
  verificationState.value.steps = shuffledActions.slice(0, stepCount);

  console.log('验证序列:', verificationState.value.steps.map(actionToChinese));
  
  // 触发验证开始事件
  emit('verificationStarted', verificationState.value.steps);
}

// 确认当前动作完成
function confirmAction() {
  if (!verificationState.value.isVerifying ||
    verificationState.value.completed ||
    verificationState.value.actionConfirmed) return;

  verificationState.value.actionConfirmed = true;

  // 显示动作完成提示
  showActionCompleted();

  // 延迟 1.5 秒后进入下一步
  setTimeout(() => {
    if (verificationState.value.currentStep < verificationState.value.steps.length - 1) {
      // 移动到下一步
      verificationState.value.currentStep++;
      verificationState.value.actionConfirmed = false;
      console.log(`开始验证下一个动作: ${actionToChinese(verificationState.value.steps[verificationState.value.currentStep])}`);
    } else {
      // 完成所有步骤
      verificationState.value.completed = true;
      verificationState.value.showSuccess = true;

      // 触发完成事件
      emit('verificationComplete', true, verificationState.value.steps);

      // 3秒后隐藏成功提示
      setTimeout(() => {
        verificationState.value.showSuccess = false;
        verificationState.value.isVerifying = false;
      }, 3000);
    }
  }, 1500); // 改为 1.5 秒
}

// 添加动作完成提示方法
function showActionCompleted() {
  const prompt = document.createElement('div');
  prompt.className = 'action-completed-prompt';
  prompt.innerHTML = `
    <div class="checkmark">✓</div>
    <div>动作完成!</div>
  `;

  document.getElementsByClassName('prompt-content')[0]?.appendChild(prompt);

  setTimeout(() => {
    prompt.remove();
  }, 1500); // 改为 1.5 秒，与等待时间保持一致
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

// 动作检测函数 - 由外部调用
function detectActions(landmarks: any) {
  // 只在验证模式下且当前动作未被确认时进行检测
  if (!verificationState.value.isVerifying ||
      verificationState.value.completed ||
      verificationState.value.actionConfirmed ||
      !currentAction.value) {
    return;
  }

  const currentActionType = currentAction.value;
  let detected = false;

  switch (currentActionType) {
    case 'blink':
      detected = verification.detectBlink(landmarks);
      break;
    case 'mouthOpen':
      detected = verification.detectMouthOpen(landmarks);
      break;
    case 'headLeft':
      detected = verification.detectHeadLeft(landmarks);
      break;
    case 'headRight':
      detected = verification.detectHeadRight(landmarks);
      break;
    case 'headUp':
      detected = verification.detectHeadUp(landmarks);
      break;
    case 'headDown':
      detected = verification.detectHeadDown(landmarks);
      break;
  }

  // 如果检测到动作，立即确认
  if (detected) {
    console.log(`检测到动作: ${actionToChinese(currentActionType)}`);
    emit('actionDetected', currentActionType);
    confirmAction();
  }
}

// 重置验证状态
function resetVerification() {
  verificationState.value = {
    isVerifying: false,
    currentStep: -1,
    steps: [],
    completed: false,
    showSuccess: false,
    actionConfirmed: false
  };
}

// 监听自动开始
watch(() => props.autoStart, (newValue) => {
  if (newValue && !verificationState.value.isVerifying) {
    startVerification();
  }
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
  startVerification,
  resetVerification,
  detectActions,
  verificationState: readonly(verificationState),
  currentAction: readonly(currentAction)
})
</script>

<style lang="scss" scoped>
.face-verification {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.video-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 auto;
  
  .placeholder {
    width: 320px;
    height: 240px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    border: 2px dashed #ccc;
    border-radius: 8px;
  }
}

.verification-controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;

  .verify-button {
    width: 200px;
    padding: 12px 25px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background: #45a049;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.success-message {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .success-content {
    background: white;
    padding: 30px 40px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    animation: fadeInScale 0.5s forwards;

    h2 {
      color: #4CAF50;
      font-size: 32px;
      margin-bottom: 20px;
      font-weight: bold;
    }

    p {
      font-size: 20px;
      color: #555;
    }
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.action-prompt {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  z-index: 5;

  .prompt-content {
    background: rgba(0, 0, 0, 0.7);
    padding: 15px 30px;
    border-radius: 10px;
    color: white;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

    .prompt-title {
      font-size: 18px;
      margin-bottom: 5px;
    }

    .current-action {
      font-size: 24px;
      font-weight: bold;
      color: #FFD700;
      margin-bottom: 5px;
    }

    .progress {
      font-size: 16px;
      color: #ccc;
    }
  }
}

.action-completed-prompt {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(4, 170, 78, 0.9);
  color: white;
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  z-index: 200;
  animation: fadeOut 1.5s forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

  .checkmark {
    font-size: 40px;
    line-height: 1;
  }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
</style> 