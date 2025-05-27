import { setEffect } from "../StateManager.js";

let lastGesture = null;

/**
 * Riconosce gesto da landmarks e aggiorna l'effetto attivo
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // 1. 🧲 Pinch: pollice vicino all’indice
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
    setEffect(2);
  } else if (isPointing) {
    gesture = "point";
    setEffect(3);
  } else if (allFingersUp) {
    gesture = "palm";
    setEffect(1);
  }

  if (gesture && gesture !== lastGesture) {
    lastGesture = gesture;
    console.log("🧠 Gesto rilevato:", gesture);
  }
}
