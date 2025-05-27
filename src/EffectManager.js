import * as Effect1 from './effects/effect5Rings.js';
import * as Effect2 from './effects/effect2Flower.js';
import * as Effect3 from './effects/effect6Lines.js';

import { subscribe } from './StateManager.js';

let currentModule = null;
let currentId = null;
let currentScene = null;

/**
 * Inizializza il gestore degli effetti.
 * Passa la scena di Three.js per iniettare/rimuovere gli oggetti.
 */
export function initEffectManager(scene) {
  currentScene = scene;

  subscribe((state) => {
    if (state.effect !== currentId) {
      switchEffect(state.effect);
    }

    if (currentModule) {
      currentModule.update(state);
    }
  });
}

function switchEffect(id) {
  if (currentModule?.dispose) {
    currentModule.dispose(currentScene);
  }

  currentId = id;

  switch (id) {
    case 1:
      currentModule = Effect1;
      break;
    case 2:
      currentModule = Effect2;
      break;
    case 3:
      currentModule = Effect3;
      break;
    default:
      currentModule = null;
  }

  if (currentModule?.init) {
    currentModule.init(currentScene);
  }
}
