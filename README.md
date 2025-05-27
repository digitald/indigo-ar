# Indigo AR ✨

Un'applicazione web-based di realtà aumentata interattiva, realizzata in JavaScript, MediaPipe e Three.js.

## 🎯 Funzionalità principali

- 👁️ Webcam in tempo reale
- 🖐️ Hand tracking con MediaPipe
- 🧠 Gestione dei gesti per attivare 3 effetti:
  - **Anelli sulle dita** con scia colorata
  - **Fiore wireframe** che segue il gesto "pinch"
  - **Linea fluida** che segue l'indice
- ✨ UI di debug con parametri live via `dat.GUI`
- 🌐 Pronta per la pubblicazione su GitHub Pages

## 🛠️ Tecnologie

- [Three.js](https://threejs.org/)
- [MediaPipe Hands](https://mediapipe.dev/)
- [dat.GUI](https://github.com/dataarts/dat.gui)
- Vanilla JS

## 🔧 Come avviare in locale

Puoi usare un semplice server:

```bash
npx serve .
