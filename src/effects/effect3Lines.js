// Rimuovi l'import
// Usa direttamente THREE.Mesh, THREE.Vector3 ecc.

let mesh;
let points = [];
const maxPoints = 40;
const trailRadius = 0.025;

export function init(scene) {
  console.log("🖌️ [Effect 3] INIT");

  // Crea mesh placeholder iniziale
  const dummyCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.01, 0, 0)
]);
  const dummyGeometry = new THREE.TubeGeometry(dummyCurve, 1, trailRadius, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.6,
  });

  mesh = new THREE.Mesh(dummyGeometry, material);
  scene.add(mesh);
}

export function update(state) {
  if (!state.landmarks || !mesh) return;

  const lm = state.landmarks[8]; // indice

  const x = (lm.x - 0.5) * 2;
  const y = -(lm.y - 0.5) * 2;
  const z = -lm.z * 1;

  points.push(new THREE.Vector3(x, y, z));
  if (points.length > maxPoints) {
    points.shift();
  }

  // Rigenera il trail con una curva fluida
  if (points.length < 2) return;
  if (points.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, points.length * 2, trailRadius, 8, false);

    mesh.geometry.dispose(); // pulizia
    mesh.geometry = geometry;
  }
}

export function dispose(scene) {
  console.log("❌ [Effect 3] Disposed");

  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh = null;
  }

  points = [];
}
