// Rimuovi l'import
// Usa direttamente THREE.Mesh, THREE.Vector3 ecc.

let mesh;
let points = [];
let pointsMetadata = [];
let ribbonMesh;
let particleSystem;
let glowMesh;

const maxPoints = 60;
const trailRadius = 0.018;
const minDistance = 0.02;
const fadeDistance = 0.8;

// Performance optimization
let lastUpdateTime = 0;
const updateInterval = 20; // ~50fps for smoother drawing

export function init(scene) {
  console.log("🖌️ [Effect 3] INIT");
  
  // Create initial dummy curve for main trail
  const dummyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, 0, 0)
  ]);
  
  // Enhanced material with gradient-like effect
  const mainMaterial = new THREE.MeshBasicMaterial({
    color: 0x4da6ff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  
  const dummyGeometry = new THREE.TubeGeometry(dummyCurve, 1, trailRadius, 12, false);
  mesh = new THREE.Mesh(dummyGeometry, mainMaterial);
  scene.add(mesh);
  
  // Create ribbon trail for added visual depth
  const ribbonMaterial = new THREE.MeshBasicMaterial({
    color: 0x80d4ff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  
  ribbonMesh = new THREE.Mesh(dummyGeometry.clone(), ribbonMaterial);
  scene.add(ribbonMesh);
  
  // Glow effect mesh
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xccf0ff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  
  glowMesh = new THREE.Mesh(dummyGeometry.clone(), glowMaterial);
  scene.add(glowMesh);
  
  // Particle system for sparkles
  initParticleSystem(scene);
}

function initParticleSystem(scene) {
  const particleCount = 50;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const alphas = new Float32Array(particleCount);
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    
    // Varied blue tones
    colors[i * 3] = 0.3 + Math.random() * 0.4;     // R
    colors[i * 3 + 1] = 0.6 + Math.random() * 0.4; // G
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
    
    sizes[i] = Math.random() * 0.015 + 0.005;
    alphas[i] = 0;
  }
  
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.01,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  
  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

export function update(state) {
  const now = performance.now();
  
  // Throttle updates for performance
  if (now - lastUpdateTime < updateInterval) return;
  lastUpdateTime = now;
  
  if (!state.landmarks || !mesh) return;
  
  const lm = state.landmarks[8]; // index finger
  const x = (lm.x - 0.5) * 2;
  const y = -(lm.y - 0.5) * 2;
  const z = -lm.z * 1;
  
  const newPoint = new THREE.Vector3(x, y, z);
  
  // Only add point if it's far enough from the last point (noise reduction)
  if (points.length === 0 || newPoint.distanceTo(points[points.length - 1]) > minDistance) {
    points.push(newPoint);
    
    // Store metadata for each point
    pointsMetadata.push({
      timestamp: now / 1000,
      velocity: calculateVelocity(points),
      pressure: calculatePressure(state.landmarks),
    });
    
    // Emit particles occasionally
    if (Math.random() < 0.3) {
      emitParticle(newPoint);
    }
  }
  
  // Remove old points
  if (points.length > maxPoints) {
    points.shift();
    pointsMetadata.shift();
  }
  
  // Update trail geometry
  updateTrailGeometry();
  
  // Update particle system
  updateParticles(now / 1000);
  
  // Update dynamic colors based on movement
  updateDynamicColors();
}

function calculateVelocity(pointsArray) {
  if (pointsArray.length < 2) return 0;
  
  const current = pointsArray[pointsArray.length - 1];
  const previous = pointsArray[pointsArray.length - 2];
  
  return current.distanceTo(previous);
}

function calculatePressure(landmarks) {
  // Simulate pressure based on hand openness
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const distance = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) + 
    Math.pow(thumbTip.y - indexTip.y, 2)
  );
  
  // Invert distance: closer fingers = higher pressure
  return Math.max(0.2, 1 - distance * 8);
}

function updateTrailGeometry() {
  if (points.length < 2) return;
  
  try {
    // Create smooth curve
    const curve = new THREE.CatmullRomCurve3(points);
    const segments = Math.min(points.length * 3, 120);
    
    // Main trail with variable radius based on velocity and pressure
    const radiusFunction = (t) => {
      const index = Math.floor(t * (pointsMetadata.length - 1));
      const metadata = pointsMetadata[index] || pointsMetadata[pointsMetadata.length - 1];
      
      const velocityFactor = Math.min(2, 1 + metadata.velocity * 3);
      const pressureFactor = metadata.pressure;
      
      return trailRadius * velocityFactor * pressureFactor;
    };
    
    // Create geometries with different properties
    const mainGeometry = new THREE.TubeGeometry(curve, segments, trailRadius, 12, false);
    const ribbonGeometry = new THREE.TubeGeometry(curve, segments, trailRadius * 1.5, 8, false);
    const glowGeometry = new THREE.TubeGeometry(curve, segments, trailRadius * 2.2, 6, false);
    
    // Update main mesh
    mesh.geometry.dispose();
    mesh.geometry = mainGeometry;
    
    // Update ribbon mesh
    ribbonMesh.geometry.dispose();
    ribbonMesh.geometry = ribbonGeometry;
    
    // Update glow mesh
    glowMesh.geometry.dispose();
    glowMesh.geometry = glowGeometry;
    
  } catch (error) {
    console.warn("Error updating trail geometry:", error);
  }
}

function updateDynamicColors() {
  if (pointsMetadata.length === 0) return;
  
  const timeSeconds = performance.now() / 1000;
  const recentMetadata = pointsMetadata[pointsMetadata.length - 1];
  
  // Color based on velocity and pressure
  const velocityHue = Math.min(1, recentMetadata.velocity * 5);
  const pressureIntensity = recentMetadata.pressure;
  
  // Animate through blue spectrum with velocity-based shifts
  const hue = 0.6 - velocityHue * 0.2; // Blue to cyan based on velocity
  const saturation = 0.8 + pressureIntensity * 0.2;
  const lightness = 0.5 + Math.sin(timeSeconds * 2) * 0.1;
  
  const color = new THREE.Color().setHSL(hue, saturation, lightness);
  
  mesh.material.color.copy(color);
  ribbonMesh.material.color.copy(color.clone().multiplyScalar(1.2));
  glowMesh.material.color.copy(color.clone().multiplyScalar(0.8));
  
  // Pulsing opacity based on pressure
  mesh.material.opacity = 0.7 + pressureIntensity * 0.3;
  ribbonMesh.material.opacity = 0.3 + pressureIntensity * 0.2;
  glowMesh.material.opacity = 0.15 + pressureIntensity * 0.15;
}

function emitParticle(position) {
  if (!particleSystem) return;
  
  const positions = particleSystem.geometry.attributes.position.array;
  const alphas = particleSystem.geometry.attributes.alpha.array;
  
  // Find an inactive particle
  for (let i = 0; i < alphas.length; i++) {
    if (alphas[i] <= 0) {
      // Set particle position with slight randomness
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.05;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.05;
      
      alphas[i] = 1.0;
      break;
    }
  }
  
  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.alpha.needsUpdate = true;
}

function updateParticles(timeSeconds) {
  if (!particleSystem) return;
  
  const positions = particleSystem.geometry.attributes.position.array;
  const alphas = particleSystem.geometry.attributes.alpha.array;
  const sizes = particleSystem.geometry.attributes.size.array;
  
  for (let i = 0; i < alphas.length; i++) {
    if (alphas[i] > 0) {
      // Fade out over time
      alphas[i] -= 0.02;
      
      // Slight upward drift
      positions[i * 3 + 1] += 0.002;
      
      // Scale down as they fade
      const scale = alphas[i];
      sizes[i] = (0.005 + Math.random() * 0.01) * scale;
      
      if (alphas[i] <= 0) {
        alphas[i] = 0;
        sizes[i] = 0;
      }
    }
  }
  
  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.alpha.needsUpdate = true;
  particleSystem.geometry.attributes.size.needsUpdate = true;
  
  // Update particle material opacity with breathing effect
  particleSystem.material.opacity = 0.6 + Math.sin(timeSeconds * 3) * 0.2;
}

export function dispose(scene) {
  console.log("❌ [Effect 3] Disposed");
  
  const meshes = [mesh, ribbonMesh, glowMesh, particleSystem].filter(Boolean);
  
  meshes.forEach(m => {
    scene.remove(m);
    if (m.geometry) m.geometry.dispose();
    if (m.material) m.material.dispose();
  });
  
  mesh = null;
  ribbonMesh = null;
  glowMesh = null;
  particleSystem = null;
  points = [];
  pointsMetadata = [];
}