import { setEffect } from "../StateManager.js";

let lastGesture = null;
let lockedGesture = null;
let resetStartTime = 0;
let isInResetPose = false;

// Configuration
const RESET_HOLD_TIME = 1500; // Increased to 1.5s for more deliberate reset
const PALM_FRONTALITY_THRESHOLD = 0.6; // Lowered for more forgiving palm detection
const RESET_STABILITY_FRAMES = 5; // Kept same for consistency
const MOVEMENT_THRESHOLD = 0.03; // Slightly increased for stability
const MIN_FINGER_SPREAD = 0.07; // Slightly reduced for easier spread detection

let resetStabilityCounter = 0;
let wristPositionBuffer = []; // Buffer for averaging wrist position
const POSITION_BUFFER_SIZE = 5; // Number of frames to average for stability

/**
 * Riconosce gesto da landmarks, con sistema di lock/reset
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    console.warn("⚠️ Landmarks non validi o insufficienti");
    return;
  }
  
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Check for reset gesture first
  const resetDetected = checkResetGesture(landmarks, wrist, thumbTip, indexTip, middleTip, ringTip, pinkyTip);
  
  if (resetDetected) {
    handleResetGesture();
    return; // Don't detect other gestures during reset
  } else {
    // Reset the reset counter if we're not in reset pose
    resetStartTime = 0;
    isInResetPose = false;
    resetStabilityCounter = 0;
    wristPositionBuffer = []; // Clear buffer when not in reset
  }
  
  // If we have a locked gesture, don't detect new ones
  if (lockedGesture) {
    return;
  }
  
  // Normal gesture detection
  const detectedGesture = detectNormalGestures(landmarks, wrist, thumbTip, indexTip, middleTip, ringTip, pinkyTip);
  
  if (detectedGesture && detectedGesture !== lastGesture) {
    lastGesture = detectedGesture;
    lockedGesture = detectedGesture;
    console.log("🧠 Gesto rilevato e bloccato:", detectedGesture);
    console.log("✋ Per sbloccare, mostra il palmo frontale per 1.5 secondi");
    setEffect(detectedGesture === "palm" ? 1 : detectedGesture === "point" ? 3 : 2);
  }
}

/**
 * Detect normal gestures (pinch, point, palm)
 */
function detectNormalGestures(landmarks, wrist, thumbTip, indexTip, middleTip, ringTip, pinkyTip) {
  // 1. 🧲 Pinch: pollice vicino all'indice
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y; 
  const pinchDistance = Math.sqrt(dx * dx + dy * dy);
  const isPinching = pinchDistance < 0.07;
  
  // 2. ✋ Palm: tutte le dita sopra al polso
  const fingers = [indexTip, middleTip, ringTip, pinkyTip];
  const allFingersUp = fingers.every(f => f.y < wrist.y);
  
  // 3. 👉 Point: solo indice su, le altre giù
  const isIndexUp = indexTip.y < wrist.y;
  const othersDown = [middleTip, ringTip, pinkyTip].every(f => f.y > wrist.y);
  const isPointing = isIndexUp && othersDown;
  
  let gesture = null;
  
  if (isPinching) {
    gesture = "pinch";
  } else if (isPointing) {
    gesture = "point";
  } else if (allFingersUp) {
    gesture = "palm";
  }
  
  // Debug gesture detection
  if (gesture) {
    console.debug(`👀 Gesto rilevato: ${gesture}`);
  }
  
  return gesture;
}

/**
 * Check if user is showing reset gesture (frontal palm)
 */
function checkResetGesture(landmarks, wrist, thumbTip, indexTip, middleTip, ringTip, pinkyTip) {
  // Basic palm check: all fingers up
  const fingers = [indexTip, middleTip, ringTip, pinkyTip];
  const allFingersUp = fingers.every(f => f.y < wrist.y);
  const thumbUp = thumbTip.y < wrist.y;
  
  if (!allFingersUp || !thumbUp) {
    console.debug("🚫 Reset non valido: dita o pollice non in posizione");
    return false;
  }
  
  // Check palm frontality (hand facing the camera)
  const palmFrontality = calculatePalmFrontality(landmarks);
  const isFrontal = palmFrontality > PALM_FRONTALITY_THRESHOLD;
  
  if (!isFrontal) {
    console.debug(`🚫 Reset non valido: palmo non frontale (${palmFrontality.toFixed(2)} < ${PALM_FRONTALITY_THRESHOLD})`);
    return false;
  }
  
  // Check hand stability (not moving much)
  const isStable = checkHandStability(landmarks);
  
  if (!isStable) {
    console.debug("🚫 Reset non valido: mano non stabile");
    return false;
  }
  
  // Check finger spread (fingers should be spread apart)
  const isSpread = checkFingerSpread(landmarks);
  
  if (!isSpread) {
    console.debug("🚫 Reset non valido: dita non sufficientemente aperte");
    return false;
  }
  
  const isValidResetPose = allFingersUp && thumbUp && isFrontal && isStable && isSpread;
  
  if (isValidResetPose) {
    resetStabilityCounter++;
    console.debug(`✅ Reset pose valida, frame ${resetStabilityCounter}/${RESET_STABILITY_FRAMES}`);
    return resetStabilityCounter >= RESET_STABILITY_FRAMES;
  } else {
    resetStabilityCounter = 0;
    return false;
  }
}

/**
 * Calculate how frontal the palm is (0 = side view, 1 = front view)
 */
function calculatePalmFrontality(landmarks) {
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  const indexMCP = landmarks[5];
  const pinkyMCP = landmarks[17];
  
  // Vector from wrist to middle MCP (palm direction)
  const palmVector = {
    x: middleMCP.x - wrist.x,
    y: middleMCP.y - wrist.y,
    z: (middleMCP.z || 0) - (wrist.z || 0)
  };
  
  // Vector across the palm (index to pinky MCP)
  const palmWidth = {
    x: pinkyMCP.x - indexMCP.x,
    y: pinkyMCP.y - indexMCP.y,
    z: (pinkyMCP.z || 0) - (indexMCP.z || 0)
  };
  
  // Cross product to get palm normal
  const normal = {
    x: palmVector.y * palmWidth.z - palmVector.z * palmWidth.y,
    y: palmVector.z * palmWidth.x - palmVector.x * palmWidth.z,
    z: palmVector.x * palmWidth.y - palmVector.y * palmWidth.x
  };
  
  // Normalize
  const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  if (normalLength === 0) {
    console.debug("⚠️ Normal length zero in palm frontality");
    return 0;
  }
  
  normal.x /= normalLength;
  normal.y /= normalLength;
  normal.z /= normalLength;
  
  // Camera is looking down negative Z axis
  // Front-facing palm should have normal pointing toward camera (positive Z)
  const frontality = Math.abs(normal.z);
  
  return frontality;
}

/**
 * Check if hand is stable (not moving much)
 */
function checkHandStability(landmarks) {
  const wrist = landmarks[0];
  const currentPosition = { x: wrist.x, y: wrist.y, z: wrist.z || 0 };
  
  wristPositionBuffer.push(currentPosition);
  if (wristPositionBuffer.length > POSITION_BUFFER_SIZE) {
    wristPositionBuffer.shift();
  }
  
  if (wristPositionBuffer.length < POSITION_BUFFER_SIZE) {
    return false; // Wait until buffer is full
  }
  
  // Calculate average position
  const avgPosition = wristPositionBuffer.reduce(
    (acc, pos) => ({
      x: acc.x + pos.x / POSITION_BUFFER_SIZE,
      y: acc.y + pos.y / POSITION_BUFFER_SIZE,
      z: acc.z + pos.z / POSITION_BUFFER_SIZE
    }),
    { x: 0, y: 0, z: 0 }
  );
  
  // Calculate max deviation from average
  const maxDeviation = wristPositionBuffer.reduce((max, pos) => {
    const dev = Math.sqrt(
      Math.pow(pos.x - avgPosition.x, 2) +
      Math.pow(pos.y - avgPosition.y, 2) +
      Math.pow(pos.z - avgPosition.z, 2)
    );
    return Math.max(max, dev);
  }, 0);
  
  return maxDeviation < MOVEMENT_THRESHOLD;
}

/**
 * Check if fingers are spread apart (open palm)
 */
function checkFingerSpread(landmarks) {
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Calculate distances between adjacent fingers
  const distances = [
    Math.sqrt(Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)),
    Math.sqrt(Math.pow(middleTip.x - ringTip.x, 2) + Math.pow(middleTip.y - ringTip.y, 2)),
    Math.sqrt(Math.pow(ringTip.x - pinkyTip.x, 2) + Math.pow(ringTip.y - pinkyTip.y, 2))
  ];
  
  const averageSpread = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
  
  // Fingers should be reasonably spread apart
  return averageSpread > MIN_FINGER_SPREAD;
}

/**
 * Handle the reset gesture timing and execution
 */
function handleResetGesture() {
  const currentTime = Date.now();
  
  if (!isInResetPose) {
    // Starting reset pose
    isInResetPose = true;
    resetStartTime = currentTime;
    console.log("🔄 Iniziando reset gesture...");
  } else {
    // Continue reset pose
    const holdTime = currentTime - resetStartTime;
    const progress = Math.min(holdTime / RESET_HOLD_TIME, 1);
    
    // Show progress (you could emit this to UI)
    if (holdTime % 200 < 50) { // Every 200ms, show progress for 50ms
      console.log("🔄 Reset progress:", Math.round(progress * 100) + "%");
    }
    
    if (holdTime >= RESET_HOLD_TIME) {
      // Reset completed!
      executeReset();
    }
  }
}

/**
 * Execute the reset - unlock gestures
 */
function executeReset() {
  console.log("✅ Reset completato! Gesti sbloccati.");
  
  lockedGesture = null;
  lastGesture = null;
  resetStartTime = 0;
  isInResetPose = false;
  resetStabilityCounter = 0;
  wristPositionBuffer = [];
  
  // Return to default effect
  setEffect(1);
}

/**
 * Get current gesture lock status (for external use)
 */
export function getGestureLockStatus() {
  return {
    isLocked: lockedGesture !== null,
    lockedGesture: lockedGesture,
    isInReset: isInResetPose,
    resetProgress: isInResetPose ? Math.min((Date.now() - resetStartTime) / RESET_HOLD_TIME, 1) : 0
  };
}

/**
 * Force unlock (for debugging/testing)
 */
export function forceUnlock() {
  console.log("🔓 Force unlock gesti");
  executeReset();
}