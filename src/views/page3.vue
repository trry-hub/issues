<template>
  <div class="flex flex-col items-center justify-center">
    <h2>人脸检测 Demo (MediaPipe FaceMesh)</h2>
    <div class="video-container" ref="videoContainer" :style="{ height: videoSize.height + 'px' }">
      <video ref="video" autoplay playsinline :width="videoSize.width" :height="videoSize.height"></video>
      <canvas ref="canvas" :width="videoSize.width" :height="videoSize.height"></canvas>
    </div>
    <div v-if="loading">模型加载中...</div>
    <div v-if="error" style="color:red;">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { 
  createFaceDetector, 
  startVideoStream, 
  createDetectionLoop 
} from '@/utils/tensorflow-face-simple';

const video = useTemplateRef<HTMLVideoElement>('video');
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const videoContainer = useTemplateRef<HTMLDivElement>('videoContainer');
const loading = ref(true);
const error = ref('');
let stream: MediaStream | null = null;
let detector: any = null;
let stopDetection: (() => void) | null = null;
const videoSize = ref({ width: 300, height: 300 });

onMounted(async () => {
  loading.value = true;
  console.log('[onMounted] start');
  
  try {
    await nextTick();
    
    // 启动视频流
    stream = await startVideoStream(videoSize.value);
    if (video.value) {
      video.value.srcObject = stream;
      console.log('[onMounted] stream set to video');
    } else {
      console.error('[onMounted] video ref is null');
    }
    
    // 加载模型
    detector = await createFaceDetector(loading, error);
    
    // 启动检测循环
    if (video.value && canvas.value && detector) {
      stopDetection = createDetectionLoop(
        video.value, 
        detector, 
        canvas.value,
        (e) => {
          console.error('[detectionLoop] error:', e);
        }
      );
    }
    
    loading.value = false;
    console.log('[onMounted] success');
  } catch (e: any) {
    error.value = '初始化失败: ' + (e?.message || e);
    console.error('[onMounted] error:', e);
  }
});

onBeforeUnmount(() => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    console.log('[onBeforeUnmount] stopped stream');
  }
  if (stopDetection) {
    stopDetection();
    console.log('[onBeforeUnmount] stopped detection loop');
  }
});
</script>

<style scoped lang="scss">
.video-container {
  width: 100%;
  // aspect-ratio: 16/9;
  max-width: 800px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  video,
  canvas {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
