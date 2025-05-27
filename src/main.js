import { initHandTracking, subscribeToLandmarks } from './tracking/handTracking.js';
import { initARCanvas, scene } from './ARCanvas.js';
import { setLandmarks } from './StateManager.js';
import { detectGesture } from './utils/gestureUtils.js'; // riprende il vecchio *******************************
import { initEffectManager } from './EffectManager.js';


import { subscribe } from './StateManager.js';

import { setupResponsiveVideo } from './utils/resizeVideo.js';





const video = document.getElementById('video');
setupResponsiveVideo(video);

window.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");

  // Avvia tracking mani
  initHandTracking(video);




  // Ogni frame: aggiorna lo stato + rileva gesto
  subscribeToLandmarks((landmarks) => {
    setLandmarks(landmarks);
    detectGesture(landmarks);
  });

  // Inizializza canvas 3D
  initARCanvas();

  // Avvia gestione effetti (gli effetti ricevono la scena)
  initEffectManager(scene);
});

const intro = document.getElementById('intro-screen');

function hideIntro() {
  if (intro) {
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.remove();
    }, 1000); // aspetta che la transizione finisca
  }
}

// 🖱️ Clic o tocco nasconde l’intro
intro.addEventListener('click', hideIntro);
intro.addEventListener('touchstart', hideIntro);

// 🕒 o auto dopo 3.5 secondi
setTimeout(hideIntro, 3500);


subscribe((state) => {
  const label = document.getElementById("effect-indicator");
  if (!label) return;

  let labelText = "";
  switch (state.effect) {
    case 1:
      labelText = "✨ Effetto: 1 – Anelli";
      break;
    case 2:
      labelText = "🌸 Effetto: 2 – Fiore";
      break;
    case 3:
      labelText = "🖌️ Effetto: 3 – Scia";
      break;
  }

  label.textContent = labelText;
});

import { setupDebugUI } from './ui/debugUI.js';

setupDebugUI();




