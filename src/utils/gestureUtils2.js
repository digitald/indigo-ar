// CLAUDE

import { setEffect } from "../StateManager.js";

let lastGesture = null;
let gestureHistory = [];
let gestureConfidence = 0;
let stabilityCounter = 0;
let lastValidGesture = null;

// Configuration constants for fine-tuning
const PINCH_THRESHOLD = 0.08;
const PINCH_THRESHOLD_HYSTERESIS = 0.05;
const STABILITY_FRAMES = 3;
const CONFIDENCE_THRESHOLD = 0.7;
const HISTORY_LENGTH = 5;

/**
 * Enhanced gesture recognition with stability filtering and confidence scoring
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  const indexTip = landmarks[8];
  const indexPIP = landmarks[6];
  const indexMCP = landmarks[5];
  const middleTip = landmarks[12];
  const middlePIP = landmarks[10];
  const ringTip = landmarks[16];
  const ringPIP = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPIP = landmarks[18];

  // Enhanced gesture detection with multiple criteria
  const gestures = {
    pinch: detectPinchGesture(thumbTip, thumbIP, indexTip, indexPIP, wrist),
    point: detectPointGesture(landmarks, wrist),
    palm: detectPalmGesture(landmarks, wrist)
  };

  // Calculate confidence scores
  const gestureScores = Object.entries(gestures).map(([name, data]) => ({
    name,
    confidence: data.confidence,
    active: data.active
  }));

  // Find the most confident gesture
  const bestGesture = gestureScores
    .filter(g => g.active)
    .sort((a, b) => b.confidence - a.confidence)[0];

  const currentGesture = bestGesture?.name || null;
  
  // Add to history for stability analysis
  gestureHistory.push(currentGesture);
  if (gestureHistory.length > HISTORY_LENGTH) {
    gestureHistory.shift();
  }

  // Calculate stability and confidence
  const stableGesture = getStableGesture();
  
  if (stableGesture && stableGesture !== lastGesture) {
    lastGesture = stableGesture;
    lastValidGesture = stableGesture;
    
    // Apply effect with enhanced feedback
    applyGestureEffect(stableGesture, bestGesture?.confidence || 0);
    
    console.log(`🧠 Gesto rilevato: ${stableGesture} (confidence: ${(bestGesture?.confidence || 0).toFixed(2)})`);
  }
}

/**
 * Enhanced pinch detection with angle analysis and hysteresis
 */
function detectPinchGesture(thumbTip, thumbIP, indexTip, indexPIP, wrist) {
  // Distance-based detection
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const dz = (thumbTip.z || 0) - (indexTip.z || 0);
  const pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Hysteresis for stability
  const threshold = lastGesture === "pinch" ? PINCH_THRESHOLD_HYSTERESIS : PINCH_THRESHOLD;
  const distanceScore = Math.max(0, 1 - (pinchDistance / threshold));
  
  // Angle analysis - thumb and index should be approaching each other
  const thumbVector = {
    x: thumbTip.x - thumbIP.x,
    y: thumbTip.y - thumbIP.y
  };
  const indexVector = {
    x: indexTip.x - indexPIP.x,
    y: indexTip.y - indexPIP.y
  };
  
  // Dot product to measure alignment
  const dot = thumbVector.x * (-indexVector.x) + thumbVector.y * (-indexVector.y);
  const thumbMag = Math.sqrt(thumbVector.x * thumbVector.x + thumbVector.y * thumbVector.y);
  const indexMag = Math.sqrt(indexVector.x * indexVector.x + indexVector.y * indexVector.y);
  const alignment = Math.max(0, dot / (thumbMag * indexMag + 0.001));
  
  // Position relative to wrist
  const handSize = getHandSize(wrist, { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 });
  const normalizedDistance = pinchDistance / handSize;
  const positionScore = Math.max(0, 1 - normalizedDistance * 2);
  
  const confidence = (distanceScore * 0.6 + alignment * 0.3 + positionScore * 0.1);
  
  return {
    active: pinchDistance < threshold && confidence > 0.4,
    confidence: confidence
  };
}

/**
 * Enhanced point detection with finger curl analysis
 */
function detectPointGesture(landmarks, wrist) {
  const indexTip = landmarks[8];
  const indexPIP = landmarks[6];
  const indexMCP = landmarks[5];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Index finger extension analysis
  const indexExtended = isFingerExtended(landmarks, 8) && indexTip.y < wrist.y - 0.05;
  
  // Other fingers curl analysis
  const middleCurled = isFingerCurled(landmarks, 12);
  const ringCurled = isFingerCurled(landmarks, 16);
  const pinkyCurled = isFingerCurled(landmarks, 20);
  
  // Thumb position (should be relaxed, not extended)
  const thumbRelaxed = landmarks[4].y > landmarks[3].y - 0.02;
  
  const curlScore = [middleCurled, ringCurled, pinkyCurled].filter(Boolean).length / 3;
  const extensionScore = indexExtended ? 1 : 0;
  const thumbScore = thumbRelaxed ? 0.8 : 0.3;
  
  const confidence = (extensionScore * 0.5 + curlScore * 0.3 + thumbScore * 0.2);
  
  return {
    active: indexExtended && curlScore > 0.6 && confidence > 0.5,
    confidence: confidence
  };
}

/**
 * Enhanced palm detection with finger spread analysis
 */
function detectPalmGesture(landmarks, wrist) {
  const fingerTips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const thumbTip = landmarks[4];
  
  // All fingers above wrist
  const fingersUp = fingerTips.every(tip => tip.y < wrist.y - 0.02);
  const thumbUp = thumbTip.y < wrist.y;
  
  // Finger spread analysis
  const spreadScore = calculateFingerSpread(landmarks);
  
  // Extension analysis for each finger
  const extensionScores = [
    isFingerExtended(landmarks, 8) ? 1 : 0,
    isFingerExtended(landmarks, 12) ? 1 : 0,
    isFingerExtended(landmarks, 16) ? 1 : 0,
    isFingerExtended(landmarks, 20) ? 1 : 0
  ];
  const avgExtension = extensionScores.reduce((a, b) => a + b, 0) / 4;
  
  // Hand orientation (palm should face forward/camera)
  const orientationScore = calculatePalmOrientation(landmarks);
  
  const confidence = (
    (fingersUp ? 0.4 : 0) +
    (thumbUp ? 0.2 : 0) +
    avgExtension * 0.25 +
    spreadScore * 0.1 +
    orientationScore * 0.05
  );
  
  return {
    active: fingersUp && thumbUp && avgExtension > 0.6 && confidence > 0.6,
    confidence: confidence
  };
}

/**
 * Analyze if a finger is extended based on joint angles
 */
function isFingerExtended(landmarks, tipIndex) {
  const fingerJoints = getFingerJoints(tipIndex);
  const tip = landmarks[fingerJoints.tip];
  const pip = landmarks[fingerJoints.pip];
  const mcp = landmarks[fingerJoints.mcp];
  
  // Calculate angle between segments
  const segment1 = { x: pip.x - mcp.x, y: pip.y - mcp.y };
  const segment2 = { x: tip.x - pip.x, y: tip.y - pip.y };
  
  const dot = segment1.x * segment2.x + segment1.y * segment2.y;
  const mag1 = Math.sqrt(segment1.x * segment1.x + segment1.y * segment1.y);
  const mag2 = Math.sqrt(segment2.x * segment2.x + segment2.y * segment2.y);
  
  const angle = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2 + 0.001))));
  
  // Extended if angle is close to straight (π radians)
  return angle > Math.PI * 0.6;
}

/**
 * Analyze if a finger is curled
 */
function isFingerCurled(landmarks, tipIndex) {
  return !isFingerExtended(landmarks, tipIndex);
}

/**
 * Calculate finger spread for palm detection
 */
function calculateFingerSpread(landmarks) {
  const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  let totalDistance = 0;
  let pairs = 0;
  
  for (let i = 0; i < tips.length - 1; i++) {
    const dx = tips[i].x - tips[i + 1].x;
    const dy = tips[i].y - tips[i + 1].y;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
    pairs++;
  }
  
  const avgSpread = totalDistance / pairs;
  return Math.min(1, avgSpread * 5); // Normalize to 0-1
}

/**
 * Calculate palm orientation score
 */
function calculatePalmOrientation(landmarks) {
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  
  // Simple orientation based on wrist-to-middle-MCP vector
  const palmVector = { x: middleMCP.x - wrist.x, y: middleMCP.y - wrist.y };
  const palmLength = Math.sqrt(palmVector.x * palmVector.x + palmVector.y * palmVector.y);
  
  // Normalized score based on vertical component
  return Math.max(0, -palmVector.y / palmLength);
}

/**
 * Get finger joint indices based on tip index
 */
function getFingerJoints(tipIndex) {
  const jointMap = {
    8: { tip: 8, pip: 6, mcp: 5 },   // Index
    12: { tip: 12, pip: 10, mcp: 9 }, // Middle
    16: { tip: 16, pip: 14, mcp: 13 }, // Ring
    20: { tip: 20, pip: 18, mcp: 17 }  // Pinky
  };
  return jointMap[tipIndex];
}

/**
 * Calculate hand size for normalization
 */
function getHandSize(wrist, referencePoint) {
  const dx = wrist.x - referencePoint.x;
  const dy = wrist.y - referencePoint.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine stable gesture from history
 */
function getStableGesture() {
  if (gestureHistory.length < STABILITY_FRAMES) return null;
  
  // Count occurrences of each gesture in recent history
  const recentHistory = gestureHistory.slice(-STABILITY_FRAMES);
  const counts = {};
  
  recentHistory.forEach(gesture => {
    if (gesture) {
      counts[gesture] = (counts[gesture] || 0) + 1;
    }
  });
  
  // Find most frequent gesture
  const mostFrequent = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (mostFrequent && mostFrequent[1] >= Math.ceil(STABILITY_FRAMES * 0.6)) {
    return mostFrequent[0];
  }
  
  return null;
}

/**
 * Apply gesture effect with enhanced feedback
 */
function applyGestureEffect(gesture, confidence) {
  const effectMap = {
    "pinch": 2,
    "point": 3,
    "palm": 1
  };
  
  const effectId = effectMap[gesture];
  if (effectId) {
    setEffect(effectId);
    
    // Add haptic feedback simulation (visual feedback)
    if (confidence > 0.8) {
      console.log(`✨ High confidence gesture: ${gesture}`);
    }
  }
}