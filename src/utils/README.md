# 人脸检测工具

这个目录包含了用于人脸检测的工具函数，支持 TensorFlow.js 和 MediaPipe 两种运行时。

## 文件说明

### tensorflow-face.ts
完整版本的工具文件，包含：
- 降级策略（tfjs -> mediapipe）
- 详细的错误处理
- 设备信息记录
- 配置管理

### tensorflow-face-simple.ts
简化版本的工具文件，专门针对生产环境优化：
- 只使用 TensorFlow.js 运行时
- 简化的错误处理
- 更小的包体积

## 使用方法

### 基本用法

```typescript
import { 
  createFaceDetector, 
  startVideoStream, 
  createDetectionLoop 
} from '@/utils/tensorflow-face-simple';

// 在 Vue 组件中使用
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    // 1. 启动视频流
    const stream = await startVideoStream({ width: 640, height: 480 });
    video.value.srcObject = stream;
    
    // 2. 加载模型
    const detector = await createFaceDetector(loading, error);
    
    // 3. 启动检测循环
    const stopDetection = createDetectionLoop(
      video.value, 
      detector, 
      canvas.value
    );
    
    // 4. 清理时停止检测
    onBeforeUnmount(() => {
      stopDetection();
      stream.getTracks().forEach(track => track.stop());
    });
  } catch (e) {
    console.error('初始化失败:', e);
  }
});
```

### 错误处理

工具函数会自动处理以下错误：
- 模型加载失败
- 视频流获取失败
- 检测过程中的错误

错误信息会通过 `loadError` ref 传递给组件。

### 性能优化

1. **使用简化版本**: 如果不需要降级策略，使用 `tensorflow-face-simple.ts`
2. **适当的视频尺寸**: 建议使用 640x480 或更小的尺寸
3. **及时清理**: 确保在组件卸载时停止检测循环和视频流

### 注意事项

1. **浏览器兼容性**: 需要支持 WebGL 和 getUserMedia API
2. **HTTPS 要求**: 在生产环境中需要 HTTPS 才能访问摄像头
3. **模型大小**: TensorFlow.js 模型较大，首次加载可能需要一些时间

## 故障排除

### 常见错误

1. **"Zg.FaceMesh is not a constructor"**
   - 原因：MediaPipe 运行时在打包后无法正确初始化
   - 解决：使用 TensorFlow.js 运行时（简化版本）

2. **"getUserMedia is not supported"**
   - 原因：浏览器不支持摄像头访问
   - 解决：检查浏览器兼容性，确保使用 HTTPS

3. **"WebGL not supported"**
   - 原因：浏览器不支持 WebGL
   - 解决：使用支持 WebGL 的浏览器

### 调试技巧

1. 查看控制台日志了解加载过程
2. 检查设备信息确认环境
3. 使用开发者工具检查网络请求 