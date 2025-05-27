// CLAUDE
// 
// Rimuovi l'import
// Usa direttamente THREE.Mesh, THREE.Vector3 ecc.

let group;
const ringMeshes = [];

let trailPool = [];
let poolIndex = 0;
const maxTrails = 300;
const trailLifetime = 2.0;

// Performance optimization
let lastUpdateTime = 0;
const updateInterval = 16; // ~60fps

export function init(scene) {
  console.log("✨ [Effect 1] INIT");

  group = new THREE.Group();
  scene.add(group);

  // Enhanced ring geometry with more segments for smoother appearance
  const ringGeometry = new THREE.TorusGeometry(0.045, 0.015, 12, 24);
  
  // More vibrant and harmonious color palette
  const colors = [
    0xff3366, // Pink-red
    0xff9933, // Orange
    0x33ff66, // Green
    0x3366ff, // Blue
    0x9933ff  // Purple
  ];

  // Create enhanced rings with glow effect
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(colors[i % colors.length]).multiplyScalar(0.2),
    });
    
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.userData = {
      originalColor: colors[i % colors.length],
      pulsePhase: i * Math.PI * 0.4,
      rotationSpeed: 0.01 + Math.random() * 0.02
    };
    
    group.add(ring);
    ringMeshes.push(ring);
  }

  // Enhanced trail system with varying sizes
  const trailSizes = [0.008, 0.012, 0.016, 0.020, 0.024];
  const trailColors = [0xff6600, 0xff9933, 0xffcc66, 0xff3366, 0x66ff99];
  
  for (let i = 0; i < maxTrails; i++) {
    const size = trailSizes[i % trailSizes.length];
    const color = trailColors[i % trailColors.length];
    
    const trailGeo = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      emissive: new THREE.Color(color).multiplyScalar(0.3),
    });
    
    const mesh = new THREE.Mesh(trailGeo, material);
    mesh.visible = false;
    mesh.userData = {
      birth: 0,
      initialScale: 1.0 + Math.random() * 0.5,
      driftX: (Math.random() - 0.5) * 0.001,
      driftY: (Math.random() - 0.5) * 0.001,
    };
    
    group.add(mesh);
    trailPool.push(mesh);
  }
}

export function update(state) {
  const now = performance.now();
  
  // Throttle updates for better performance
  if (now - lastUpdateTime < updateInterval) return;
  lastUpdateTime = now;
  
  const { landmarks } = state;
  if (!landmarks || ringMeshes.length === 0) return;

  const fingerIndices = [4, 6, 10, 14, 18]; // nocche centrali (PIP)
  const timeSeconds = now / 1000;

  // Calculate dynamic scale
  const s = scaleFromThumbPinky(landmarks);

  // Enhanced ring positioning with smooth animations
  for (let i = 0; i < fingerIndices.length; i++) {
    const lm = landmarks[fingerIndices[i]];
    const ring = ringMeshes[i];
    
    const x = (lm.x - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    const z = -lm.z * 1;

    // Smooth position interpolation
    ring.position.lerp(new THREE.Vector3(x, y, z), 0.3);
    
    // Dynamic rotation
    ring.rotation.z += ring.userData.rotationSpeed;
    ring.lookAt(0, 0, 0);
    
    // Pulsing effect
    const pulse = Math.sin(timeSeconds * 3 + ring.userData.pulsePhase) * 0.2 + 1;
    ring.scale.setScalar(s * pulse);
    
    // Color breathing effect
    const breathe = Math.sin(timeSeconds * 2 + ring.userData.pulsePhase) * 0.3 + 0.7;
    ring.material.opacity = 0.7 + breathe * 0.3;
  }

  // Enhanced trail system - multiple fingers
  const trailFingers = [8, 12]; // Index and middle finger
  
  for (let fingerIdx of trailFingers) {
    const lm = landmarks[fingerIdx];
    const trail = trailPool[poolIndex];
    poolIndex = (poolIndex + 1) % maxTrails;

    const x = (lm.x - 0.5) * 2;
    const y = -(lm.y - 0.5) * 2;
    const z = -lm.z * 1;

    trail.position.set(x, y, z);
    trail.scale.setScalar(s * trail.userData.initialScale);
    trail.material.opacity = 0.6;
    trail.visible = true;
    trail.userData.birth = timeSeconds;
  }

  // Enhanced trail animation with drift and scaling
  for (let t of trailPool) {
    if (!t.visible) continue;

    const age = timeSeconds - t.userData.birth;
    if (age > trailLifetime) {
      t.visible = false;
      t.material.opacity = 0;
    } else {
      const progress = age / trailLifetime;
      const alpha = 1 - progress;
      const easedAlpha = alpha * alpha; // Quadratic easing
      
      // Fading and scaling
      t.material.opacity = 0.6 * easedAlpha;
      const scaleProgress = 1 - progress * 0.7;
      t.scale.multiplyScalar(scaleProgress);
      
      // Subtle drift effect
      t.position.x += t.userData.driftX;
      t.position.y += t.userData.driftY;
      
      // Color shifting over time
      const hueShift = progress * 0.2;
      const currentColor = new THREE.Color(t.material.color);
      currentColor.offsetHSL(hueShift * 0.1, 0, 0);
      t.material.color.copy(currentColor);
    }
  }

  // Add sparkle effect occasionally
  if (Math.random() < 0.1) {
    addSparkle(landmarks[8], s);
  }
}

// Sparkle effect for extra visual appeal
function addSparkle(landmark, scale) {
  const availableTrail = trailPool.find(t => !t.visible);
  if (!availableTrail) return;
  
  const sparkleOffset = 0.05;
  const x = (landmark.x - 0.5) * 2 + (Math.random() - 0.5) * sparkleOffset;
  const y = -(landmark.y - 0.5) * 2 + (Math.random() - 0.5) * sparkleOffset;
  const z = -landmark.z * 1 + (Math.random() - 0.5) * sparkleOffset;
  
  availableTrail.position.set(x, y, z);
  availableTrail.scale.setScalar(scale * 0.3);
  availableTrail.material.opacity = 0.8;
  availableTrail.material.color.setHex(0xffffff);
  availableTrail.visible = true;
  availableTrail.userData.birth = performance.now() / 1000;
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

// 🔧 Helper: enhanced dynamic scaling with smoothing
function scaleFromThumbPinky(landmarks) {
  const a = landmarks[4]; // thumb
  const b = landmarks[20]; // pinky
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Enhanced scaling with smoother transitions
  const baseScale = THREE.MathUtils.clamp(2.0 * d, 0.3, 2.5);
  const smoothedScale = THREE.MathUtils.lerp(baseScale, 1.0, 0.1);
  
  return smoothedScale;
}