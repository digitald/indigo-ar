// effect2Flower.js - Versione senza import/export

(function() {
  
  const Effect2 = {
    // Variabili private dell'effetto
    flower: null,
    petals: [],
    targetPosition: new THREE.Vector3(),
    appearProgress: 0,
    active: false,
    petalCount: 6,
    fadeSpeed: 0.02, // Valore di default, puoi modificarlo

    init: function(scene) {
      console.log("🌸 [Effect 2] INIT");

      this.flower = new THREE.Group();
      this.petals = [];

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.05, 0.2, 0, 0.4);
      shape.quadraticCurveTo(-0.05, 0.2, 0, 0);

      const geometry = new THREE.ShapeGeometry(shape);
      geometry.translate(0, 0.2, 0);

      for (let i = 0; i < this.petalCount; i++) {
        const material = new THREE.MeshBasicMaterial({
          color: 0xff66cc,
          wireframe: true,
          transparent: true,
          opacity: 0,
        });

        const petal = new THREE.Mesh(geometry.clone(), material);
        petal.rotation.z = (i / this.petalCount) * Math.PI * 2;
        this.flower.add(petal);
        this.petals.push(petal);
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
      this.flower.add(center);
      this.petals.push(center);

      this.flower.scale.setScalar(0.001); // partenza "chiusa"
      scene.add(this.flower);
      this.active = true;
    },

    update: function(state) {
      if (!this.flower || !state.landmarks) return;

      const thumb = state.landmarks[4];
      const index = state.landmarks[8];

      const x = ((thumb.x + index.x) / 2 - 0.5) * 2;
      const y = -((thumb.y + index.y) / 2 - 0.5) * 2;
      const z = -((thumb.z + index.z) / 2) * 1;

      this.targetPosition.set(x, y, z);
      this.flower.position.lerp(this.targetPosition, 0.15);
      this.flower.rotation.z += 0.01;

      // 🌀 Pulsazione morbida
      const pulseSpeed = 0.003; // Valore di default
      const pulse = 1 + 0.05 * Math.sin(performance.now() * pulseSpeed);
      this.flower.scale.setScalar(this.appearProgress * pulse);

      // ✨ Fade-in
      if (this.active && this.appearProgress < 1) this.appearProgress += this.fadeSpeed;
      else if (!this.active && this.appearProgress > 0) this.appearProgress -= this.fadeSpeed;

      for (let mesh of this.petals) {
        mesh.material.opacity = this.appearProgress;
      }
    },

    dispose: function(scene) {
      console.log("❌ [Effect 2] Disposed");

      if (this.flower) {
        this.active = false;
        this.appearProgress = 0;

        scene.remove(this.flower);
        this.flower.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        });

        this.flower = null;
        this.petals = [];
      }
    }
  };

  // Registra l'effetto nel manager quando il file viene caricato
  if (window.EffectManager) {
    window.EffectManager.register(2, Effect2);
  } else {
    // Se EffectManager non è ancora caricato, aspetta
    window.addEventListener('load', function() {
      if (window.EffectManager) {
        window.EffectManager.register(2, Effect2);
      }
    });
  }

})();