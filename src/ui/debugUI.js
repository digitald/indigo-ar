import { EffectSettings } from '../config.js';

// Salva le cartelle per poterle mostrare/nascondere
let trailFolder, flowerFolder;

export function setupDebugUI() {
  const gui = new dat.GUI({ width: 300 });
  gui.domElement.style.zIndex = '999';

  // FOLDER Trail (Effetto 1)
  trailFolder = gui.addFolder('Trail (Effect 1)');
  trailFolder.add(EffectSettings.trail, 'radius', 0.005, 0.1).name('Spessore');
  trailFolder.add(EffectSettings.trail, 'lifetime', 0.2, 3).name('Durata');
  trailFolder.add(EffectSettings.trail, 'opacity', 0.1, 1).name('Opacità');
  trailFolder.add(EffectSettings.trail, 'scaleMultiplier', 0.5, 3).name('Scala mano');

  // FOLDER Flower (Effetto 2)
  flowerFolder = gui.addFolder('Fiore (Effect 2)');
  flowerFolder.add(EffectSettings.flower, 'pulseSpeed', 0.001, 0.02).name('Pulsazione');
  flowerFolder.add(EffectSettings.flower, 'fadeSpeed', 0.01, 0.1).name('Fade In/Out');

  // Toggle: Mostra / Nasconde dettagli (ma NON il pannello)
  gui.add(EffectSettings.debug, 'showUI').name('Mostra dettagli').onChange(show => {
    if (show) {
      trailFolder.show();
      flowerFolder.show();
    } else {
      trailFolder.hide();
      flowerFolder.hide();
    }
  });

  // Apri le cartelle inizialmente
  trailFolder.open();
  flowerFolder.open();
}
