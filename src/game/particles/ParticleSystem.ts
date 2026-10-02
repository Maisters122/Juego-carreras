/**
 * ParticleSystem.ts - Advanced Dynamic 3D Particle Engine
 * Generates volumetric billowing tire drift smoke, progressive multi-stage engine damage smoke,
 * fire embers, and realistic collision impact debris & sparks.
 */

import * as THREE from 'three';

interface Spark {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface SmokePuff {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  maxSize: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  colorR: number;
  colorG: number;
  colorB: number;
}

interface DebrisChunk {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  angVel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public group: THREE.Group;

  // Sparks
  private sparks: Spark[] = [];
  private sparkPoints!: THREE.Points;
  private sparkPositions!: Float32Array;
  private sparkColors!: Float32Array;
  private maxSparks = 400;

  // Volumetric Smoke Particles
  private smokePuffs: SmokePuff[] = [];
  private smokePoints!: THREE.Points;
  private smokePositions!: Float32Array;
  private smokeColors!: Float32Array;
  private smokeSizes!: Float32Array;
  private maxSmoke = 600;

  // Collision Debris Chunks (shattered car carbon fragments)
  private debrisList: DebrisChunk[] = [];
  private debrisPoints!: THREE.Points;
  private debrisPositions!: Float32Array;
  private maxDebris = 80;

  // Dynamic Tire Skid Marks Mesh (Strip of quads on the road surface)
  private skidMesh!: THREE.Mesh;
  private skidPositions!: Float32Array;
  private skidAlphas!: Float32Array;
  private maxSkidPoints = 1200;
  private skidIndex = 0;
  private lastLeftWheelPos: THREE.Vector3 | null = null;
  private lastRightWheelPos: THREE.Vector3 | null = null;

  // Procedural Smoke Cloud Texture
  private smokeTexture!: THREE.CanvasTexture;

  constructor() {
    this.group = new THREE.Group();
    this.createSmokeTexture();
    this.initSparks();
    this.initVolumetricSmoke();
    this.initDebris();
    this.initSkidmarks();
  }

  /**
   * Generates a soft, volumetric gaussian radial cloud texture for photorealistic smoke
   */
  private createSmokeTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(240, 240, 245, 0.85)');
    grad.addColorStop(0.55, 'rgba(200, 205, 215, 0.45)');
    grad.addColorStop(0.85, 'rgba(160, 165, 175, 0.12)');
    grad.addColorStop(1.0, 'rgba(120, 120, 130, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Subtle noise spots for organic smoke texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
      const x = 30 + Math.random() * 68;
      const y = 30 + Math.random() * 68;
      const r = 10 + Math.random() * 18;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    this.smokeTexture = new THREE.CanvasTexture(canvas);
  }

  private initSparks(): void {
    const geo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.sparkPoints = new THREE.Points(geo, mat);
    this.sparkPoints.frustumCulled = false;
    this.group.add(this.sparkPoints);
  }

  private initVolumetricSmoke(): void {
    const geo = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeColors = new Float32Array(this.maxSmoke * 4); // RGBA
    this.smokeSizes = new Float32Array(this.maxSmoke);

    geo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.smokeColors, 4));

    // Custom point material with smoke texture and soft blending
    const mat = new THREE.PointsMaterial({
      size: 2.2,
      map: this.smokeTexture,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0.75,
    });

    this.smokePoints = new THREE.Points(geo, mat);
    this.smokePoints.frustumCulled = false;
    this.group.add(this.smokePoints);
  }

  private initDebris(): void {
    const geo = new THREE.BufferGeometry();
    this.debrisPositions = new Float32Array(this.maxDebris * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.debrisPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      color: 0x1f2937, // Carbon black
      depthWrite: false,
    });

    this.debrisPoints = new THREE.Points(geo, mat);
    this.debrisPoints.frustumCulled = false;
    this.group.add(this.debrisPoints);
  }

  private initSkidmarks(): void {
    const geo = new THREE.BufferGeometry();
    const totalVertices = this.maxSkidPoints * 6;
    this.skidPositions = new Float32Array(totalVertices * 3);
    this.skidAlphas = new Float32Array(totalVertices * 4);

    geo.setAttribute('position', new THREE.BufferAttribute(this.skidPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.skidAlphas, 4));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -4.0,
    });

    this.skidMesh = new THREE.Mesh(geo, mat);
    this.skidMesh.frustumCulled = false;
    this.group.add(this.skidMesh);
  }

  /**
   * Emit high speed bouncing sparks and carbon debris on collision
   */
  public emitSparks(pos: THREE.Vector3, normal: THREE.Vector3, count: number = 30): void {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      const spread = 1.0;
      const speed = 5 + Math.random() * 11;
      const vel = new THREE.Vector3(
        normal.x * 2.2 + (Math.random() - 0.5) * spread,
        Math.random() * 3.5 + 1.2,
        normal.z * 2.2 + (Math.random() - 0.5) * spread
      ).normalize().multiplyScalar(speed);

      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.35, Math.random() * 0.25, (Math.random() - 0.5) * 0.35)),
        velocity: vel,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.45,
      });
    }

    // Spawn 4-8 physical debris chunks on heavy hit
    const debrisCount = Math.min(8, Math.floor(count / 4));
    for (let d = 0; d < debrisCount; d++) {
      if (this.debrisList.length >= this.maxDebris) break;
      this.debrisList.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3, (Math.random() - 0.5) * 0.2)),
        velocity: new THREE.Vector3(
          normal.x * 3.5 + (Math.random() - 0.5) * 4,
          2.0 + Math.random() * 3.5,
          normal.z * 3.5 + (Math.random() - 0.5) * 4
        ),
        rotation: new THREE.Vector3(),
        angVel: new THREE.Vector3(Math.random() * 15, Math.random() * 15, Math.random() * 15),
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
      });
    }

    // Impact dust cloud
    this.emitImpactDust(pos, normal);
  }

  /**
   * Emit compressed air aerosol puffs from pneumatic impact wrenches and air jacks (clean white air blast)
   */
  public emitPneumaticBlast(pos: THREE.Vector3, dir: THREE.Vector3, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      if (this.smokePuffs.length >= this.maxSmoke) break;
      const speed = 2.5 + Math.random() * 3.5;
      this.smokePuffs.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1)),
        velocity: new THREE.Vector3(
          dir.x * speed + (Math.random() - 0.5) * 0.8,
          dir.y * speed + (Math.random() - 0.5) * 0.8,
          dir.z * speed + (Math.random() - 0.5) * 0.8
        ),
        size: 0.25,
        maxSize: 0.9 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3.0,
        opacity: 0.8,
        maxOpacity: 0.8,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2, // Quick high-pressure dispersal
        colorR: 0.98,
        colorG: 0.99,
        colorB: 1.0,
      });
    }
  }

  /**
   * Emit razor-sharp golden micro-sparks from wheel hub centerlock torquing (WITHOUT dust)
   */
  public emitNutTorqueSparks(pos: THREE.Vector3, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 6.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.8 + 1.0,
        (Math.random() - 0.5) * 2.0
      );

      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05)),
        velocity: vel,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.15,
      });
    }
  }

  /**
   * Emit white/grey dust cloud upon crashing into barrier or ground
   */
  public emitImpactDust(pos: THREE.Vector3, normal: THREE.Vector3): void {
    for (let i = 0; i < 6; i++) {
      if (this.smokePuffs.length >= this.maxSmoke) break;
      this.smokePuffs.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.1, (Math.random() - 0.5) * 0.5)),
        velocity: new THREE.Vector3(
          normal.x * 1.5 + (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.2,
          normal.z * 1.5 + (Math.random() - 0.5) * 1.5
        ),
        size: 0.6,
        maxSize: 2.2 + Math.random() * 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
        opacity: 0.65,
        maxOpacity: 0.65,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.6,
        colorR: 0.85,
        colorG: 0.85,
        colorB: 0.88,
      });
    }
  }

  /**
   * Emit billowing tire smoke during drift, burnout, or hard braking
   */
  public emitTireSmoke(pos: THREE.Vector3, count: number = 3, slipRatio: number = 0.5): void {
    const opacityFactor = Math.min(0.85, 0.4 + slipRatio * 0.5);

    for (let i = 0; i < count; i++) {
      if (this.smokePuffs.length >= this.maxSmoke) break;

      this.smokePuffs.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.45, 0.08, (Math.random() - 0.5) * 0.45)),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          0.6 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
        size: 0.5,
        maxSize: 2.5 + Math.random() * 1.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 1.8,
        opacity: opacityFactor,
        maxOpacity: opacityFactor,
        life: 0,
        maxLife: 1.0 + Math.random() * 0.6,
        colorR: 0.92,
        colorG: 0.92,
        colorB: 0.95,
      });
    }
  }

  /**
   * Emit realistic exhaust smoke and backfire plumes from the twin Inconel tailpipes
   * @param pos Tailpipe world position
   * @param rearDir Tailpipe ejection direction (rearwards)
   * @param mode 'idle' (gentle condensation vapor), 'power' (high-speed hot gas), or 'backfire' (fuel pop with flame)
   */
  public emitRealisticExhaust(
    pos: THREE.Vector3,
    rearDir: THREE.Vector3,
    mode: 'idle' | 'power' | 'backfire'
  ): void {
    if (this.smokePuffs.length >= this.maxSmoke) return;

    if (mode === 'idle') {
      // Gentle white/cyan condensation vapor at idle/stop
      this.smokePuffs.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.05)),
        velocity: new THREE.Vector3(
          rearDir.x * 0.35 + (Math.random() - 0.5) * 0.15,
          0.32 + Math.random() * 0.22,
          rearDir.z * 0.35 + (Math.random() - 0.5) * 0.15
        ),
        size: 0.12,
        maxSize: 0.42 + Math.random() * 0.15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 1.2,
        opacity: 0.32,
        maxOpacity: 0.32,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.25,
        colorR: 0.88,
        colorG: 0.92,
        colorB: 0.96,
      });
    } else if (mode === 'power') {
      // High-velocity hot combustion plume under heavy throttle
      const speed = 4.8 + Math.random() * 3.5;
      this.smokePuffs.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04)),
        velocity: new THREE.Vector3(
          rearDir.x * speed + (Math.random() - 0.5) * 0.25,
          rearDir.y * speed + 0.12,
          rearDir.z * speed + (Math.random() - 0.5) * 0.25
        ),
        size: 0.15,
        maxSize: 0.62 + Math.random() * 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3.0,
        opacity: 0.38,
        maxOpacity: 0.38,
        life: 0,
        maxLife: 0.28 + Math.random() * 0.15,
        colorR: 0.72,
        colorG: 0.75,
        colorB: 0.80,
      });
    } else if (mode === 'backfire') {
      // Dark unburnt fuel puff + intense ignition flame sparks
      for (let i = 0; i < 2; i++) {
        this.smokePuffs.push({
          position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06)),
          velocity: new THREE.Vector3(
            rearDir.x * (6.5 + Math.random() * 4.5) + (Math.random() - 0.5) * 0.6,
            0.35 + Math.random() * 0.35,
            rearDir.z * (6.5 + Math.random() * 4.5) + (Math.random() - 0.5) * 0.6
          ),
          size: 0.26,
          maxSize: 1.0 + Math.random() * 0.35,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 4.0,
          opacity: 0.85,
          maxOpacity: 0.85,
          life: 0,
          maxLife: 0.42 + Math.random() * 0.18,
          colorR: 0.16,
          colorG: 0.16,
          colorB: 0.18,
        });
      }

      // Backfire flame sparks
      for (let s = 0; s < 7; s++) {
        if (this.sparks.length >= this.maxSparks) break;
        this.sparks.push({
          position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04)),
          velocity: new THREE.Vector3(
            rearDir.x * (8.5 + Math.random() * 6.5) + (Math.random() - 0.5) * 1.5,
            0.5 + Math.random() * 1.2,
            rearDir.z * (8.5 + Math.random() * 6.5) + (Math.random() - 0.5) * 1.5
          ),
          life: 0,
          maxLife: 0.14 + Math.random() * 0.12,
        });
      }
    }
  }

  /**
   * Emit progressive engine damage smoke from the hood:
   * Light grey at 70%, dark billowing soot at 40%, and black smoke + glowing embers at < 25%
   */
  public emitEngineDamageSmoke(pos: THREE.Vector3, engineHealth: number): void {
    if (this.smokePuffs.length >= this.maxSmoke) return;

    const isSevere = engineHealth < 35;
    const isCritical = engineHealth < 20;

    // Dark smoke color
    let r = 0.5;
    let g = 0.5;
    let b = 0.52;

    if (isCritical) {
      r = 0.08;
      g = 0.08;
      b = 0.09;
    } else if (isSevere) {
      r = 0.18;
      g = 0.18;
      b = 0.20;
    }

    this.smokePuffs.push({
      position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.4)),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        1.5 + Math.random() * 1.2,
        (Math.random() - 0.5) * 0.6
      ),
      size: 0.6,
      maxSize: isSevere ? 3.4 : 2.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2.2,
      opacity: isSevere ? 0.9 : 0.6,
      maxOpacity: isSevere ? 0.9 : 0.6,
      life: 0,
      maxLife: 1.3 + Math.random() * 0.7,
      colorR: r,
      colorG: g,
      colorB: b,
    });

    // Fiery glowing embers popping out when engine is near death
    if (isCritical && Math.random() < 0.45 && this.sparks.length < this.maxSparks) {
      this.sparks.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.3, (Math.random() - 0.5) * 0.3)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2.5, 3.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2.5),
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  }

  /**
   * Add continuous tire skidmarks on the road surface
   */
  public addSkidmark(leftWheel: THREE.Vector3, rightWheel: THREE.Vector3, intensity: number): void {
    if (!this.lastLeftWheelPos || !this.lastRightWheelPos) {
      this.lastLeftWheelPos = leftWheel.clone();
      this.lastRightWheelPos = rightWheel.clone();
      return;
    }

    const dist = leftWheel.distanceTo(this.lastLeftWheelPos);
    if (dist < 0.3) return;

    const tireHalfWidth = 0.15;
    const roadY = 0.025;

    const p1 = new THREE.Vector3(this.lastLeftWheelPos.x - tireHalfWidth, roadY, this.lastLeftWheelPos.z);
    const p2 = new THREE.Vector3(this.lastLeftWheelPos.x + tireHalfWidth, roadY, this.lastLeftWheelPos.z);
    const p3 = new THREE.Vector3(leftWheel.x + tireHalfWidth, roadY, leftWheel.z);
    const p4 = new THREE.Vector3(leftWheel.x - tireHalfWidth, roadY, leftWheel.z);

    const quadVerts = [p1, p2, p3, p1, p3, p4];
    const baseIndex = (this.skidIndex % this.maxSkidPoints) * 6;

    const alpha = Math.min(0.72, intensity * 0.75);

    for (let i = 0; i < 6; i++) {
      const v = quadVerts[i];
      const vertIdx = (baseIndex + i) * 3;
      this.skidPositions[vertIdx] = v.x;
      this.skidPositions[vertIdx + 1] = v.y;
      this.skidPositions[vertIdx + 2] = v.z;

      const colIdx = (baseIndex + i) * 4;
      this.skidAlphas[colIdx] = 0.06;
      this.skidAlphas[colIdx + 1] = 0.06;
      this.skidAlphas[colIdx + 2] = 0.07;
      this.skidAlphas[colIdx + 3] = alpha;
    }

    this.skidIndex++;
    this.skidMesh.geometry.attributes.position.needsUpdate = true;
    (this.skidMesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    this.lastLeftWheelPos.copy(leftWheel);
    this.lastRightWheelPos.copy(rightWheel);
  }

  public breakSkidmark(): void {
    this.lastLeftWheelPos = null;
    this.lastRightWheelPos = null;
  }

  /**
   * Main Particle Simulation Frame Tick
   */
  public update(dt: number): void {
    // 1. Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      s.velocity.y -= 9.81 * dt;
      s.position.addScaledVector(s.velocity, dt);

      // Bounce on tarmac
      if (s.position.y < 0.04) {
        s.position.y = 0.04;
        s.velocity.y *= -0.38;
        s.velocity.x *= 0.65;
        s.velocity.z *= 0.65;
      }
    }

    for (let i = 0; i < this.maxSparks; i++) {
      const pIdx = i * 3;
      if (i < this.sparks.length) {
        const s = this.sparks[i];
        this.sparkPositions[pIdx] = s.position.x;
        this.sparkPositions[pIdx + 1] = s.position.y;
        this.sparkPositions[pIdx + 2] = s.position.z;

        const t = s.life / s.maxLife;
        this.sparkColors[pIdx] = 1.0;
        this.sparkColors[pIdx + 1] = Math.max(0, 0.85 - t * 0.85);
        this.sparkColors[pIdx + 2] = Math.max(0, 0.2 - t * 0.2);
      } else {
        this.sparkPositions[pIdx] = 0;
        this.sparkPositions[pIdx + 1] = -1000;
        this.sparkPositions[pIdx + 2] = 0;
      }
    }
    this.sparkPoints.geometry.attributes.position.needsUpdate = true;
    this.sparkPoints.geometry.attributes.color.needsUpdate = true;

    // 2. Update Debris Chunks
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.life += dt;
      if (d.life >= d.maxLife) {
        this.debrisList.splice(i, 1);
        continue;
      }

      d.velocity.y -= 9.81 * dt;
      d.position.addScaledVector(d.velocity, dt);

      if (d.position.y < 0.03) {
        d.position.y = 0.03;
        d.velocity.y *= -0.28;
        d.velocity.x *= 0.7;
        d.velocity.z *= 0.7;
      }
    }

    for (let i = 0; i < this.maxDebris; i++) {
      const pIdx = i * 3;
      if (i < this.debrisList.length) {
        const d = this.debrisList[i];
        this.debrisPositions[pIdx] = d.position.x;
        this.debrisPositions[pIdx + 1] = d.position.y;
        this.debrisPositions[pIdx + 2] = d.position.z;
      } else {
        this.debrisPositions[pIdx] = 0;
        this.debrisPositions[pIdx + 1] = -1000;
        this.debrisPositions[pIdx + 2] = 0;
      }
    }
    this.debrisPoints.geometry.attributes.position.needsUpdate = true;

    // 3. Update Volumetric Smoke Puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const p = this.smokePuffs[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.smokePuffs.splice(i, 1);
        continue;
      }

      // Air drag slows horizontal drift while thermal buoyancy lifts it
      p.velocity.x *= Math.max(0, 1.0 - 1.2 * dt);
      p.velocity.z *= Math.max(0, 1.0 - 1.2 * dt);
      p.position.addScaledVector(p.velocity, dt);

      p.rotation += p.rotationSpeed * dt;
    }

    for (let i = 0; i < this.maxSmoke; i++) {
      const pIdx = i * 3;
      const cIdx = i * 4;

      if (i < this.smokePuffs.length) {
        const p = this.smokePuffs[i];
        this.smokePositions[pIdx] = p.position.x;
        this.smokePositions[pIdx + 1] = p.position.y;
        this.smokePositions[pIdx + 2] = p.position.z;

        const progress = p.life / p.maxLife;
        // Smooth bell curve opacity fade
        const alpha = p.maxOpacity * Math.sin(progress * Math.PI);

        this.smokeColors[cIdx] = p.colorR;
        this.smokeColors[cIdx + 1] = p.colorG;
        this.smokeColors[cIdx + 2] = p.colorB;
        this.smokeColors[cIdx + 3] = alpha;
      } else {
        this.smokePositions[pIdx] = 0;
        this.smokePositions[pIdx + 1] = -1000;
        this.smokePositions[pIdx + 2] = 0;
        this.smokeColors[cIdx + 3] = 0;
      }
    }

    this.smokePoints.geometry.attributes.position.needsUpdate = true;
    (this.smokePoints.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}
