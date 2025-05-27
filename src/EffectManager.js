// EffectManager.js - Versione senza import/export

let currentModule = null;
let currentId = null;
let currentScene = null;

// Oggetto contenitore per tutti gli effetti
const Effects = {};

// Registra gli effetti nell'oggetto Effects
function registerEffect(id, effectModule) {
  Effects[id] = effectModule;
}

/**
 * Inizializza il gestore degli effetti.
 * Passa la scena di Three.js per iniettare/rimuovere gli oggetti.
 */
function initEffectManager(scene) {
  currentScene = scene;

  // Assumendo che hai una funzione subscribe disponibile globalmente
  if (window.subscribe) {
    window.subscribe((state) => {
      if (state.effect !== currentId) {
        switchEffect(state.effect);
      }

      if (currentModule && currentModule.update) {
        currentModule.update(state);
      }
    });
  }
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

// Esponi le funzioni globalmente
window.EffectManager = {
  init: initEffectManager,
  switch: switchEffect,
  register: registerEffect
};