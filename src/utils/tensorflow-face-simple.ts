import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import type { Ref } from 'vue';

// 简化的配置
export const FACE_DETECTION_CONFIG = {
  BASE_OPTIONS: {
    runtime: 'tfjs' as const,
    maxFaces: 1,
    refineLandmarks: false
  }
} as const;

// 错误处理
export function handleError(error: unknown, context: string): void {
  console.error(`${context}:`, error);
}

// 设备信息记录
export function logDeviceInfo(): void {
  console.log('设备信息:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform
  });
}

// 简化的模型创建函数
export async function createFaceDetector(
  isLoading: Ref<boolean>,
  loadError: Ref<string | null>
): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  isLoading.value = true;
  loadError.value = null;
  
  try {
    console.log('开始加载 Face Detector...');
    logDeviceInfo();
    
    // 确保 TensorFlow.js 后端已初始化
    await tf.setBackend('webgl');
    console.log('TensorFlow.js WebGL 后端已初始化');
    
    const detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      FACE_DETECTION_CONFIG.BASE_OPTIONS
    );
    
    console.log('人脸检测模型加载成功');
    isLoading.value = false;
    return detector;
  } catch (error) {
    handleError(error, '加载人脸检测模型时出错');
    loadError.value = `加载失败: ${error instanceof Error ? error.message : String(error)}`;
    isLoading.value = false;
    throw error;
  }
}

// 启动视频流
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

// 绘制检测结果
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

// 检测人脸
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

// 创建检测循环
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
  
  // 启动循环
  loop();
  
  // 返回停止函数
  return stop;
} 