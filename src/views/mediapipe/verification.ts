// 面部关键点索引 (基于MediaPipe的468点模型)
const LANDMARK_INDICES = {
  LEFT_EYE: [33, 160, 159, 158, 133, 153],   // 左眼轮廓关键点
  RIGHT_EYE: [362, 385, 386, 387, 263, 373], // 右眼轮廓关键点
  MOUTH: [61, 291, 0, 17, 13, 14],           // 嘴部区域关键点
  NOSE_TIP: 1,                               // 鼻尖关键点
  FOREHEAD: 10,                              // 额头中心关键点
  CHIN: 152                                  // 下巴关键点
};

/**
 * 计算两点之间的欧几里得距离
 * @param p1 第一个点 {x, y}
 * @param p2 第二个点 {x, y}
 * @returns 两点之间的距离
 */
function distance(p1: {x: number, y: number}, p2: {x: number, y: number}): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * 检测眨眼动作
 * 原理：通过计算眼睛垂直开合度与眼宽的比值来判断
 * @param landmarks 面部关键点数组
 * @returns 如果检测到眨眼返回true，否则false
 */
export function detectBlink(landmarks: any[]): boolean {
  // 定义眼部关键点索引
  const LEFT_EYE_TOP = 159;    // 左眼上眼皮中心
  const LEFT_EYE_BOTTOM = 145; // 左眼下眼皮中心
  const RIGHT_EYE_TOP = 386;   // 右眼上眼皮中心
  const RIGHT_EYE_BOTTOM = 374; // 右眼下眼皮中心
  
  // 计算眼睛垂直开合度
  const leftEyeOpenness = Math.abs(
    landmarks[LEFT_EYE_TOP].y - landmarks[LEFT_EYE_BOTTOM].y
  );
  const rightEyeOpenness = Math.abs(
    landmarks[RIGHT_EYE_TOP].y - landmarks[RIGHT_EYE_BOTTOM].y
  );
  
  // 计算参考距离 (眼宽)
  const eyeWidth = Math.abs(landmarks[33].x - landmarks[263].x);
  
  // 标准化开合度 (消除人脸大小差异)
  const normalizedLeft = leftEyeOpenness / eyeWidth;
  const normalizedRight = rightEyeOpenness / eyeWidth;
  
  // 开合度低于阈值表示眨眼
  return (normalizedLeft + normalizedRight) / 2 < 0.1;
}

/**
 * 检测张嘴动作
 * 原理：通过计算嘴部垂直开合度与嘴宽的比值来判断
 * @param landmarks 面部关键点数组
 * @returns 如果检测到张嘴返回true，否则false
 */
export function detectMouthOpen(landmarks: any[]): boolean {
  // 定义嘴部关键点索引
  const UPPER_LIP = 13;    // 上嘴唇中心
  const LOWER_LIP = 14;    // 下嘴唇中心
  const MOUTH_LEFT = 61;   // 左嘴角
  const MOUTH_RIGHT = 291; // 右嘴角
  const UPPER_LIP_TOP = 0; // 上嘴唇顶部
  const LOWER_LIP_BOTTOM = 17; // 下嘴唇底部

  // 计算垂直距离 (上嘴唇中心到下嘴唇中心)
  const verticalCenter = distance(landmarks[UPPER_LIP], landmarks[LOWER_LIP]);
  
  // 计算最大垂直距离 (上嘴唇顶部到下嘴唇底部)
  const verticalMax = distance(landmarks[UPPER_LIP_TOP], landmarks[LOWER_LIP_BOTTOM]);
  
  // 计算水平距离 (左嘴角到右嘴角)
  const horizontal = distance(landmarks[MOUTH_LEFT], landmarks[MOUTH_RIGHT]);
  
  // 计算嘴巴开合度比例
  const ratio = verticalMax / horizontal;
  
  // 计算中心点开合度比例 (辅助验证)
  const centerRatio = verticalCenter / horizontal;
  
  // 双条件检测确保准确性
  return ratio > 0.4 && centerRatio > 0.3;
}

/**
 * 计算双眼中心点
 * @param landmarks 面部关键点数组
 * @returns 双眼中心点坐标 {x, y}
 */
function getEyeMidpoint(landmarks: any[]) {
  // 计算左眼中心
  const leftEyeCenter = {
    x: (landmarks[33].x + landmarks[133].x) / 2,
    y: (landmarks[33].y + landmarks[133].y) / 2
  };
  
  // 计算右眼中心
  const rightEyeCenter = {
    x: (landmarks[362].x + landmarks[263].x) / 2,
    y: (landmarks[362].y + landmarks[263].y) / 2
  };
  
  // 返回双眼中心点
  return {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2
  };
}

/**
 * 检测向左转头动作
 * 原理：通过计算鼻子相对于双眼中心的水平偏移比例来判断
 * @param landmarks 面部关键点数组
 * @returns 如果检测到向左转头返回true，否则false
 */
export function detectHeadLeft(landmarks: any[]): boolean {
  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const eyeMidpoint = getEyeMidpoint(landmarks);
  
  // 计算水平偏移量 (考虑镜像)
  const horizontalOffset = (eyeMidpoint.x - nose.x) * -1;
  
  // 计算参考距离 (眼距)
  const eyeDistance = distance(landmarks[33], landmarks[263]);
  
  // 计算偏移比例 (归一化处理)
  const offsetRatio = horizontalOffset / eyeDistance;
  
  // 阈值检测 (需要显著偏移)
  return offsetRatio > 0.15;
}

/**
 * 检测向右转头动作
 * 原理：通过计算鼻子相对于双眼中心的水平偏移比例来判断
 * @param landmarks 面部关键点数组
 * @returns 如果检测到向右转头返回true，否则false
 */
export function detectHeadRight(landmarks: any[]): boolean {
  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const eyeMidpoint = getEyeMidpoint(landmarks);
  
  // 计算水平偏移量 (考虑镜像)
  const horizontalOffset = (nose.x - eyeMidpoint.x) * -1;
  
  // 计算参考距离 (眼距)
  const eyeDistance = distance(landmarks[33], landmarks[263]);
  
  // 计算偏移比例 (归一化处理)
  const offsetRatio = horizontalOffset / eyeDistance;
  
  // 阈值检测 (需要显著偏移)
  return offsetRatio > 0.25;
}

/**
 * 检测抬头动作
 * 原理：通过计算鼻尖相对于双眼中心的垂直偏移比例来判断
 * 注意：坐标系Y轴向下为正（值越大表示位置越靠下）
 * @param landmarks 面部关键点数组
 * @returns 如果检测到抬头返回true，否则false
 */
export function detectHeadUp(landmarks: any[]): boolean {
  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  
  // 计算双眼中心点
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };

  // 关键计算：鼻尖Y坐标 - 眼睛中心Y坐标
  const verticalDistance = nose.y - eyeCenter.y;
  
  // 计算眼距（归一化基准）
  const eyeDistance = distance(leftEye, rightEye);
  
  // 计算垂直偏移比例
  const ratio = verticalDistance / eyeDistance;
  
  // 当头部上抬时：
  // - 鼻尖Y坐标减小（向上移动）
  // - verticalDistance值减小
  // - ratio值减小
  return ratio < 0.2;
}

/**
 * 检测低头动作
 * 原理：通过计算鼻尖相对于双眼中心的垂直偏移比例来判断
 * 注意：坐标系Y轴向下为正（值越大表示位置越靠下）
 * @param landmarks 面部关键点数组
 * @returns 如果检测到低头返回true，否则false
 */
export function detectHeadDown(landmarks: any[]): boolean {
  const nose = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  
  // 计算双眼中心点
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };

  // 关键计算：鼻尖Y坐标 - 眼睛中心Y坐标
  const verticalDistance = nose.y - eyeCenter.y;
  
  // 计算眼距（归一化基准）
  const eyeDistance = distance(leftEye, rightEye);
  
  // 计算垂直偏移比例
  const ratio = verticalDistance / eyeDistance;
  
  // 当头部低下时：
  // - 鼻尖Y坐标增大（向下移动）
  // - verticalDistance值增大
  // - ratio值增大
  return ratio > 0.65;
}