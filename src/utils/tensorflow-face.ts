import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import type { Ref } from 'vue';

// Configuration constants
export const FACE_DETECTION_CONFIG = {
  BASE_OPTIONS: {
    // runtime: 'tfjs',
    runtime: 'mediapipe',
    solutionPath: '/mediapipe/face_mesh',
    // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
    maxFaces: 1,
    refineLandmarks: false
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
  console.error(`${context}:`, error);
  console.error('错误详情:', {
    name: error instanceof Error ? error.name : '未知',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
}

// Utility function to log device information
export function logDeviceInfo(): void {
  console.log('设备信息:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    connection: (navigator as any).connection?.effectiveType || '未知'
  });
}

// Utility function to create face detector with fallback
export async function createFaceDetectorWithFallback(
  options: any = FACE_DETECTION_CONFIG.BASE_OPTIONS
): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  const fallbackOptions = [
    // 首选：mediapipe runtime
    { runtime: 'mediapipe', maxFaces: 1, refineLandmarks: false, solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619' },
    // 备选：tfjs runtime (如果可用)
    { runtime: 'tfjs', maxFaces: 1, refineLandmarks: false },
  ];
  
  for (let i = 0; i < fallbackOptions.length; i++) {
    try {
      const currentOptions = i === 0 ? options : fallbackOptions[i];
      console.log(`尝试加载人脸检测模型 (${currentOptions.runtime})...`);
      
      // 确保 TensorFlow.js 后端已初始化
      if (currentOptions.runtime === 'tfjs') {
        try {
          await tf.setBackend('webgl');
          console.log('TensorFlow.js WebGL 后端已初始化');
        } catch (backendError) {
          console.warn('TensorFlow.js 后端初始化失败:', backendError);
        }
      }
      
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        currentOptions
      );
      
      console.log(`人脸检测模型加载成功 (${currentOptions.runtime})`);
      return detector;
    } catch (error) {
      console.warn(`${fallbackOptions[i].runtime} 加载失败:`, error);
      
      // 如果是最后一个选项，抛出错误
      if (i === fallbackOptions.length - 1) {
        console.error('所有运行时都加载失败');
        throw error;
      }
      
      // 否则继续尝试下一个选项
      continue;
    }
  }
  
  throw new Error('无法加载人脸检测模型');
}

// Unified face detector creation function
export async function createFaceDetector(
  isLoading: Ref<boolean>,
  loadError: Ref<string | null>
): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  isLoading.value = true;
  loadError.value = null;
  
  try {
    console.log('开始加载 Face Detector...');
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

// Function to start video stream
export async function startVideoStream(
  videoSize: { width: number; height: number }
): Promise<MediaStream> {
  console.log('[startVideoStream] called');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: videoSize.width,
        height: videoSize.height,
        facingMode: 'user'
      },
    });
    console.log('[startVideoStream] stream created successfully');
    return stream;
  } catch (e) {
    console.error('[startVideoStream] getUserMedia error:', e);
    throw e;
  }
}

// Function to draw detection results on canvas
export function drawFaceResults(
  canvas: HTMLCanvasElement,
  faces: faceLandmarksDetection.Face[]
): void {
  if (!canvas) {
    console.error('[drawFaceResults] canvas is null');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('[drawFaceResults] ctx is null');
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  
  faces.forEach(face => {
    face.keypoints.forEach((kp: faceLandmarksDetection.Keypoint) => {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#0FF';
      ctx.fill();
    });
  });
}

// Function to detect faces in a video element
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
  
  try {
    const faces = await detector.estimateFaces(video);
    return faces;
  } catch (e) {
    console.error('[detectFaces] estimateFaces error:', e);
    throw e;
  }
}

// Function to create a detection loop
export function createDetectionLoop(
  video: HTMLVideoElement,
  detector: faceLandmarksDetection.FaceLandmarksDetector,
  canvas: HTMLCanvasElement,
  onError?: (error: Error) => void
): () => void {
  let detecting = false;
  let rafId: number | null = null;
  
  const loop = async () => {
    if (detecting) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    
    detecting = true;
    
    try {
      const faces = await detectFaces(video, detector);
      drawFaceResults(canvas, faces);
    } catch (e) {
      console.error('[detectionLoop] error:', e);
      onError?.(e as Error);
    }
    
    detecting = false;
    rafId = requestAnimationFrame(loop);
  };
  
  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  
  // Start the loop immediately
  loop();
  
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