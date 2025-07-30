// 面部关键点索引 (基于MediaPipe的468点模型)
const LANDMARK_INDICES = {
  LEFT_EYE: [33, 160, 159, 158, 133, 153],   // 左眼轮廓关键点
  RIGHT_EYE: [362, 385, 386, 387, 263, 373], // 右眼轮廓关键点
  MOUTH: [61, 291, 0, 17, 13, 14],           // 嘴部区域关键点
  NOSE_TIP: 1,                               // 鼻尖关键点
  FOREHEAD: 10,                              // 额头中心关键点
  CHIN: 152                                  // 下巴关键点
};

// 眨眼检测状态管理 - 重构版本
interface BlinkState {
  isBlinking: boolean;
  blinkCount: number;
  lastBlinkTime: number;
  consecutiveBlinkCount: number;
  lastEyeOpenness: number;
  resetTimeout: number;
  baselineOpenness: number;  // 添加基线开合度
  samples: number[];        // 添加样本数组用于动态调整
}

let blinkState: BlinkState = {
  isBlinking: false,
  blinkCount: 0,
  lastBlinkTime: 0,
  consecutiveBlinkCount: 0,
  lastEyeOpenness: 0,
  resetTimeout: 0,
  baselineOpenness: 0,
  samples: []
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
 * 计算眼睛开合度
 * @param landmarks 面部关键点数组
 * @returns 标准化的眼睛开合度 (0-1之间)
 */
function calculateEyeOpenness(landmarks: any[]): number {
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
  
  // 返回平均开合度
  return (normalizedLeft + normalizedRight) / 2;
}

/**
 * 检测眨眼动作 - 重构版本
 * 使用更简洁可靠的检测逻辑
 * @param landmarks 面部关键点数组
 * @param requiredBlinkCount 需要的眨眼次数，默认为2
 * @returns 如果检测到足够的眨眼次数返回true，否则false
 */
export function detectBlink(landmarks: any[], requiredBlinkCount: number = 2): boolean {
  const currentTime = Date.now();
  const currentEyeOpenness = calculateEyeOpenness(landmarks);
  
  // 更新基线开合度（前10个样本的平均值）
  if (blinkState.samples.length < 10) {
    blinkState.samples.push(currentEyeOpenness);
    blinkState.baselineOpenness = blinkState.samples.reduce((a, b) => a + b, 0) / blinkState.samples.length;
  } else {
    // 保持最新的10个样本
    blinkState.samples.shift();
    blinkState.samples.push(currentEyeOpenness);
    blinkState.baselineOpenness = blinkState.samples.reduce((a, b) => a + b, 0) / blinkState.samples.length;
  }
  
  // 更智能的阈值计算
  const baseline = blinkState.baselineOpenness;
  const BLINK_THRESHOLD = Math.max(0.08, baseline * 0.6);    // 更宽松的眨眼阈值
  const OPEN_THRESHOLD = Math.max(0.09, baseline * 0.75);     // 更宽松的睁开阈值
  const RESET_TIMEOUT = 5000;    // 重置超时时间 (5秒)
  const BLINK_TIMEOUT = 800;     // 眨眼超时时间 (0.8秒) - 缩短时间
  
  // 检查是否需要重置连续计数
  if (currentTime - blinkState.lastBlinkTime > RESET_TIMEOUT) {
    blinkState.consecutiveBlinkCount = 0;
  }
  
  // 检查眨眼是否超时 - 如果眨眼状态持续太久，强制重置
  if (blinkState.isBlinking && (currentTime - blinkState.lastBlinkTime) > BLINK_TIMEOUT) {
    blinkState.isBlinking = false;
    if (process.env.NODE_ENV === 'development') {
      console.log('眨眼超时，强制重置状态');
    }
  }
  
  // 眨眼检测逻辑
  if (currentEyeOpenness < BLINK_THRESHOLD && !blinkState.isBlinking) {
    // 开始眨眼
    blinkState.isBlinking = true;
    blinkState.lastBlinkTime = currentTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('开始眨眼，开合度:', currentEyeOpenness.toFixed(3), '阈值:', BLINK_THRESHOLD.toFixed(3), '基线:', baseline.toFixed(3));
    }
  } else if (currentEyeOpenness > OPEN_THRESHOLD && blinkState.isBlinking) {
    // 眨眼结束
    blinkState.isBlinking = false;
    blinkState.consecutiveBlinkCount++;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`眨眼完成，连续次数: ${blinkState.consecutiveBlinkCount}, 开合度: ${currentEyeOpenness.toFixed(3)}`);
    }
    
    // 检查是否达到要求的眨眼次数
    if (blinkState.consecutiveBlinkCount >= requiredBlinkCount) {
      resetBlinkState();
      return true;
    }
  }
  
  // 添加调试信息 - 每2秒输出一次状态
  if (process.env.NODE_ENV === 'development' && currentTime % 2000 < 16) {
    console.log('眨眼检测状态:', {
      eyeOpenness: currentEyeOpenness.toFixed(3),
      baseline: baseline.toFixed(3),
      isBlinking: blinkState.isBlinking,
      consecutiveBlinkCount: blinkState.consecutiveBlinkCount,
      thresholds: { 
        blink: BLINK_THRESHOLD.toFixed(3), 
        open: OPEN_THRESHOLD.toFixed(3) 
      }
    });
  }
  
  return false;
}

/**
 * 重置眨眼检测状态
 */
export function resetBlinkState(): void {
  blinkState = {
    isBlinking: false,
    blinkCount: 0,
    lastBlinkTime: 0,
    consecutiveBlinkCount: 0,
    lastEyeOpenness: 0,
    resetTimeout: 0,
    baselineOpenness: 0,
    samples: []
  };
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
  const chin = landmarks[LANDMARK_INDICES.CHIN]; // 下巴关键点
  const forehead = landmarks[LANDMARK_INDICES.FOREHEAD]; // 额头关键点
  
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
  const noseRatio = verticalDistance / eyeDistance;
  
  // 计算下巴到眼睛中心的距离比例
  const chinToEyeDistance = chin.y - eyeCenter.y;
  const chinRatio = chinToEyeDistance / eyeDistance;
  
  // 计算额头到眼睛中心的距离比例
  const foreheadToEyeDistance = forehead.y - eyeCenter.y;
  const foreheadRatio = foreheadToEyeDistance / eyeDistance;
  
  // 计算鼻子到下巴的距离比例（用于判断整体面部倾斜）
  const noseToChinDistance = chin.y - nose.y;
  const noseToChinRatio = noseToChinDistance / eyeDistance;
  
  // 计算面部整体高度比例
  const faceHeight = chin.y - forehead.y;
  const faceHeightRatio = faceHeight / eyeDistance;
  
  // 优化后的检测逻辑 - 更严格的阈值
  // 当头部低下时：
  // - 鼻尖Y坐标增大（向下移动），noseRatio值增大
  // - 下巴也会向下移动，chinRatio值增大
  // - 额头会向上移动，foreheadRatio值减小
  
  // 主要条件：鼻尖向下偏移 - 提高阈值要求
  const noseCondition = noseRatio > 0.35; // 从0.2提高到0.35
  
  // 辅助条件1：下巴向下偏移 - 提高阈值要求
  const chinCondition = chinRatio > 0.6; // 从0.4提高到0.6
  
  // 辅助条件2：额头向上偏移 - 更严格的阈值
  const foreheadCondition = foreheadRatio < 0.1; // 从0.25降低到0.1
  
  // 新增条件：面部整体倾斜角度 - 更严格的阈值
  const faceTiltCondition = faceHeightRatio < 1.6; // 从2.0降低到1.6
  
  // 新增条件：鼻子到下巴的相对位置 - 提高阈值
  const noseChinCondition = noseToChinRatio > 0.4; // 从0.25提高到0.4
  
  // 新增条件：确保眼睛中心在面部上半部分
  const eyePositionCondition = eyeCenter.y < (forehead.y + chin.y) / 2;
  
  // 新增条件：确保额头位置合理（不会太低）
  const foreheadPositionCondition = forehead.y < eyeCenter.y;
  
  // 更严格的组合条件
  const mainCondition = noseCondition;
  const auxiliaryConditions = [
    chinCondition,
    foreheadCondition,
    faceTiltCondition,
    noseChinCondition,
    eyePositionCondition,
    foreheadPositionCondition
  ];
  
  const satisfiedAuxiliary = auxiliaryConditions.filter(Boolean).length;
  
  // 调试信息（开发模式下显示）
  if (process.env.NODE_ENV === 'development') {
    console.log('低头检测调试信息:', {
      noseRatio: noseRatio.toFixed(3),
      chinRatio: chinRatio.toFixed(3),
      foreheadRatio: foreheadRatio.toFixed(3),
      faceHeightRatio: faceHeightRatio.toFixed(3),
      noseToChinRatio: noseToChinRatio.toFixed(3),
      mainCondition,
      auxiliaryConditions: auxiliaryConditions.map((condition, index) => ({
        name: ['chin', 'forehead', 'faceTilt', 'noseChin', 'eyePosition', 'foreheadPosition'][index],
        satisfied: condition
      })),
      satisfiedAuxiliary,
      result: mainCondition && satisfiedAuxiliary >= 3
    });
  }
  
  // 主要条件满足且至少3个辅助条件满足（从1个提高到3个）
  return mainCondition && satisfiedAuxiliary >= 3;
}
