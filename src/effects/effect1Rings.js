// Rimuovi l'import
// Usa direttamente THREE.Mesh, THREE.Vector3 ecc.

let group;
const ringMeshes = [];

let trailPool = [];
let poolIndex = 0;
const maxTrails = 200;
const trailLifetime = 1.2;

export function init(scene) {
  console.log("✨ [Effect 1] INIT");

  group = new THREE.Group();
  scene.add(group);

  const ringGeometry = new THREE.TorusGeometry(0.04, 0.012, 8, 16);
  const colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0xff00ff];

  // Crea anelli colorati
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeometry, material);
    group.add(ring);
    ringMeshes.push(ring);
  }

  // Trail pool
  const trailGeo = new THREE.SphereGeometry(0.015, 6, 6);
  for (let i = 0; i < maxTrails; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(trailGeo, material);
    mesh.visible = false;
    mesh.userData.birth = 0;
    group.add(mesh);
    trailPool.push(mesh);
  }
}

export function update(state) {
  const { landmarks } = state;
  if (!landmarks || ringMeshes.length === 0) return;

  // const fingerIndices = [4, 8, 12, 16, 20];
  const fingerIndices = [4, 6, 10, 14, 18]; // nocche centrali (PIP)

  // Calcola scala dinamica (thumb-pinky)
  const s = scaleFromThumbPinky(landmarks);

  // Posiziona anelli
  for (let i = 0; i < fingerIndices.length; i++) {
    const lm = landmarks[fingerIndices[i]];
    const x = (lm.x - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    const z = -lm.z * 1;

    ringMeshes[i].position.set(x, y, z);
    ringMeshes[i].lookAt(0, 0, 0);
    ringMeshes[i].scale.setScalar(s);
  }

  // Trail: solo sull’indice (landmark 8)
  const lm = landmarks[8];
  const trail = trailPool[poolIndex];
  poolIndex = (poolIndex + 1) % maxTrails;

  trail.position.set(
    (lm.x - 0.5) * 2,
    -(lm.y - 0.5) * 2,
    -lm.z * 1
  );

  trail.scale.setScalar(s);
  trail.material.opacity = 0.4;
  trail.visible = true;
  trail.userData.birth = performance.now() / 1000;

  // Aggiorna fading per tutti
  const now = performance.now() / 1000;
  for (let t of trailPool) {
    if (!t.visible) continue;

    const age = now - t.userData.birth;
    if (age > trailLifetime) {
      t.visible = false;
      t.material.opacity = 0;
    } else {
      const alpha = 1 - age / trailLifetime;
      t.material.opacity = 0.4 * alpha;
      t.scale.setScalar(s * alpha);
    }
  }
}

export function dispose(scene) {
  console.log("❌ [Effect 1] Disposed");

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

// 🔧 Helper: scala dinamica
function scaleFromThumbPinky(landmarks) {
  const a = landmarks[4]; // thumb
  const b = landmarks[20]; // pinky
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return THREE.MathUtils.clamp(1.5 * d, 0.5, 2.0);
}
