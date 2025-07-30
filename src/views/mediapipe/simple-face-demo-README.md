# Simple Face Landmark Detection Demo

这是一个简化的人脸关键点检测演示，只包含视频/摄像头功能，基于您提供的MediaPipe代码重写。

## 功能特性

- 实时人脸关键点检测
- 面部轮廓、眼睛、眉毛、嘴唇等关键点绘制
- 面部混合形状（Blend Shapes）显示
- 简洁的UI设计

## 使用方法

1. 访问 `/simple-face-demo` 路由
2. 点击 "ENABLE WEBCAM" 按钮启用摄像头
3. 允许浏览器访问摄像头权限
4. 将面部对准摄像头，观察实时检测结果
5. 点击 "DISABLE WEBCAM" 按钮停止检测

## 技术实现

- 使用 MediaPipe FaceLandmarker 进行人脸检测
- 支持 GPU 加速（WebGL）
- 实时绘制面部关键点连接线
- 显示面部表情混合形状数据

## 与原始代码的区别

这个简化版本：
- 只保留了视频检测功能
- 移除了图片检测部分
- 简化了UI界面
- 保持了核心的MediaPipe功能

## 注意事项

- 需要现代浏览器支持（支持 WebGL 和 getUserMedia API）
- 首次加载需要下载模型文件，可能需要一些时间
- 建议在光线充足的环境下使用以获得更好的检测效果

## 依赖

- @mediapipe/tasks-vision: 0.10.22-rc.20250304
- Vue 3
- TypeScript 