<template>
  <div class="face-landmarker-demo">
    <h1>使用 MediaPipe FaceLandmarker 进行人脸特征点检测</h1>

    <section id="demos" :class="{ invisible: !demosVisible }">
      <h2>演示：检测图像</h2>
      <p><b>点击下方图片</b> 查看人脸关键特征点。</p>

      <div class="detectOnClick" ref="imageContainerRef">
        <img src="https://storage.googleapis.com/mediapipe-assets/portrait.jpg" width="100%" crossorigin="anonymous"
          title="点击进行检测！" @click="handleClick" />
      </div>
      <div class="blend-shapes">
        <ul class="blend-shapes-list">
          <li v-for="shape in imageBlendShapesData" :key="shape.displayName" class="blend-shapes-item">
            <span class="blend-shapes-label">{{ shape.displayName }}</span>
            <span class="blend-shapes-value" :style="{ width: `calc(${+shape.score * 100}% - 120px)` }">{{ shape.score
              }}</span>
          </li>
        </ul>
      </div>

      <h2>演示：摄像头实时人脸特征点检测</h2>
      <p>将您的脸放在网络摄像头前，进行实时人脸特征点检测。<br />点击<b>启用网络摄像头</b>下方，并在出现提示时授予网络摄像头访问权限。</p>

      <div id="liveView" class="videoView">
        <button id="webcamButton" @click="enableCam">
          {{ webcamRunning ? '禁用网络摄像头' : '启用网络摄像头' }}
        </button>
        <div style="position: relative;">
          <video ref="videoRef" autoplay playsinline></video>
          <canvas class="output_canvas" ref="canvasElementRef"></canvas>
        </div>
      </div>
      <div class="blend-shapes">
        <ul class="blend-shapes-list">
          <li v-for="shape in videoBlendShapesData" :key="shape.displayName" class="blend-shapes-item">
            <span class="blend-shapes-label">{{ shape.displayName }}</span>
            <span class="blend-shapes-value" :style="{ width: `calc(${+shape.score * 100}% - 120px)` }">{{ shape.score
              }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

// DOM Refs
const imageContainerRef = ref<HTMLDivElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasElementRef = ref<HTMLCanvasElement | null>(null);

// State
const demosVisible = ref(false);
let faceLandmarker: FaceLandmarker | null = null;
let runningMode: 'IMAGE' | 'VIDEO' = 'IMAGE';
const webcamRunning = ref(false);
let stream: MediaStream | null = null;
const imageBlendShapesData = ref<any[]>([]);
const videoBlendShapesData = ref<any[]>([]);

const videoWidth = 480;

// Initialize FaceLandmarker
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: 'GPU'
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
  demosVisible.value = true;
}

// Image Detection
async function handleClick(event: MouseEvent) {
  if (!faceLandmarker) {
    console.log('在点击前请等待 FaceLandmarker 加载完成!');
    return;
  }

  if (runningMode === 'VIDEO') {
    runningMode = 'IMAGE';
    await faceLandmarker.setOptions({ runningMode });
  }

  const imageContainer = imageContainerRef.value;
  if (!imageContainer) return;

  // Remove previous canvases
  const allCanvas = imageContainer.getElementsByClassName('canvas');
  for (let i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode?.removeChild(n);
  }

  const target = event.target as HTMLImageElement;
  const faceLandmarkerResult = faceLandmarker.detect(target);

  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.setAttribute('class', 'canvas');
  canvas.setAttribute('width', target.naturalWidth + 'px');
  canvas.setAttribute('height', target.naturalHeight + 'px');
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = `${target.width}px`;
  canvas.style.height = `${target.height}px`;

  imageContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of faceLandmarkerResult.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#30FF30' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: '#30FF30' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#E0E0E0' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: '#30FF30' });
    }
  }
  drawBlendShapes(faceLandmarkerResult.faceBlendshapes, 'image');
}

// Webcam Detection
async function enableCam() {
  if (!faceLandmarker) {
    console.log('等等! FaceLandmarker 还没有加载完成。');
    return;
  }

  webcamRunning.value = !webcamRunning.value;

  if (webcamRunning.value) {
    const constraints = { video: true };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoRef.value!.srcObject = stream;
    videoRef.value!.addEventListener('loadeddata', predictWebcam);
  } else {
    stream?.getTracks().forEach(track => track.stop());
  }
}

let lastVideoTime = -1;
async function predictWebcam() {
  const video = videoRef.value;
  const canvasElement = canvasElementRef.value;
  if (!video || !canvasElement || !webcamRunning.value) {
    return;
  }
  
  const canvasCtx = canvasElement.getContext('2d');
  if (!canvasCtx) return;

  const radio = video.videoHeight / video.videoWidth;
  video.style.width = videoWidth + 'px';
  video.style.height = videoWidth * radio + 'px';
  canvasElement.style.width = video.style.width;
  canvasElement.style.height = video.style.height;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;

  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await faceLandmarker!.setOptions({ runningMode: runningMode });
  }

  let startTimeMs = performance.now();
  let results: any;
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker!.detectForVideo(video, startTimeMs);
  }

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results && results.faceLandmarks) {
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: '#30FF30' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: '#30FF30' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#E0E0E0' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: '#E0E0E0' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: '#FF3030' });
      drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: '#30FF30' });
    }
  }

  if (results) {
    drawBlendShapes(results.faceBlendshapes, 'video');
  }

  if (webcamRunning.value) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// Draw Blend Shapes
function drawBlendShapes(blendShapes: any[], type: 'image' | 'video') {
  if (!blendShapes || !blendShapes.length) {
    if (type === 'image') imageBlendShapesData.value = [];
    else videoBlendShapesData.value = [];
    return;
  }

  const shapes = blendShapes[0].categories.map((shape: any) => ({
    displayName: shape.displayName || shape.categoryName,
    score: (+shape.score).toFixed(4)
  }));

  if (type === 'image') {
    imageBlendShapesData.value = shapes;
  } else {
    videoBlendShapesData.value = shapes;
  }
}

onMounted(() => {
  createFaceLandmarker();
});

onBeforeUnmount(() => {
  webcamRunning.value = false;
  stream?.getTracks().forEach(track => track.stop());
  if (faceLandmarker) {
    faceLandmarker.close();
  }
});

</script>

<style lang="scss" scoped>
.face-landmarker-demo {
  font-family: helvetica, arial, sans-serif;
  margin: 2em;
  color: #3d3d3d;
}

h1 {
  font-style: italic;
  color: #007f8b;
}

h2 {
  clear: both;
}

video {
  clear: both;
  display: block;
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
}

section {
  opacity: 1;
  transition: opacity 500ms ease-in-out;
}

.removed {
  display: none;
}

.invisible {
  opacity: 0.2;
}

.videoView,
.detectOnClick,
.blend-shapes {
  position: relative;
  float: left;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
}

.videoView p,
.detectOnClick p {
  position: absolute;
  padding: 5px;
  background-color: #007f8b;
  color: #fff;
  border: 1px dashed rgba(255, 255, 255, 0.7);
  z-index: 2;
  font-size: 12px;
  margin: 0;
}

.canvas {
  z-index: 1;
  position: absolute;
  pointer-events: none;
}

.output_canvas {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
  position: absolute;
  left: 0px;
  top: 0px;
}

.detectOnClick {
  z-index: 0;
}

.detectOnClick img {
  width: 100%;
}

.blend-shapes-item {
  display: flex;
  align-items: center;
  height: 20px;
  list-style-type: none;
}

.blend-shapes-label {
  display: flex;
  width: 120px;
  justify-content: flex-end;
  align-items: center;
  margin-right: 4px;
}

.blend-shapes-value {
  display: flex;
  height: 16px;
  align-items: center;
  background-color: #007f8b;
  color: white;
  padding: 0 4px;
}

#webcamButton {
  padding: 10px;
  background-color: #007f8b;
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;

  &:hover {
    background-color: #005f6b;
  }
}
</style> 