import * as THREE from 'three';
import { EffectSettings } from '../config.js';

let flower;
let petals = [];
let targetPosition = new THREE.Vector3();
let appearProgress = 0;
let active = false;

const petalCount = 6;
const fadeSpeed = EffectSettings.flower.fadeSpeed;


export function init(scene) {
  console.log("🌸 [Effect 2] INIT");

  flower = new THREE.Group();
  petals = [];

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.05, 0.2, 0, 0.4);
  shape.quadraticCurveTo(-0.05, 0.2, 0, 0);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.translate(0, 0.2, 0);

  for (let i = 0; i < petalCount; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff66cc,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });

    const petal = new THREE.Mesh(geometry.clone(), material);
    petal.rotation.z = (i / petalCount) * Math.PI * 2;
    flower.add(petal);
    petals.push(petal);
  }

  // Centro (pistillo)
  const centerGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const centerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0,
  });
  const center = new THREE.Mesh(centerGeo, centerMat);
  flower.add(center);
  petals.push(center);

  flower.scale.setScalar(0.001); // partenza "chiusa"
  scene.add(flower);
  active = true;
}

export function update(state) {
  if (!flower || !state.landmarks) return;

  const thumb = state.landmarks[4];
  const index = state.landmarks[8];

  const x = ((thumb.x + index.x) / 2 - 0.5) * 2;
  const y = -((thumb.y + index.y) / 2 - 0.5) * 2;
  const z = -((thumb.z + index.z) / 2) * 1;

  targetPosition.set(x, y, z);
  flower.position.lerp(targetPosition, 0.15);
  flower.rotation.z += 0.01;

  // 🌀 Pulsazione morbida
 const pulse = 1 + 0.05 * Math.sin(performance.now() * EffectSettings.flower.pulseSpeed);
  flower.scale.setScalar(appearProgress * pulse);

  // ✨ Fade-in
  if (active && appearProgress < 1) appearProgress += fadeSpeed;
  else if (!active && appearProgress > 0) appearProgress -= fadeSpeed;

  for (let mesh of petals) {
    mesh.material.opacity = appearProgress;
  }
}

export function dispose(scene) {
  console.log("❌ [Effect 2] Disposed");

  if (flower) {
    active = false;
    appearProgress = 0;

    scene.remove(flower);
    flower.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    flower = null;
    petals = [];
  }
}
