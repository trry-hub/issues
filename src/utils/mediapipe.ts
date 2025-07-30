import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceLandmarkerOptions } from '@mediapipe/tasks-vision'
import type { Ref } from 'vue'

// Configuration constants
export const FACE_LANDMARKER_CONFIG = {
  WASM_PATH: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
  MODEL_PATH: "/mediapipe/face_landmarker.task",
  // MODEL_PATH: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  LOCAL_MODEL_PATH: "/mediapipe/face_landmarker.task",
  BASE_OPTIONS: {
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  } satisfies FaceLandmarkerOptions
} as const

// Type-safe function to create FaceLandmarkerOptions
export function createFaceLandmarkerOptions(
  modelAssetPath: string,
  delegate: 'GPU' | 'CPU' = 'GPU'
): FaceLandmarkerOptions {
  return {
    baseOptions: {
      modelAssetPath,
      delegate
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  }
}

// Utility function for error handling and logging
export function handleError(error: unknown, context: string): void {
  console.error(`${context}:`, error)
  console.error('错误详情:', {
    name: error instanceof Error ? error.name : '未知',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
}

// Utility function to log device information
export function logDeviceInfo(): void {
  console.log('设备信息:', {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    connection: (navigator as any).connection?.effectiveType || '未知'
  })
}

// Utility function to create face landmarker with fallback
export async function createFaceLandmarkerWithFallback(
  filesetResolver: any, 
  useLocalModel: boolean = false
): Promise<any> {
  const delegates = ['GPU', 'CPU'] as const
  const modelPath = useLocalModel ? FACE_LANDMARKER_CONFIG.LOCAL_MODEL_PATH : FACE_LANDMARKER_CONFIG.MODEL_PATH
  
  for (const delegate of delegates) {
    try {
      console.log(`尝试使用${delegate}加载...`)
      const options = createFaceLandmarkerOptions(modelPath, delegate)
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, options)
      console.log(`人脸关键点检测器加载成功 (${delegate})`)
      return landmarker
    } catch (error) {
      console.warn(`${delegate}加载失败:`, error)
      if (delegate === 'CPU') {
        // CPU也失败了，抛出错误
        throw error
      }
      // GPU失败，继续尝试CPU
      continue
    }
  }
  
  throw new Error('无法加载人脸关键点检测器')
}

// Unified face landmarker creation function
export async function createFaceLandmarker(
  isLoading: Ref<boolean>,
  loadError: Ref<string | null>,
  useLocalModel: boolean = false
): Promise<any> {
  isLoading.value = true
  loadError.value = null
  
  try {
    console.log('开始加载 Face Landmarker...')
    logDeviceInfo()
    
    const filesetResolver = await FilesetResolver.forVisionTasks(FACE_LANDMARKER_CONFIG.WASM_PATH)
    console.log('FilesetResolver 创建成功，开始创建 FaceLandmarker...')
    
    const landmarker = await createFaceLandmarkerWithFallback(filesetResolver, useLocalModel)
    isLoading.value = false
    return landmarker
  } catch (error) {
    handleError(error, '加载人脸关键点检测器时出错')
    loadError.value = `加载失败: ${error instanceof Error ? error.message : String(error)}`
    isLoading.value = false
    
    throw error
  }
} 