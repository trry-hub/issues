# MediaPipe 面部验证组件

这个目录包含了基于 MediaPipe 的面部验证组件，支持多种模型配置和动作检测。

## 组件结构

### 1. FaceVerification 组件 (`src/components/face-verification.vue`)

这是一个纯验证逻辑组件，专注于动作检测和验证流程，支持：

- **纯验证逻辑**：不包含摄像头和模型加载，专注于验证流程
- **外部数据输入**：接收外部提供的人脸关键点数据进行检测
- **自定义动作列表**：支持眨眼、张嘴、转头等动作
- **插槽系统**：通过插槽支持外部提供视频显示组件
- **事件回调**：验证完成、动作检测和验证开始的回调

#### Props

```typescript
interface Props {
  actions?: string[]         // 支持的动作列表
  enableDrawing?: boolean    // 是否显示关键点
  autoStart?: boolean        // 是否自动开始验证
}
```

#### Events

```typescript
// 验证完成事件
@verification-complete="(success: boolean, steps: string[]) => void"

// 动作检测事件
@action-detected="(action: string) => void"

// 验证开始事件
@verification-started="(steps: string[]) => void"
```

#### 使用示例

```vue
<template>
  <FaceVerification
    :actions="['blink', 'mouthOpen', 'headLeft']"
    :enable-drawing="true"
    @verification-complete="onComplete"
    @action-detected="onActionDetected"
    @verification-started="onStarted"
  >
    <!-- 视频显示插槽 -->
    <template #video-display>
      <div class="video-wrapper">
        <video ref="video" autoplay playsinline></video>
        <canvas ref="canvas" class="output-canvas"></canvas>
      </div>
    </template>
  </FaceVerification>
</template>

<script setup>
import FaceVerification from '@/components/face-verification.vue'

function onComplete(success, steps) {
  console.log('验证完成:', success, steps)
}

function onActionDetected(action) {
  console.log('检测到动作:', action)
}

function onStarted(steps) {
  console.log('验证开始，步骤:', steps)
}

// 在渲染循环中调用验证组件的检测方法
function renderLoop() {
  // ... 其他代码 ...
  
  if (results?.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      // 调用验证组件的动作检测
      verificationRef.value.detectActions(landmarks)
    }
  }
}
</script>
```

### 2. 模型选择器 (`face-demo.vue`)

这是一个演示页面，展示了如何使用不同的模型配置：

- **标准模型**：包含所有动作的完整验证
- **高性能模型**：优化的配置，适合移动设备
- **完整动作模型**：大尺寸显示，适合桌面设备



## 支持的动作

目前支持以下动作检测：

- `blink` - 眨眼
- `mouthOpen` - 张嘴
- `headLeft` - 向左转头
- `headRight` - 向右转头
- `headUp` - 抬头
- `headDown` - 低头

## 模型配置

### 标准配置

```typescript
{
  wasmPath: '/node_modules/@mediapipe/tasks-vision/wasm',
  modelPath: '/mediapipe/face_landmarker.task',
  runningMode: 'VIDEO',
  numFaces: 1
}
```

### 自定义配置

你可以根据需要调整以下参数：

- **WASM 路径**：指向 MediaPipe WASM 文件的位置
- **模型路径**：指向面部检测模型文件的位置
- **运行模式**：`VIDEO` 用于实时视频，`IMAGE` 用于静态图片
- **人脸数量**：同时检测的人脸数量

## 性能优化

### 1. 视频尺寸优化

较小的视频尺寸可以提高性能：

```typescript
// 高性能配置
const videoWidth = 240  // 小尺寸，高性能

// 标准配置
const videoWidth = 280  // 平衡性能和显示效果

// 高质量配置
const videoWidth = 400  // 大尺寸，高质量显示
```

### 2. 动作列表优化

减少检测的动作数量可以提高性能：

```typescript
// 高性能配置 - 只检测基本动作
const actions = ['blink', 'mouthOpen']

// 完整配置 - 检测所有动作
const actions = ['blink', 'mouthOpen', 'headLeft', 'headRight', 'headUp', 'headDown']
```

### 3. 绘制优化

关闭关键点绘制可以提高性能：

```typescript
// 关闭绘制以提高性能
:enable-drawing="false"

// 开启绘制以显示关键点
:enable-drawing="true"
```

## 路由配置

访问以下路径可以查看不同的演示：

- `/mediapipe-face-demo` - 模型选择器
- `/simple-face-demo` - 简单面部检测

## 组件使用

FaceVerification 组件现在位于 `src/components/face-verification.vue`，可以在任何地方使用：

```vue
import FaceVerification from '@/components/face-verification.vue'
```

## 注意事项

1. **摄像头权限**：确保浏览器允许访问摄像头
2. **模型文件**：确保 MediaPipe 模型文件已正确放置
3. **性能考虑**：在移动设备上建议使用较小的视频尺寸
4. **浏览器兼容性**：需要支持 WebAssembly 的现代浏览器

## 故障排除

### 常见问题

1. **模型加载失败**
   - 检查模型文件路径是否正确
   - 确保 WASM 文件存在

2. **摄像头无法访问**
   - 检查浏览器权限设置
   - 确保设备有可用的摄像头

3. **性能问题**
   - 尝试减小视频尺寸
   - 减少检测的动作数量
   - 关闭关键点绘制

4. **关键点不对齐**
   - 确保使用正确的容器类名 (`video-wrapper`)
   - 检查镜像设置是否正确
   - 验证尺寸计算逻辑