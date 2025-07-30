import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import type { Ref } from 'vue';

// 全局日志开关
export let DEBUG_MODE = false;

// 设置调试模式的函数
export function setDebugMode(enabled: boolean) {
  DEBUG_MODE = enabled;
  console.log(`[TensorFlow Face] 调试模式: ${enabled ? '开启' : '关闭'}`);
}

// 调试日志函数
function debugLog(...args: any[]) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// 调试错误日志函数
function debugError(...args: any[]) {
  if (DEBUG_MODE) {
    console.error(...args);
  }
}

// Configuration constants - 简化为与 page3-copy.vue 一致的配置
export const FACE_DETECTION_CONFIG = {
  BASE_OPTIONS: {
    runtime: 'tfjs',
    maxFaces: 3,  // 增加最大检测人脸数
    refineLandmarks: true  // 启用精细关键点以提高检测精度
  }
} as const;

// Type-safe function to create detector options
export function createDetectorOptions(
  runtime: 'tfjs' | 'mediapipe' = 'tfjs',
  maxFaces: number = 1,
  refineLandmarks: boolean = false
) {
  return {
    runtime,
    maxFaces,
    refineLandmarks
  };
}

// Utility function for error handling and logging
export function handleError(error: unknown, context: string): void {
  debugError(`${context}:`, error);
  debugError('错误详情:', {
    name: error instanceof Error ? error.name : '未知',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
}

// Utility function to log device information
export function logDeviceInfo(): void {
  debugLog('设备信息:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    connection: (navigator as any).connection?.effectiveType || '未知'
  });
}

// 简化的模型创建函数 - 参考 page3-copy.vue 的 loadModel 函数
export async function createFaceDetectorWithFallback(
  options: any = FACE_DETECTION_CONFIG.BASE_OPTIONS
): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  try {
    debugLog('尝试加载人脸检测模型 (tfjs)...');
    
    const detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      options
    );
    
    debugLog('人脸检测模型加载成功 (tfjs)');
    return detector;
  } catch (error) {
    debugError('模型加载失败:', error);
    throw error;
  }
}

// Unified face detector creation function
export async function createFaceDetector(
  isLoading: Ref<boolean>,
  loadError: Ref<string | null>
): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  isLoading.value = true;
  loadError.value = null;
  
  try {
    debugLog('开始加载 Face Detector...');
    logDeviceInfo();
    
    const detector = await createFaceDetectorWithFallback();
    isLoading.value = false;
    return detector;
  } catch (error) {
    handleError(error, '加载人脸检测模型时出错');
    loadError.value = `加载失败: ${error instanceof Error ? error.message : String(error)}`;
    isLoading.value = false;
    
    throw error;
  }
}

// Function to start video stream - 保持原有逻辑
export async function startVideoStream(
  videoSize: { width: number; height: number }
): Promise<MediaStream> {
  debugLog('[startVideoStream] called');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: videoSize.width,
        height: videoSize.height,
        facingMode: 'user'
      },
    });
    debugLog('[startVideoStream] stream created successfully');
    return stream;
  } catch (e) {
    debugError('[startVideoStream] getUserMedia error:', e);
    throw e;
  }
}

// 简化的绘制函数 - 参考 page3-copy.vue 的 drawResults 函数，移除镜像变换
export function drawFaceResults(
  canvas: HTMLCanvasElement,
  faces: faceLandmarksDetection.Face[],
  video?: HTMLVideoElement
): void {
  if (!canvas) {
    debugError('[drawFaceResults] canvas is null');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    debugError('[drawFaceResults] ctx is null');
    return;
  }
  
  // 确保 canvas 尺寸与视频匹配
  if (video) {
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      debugLog(`[drawFaceResults] 调整 canvas 尺寸: ${canvas.width}x${canvas.height} -> ${videoWidth}x${videoHeight}`);
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (faces.length === 0) {
    return;
  }
  
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  
  faces.forEach(face => {
    // 绘制人脸框（如果有）
    if (face.box) {
      const { xMin, yMin, xMax, yMax } = face.box;
      ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
    }
    
    // 绘制关键点
    face.keypoints.forEach((kp: faceLandmarksDetection.Keypoint) => {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
    });
  });
  
  // 调试信息
  if (faces.length > 0) {
    debugLog(`[drawFaceResults] 绘制了 ${faces[0].keypoints.length} 个关键点`);
    debugLog(`[drawFaceResults] Canvas 尺寸: ${canvas.width}x${canvas.height}`);
    if (video) {
      debugLog(`[drawFaceResults] Video 尺寸: ${video.videoWidth}x${video.videoHeight}`);
    }
  }
}

// Function to detect faces in a video element - 保持原有逻辑
export async function detectFaces(
  video: HTMLVideoElement,
  detector: faceLandmarksDetection.FaceLandmarksDetector
): Promise<faceLandmarksDetection.Face[]> {
  if (!video) {
    throw new Error('[detectFaces] video element is null');
  }
  
  if (!detector) {
    throw new Error('[detectFaces] detector is null');
  }
  
  debugLog('[detectFaces] 检查视频状态:', {
    readyState: video.readyState,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    paused: video.paused,
    currentTime: video.currentTime
  });
  
  // 检查视频是否准备好
  if (video.readyState < 2) {
    debugLog('[detectFaces] video not ready, readyState:', video.readyState);
    return [];
  }
  
  // 检查视频尺寸是否有效
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    debugLog('[detectFaces] video dimensions invalid:', video.videoWidth, 'x', video.videoHeight);
    return [];
  }
  
  try {
    // 减少日志输出频率
    if (Math.random() < 0.1) {
      debugLog('[detectFaces] 开始检测人脸，视频尺寸:', video.videoWidth, 'x', video.videoHeight);
    }
    
    // 检查视频的 CSS 变换
    const computedStyle = window.getComputedStyle(video);
    const transform = computedStyle.transform;
    
    // 如果视频有镜像变换，创建一个临时 canvas 来处理
    let detectionElement: HTMLVideoElement | HTMLCanvasElement = video;
    
    if (transform.includes('-1')) {
      // 只在第一次检测到镜像时输出日志
      if (Math.random() < 0.05) {
        debugLog('[detectFaces] 检测到镜像变换，创建临时 canvas 处理');
      }
      
      // 创建临时 canvas
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        
        // 应用镜像变换
        tempCtx.scale(-1, 1);
        tempCtx.translate(-video.videoWidth, 0);
        
        // 绘制视频帧到 canvas
        tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // 使用临时 canvas 进行检测
        detectionElement = tempCanvas;
      }
    }
    
    const faces = await detector.estimateFaces(detectionElement);
    
    // 只在检测到人脸或检测结果变化时输出日志
    if (faces.length > 0) {
      debugLog('[detectFaces] 检测到人脸，关键点数量:', faces[0].keypoints.length);
      
      // 如果使用了临时 canvas，需要调整关键点坐标
      if (detectionElement !== video) {
        faces.forEach(face => {
          face.keypoints.forEach(kp => {
            // 将镜像后的坐标转换回原始坐标
            kp.x = video.videoWidth - kp.x;
          });
        });
      }
    }
    
    return faces;
  } catch (e) {
    debugError('[detectFaces] estimateFaces error:', e);
    throw e;
  }
}

// 简化的检测循环函数 - 参考 page3-copy.vue 的 loop 和 detectFace 函数
export function createDetectionLoop(
  video: HTMLVideoElement,
  detector: faceLandmarksDetection.FaceLandmarksDetector,
  canvas: HTMLCanvasElement,
  onError?: (error: Error) => void,
  onFacesDetected?: (faces: faceLandmarksDetection.Face[]) => void,
  enableDrawing: boolean = false
): () => void {
  let detecting = false;
  let rafId: number | null = null;
  let lastDetectionTime = 0;
  const detectionInterval = 100; // 每 100ms 检测一次，而不是每帧都检测
  
  const detectFace = async () => {
    if (detecting) return;
    
    const now = Date.now();
    if (now - lastDetectionTime < detectionInterval) {
      rafId = requestAnimationFrame(detectFace);
      return;
    }
    
    detecting = true;
    lastDetectionTime = now;
    
    if (!video) {
      debugError('[detectFace] video ref is null');
      detecting = false;
      rafId = requestAnimationFrame(detectFace);
      return;
    }
    if (!detector) {
      debugError('[detectFace] detector is null');
      detecting = false;
      rafId = requestAnimationFrame(detectFace);
      return;
    }
    
    try {
      const faces = await detectFaces(video, detector);
      
      // 只有在启用绘制时才绘制
      if (enableDrawing) {
        drawFaceResults(canvas, faces, video);
      }
      
      // 调用人脸检测回调
      if (onFacesDetected) {
        onFacesDetected(faces);
      }
    } catch (e) {
      debugError('[detectFace] estimateFaces error:', e);
      onError?.(e as Error);
    }
    
    detecting = false;
    rafId = requestAnimationFrame(detectFace);
  };
  
  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  
  // Start the loop immediately
  detectFace();
  
  // Return stop function for cleanup
  return stop;
}

/*
使用示例:

```typescript
import { 
  createFaceDetector, 
  startVideoStream, 
  createDetectionLoop 
} from '@/utils/tensorflow-face';

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
*/ 