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
 * 🧩 Imposta l’effetto attivo
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
