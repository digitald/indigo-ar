// GOOGLE GEMINI

// Rimuovi l'import
// Usa direttamente THREE.Mesh, THREE.Vector3 ecc.

let group;
const ringMeshes = [];

let trailPool = [];
let poolIndex = 0;
const maxTrails = 200; // Considera di aumentarlo se generi 5 particelle per frame e hai una trailLifetime lunga
const trailLifetime = 1.2; // Secondi
const trailInitialOpacity = 0.7; // Opacità iniziale per le particelle della scia
const trailInitialScaleFactorRelativeToRing = 0.7; // Dimensione iniziale della particella della scia relativa all'anello
const depthFactor = 1.5; // Moltiplicatore per la coordinata Z, per accentuare la profondità

export function init(scene) {
  console.log("✨ [Effect 1] INIT - Enhanced Version");

  group = new THREE.Group();
  scene.add(group);

  // Geometria dell'anello più definita
  const ringGeometry = new THREE.TorusGeometry(0.04, 0.012, 16, 32); // Aumentati segmenti radiali e tubolari
  const colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0xff00ff];

  // Crea anelli colorati
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.75, // Leggermente aggiustata l'opacità per un look più morbido
    });
    const ring = new THREE.Mesh(ringGeometry, material);
    group.add(ring);
    ringMeshes.push(ring);
  }

  // Trail pool con geometria più definita
  const trailGeo = new THREE.SphereGeometry(0.015, 12, 12); // Aumentati segmenti per sfere più lisce
  for (let i = 0; i < maxTrails; i++) {
    const material = new THREE.MeshBasicMaterial({
      // Il colore sarà impostato dinamicamente
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(trailGeo, material);
    mesh.visible = false;
    mesh.userData.birth = 0;
    mesh.userData.initialOpacity = 0;
    mesh.userData.initialScale = 0;
    group.add(mesh);
    trailPool.push(mesh);
  }
}

export function update(state) {
  const { landmarks } = state;
  if (!landmarks || ringMeshes.length === 0 || trailPool.length === 0) return;

  const fingerIndices = [4, 6, 10, 14, 18]; // Nocche centrali (PIP)

  // Calcola scala dinamica (thumb-pinky)
  const s = scaleFromThumbPinky(landmarks);

  // Posiziona anelli e genera scie
  for (let i = 0; i < fingerIndices.length; i++) {
    const landmarkIndex = fingerIndices[i];
    if (landmarkIndex >= landmarks.length) continue; // Sanity check

    const lm = landmarks[landmarkIndex];
    const x = (lm.x - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    const z = -lm.z * depthFactor; // Usa il fattore di profondità

    // Aggiorna posizione e scala anello
    if (ringMeshes[i]) {
        ringMeshes[i].position.set(x, y, z);
        ringMeshes[i].lookAt(0, 0, 0); // Mantenuto il lookAt originale
        ringMeshes[i].scale.setScalar(s);

        // Genera una particella di scia per questo anello/dito
        const trail = trailPool[poolIndex];
        poolIndex = (poolIndex + 1) % maxTrails;

        trail.position.set(x, y, z);
        trail.material.color.copy(ringMeshes[i].material.color); // Eredita il colore dall'anello

        trail.userData.initialOpacity = trailInitialOpacity;
        trail.userData.initialScale = s * trailInitialScaleFactorRelativeToRing;

        trail.material.opacity = trail.userData.initialOpacity;
        trail.scale.setScalar(trail.userData.initialScale);
        
        trail.visible = true;
        trail.userData.birth = performance.now() / 1000;
    }
  }

  // Aggiorna fading per tutte le particelle della scia
  const now = performance.now() / 1000;
  for (let t of trailPool) {
    if (!t.visible) continue;

    const age = now - t.userData.birth;
    if (age > trailLifetime) {
      t.visible = false;
      t.material.opacity = 0;
    } else {
      const progress = age / trailLifetime;
      
      // Funzione di Easing (Ease-Out Cubic): (1 - progress)^3
      // Questo fa sì che il valore decada da 1 a 0, iniziando velocemente e rallentando.
      const decayMultiplier = Math.pow(1 - progress, 3);

      t.material.opacity = t.userData.initialOpacity * decayMultiplier;
      t.scale.setScalar(t.userData.initialScale * decayMultiplier);
    }
  }
}

export function dispose(scene) {
  console.log("❌ [Effect 1] Disposed - Enhanced Version");

  if (group) {
    scene.remove(group);

    [...ringMeshes, ...trailPool].forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    ringMeshes.length = 0;
    trailPool.length = 0;
    group = null;
  }
}

// 🔧 Helper: scala dinamica (invariato)
function scaleFromThumbPinky(landmarks) {
  const a = landmarks[4]; // thumb
  const b = landmarks[20]; // pinky
  if (!a || !b) return 1.0; // Fallback se i landmark non sono disponibili
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return THREE.MathUtils.clamp(1.5 * d, 0.5, 2.0);
}
