// Unified Manager - StateManager + EffectManager + GestureUtils
// File unico che gestisce stato, effetti e gesture

// ===== STATE MANAGER =====
const state = {
  effect: 1,             // Effetto attivo (1 = anelli, 2 = fiore, 3 = trail)
  landmarks: null,       // Ultimi hand landmarks
};

const listeners = new Set();

/**
 * 🔄 Ottieni lo stato corrente
 */
function getState() {
  return { ...state };
}

/**
 * 🧩 Imposta l'effetto attivo
 */
function setEffect(effectId) {
  if (state.effect !== effectId) {
    state.effect = effectId;
    notify();
  }
}

/**
 * 🤝 Aggiorna i landmarks della mano
 */
function setLandmarks(landmarks) {
  state.landmarks = landmarks;
  notify();
}

/**
 * 👂 Sottoscrivi cambiamenti di stato
 */
function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback); // per rimuovere la subscription
}

/**
 * 🔔 Notifica tutti gli ascoltatori
 */
function notify() {
  for (const callback of listeners) {
    callback(getState());
  }
}

// ===== EFFECT MANAGER =====
let currentModule = null;
let currentId = null;
let currentScene = null;

// Oggetto contenitore per tutti gli effetti
const Effects = {};

/**
 * Registra gli effetti nell'oggetto Effects
 */
function registerEffect(id, effectModule) {
  Effects[id] = effectModule;
}

/**
 * Inizializza il gestore degli effetti.
 * Passa la scena di Three.js per iniettare/rimuovere gli oggetti.
 */
function initEffectManager(scene) {
  currentScene = scene;

  // Subscribe ai cambiamenti di stato
  subscribe((state) => {
    if (state.effect !== currentId) {
      switchEffect(state.effect);
    }

    if (currentModule && currentModule.update) {
      currentModule.update(state);
    }
  });
}

function switchEffect(id) {
  // Disponi l'effetto corrente
  if (currentModule && currentModule.dispose) {
    currentModule.dispose(currentScene);
  }

  currentId = id;
  currentModule = Effects[id] || null;

  // Inizializza il nuovo effetto
  if (currentModule && currentModule.init) {
    currentModule.init(currentScene);
  }
}

// ===== GESTURE UTILS =====
let lastGesture = null;

/**
 * Riconosce gesto da landmarks e aggiorna l'effetto attivo
 */
function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

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

// ===== ESPOSIZIONE GLOBALE =====

// StateManager globale
window.StateManager = {
  getState,
  setEffect,
  setLandmarks,
  subscribe
};

// EffectManager globale
window.EffectManager = {
  init: initEffectManager,
  switch: switchEffect,
  register: registerEffect
};

// GestureUtils globale
window.GestureUtils = {
  detectGesture
};

// ===== FUNZIONI DI UTILITÀ =====

/**
 * Inizializza tutto il sistema
 * @param {THREE.Scene} scene - La scena di Three.js
 */
function initUnifiedManager(scene) {
  // Inizializza l'EffectManager
  window.EffectManager.init(scene);
  console.log("✅ Unified Manager inizializzato");
}

/**
 * Cambia effetto direttamente
 * @param {number} effectId - ID dell'effetto (1, 2, 3)
 */
function changeEffect(effectId) {
  window.StateManager.setEffect(effectId);
  console.log(`🎨 Effetto cambiato a: ${effectId}`);
}

// Esponi le funzioni di utilità
window.UnifiedManager = {
  init: initUnifiedManager,
  changeEffect
};

// ===== ESEMPIO DI UTILIZZO =====
/*
// Nell'app principale:

// 1. Inizializza il sistema
window.UnifiedManager.init(scene);

// 2. Registra gli effetti
window.EffectManager.register(1, anelliEffect);
window.EffectManager.register(2, fioreEffect);  
window.EffectManager.register(3, trailEffect);

// 3. Cambia effetto manualmente
window.UnifiedManager.changeEffect(3); // Attiva l'effetto Lines

// 4. Oppure usa i gesture
window.GestureUtils.detectGesture(landmarks);

// 5. Subscribe ai cambiamenti
window.StateManager.subscribe((state) => {
  console.log("Stato aggiornato:", state);
});
*/