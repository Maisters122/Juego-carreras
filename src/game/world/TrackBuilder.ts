/**
 * TrackBuilder.ts - Professional FIA Grade-1 Racing Circuit World
 * Features realistic PBR materials, FIA catch fencing & debris barriers,
 * Tecpro high-impact runoff cushions, multi-tiered covered grandstands with VIP suites,
 * 2-story modern Pit Lane & Paddock Club building, 8 high-mast stadium floodlights,
 * realistic organic vegetation (pines, oaks, shrubs), Jumbotron video walls, and marshal posts.
 */

import * as THREE from 'three';

export interface StaticObstacle {
  x: number;
  z: number;
  radius: number;
  isWallSegment?: boolean;
  p1?: { x: number; z: number };
  p2?: { x: number; z: number };
  type: 'tree' | 'pillar' | 'wall' | 'building' | 'tecpro';
}

export interface DynamicProp {
  id: number;
  type: 'sign' | 'cone' | 'tire_stack';
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  radius: number;
  height: number;
  mass: number;
  isSleeping: boolean;
  baseY: number;
}

export class TrackBuilder {
  public group: THREE.Group;
  public staticObstacles: StaticObstacle[] = [];
  public dynamicProps: DynamicProp[] = [];

  // Track Dimensions
  public readonly halfSize = 130;  // 260m total square size
  public readonly cornerRadius = 38; // Radius of 4 rounded corner apexes
  public readonly trackWidth = 16;
  public readonly innerCornerCenter = 130 - 38; // 92

  // Pit Stop Area Bounds
  public readonly pitZone = {
    minX: -55,
    maxX: 50,
    minZ: -120.5,
    maxZ: -111.5,
  };

  // Shared High-Performance PBR Materials
  private asphaltMat!: THREE.MeshStandardMaterial;
  private kerbRedMat!: THREE.MeshStandardMaterial;
  private kerbWhiteMat!: THREE.MeshStandardMaterial;
  private concreteBarrierMat!: THREE.MeshStandardMaterial;
  private metalFenceMat!: THREE.MeshStandardMaterial;
  private tecproRedMat!: THREE.MeshStandardMaterial;
  private tecproWhiteMat!: THREE.MeshStandardMaterial;
  private grassMat!: THREE.MeshStandardMaterial;
  private gravelMat!: THREE.MeshStandardMaterial;
  private treeBarkMat!: THREE.MeshStandardMaterial;
  private pineFoliageMat!: THREE.MeshStandardMaterial;
  private oakFoliageMat!: THREE.MeshStandardMaterial;
  private bushFoliageMat!: THREE.MeshStandardMaterial;
  private glassMat!: THREE.MeshPhysicalMaterial;
  private metalDarkMat!: THREE.MeshStandardMaterial;
  private metalSilverMat!: THREE.MeshStandardMaterial;
  private floodlightMat!: THREE.MeshStandardMaterial;
  private lightBeamsGroup = new THREE.Group();

  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildTerrainAndInfield();
    this.buildSquareCircuitTrack();
    this.buildKerbsAndStartingGrid();
    this.buildConcreteBarriersWithCatchFences();
    this.buildTecproRunoffZones();
    this.buildMarshalSafetyPosts();
    this.buildGrandstands();
    this.buildPaddockBuildingAndPitLane();
    this.buildPitEntryAndExitArchitecture();
    this.buildPaddockTransportersAndTrailers();
    this.buildServiceAndSafetyVehicles();
    this.buildSpeedTrapRadarAndSectorGantries();
    this.buildJumbotronAndTimingTowers();
    this.buildOverheadGantriesAndBridges();
    this.buildTVBroadcastTowersAndCranes();
    this.buildPitEquipment();
    this.buildHighMastFloodlights();
    this.buildOrganicVegetation();
    this.buildDynamicProps();
  }

  private initMaterials(): void {
    const textureLoader = new THREE.TextureLoader();

    // High-Grip Racing Asphalt Texture
    const asphaltTex = textureLoader.load('/src/assets/images/track_asphalt_detail_1790904767865.jpg');
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(40, 40);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.82,
      metalness: 0.12,
    });

    // Mown Racing Turf (Striped pattern)
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x1e4620,
      roughness: 0.92,
      metalness: 0.04,
    });

    // Runoff Gravel Trap Material
    this.gravelMat = new THREE.MeshStandardMaterial({
      color: 0xc2a679,
      roughness: 0.98,
      metalness: 0.02,
    });

    // Curbs
    this.kerbRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc1422,
      roughness: 0.45,
      metalness: 0.15,
    });
    this.kerbWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.15,
    });

    // FIA Concrete Barriers
    this.concreteBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.88,
      metalness: 0.08,
    });

    // Debris Catch Fence Steel
    this.metalFenceMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false,
    });

    // Tecpro Impact Cushions
    this.tecproRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.tecproWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
    });

    // Architectural Metals
    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.22,
    });
    this.metalSilverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.90,
      roughness: 0.18,
    });

    // Architectural VIP Glass
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.75,
      transparent: true,
      opacity: 0.85,
    });

    // Vegetation Materials
    this.treeBarkMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.92,
      metalness: 0.05,
    });
    this.pineFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x143d22,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.oakFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x2e6b2c,
      roughness: 0.82,
      metalness: 0.05,
    });
    this.bushFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x3a7d34,
      roughness: 0.88,
      metalness: 0.02,
    });

    // Stadium Floodlight Emissive Lens Material
    this.floodlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
  }

  /**
   * Terrain, Infield Landscaping, Gravel Traps and Service Perimeter Roads
   */
  private buildTerrainAndInfield(): void {
    const terrainGroup = new THREE.Group();

    // 1. Massive Ground Plane
    const groundGeo = new THREE.PlaneGeometry(750, 750, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.grassMat);
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // 2. Corner Gravel Runoff Traps (Behind corner apexes for realistic FIA safety)
    const corners = [
      { x: 128, z: -128, rot: 0 },
      { x: 128, z: 128, rot: Math.PI / 2 },
      { x: -128, z: 128, rot: Math.PI },
      { x: -128, z: -128, rot: -Math.PI / 2 },
    ];

    corners.forEach((c) => {
      const gravelGeo = new THREE.RingGeometry(this.cornerRadius + this.trackWidth / 2 + 1.2, this.cornerRadius + this.trackWidth / 2 + 16, 24, 1, 0, Math.PI / 2);
      gravelGeo.rotateX(-Math.PI / 2);
      const gravel = new THREE.Mesh(gravelGeo, this.gravelMat);
      const cx = c.x > 0 ? this.innerCornerCenter : -this.innerCornerCenter;
      const cz = c.z > 0 ? this.innerCornerCenter : -this.innerCornerCenter;
      gravel.position.set(cx, 0.008, cz);
      gravel.rotation.y = c.rot;
      gravel.receiveShadow = true;
      terrainGroup.add(gravel);
    });

    // 3. Infield Asphalt Service Road & Helipad
    const heliGeo = new THREE.CircleGeometry(16, 32);
    heliGeo.rotateX(-Math.PI / 2);
    const heliCanvas = document.createElement('canvas');
    heliCanvas.width = 256;
    heliCanvas.height = 256;
    const hCtx = heliCanvas.getContext('2d')!;
    hCtx.fillStyle = '#1e293b';
    hCtx.fillRect(0, 0, 256, 256);
    hCtx.lineWidth = 14;
    hCtx.strokeStyle = '#facc15';
    hCtx.beginPath();
    hCtx.arc(128, 128, 105, 0, Math.PI * 2);
    hCtx.stroke();
    hCtx.fillStyle = '#facc15';
    hCtx.font = 'bold 120px sans-serif';
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillText('H', 128, 128);
    const heliTex = new THREE.CanvasTexture(heliCanvas);
    const heliMat = new THREE.MeshStandardMaterial({ map: heliTex, roughness: 0.8 });
    const helipad = new THREE.Mesh(heliGeo, heliMat);
    helipad.position.set(30, 0.012, 30);
    helipad.receiveShadow = true;
    terrainGroup.add(helipad);

    this.group.add(terrainGroup);
  }

  /**
   * Continuous Asphalt Racing Surface with Pit Lane Integration
   */
  private buildSquareCircuitTrack(): void {
    const trackGroup = new THREE.Group();
    const half = this.halfSize;
    const w = this.trackWidth;
    const c = this.innerCornerCenter;
    const straightLen = c * 2;

    // 4 Straight Sections
    const hGeo = new THREE.PlaneGeometry(straightLen, w);
    hGeo.rotateX(-Math.PI / 2);

    const vGeo = new THREE.PlaneGeometry(w, straightLen);
    vGeo.rotateX(-Math.PI / 2);

    // South Straight (Main straight)
    const southTrack = new THREE.Mesh(hGeo, this.asphaltMat);
    southTrack.position.set(0, 0.005, -half);
    southTrack.receiveShadow = true;
    trackGroup.add(southTrack);

    // North Straight
    const northTrack = new THREE.Mesh(hGeo, this.asphaltMat);
    northTrack.position.set(0, 0.005, half);
    northTrack.receiveShadow = true;
    trackGroup.add(northTrack);

    // East Straight
    const eastTrack = new THREE.Mesh(vGeo, this.asphaltMat);
    eastTrack.position.set(half, 0.005, 0);
    eastTrack.receiveShadow = true;
    trackGroup.add(eastTrack);

    // West Straight
    const westTrack = new THREE.Mesh(vGeo, this.asphaltMat);
    westTrack.position.set(-half, 0.005, 0);
    westTrack.receiveShadow = true;
    trackGroup.add(westTrack);

    // 4 Rounded Corner Sections
    const innerR = this.cornerRadius - w / 2;
    const outerR = this.cornerRadius + w / 2;

    // Corner 1: South-East (Turn 1)
    trackGroup.add(this.createCornerRoadMesh(c, -c, innerR, outerR, -Math.PI / 2, 0));
    // Corner 2: North-East (Turn 2)
    trackGroup.add(this.createCornerRoadMesh(c, c, innerR, outerR, 0, Math.PI / 2));
    // Corner 3: North-West (Turn 3)
    trackGroup.add(this.createCornerRoadMesh(-c, c, innerR, outerR, Math.PI / 2, Math.PI));
    // Corner 4: South-West (Turn 4)
    trackGroup.add(this.createCornerRoadMesh(-c, -c, innerR, outerR, Math.PI, Math.PI * 1.5));

    // Pit Lane & Pit Entry / Exit Seamless Asphalt Apron (Zero grass gaps!)
    const pitApronGeo = new THREE.PlaneGeometry(160, 11.5);
    pitApronGeo.rotateX(-Math.PI / 2);
    const pitApron = new THREE.Mesh(pitApronGeo, this.asphaltMat);
    pitApron.position.set(0, 0.006, -116.5);
    pitApron.receiveShadow = true;
    trackGroup.add(pitApron);

    // Pit Entry & Exit Diagonal Transition Aprons
    const entryApronGeo = new THREE.PlaneGeometry(36, 12);
    entryApronGeo.rotateX(-Math.PI / 2);
    entryApronGeo.rotateY(0.35);
    const entryApron = new THREE.Mesh(entryApronGeo, this.asphaltMat);
    entryApron.position.set(-68, 0.006, -120);
    entryApron.receiveShadow = true;
    trackGroup.add(entryApron);

    const exitApronGeo = new THREE.PlaneGeometry(36, 12);
    exitApronGeo.rotateX(-Math.PI / 2);
    exitApronGeo.rotateY(-0.35);
    const exitApron = new THREE.Mesh(exitApronGeo, this.asphaltMat);
    exitApron.position.set(68, 0.006, -120);
    exitApron.receiveShadow = true;
    trackGroup.add(exitApron);

    // Paint FIA White Road Markings & Boundary Lines
    this.buildTrackAndPitRoadLines(trackGroup);

    this.group.add(trackGroup);
  }

  /**
   * Crisp FIA Official Road Lines & Pit Lane Markings
   */
  private buildTrackAndPitRoadLines(trackGroup: THREE.Group): void {
    const linesGroup = new THREE.Group();
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // 1. South Straight Inner Track Limit Solid White Line (z = -122)
    // Runs along the straight with pit entry opening
    const lineWestGeo = new THREE.PlaneGeometry(24, 0.3);
    lineWestGeo.rotateX(-Math.PI / 2);
    const lineWest = new THREE.Mesh(lineWestGeo, whiteLineMat);
    lineWest.position.set(-80, 0.010, -122);
    linesGroup.add(lineWest);

    const lineEastGeo = new THREE.PlaneGeometry(88, 0.3);
    lineEastGeo.rotateX(-Math.PI / 2);
    const lineEast = new THREE.Mesh(lineEastGeo, whiteLineMat);
    lineEast.position.set(4, 0.010, -122);
    linesGroup.add(lineEast);

    // 2. Pit Entry Deceleration Solid White Boundary Line (Curving into pit lane)
    const pitEntryLinePoints = [];
    for (let p = 0; p <= 20; p++) {
      const t = p / 20;
      const lx = -72 + t * 24;
      const lz = -122 + (1 - Math.cos(t * Math.PI)) * 0.5 * 5.8; // Smooth S-curve from -122 to -116.2
      pitEntryLinePoints.push(new THREE.Vector3(lx, 0.012, lz));
    }
    for (let p = 0; p < pitEntryLinePoints.length - 1; p++) {
      const p1 = pitEntryLinePoints[p];
      const p2 = pitEntryLinePoints[p + 1];
      const segLen = p1.distanceTo(p2);
      const segGeo = new THREE.PlaneGeometry(segLen, 0.3);
      segGeo.rotateX(-Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, whiteLineMat);
      segMesh.position.set((p1.x + p2.x) / 2, 0.012, (p1.z + p2.z) / 2);
      segMesh.rotation.y = -Math.atan2(p2.z - p1.z, p2.x - p1.x);
      linesGroup.add(segMesh);
    }

    // 3. Pit Entry Dashed Commitment Line along Main Straight
    for (let d = 0; d < 8; d++) {
      const dashGeo = new THREE.PlaneGeometry(1.5, 0.3);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, whiteLineMat);
      dash.position.set(-70 + d * 3.0, 0.010, -122);
      linesGroup.add(dash);
    }

    // 4. Pit Lane Fast Lane Solid White Boundary Lines
    const pitInnerLineGeo = new THREE.PlaneGeometry(96, 0.25);
    pitInnerLineGeo.rotateX(-Math.PI / 2);
    const pitInnerLine = new THREE.Mesh(pitInnerLineGeo, whiteLineMat);
    pitInnerLine.position.set(0, 0.010, -113.2); // Paddock garage boundary
    linesGroup.add(pitInnerLine);

    const pitOuterLineGeo = new THREE.PlaneGeometry(96, 0.25);
    pitOuterLineGeo.rotateX(-Math.PI / 2);
    const pitOuterLine = new THREE.Mesh(pitOuterLineGeo, whiteLineMat);
    pitOuterLine.position.set(0, 0.010, -120.4); // Pit wall boundary
    linesGroup.add(pitOuterLine);

    // 5. Pit Lane Center Dashed Guidance Line
    for (let pd = 0; pd < 24; pd++) {
      const pDashGeo = new THREE.PlaneGeometry(2.0, 0.2);
      pDashGeo.rotateX(-Math.PI / 2);
      const pDash = new THREE.Mesh(pDashGeo, yellowLineMat);
      pDash.position.set(-44 + pd * 4.0, 0.010, -116.8);
      linesGroup.add(pDash);
    }

    trackGroup.add(linesGroup);
  }

  /**
   * Realistic Curbs with 3D Ribbed Profile and Checkered Starting Grid
   */
  private buildKerbsAndStartingGrid(): void {
    const kerbGroup = new THREE.Group();
    const c = this.innerCornerCenter;
    const w = this.trackWidth;
    const innerR = this.cornerRadius - w / 2;
    const outerR = this.cornerRadius + w / 2;
    const kerbWidth = 1.6;

    const corners = [
      { cx: c, cz: -c, startAngle: -Math.PI / 2 },
      { cx: c, cz: c, startAngle: 0 },
      { cx: -c, cz: c, startAngle: Math.PI / 2 },
      { cx: -c, cz: -c, startAngle: Math.PI },
    ];

    corners.forEach((corner) => {
      const stepAngle = (Math.PI / 2) / 18;
      for (let i = 0; i < 18; i++) {
        const mat = i % 2 === 0 ? this.kerbRedMat : this.kerbWhiteMat;
        const angle = corner.startAngle + (i + 0.5) * stepAngle;

        // Inner Apex Curb
        const kGeo = new THREE.BoxGeometry(kerbWidth, 0.10, (innerR * stepAngle) * 1.05);
        const kMesh = new THREE.Mesh(kGeo, mat);
        const kx = corner.cx + Math.cos(angle) * (innerR - kerbWidth / 2);
        const kz = corner.cz + Math.sin(angle) * (innerR - kerbWidth / 2);
        kMesh.position.set(kx, 0.05, kz);
        kMesh.rotation.y = -angle;
        kMesh.castShadow = true;
        kerbGroup.add(kMesh);

        // Outer Exit Curb (Exit phase of corner)
        if (i > 8) {
          const okGeo = new THREE.BoxGeometry(kerbWidth, 0.10, (outerR * stepAngle) * 1.05);
          const okMesh = new THREE.Mesh(okGeo, mat);
          const okx = corner.cx + Math.cos(angle) * (outerR + kerbWidth / 2);
          const okz = corner.cz + Math.sin(angle) * (outerR + kerbWidth / 2);
          okMesh.position.set(okx, 0.05, okz);
          okMesh.rotation.y = -angle;
          okMesh.castShadow = true;
          kerbGroup.add(okMesh);
        }
      }
    });

    // Checkered Start / Finish Line
    const sfGeo = new THREE.PlaneGeometry(16, 2.5);
    sfGeo.rotateX(-Math.PI / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = '#09090b';
    for (let x = 0; x < 128; x += 16) {
      for (let y = 0; y < 32; y += 16) {
        if ((x / 16 + y / 16) % 2 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
    const sfTex = new THREE.CanvasTexture(canvas);
    const sfMat = new THREE.MeshStandardMaterial({ map: sfTex, roughness: 0.5 });
    const sfMesh = new THREE.Mesh(sfGeo, sfMat);
    sfMesh.position.set(0, 0.012, -this.halfSize);
    kerbGroup.add(sfMesh);

    // Starting Grid Boxes (8 grid slots)
    for (let g = 0; g < 4; g++) {
      [-2.4, 2.4].forEach((offsetZ, sideIdx) => {
        const boxGeo = new THREE.PlaneGeometry(4.8, 2.2);
        boxGeo.rotateX(-Math.PI / 2);
        const boxMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(-15 - g * 12 + sideIdx * 5, 0.015, -this.halfSize + offsetZ);
        kerbGroup.add(boxMesh);
      });
    }

    this.group.add(kerbGroup);
  }

  /**
   * FIA Concrete Safety Barriers with Overhead Curved Steel Debris Catch Fencing
   */
  private buildConcreteBarriersWithCatchFences(): void {
    const wallHeight = 1.20;
    const wallThick = 0.75;
    const fenceHeight = 2.40;
    const half = this.halfSize;
    const w = this.trackWidth;
    const c = this.innerCornerCenter;

    const outerHalf = half + w / 2 + 2.0;
    const innerHalf = half - w / 2 - 2.0;

    const makeWallWithFence = (x1: number, z1: number, x2: number, z2: number, hasFence: boolean = true) => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      // Concrete Base Block
      const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, length);
      const wall = new THREE.Mesh(wallGeo, this.concreteBarrierMat);
      wall.position.set(midX, wallHeight / 2, midZ);
      wall.rotation.y = angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.group.add(wall);

      // Red Top Guardrail
      const railGeo = new THREE.BoxGeometry(0.14, 0.16, length);
      const railMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(midX, wallHeight + 0.08, midZ);
      rail.rotation.y = angle;
      this.group.add(rail);

      // FIA Catch Fencing (Curved Steel Posts + Wire Cables)
      if (hasFence && length > 6) {
        const postCount = Math.max(2, Math.floor(length / 5));
        for (let p = 0; p <= postCount; p++) {
          const t = p / postCount;
          const px = x1 + (x2 - x1) * t;
          const pz = z1 + (z2 - z1) * t;

          const postGeo = new THREE.CylinderGeometry(0.06, 0.07, fenceHeight, 6);
          const post = new THREE.Mesh(postGeo, this.metalFenceMat);
          post.position.set(px, wallHeight + fenceHeight / 2, pz);
          this.group.add(post);
        }

        // Horizontal security cables
        for (let c = 0; c < 3; c++) {
          const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, length, 4);
          cableGeo.rotateX(Math.PI / 2);
          const cable = new THREE.Mesh(cableGeo, this.metalFenceMat);
          cable.position.set(midX, wallHeight + 0.6 + c * 0.7, midZ);
          cable.rotation.y = angle;
          this.group.add(cable);
        }
      }

      this.staticObstacles.push({
        x: midX,
        z: midZ,
        radius: length / 2,
        isWallSegment: true,
        p1: { x: x1, z: z1 },
        p2: { x: x2, z: z2 },
        type: 'wall',
      });
    };

    // Straight Outer Walls with Catch Fencing
    makeWallWithFence(-c, -outerHalf, c, -outerHalf, true);
    makeWallWithFence(-c, outerHalf, c, outerHalf, true);
    makeWallWithFence(outerHalf, -c, outerHalf, c, true);
    makeWallWithFence(-outerHalf, -c, -outerHalf, c, true);

    // Pit Wall separating main track and pit lane on South straight
    makeWallWithFence(-48, -121.2, 44, -121.2, false);

    // Infield Back Wall behind Pit Garages
    makeWallWithFence(-c, -110.8, c, -110.8, false);

    // 3 Straight Inner Walls (North, East, West)
    makeWallWithFence(-c, innerHalf, c, innerHalf, true);
    makeWallWithFence(innerHalf, -c, innerHalf, c, true);
    makeWallWithFence(-innerHalf, -c, -innerHalf, c, true);

    // Rounded Corner Outer Barrier Walls
    const corners = [
      { cx: c, cz: -c, start: -Math.PI / 2 },
      { cx: c, cz: c, start: 0 },
      { cx: -c, cz: c, start: Math.PI / 2 },
      { cx: -c, cz: -c, start: Math.PI },
    ];

    const outerR = this.cornerRadius + w / 2 + 2.0;
    corners.forEach((corn) => {
      const segs = 6;
      const step = (Math.PI / 2) / segs;
      for (let s = 0; s < segs; s++) {
        const a1 = corn.start + s * step;
        const a2 = corn.start + (s + 1) * step;
        const x1 = corn.cx + Math.cos(a1) * outerR;
        const z1 = corn.cz + Math.sin(a1) * outerR;
        const x2 = corn.cx + Math.cos(a2) * outerR;
        const z2 = corn.cz + Math.sin(a2) * outerR;
        makeWallWithFence(x1, z1, x2, z2, true);
      }
    });
  }

  /**
   * Realistic High-Impact Tecpro Energy Absorbing Barrier Blocks in Runoff Zones
   */
  private buildTecproRunoffZones(): void {
    const tecproGroup = new THREE.Group();
    const c = this.innerCornerCenter;
    const w = this.trackWidth;
    const outerR = this.cornerRadius + w / 2 + 1.2;

    const corners = [
      { cx: c, cz: -c, start: -Math.PI / 2 },
      { cx: c, cz: c, start: 0 },
      { cx: -c, cz: c, start: Math.PI / 2 },
      { cx: -c, cz: -c, start: Math.PI },
    ];

    corners.forEach((corn) => {
      // 8 Tecpro blocks lining the high-impact zone of each corner runoff
      for (let b = 0; b < 8; b++) {
        const angle = corn.start + (b + 0.5) * ((Math.PI / 2) / 8);
        const bx = corn.cx + Math.cos(angle) * (outerR + 0.8);
        const bz = corn.cz + Math.sin(angle) * (outerR + 0.8);

        const blockGeo = new THREE.BoxGeometry(0.85, 1.1, 1.8);
        const mat = b % 2 === 0 ? this.tecproRedMat : this.tecproWhiteMat;
        const block = new THREE.Mesh(blockGeo, mat);
        block.position.set(bx, 0.55, bz);
        block.rotation.y = -angle;
        block.castShadow = true;
        tecproGroup.add(block);
      }
    });

    this.group.add(tecproGroup);
  }

  /**
   * FIA Marshal Posts with Elevated Viewing Platforms, Flags, and Digital LED Signal Boards
   */
  private buildMarshalSafetyPosts(): void {
    const marshalGroup = new THREE.Group();
    const postLocations = [
      { x: 92, z: -145, rot: 0, sector: 'S1' },
      { x: 145, z: 92, rot: Math.PI / 2, sector: 'S2' },
      { x: -92, z: 145, rot: Math.PI, sector: 'S3' },
      { x: -145, z: -92, rot: -Math.PI / 2, sector: 'S4' },
    ];

    postLocations.forEach((loc) => {
      const singlePost = new THREE.Group();
      singlePost.position.set(loc.x, 0, loc.z);
      singlePost.rotation.y = loc.rot;

      // Elevated Steel Scaffold Platform
      const scaffoldGeo = new THREE.BoxGeometry(3.5, 3.2, 2.5);
      const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const scaffold = new THREE.Mesh(scaffoldGeo, scaffoldMat);
      scaffold.position.y = 1.6;
      singlePost.add(scaffold);

      // Cabin / Roof
      const roofGeo = new THREE.BoxGeometry(4.0, 0.3, 3.0);
      const roof = new THREE.Mesh(roofGeo, this.metalSilverMat);
      roof.position.y = 4.8;
      singlePost.add(roof);

      // Digital FIA LED Signal Board (Green/Yellow Racing Matrix)
      const ledGeo = new THREE.BoxGeometry(1.4, 0.9, 0.2);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x22c55e, // Radiant green flag LED
        emissiveIntensity: 3.2,
      });
      const ledBoard = new THREE.Mesh(ledGeo, ledMat);
      ledBoard.position.set(0, 3.8, 1.35);
      singlePost.add(ledBoard);

      marshalGroup.add(singlePost);
    });

    this.group.add(marshalGroup);
  }

  /**
   * Massive Covered Multi-Tiered Grandstand with VIP Corporate Suites and Real Sponsors
   */
  private buildGrandstands(): void {
    const standsGroup = new THREE.Group();

    // 1. South Main Grandstand (120m long, covered cantilevered canopy)
    const standLength = 120;
    const standDepth = 18;
    const standHeight = 14;

    // Concrete Base
    const baseGeo = new THREE.BoxGeometry(standLength, 2.5, standDepth);
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
    baseMesh.position.set(0, 1.25, -154);
    baseMesh.castShadow = true;
    standsGroup.add(baseMesh);

    // 8 Tiered Seating Rows with Alternating FIA Red and Sapphire Blue Seats
    const tiers = 8;
    for (let t = 0; t < tiers; t++) {
      const tierGeo = new THREE.BoxGeometry(standLength, 1.2, standDepth / tiers);
      const seatMat = new THREE.MeshStandardMaterial({
        color: t % 2 === 0 ? 0xdc2626 : 0x1d4ed8,
        roughness: 0.45,
        metalness: 0.1,
      });
      const tierMesh = new THREE.Mesh(tierGeo, seatMat);
      tierMesh.position.set(0, 2.5 + t * 1.15, -154 + (t - tiers / 2) * (standDepth / tiers));
      tierMesh.castShadow = true;
      standsGroup.add(tierMesh);
    }

    // Upper VIP Glass Corporate Suites
    const vipGeo = new THREE.BoxGeometry(standLength - 8, 3.5, 4.5);
    const vipBuilding = new THREE.Mesh(vipGeo, this.metalDarkMat);
    vipBuilding.position.set(0, standHeight + 0.5, -160);
    standsGroup.add(vipBuilding);

    const glassFrontGeo = new THREE.BoxGeometry(standLength - 10, 2.6, 0.2);
    const glassFront = new THREE.Mesh(glassFrontGeo, this.glassMat);
    glassFront.position.set(0, standHeight + 0.5, -157.6);
    standsGroup.add(glassFront);

    // Cantilevered Aerodynamic Steel Roof Canopy
    const roofGeo = new THREE.BoxGeometry(standLength + 6, 0.6, standDepth + 8);
    roofGeo.rotateX(0.14);
    const roof = new THREE.Mesh(roofGeo, this.metalSilverMat);
    roof.position.set(0, standHeight + 3.2, -151);
    roof.castShadow = true;
    standsGroup.add(roof);

    // High-Resolution Trackside Sponsor Hoardings
    const sponsorGeo = new THREE.BoxGeometry(standLength, 2.4, 0.2);
    const sponsorCanvas = document.createElement('canvas');
    sponsorCanvas.width = 1024;
    sponsorCanvas.height = 128;
    const sCtx = sponsorCanvas.getContext('2d')!;
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 128);
    sCtx.fillStyle = '#ef4444';
    sCtx.fillRect(0, 116, 1024, 12);
    sCtx.fillStyle = '#f59e0b';
    sCtx.font = 'bold 52px sans-serif';
    sCtx.fillText('APEX GRAND PRIX  ·  PIRELLI  ·  BREMBO  ·  SHELL  ·  ROLEX', 24, 82);
    const sponsorTex = new THREE.CanvasTexture(sponsorCanvas);
    const sponsorMat = new THREE.MeshBasicMaterial({ map: sponsorTex });
    const sponsorMesh = new THREE.Mesh(sponsorGeo, sponsorMat);
    sponsorMesh.position.set(0, 2.8, -144.2);
    standsGroup.add(sponsorMesh);

    // 2. North Bank Open Grandstand (80m long)
    const northLength = 80;
    const northBaseGeo = new THREE.BoxGeometry(northLength, 1.8, 14);
    const northBase = new THREE.Mesh(northBaseGeo, concreteMat);
    northBase.position.set(0, 0.9, 152);
    northBase.castShadow = true;
    standsGroup.add(northBase);

    for (let nt = 0; nt < 5; nt++) {
      const nTierGeo = new THREE.BoxGeometry(northLength, 1.0, 14 / 5);
      const nSeatMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
      const nTier = new THREE.Mesh(nTierGeo, nSeatMat);
      nTier.position.set(0, 1.8 + nt * 0.9, 152 + (nt - 2.5) * (14 / 5));
      nTier.castShadow = true;
      standsGroup.add(nTier);
    }

    this.group.add(standsGroup);
  }

  /**
   * Two-Story Modern Paddock Club & Pit Garages with Workshop Lighting
   */
  private buildPaddockBuildingAndPitLane(): void {
    const paddockGroup = new THREE.Group();

    // 1. Two-Story Paddock Club Building (90m length x 16m depth x 8.5m height)
    const buildingLength = 90;
    const buildingGeo = new THREE.BoxGeometry(buildingLength, 8.5, 14);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(-2.5, 4.25, -103);
    building.castShadow = true;
    paddockGroup.add(building);

    // Architectural White/Silver Cladding Overhang
    const canopyGeo = new THREE.BoxGeometry(buildingLength + 2, 0.4, 15.5);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.metalSilverMat);
    canopyMesh.position.set(-2.5, 8.6, -103);
    paddockGroup.add(canopyMesh);

    // West Facade facing Pit Entry (x = -47.5): Architectural Sponsor Logo & Glass
    const westSignGeo = new THREE.PlaneGeometry(12, 5.5);
    westSignGeo.rotateY(-Math.PI / 2);
    const wsCanvas = document.createElement('canvas');
    wsCanvas.width = 512;
    wsCanvas.height = 256;
    const wsCtx = wsCanvas.getContext('2d')!;
    wsCtx.fillStyle = '#0f172a';
    wsCtx.fillRect(0, 0, 512, 256);
    wsCtx.fillStyle = '#ef4444';
    wsCtx.fillRect(0, 0, 512, 12);
    wsCtx.fillStyle = '#ffffff';
    wsCtx.font = 'black 46px sans-serif';
    wsCtx.textAlign = 'center';
    wsCtx.fillText('PADDOCK CLUB', 256, 110);
    wsCtx.fillStyle = '#f59e0b';
    wsCtx.font = 'bold 32px monospace';
    wsCtx.fillText('VIP PIT HOSPITALITY', 256, 175);
    const wsTex = new THREE.CanvasTexture(wsCanvas);
    const wsMat = new THREE.MeshStandardMaterial({ map: wsTex, roughness: 0.3 });
    const westSign = new THREE.Mesh(westSignGeo, wsMat);
    westSign.position.set(-47.55, 4.5, -103);
    paddockGroup.add(westSign);

    // Upper VIP Glass Facade
    const vipGlassGeo = new THREE.PlaneGeometry(buildingLength - 4, 3.2);
    const vipGlass = new THREE.Mesh(vipGlassGeo, this.glassMat);
    vipGlass.position.set(-2.5, 6.4, -110.1);
    paddockGroup.add(vipGlass);

    // 6 Team Garages with Roll-Up Doors and Neon Workshop Lighting
    const teamColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    for (let g = 0; g < 6; g++) {
      const doorX = -40 + g * 15;

      // Roll-Up Garage Door
      const doorGeo = new THREE.PlaneGeometry(11.5, 3.8);
      const doorMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.75,
        roughness: 0.3,
      });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(doorX, 1.9, -110.1);
      paddockGroup.add(door);

      // Team Header Strip
      const headerGeo = new THREE.PlaneGeometry(11.5, 0.7);
      const headerMat = new THREE.MeshBasicMaterial({ color: teamColors[g] });
      const header = new THREE.Mesh(headerGeo, headerMat);
      header.position.set(doorX, 4.15, -110.05);
      paddockGroup.add(header);
    }

    // 2. Pit Wall Gantry with Team Telemetry Monitors
    for (let pw = 0; pw < 6; pw++) {
      const pwX = -35 + pw * 14;
      const standGantryGeo = new THREE.BoxGeometry(3.2, 2.2, 0.8);
      const standGantry = new THREE.Mesh(standGantryGeo, this.metalDarkMat);
      standGantry.position.set(pwX, 2.1, -121.2);
      paddockGroup.add(standGantry);

      // Glowing Timing Screens
      const monitorGeo = new THREE.PlaneGeometry(1.2, 0.7);
      const monitorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(pwX, 2.2, -120.75);
      paddockGroup.add(monitor);
    }

    this.group.add(paddockGroup);
  }

  /**
   * FIA Grade-1 High-Fidelity Pit Lane Entry & Exit Architecture
   * Includes Impact Attenuator Crash Cushion, Pit Limiter Speed & Timing Gantry,
   * Chevron Deceleration Road Markings, Fluorescent Apex Bollards, and Marshal Safety Station.
   */
  private buildPitEntryAndExitArchitecture(): void {
    const pitEntryGroup = new THREE.Group();

    // =========================================================================
    // 1. FIA HIGH-SPEED IMPACT ATTENUATOR / CRASH CUSHION (Pit Wall Entry Nose)
    // =========================================================================
    const noseX = -48;
    const noseZ = -121.2;

    // A. Main Crash Cushion Wedge
    const cushionGeo = new THREE.BoxGeometry(2.4, 1.35, 1.2);
    const cushionCanvas = document.createElement('canvas');
    cushionCanvas.width = 256;
    cushionCanvas.height = 128;
    const cCtx = cushionCanvas.getContext('2d')!;
    cCtx.fillStyle = '#facc15'; // High-visibility safety yellow
    cCtx.fillRect(0, 0, 256, 128);
    // Black chevron hazard diagonal stripes
    cCtx.fillStyle = '#09090b';
    cCtx.lineWidth = 28;
    for (let x = -100; x < 350; x += 55) {
      cCtx.beginPath();
      cCtx.moveTo(x, 128);
      cCtx.lineTo(x + 50, 0);
      cCtx.lineTo(x + 75, 0);
      cCtx.lineTo(x + 25, 128);
      cCtx.fill();
    }
    const cushionTex = new THREE.CanvasTexture(cushionCanvas);
    const cushionMat = new THREE.MeshStandardMaterial({
      map: cushionTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const cushionMesh = new THREE.Mesh(cushionGeo, cushionMat);
    cushionMesh.position.set(noseX - 1.2, 0.68, noseZ);
    cushionMesh.castShadow = true;
    pitEntryGroup.add(cushionMesh);

    // B. Stepped Energy-Absorbing Steel Deceleration Cylinders (QuadGuard style)
    for (let cyl = 0; cyl < 4; cyl++) {
      const cylGeo = new THREE.CylinderGeometry(0.48 - cyl * 0.04, 0.48 - cyl * 0.04, 1.2, 16);
      const cylMat = new THREE.MeshStandardMaterial({ color: cyl % 2 === 0 ? 0xfacc15 : 0x1e293b, roughness: 0.4 });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.position.set(noseX - 2.8 - cyl * 0.85, 0.6, noseZ);
      cylMesh.castShadow = true;
      pitEntryGroup.add(cylMesh);
    }

    // C. High-Intensity Flashing Amber LED Warning Beacon on Nose
    const beaconBaseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12);
    const beaconBase = new THREE.Mesh(beaconBaseGeo, this.metalDarkMat);
    beaconBase.position.set(noseX - 0.8, 1.5, noseZ);
    pitEntryGroup.add(beaconBase);

    const beaconLightGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const beaconLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 6.0,
      roughness: 0.1,
    });
    const beaconLight = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconLight.position.set(noseX - 0.8, 1.75, noseZ);
    pitEntryGroup.add(beaconLight);

    // =========================================================================
    // 2. LUXURY FORMULA 1 PIT ENTRY SPEED & STATUS GANTRY (x = -54, aligned to pit wall)
    // =========================================================================
    const gantryX = -54;
    const gantryH = 5.8;
    const pitWallZ = -121.2;  // Left column aligns EXACTLY with the pit wall
    const paddockWallZ = -113.2; // Right column aligns with paddock side
    const gantryCenterZ = (pitWallZ + paddockWallZ) / 2; // -117.2
    const gantrySpan = Math.abs(pitWallZ - paddockWallZ); // 8.0m

    // Heavy-duty Brushed Titanium Columns (Pit Wall side and Paddock side)
    const colGeo = new THREE.BoxGeometry(0.65, gantryH, 0.65);
    const colLeft = new THREE.Mesh(colGeo, this.metalDarkMat);
    colLeft.position.set(gantryX, gantryH / 2, pitWallZ);
    colLeft.castShadow = true;
    pitEntryGroup.add(colLeft);

    const colRight = new THREE.Mesh(colGeo, this.metalDarkMat);
    colRight.position.set(gantryX, gantryH / 2, paddockWallZ);
    colRight.castShadow = true;
    pitEntryGroup.add(colRight);

    // Crossbar Gantry Truss with Carbon-Titanium Casing (Only spans the pit lane)
    const crossGeo = new THREE.BoxGeometry(0.85, 1.25, gantrySpan + 0.65);
    const crossMesh = new THREE.Mesh(crossGeo, this.metalDarkMat);
    crossMesh.position.set(gantryX, gantryH - 0.55, gantryCenterZ);
    crossMesh.castShadow = true;
    pitEntryGroup.add(crossMesh);

    // Luxury FIA High-Definition Digital Sign Display
    const gantrySignCanvas = document.createElement('canvas');
    gantrySignCanvas.width = 1024;
    gantrySignCanvas.height = 256;
    const gCtx = gantrySignCanvas.getContext('2d')!;

    // Deep Obsidian / Carbon Matrix Backing
    gCtx.fillStyle = '#0a0d14';
    gCtx.fillRect(0, 0, 1024, 256);

    // Subtle Carbon-Fiber Pattern
    gCtx.fillStyle = '#111827';
    for (let y = 0; y < 256; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < 1024; x += 16) {
        gCtx.fillRect(x, y, 8, 8);
      }
    }

    // Elegant Brushed Gold and Crimson Accent Trim
    gCtx.fillStyle = '#f59e0b'; // Luxury Gold Trim
    gCtx.fillRect(0, 0, 1024, 8);
    gCtx.fillStyle = '#ef4444'; // FIA Racing Red
    gCtx.fillRect(0, 248, 1024, 8);

    // Top Header: Swiss Clean Typography
    gCtx.fillStyle = '#94a3b8';
    gCtx.font = 'bold 26px sans-serif';
    gCtx.textAlign = 'left';
    gCtx.fillText('FIA PIT ENTRY CONTROL', 48, 48);

    // Status Pill: [● PIT OPEN ●] with elegant emerald LED
    gCtx.fillStyle = '#064e3b';
    gCtx.fillRect(720, 22, 250, 36);
    gCtx.strokeStyle = '#10b981';
    gCtx.lineWidth = 2;
    gCtx.strokeRect(720, 22, 250, 36);
    gCtx.fillStyle = '#34d399';
    gCtx.font = 'bold 22px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('● PIT OPEN ●', 845, 48);

    // Center Roundel: International FIA Speed Limit 60 Badge (Red Circle + Pure White Inside + Black '60')
    const badgeX = 220;
    const badgeY = 145;
    const badgeR = 64;

    // Red Outer Warning Ring
    gCtx.fillStyle = '#dc2626';
    gCtx.beginPath();
    gCtx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    gCtx.fill();

    // White Core Disc
    gCtx.fillStyle = '#ffffff';
    gCtx.beginPath();
    gCtx.arc(badgeX, badgeY, badgeR * 0.76, 0, Math.PI * 2);
    gCtx.fill();

    // Bold Speed Number '60'
    gCtx.fillStyle = '#09090b';
    gCtx.font = '900 64px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText('60', badgeX, badgeY + 3);

    // Right Main Text: Crisp Luxury High-Resolution Typography
    gCtx.textAlign = 'left';
    gCtx.textBaseline = 'alphabetic';
    gCtx.fillStyle = '#ffffff';
    gCtx.font = '900 58px sans-serif';
    gCtx.fillText('PIT SPEED LIMIT', 320, 135);

    gCtx.fillStyle = '#f59e0b';
    gCtx.font = 'bold 30px monospace';
    gCtx.fillText('MAX 60 KM/H · ENGAGE LIMITER', 320, 185);

    const gantrySignTex = new THREE.CanvasTexture(gantrySignCanvas);
    const gantrySignMat = new THREE.MeshStandardMaterial({
      map: gantrySignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: gantrySignTex,
      emissiveIntensity: 0.95,
      roughness: 0.25,
      metalness: 0.4,
    });
    const gantrySignGeo = new THREE.PlaneGeometry(6.8, 1.8);
    gantrySignGeo.rotateY(-Math.PI / 2); // Facing incoming cars from West
    const gantrySign = new THREE.Mesh(gantrySignGeo, gantrySignMat);
    gantrySign.position.set(gantryX - 0.45, gantryH - 0.55, gantryCenterZ);
    pitEntryGroup.add(gantrySign);

    // FIA CCTV Telemetry Cameras on Gantry
    for (let cam = 0; cam < 2; cam++) {
      const camHousingGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
      const camHousing = new THREE.Mesh(camHousingGeo, this.metalSilverMat);
      camHousing.position.set(gantryX - 0.5, gantryH - 1.1, gantryCenterZ - 2.0 + cam * 4.0);
      pitEntryGroup.add(camHousing);

      const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(gantryX - 0.7, gantryH - 1.1, gantryCenterZ - 2.0 + cam * 4.0);
      pitEntryGroup.add(lens);
    }

    // =========================================================================
    // 3. ROAD MARKINGS: FIA CHEVRON DECELERATION HATCHING & LIMITER LINE
    // =========================================================================
    // A. Triangular Chevron Island between Main Track and Pit Lane (x: -74 to -48)
    const chevronGeo = new THREE.PlaneGeometry(28, 7.5);
    chevronGeo.rotateX(-Math.PI / 2);
    chevronGeo.rotateY(0.28);
    const chevronCanvas = document.createElement('canvas');
    chevronCanvas.width = 512;
    chevronCanvas.height = 256;
    const chCtx = chevronCanvas.getContext('2d')!;
    chCtx.fillStyle = 'rgba(20, 20, 25, 0.0)'; // Transparent base
    chCtx.fillRect(0, 0, 512, 256);

    // Solid Perimeter White Line
    chCtx.strokeStyle = '#ffffff';
    chCtx.lineWidth = 14;
    chCtx.beginPath();
    chCtx.moveTo(20, 230);
    chCtx.lineTo(490, 128);
    chCtx.lineTo(20, 26);
    chCtx.closePath();
    chCtx.stroke();

    // Diagonal White Chevron Stripes (FIA Safety Standard)
    chCtx.lineWidth = 16;
    for (let px = 60; px < 460; px += 42) {
      chCtx.beginPath();
      chCtx.moveTo(px, 220);
      chCtx.lineTo(px + 45, 128);
      chCtx.lineTo(px, 36);
      chCtx.stroke();
    }

    const chevronTex = new THREE.CanvasTexture(chevronCanvas);
    const chevronMat = new THREE.MeshBasicMaterial({
      map: chevronTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const chevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
    chevronMesh.position.set(-61, 0.012, -124.8);
    pitEntryGroup.add(chevronMesh);

    // B. Transverse Pit Limiter Ground Road Line (at x = -54, spanning exactly the pit lane)
    const limiterLineGeo = new THREE.PlaneGeometry(1.6, 7.6);
    limiterLineGeo.rotateX(-Math.PI / 2);
    const limiterCanvas = document.createElement('canvas');
    limiterCanvas.width = 128;
    limiterCanvas.height = 512;
    const lCtx = limiterCanvas.getContext('2d')!;
    // Red & White chequered safety band
    for (let y = 0; y < 512; y += 32) {
      lCtx.fillStyle = (y / 32) % 2 === 0 ? '#ef4444' : '#ffffff';
      lCtx.fillRect(0, y, 128, 32);
    }
    const limiterTex = new THREE.CanvasTexture(limiterCanvas);
    const limiterMat = new THREE.MeshBasicMaterial({ map: limiterTex });
    const limiterLine = new THREE.Mesh(limiterLineGeo, limiterMat);
    limiterLine.position.set(gantryX, 0.014, gantryCenterZ);
    pitEntryGroup.add(limiterLine);

    // C. Heavy Tire Skid / Deceleration Rubber Marks on Pit Entry Tarmac
    const skidGeo = new THREE.PlaneGeometry(36, 6.0);
    skidGeo.rotateX(-Math.PI / 2);
    skidGeo.rotateY(0.42);
    const skidCanvas = document.createElement('canvas');
    skidCanvas.width = 512;
    skidCanvas.height = 128;
    const skCtx = skidCanvas.getContext('2d')!;
    skCtx.fillStyle = 'rgba(0,0,0,0)';
    skCtx.fillRect(0, 0, 512, 128);
    // Dark dual tire rubber trails
    const drawTireRubber = (offsetY: number) => {
      const grad = skCtx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0.0, 'rgba(10, 10, 12, 0.0)');
      grad.addColorStop(0.3, 'rgba(10, 10, 12, 0.65)');
      grad.addColorStop(0.8, 'rgba(10, 10, 12, 0.85)');
      grad.addColorStop(1.0, 'rgba(10, 10, 12, 0.35)');
      skCtx.fillStyle = grad;
      skCtx.fillRect(0, offsetY, 512, 14);
    };
    drawTireRubber(32);
    drawTireRubber(82);
    const skidTex = new THREE.CanvasTexture(skidCanvas);
    const skidMat = new THREE.MeshBasicMaterial({
      map: skidTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const skidMesh = new THREE.Mesh(skidGeo, skidMat);
    skidMesh.position.set(-66, 0.011, -121.8);
    pitEntryGroup.add(skidMesh);

    // =========================================================================
    // 4. FLUORESCENT BOLLARDS (Strictly on the dividing island, NOT invading track)
    // =========================================================================
    for (let b = 0; b < 6; b++) {
      const bt = b / 5;
      // Positioned strictly along the dividing island leading safely to the crash cushion
      const bx = -56 + bt * 7.5;
      const bz = -123.2 + bt * 2.0;

      const bollardGroup = new THREE.Group();
      bollardGroup.position.set(bx, 0, bz);

      // Flexible Orange Polyurethane Post (0.75m tall)
      const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.75, 12);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, // Fluorescent safety orange
        roughness: 0.3,
        metalness: 0.1,
      });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.375;
      bollardGroup.add(post);

      // 3M Retroreflective White Bands
      for (let r = 0; r < 2; r++) {
        const ringGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.10, 12);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.48 + r * 0.16;
        bollardGroup.add(ring);
      }

      pitEntryGroup.add(bollardGroup);
    }

    // =========================================================================
    // 5. ENTRY MARSHAL SAFETY POST & FIRE STATION (Integrated into Pit Wall)
    // =========================================================================
    const marshalX = -44;
    const marshalZ = -121.2; // Aligned directly on top of the pit wall

    // Platform Base
    const mBaseGeo = new THREE.BoxGeometry(2.4, 1.8, 0.9);
    const mBase = new THREE.Mesh(mBaseGeo, this.metalDarkMat);
    mBase.position.set(marshalX, 1.9, marshalZ);
    mBase.castShadow = true;
    pitEntryGroup.add(mBase);

    // Platform Canopy Roof
    const mRoofGeo = new THREE.BoxGeometry(2.8, 0.15, 1.2);
    const mRoof = new THREE.Mesh(mRoofGeo, this.metalSilverMat);
    mRoof.position.set(marshalX, 3.4, marshalZ);
    pitEntryGroup.add(mRoof);

    // Electronic Flag LED Matrix Display (Green / Yellow / SC)
    const eFlagGeo = new THREE.BoxGeometry(1.0, 0.65, 0.15);
    const eFlagMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x22c55e, // Glowing Green Light
      emissiveIntensity: 4.5,
    });
    const eFlag = new THREE.Mesh(eFlagGeo, eFlagMat);
    eFlag.position.set(marshalX - 0.6, 2.6, marshalZ + 0.45);
    pitEntryGroup.add(eFlag);

    // Fire Extinguishers (Red steel cylinders with chrome nozzles)
    for (let fe = 0; fe < 2; fe++) {
      const feGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.55, 12);
      const feMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.2 });
      const feMesh = new THREE.Mesh(feGeo, feMat);
      feMesh.position.set(marshalX + 0.4 + fe * 0.35, 2.1, marshalZ);
      pitEntryGroup.add(feMesh);
    }

    // =========================================================================
    // 6. MOTORSPORT SPONSOR BANNERS ALONG PIT WALL (Rolex, Pirelli, Brembo, Apex GT)
    // =========================================================================
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d')!;
    bCtx.fillStyle = '#0f172a';
    bCtx.fillRect(0, 0, 1024, 128);
    bCtx.fillStyle = '#ef4444';
    bCtx.fillRect(0, 0, 1024, 8);
    bCtx.fillStyle = '#f59e0b';
    bCtx.fillRect(0, 120, 1024, 8);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'black 44px sans-serif';
    bCtx.fillText('APEX GT PIT LANE  ·  ROLEX  ·  PIRELLI  ·  BREMBO  ·  SHELL', 28, 78);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 });
    const bannerGeo = new THREE.BoxGeometry(32, 1.1, 0.15);
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(-32, 1.4, -121.2);
    pitEntryGroup.add(bannerMesh);

    this.group.add(pitEntryGroup);
  }

  /**
   * 18m Jumbotron LED Video Wall & Circuit Tower
   */
  private buildJumbotronAndTimingTowers(): void {
    const towerGroup = new THREE.Group();

    // Tower located near Turn 1 (x = 65, z = -148)
    const towerX = 65;
    const towerZ = -148;

    // Steel Lattice Support
    const mastGeo = new THREE.BoxGeometry(2.2, 18, 2.2);
    const mast = new THREE.Mesh(mastGeo, this.metalDarkMat);
    mast.position.set(towerX, 9, towerZ);
    mast.castShadow = true;
    towerGroup.add(mast);

    // Massive Jumbotron Screen (12m x 7m)
    const screenGeo = new THREE.BoxGeometry(12, 7, 0.6);
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.fillStyle = '#09090b';
    sCtx.fillRect(0, 0, 512, 256);
    sCtx.fillStyle = '#f59e0b';
    sCtx.font = 'bold 36px monospace';
    sCtx.fillText('APEX GP LIVE TIMING', 40, 55);
    sCtx.fillStyle = '#22c55e';
    sCtx.font = '28px monospace';
    sCtx.fillText('P1  VER  1:14.281', 40, 110);
    sCtx.fillText('P2  LEC  +0.142', 40, 155);
    sCtx.fillText('P3  NOR  +0.298', 40, 200);
    const screenTex = new THREE.CanvasTexture(sCanvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(towerX, 15, towerZ + 1.2);
    screenMesh.rotation.y = -0.2;
    towerGroup.add(screenMesh);

    this.group.add(towerGroup);
  }

  /**
   * Start / Finish Overhead Gantry with FIA Start Lights & West High-Tech Bridge
   */
  private buildOverheadGantriesAndBridges(): void {
    const structGroup = new THREE.Group();

    // 1. Start Gantry across Main Straight and Pit Lane
    const gantryHeight = 7.8;
    const pylonZ1 = -143;
    const pylonZ2 = -106;

    [pylonZ1, pylonZ2].forEach((zPos) => {
      const pylonGeo = new THREE.BoxGeometry(1.4, gantryHeight, 1.4);
      const pylon = new THREE.Mesh(pylonGeo, this.metalDarkMat);
      pylon.position.set(0, gantryHeight / 2, zPos);
      pylon.castShadow = true;
      structGroup.add(pylon);
    });

    // Overhead Truss Beam
    const spanLengthZ = Math.abs(pylonZ2 - pylonZ1) + 1.4;
    const spanCenterZ = (pylonZ1 + pylonZ2) / 2;
    const spanGeo = new THREE.BoxGeometry(1.6, 1.6, spanLengthZ);
    const span = new THREE.Mesh(spanGeo, this.metalDarkMat);
    span.position.set(0, gantryHeight + 0.8, spanCenterZ);
    span.castShadow = true;
    structGroup.add(span);

    // 5 Red Starting Light Pods
    for (let l = 0; l < 5; l++) {
      const lightGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.20, 14);
      lightGeo.rotateZ(Math.PI / 2);
      const lightMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0xef4444,
        emissiveIntensity: 3.5,
      });
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.set(-0.85, gantryHeight + 0.3, -this.halfSize - 4 + l * 2);
      structGroup.add(lightMesh);
    }

    // 2. West High-Tech Sponsor Arch Bridge (38m span across West Straight)
    const archSpan = 38;
    const archH = 8.8;
    const archMeshGeo = new THREE.BoxGeometry(archSpan, 2.4, 4.8);
    const archMesh = new THREE.Mesh(archMeshGeo, this.metalDarkMat);
    archMesh.position.set(-this.halfSize, archH, 0);
    archMesh.castShadow = true;
    structGroup.add(archMesh);

    // Arch Support Pillars
    [-this.halfSize - archSpan / 2 + 0.8, -this.halfSize + archSpan / 2 - 0.8].forEach((xPos) => {
      const pillarGeo = new THREE.CylinderGeometry(1.3, 1.5, archH, 12);
      const pillar = new THREE.Mesh(pillarGeo, this.metalDarkMat);
      pillar.position.set(xPos, archH / 2, 0);
      pillar.castShadow = true;
      structGroup.add(pillar);

      this.staticObstacles.push({
        x: xPos,
        z: 0,
        radius: 1.6,
        type: 'pillar',
      });
    });

    this.group.add(structGroup);
  }

  /**
   * 24 High-Mast Stadium Floodlight Towers Surrounding the Entire Circuit
   * Every single tower is analyzed and rotated so the light head and spotlight bulbs
   * pitch downward at a 35 degree angle pointing directly at the racing track surface!
   */
  private buildHighMastFloodlights(): void {
    const towerGroup = new THREE.Group();

    // 24 Strategic Floodlight Tower positions with exact track target focal points
    const floodlightConfigs = [
      // South Straight (Main Straight & Pit Lane) - Aiming North onto the track
      { x: -75, z: -156, tx: -75, tz: -130 },
      { x: -40, z: -156, tx: -40, tz: -130 },
      { x: 0, z: -156, tx: 0, tz: -130 },
      { x: 40, z: -156, tx: 40, tz: -130 },
      { x: 75, z: -156, tx: 75, tz: -130 },
      // South Infield Pit Tower - Aiming South onto Pit Lane & Track
      { x: -10, z: -92, tx: -10, tz: -116 },

      // Turn 1 Corner Outer Towers (South-East) - Aiming at Turn 1 apex & exit
      { x: 125, z: -156, tx: 110, tz: -125 },
      { x: 156, z: -125, tx: 125, tz: -110 },
      { x: 156, z: -80, tx: 130, tz: -80 },

      // East Straight - Aiming West onto the track
      { x: 156, z: -40, tx: 130, tz: -40 },
      { x: 156, z: 0, tx: 130, tz: 0 },
      { x: 156, z: 40, tx: 130, tz: 40 },

      // Turn 2 Corner Outer Towers (North-East) - Aiming at Turn 2 apex & exit
      { x: 156, z: 80, tx: 130, tz: 80 },
      { x: 156, z: 125, tx: 125, tz: 110 },
      { x: 125, z: 156, tx: 110, tz: 125 },

      // North Straight - Aiming South onto the track
      { x: 75, z: 156, tx: 75, tz: 130 },
      { x: 40, z: 156, tx: 40, tz: 130 },
      { x: 0, z: 156, tx: 0, tz: 130 },
      { x: -40, z: 156, tx: -40, tz: 130 },
      { x: -75, z: 156, tx: -75, tz: 130 },

      // Turn 3 Corner Outer Towers (North-West) - Aiming at Turn 3 apex & exit
      { x: -125, z: 156, tx: -110, tz: 125 },
      { x: -156, z: 125, tx: -125, tz: 110 },
      { x: -156, z: 80, tx: -130, tz: 80 },

      // West Straight - Aiming East onto the track
      { x: -156, z: 40, tx: -130, tz: 40 },
      { x: -156, z: 0, tx: -130, tz: 0 },
      { x: -156, z: -40, tx: -130, tz: -40 },

      // Turn 4 Corner Outer Towers (South-West) - Aiming at Turn 4 apex & entry
      { x: -156, z: -80, tx: -130, tz: -80 },
      { x: -156, z: -125, tx: -125, tz: -110 },
      { x: -125, z: -156, tx: -110, tz: -125 },
    ];

    floodlightConfigs.forEach((cfg) => {
      const singleTower = new THREE.Group();
      singleTower.position.set(cfg.x, 0, cfg.z);

      // Analyze angle from tower position to its intended target on the track!
      const yawAngle = Math.atan2(cfg.tx - cfg.x, cfg.tz - cfg.z);
      singleTower.rotation.y = yawAngle;

      // Steel Lattice Mast (24m high)
      const mastH = 24;
      const mastGeo = new THREE.CylinderGeometry(0.55, 1.1, mastH, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = mastH / 2;
      mast.castShadow = true;
      singleTower.add(mast);

      // Angled Light Head Assembly (pitched 35 degrees forward towards the track!)
      const headAssembly = new THREE.Group();
      headAssembly.position.set(0, mastH, 0);
      headAssembly.rotation.x = 0.62; // 35.5 degrees pitch down directly aimed at the asphalt

      // Cantilever Arm Bar
      const armGeo = new THREE.BoxGeometry(0.8, 0.8, 2.2);
      const arm = new THREE.Mesh(armGeo, mastMat);
      arm.position.set(0, 0, 1.1);
      headAssembly.add(arm);

      // Hexagonal Crossbar Head
      const headGeo = new THREE.BoxGeometry(5.4, 1.4, 0.8);
      const head = new THREE.Mesh(headGeo, mastMat);
      head.position.set(0, 0, 2.2);
      headAssembly.add(head);

      // 6 High-Power Stadium Spotlights angled directly at the circuit
      for (let s = 0; s < 6; s++) {
        // Spotlight Casing
        const spotHousingGeo = new THREE.BoxGeometry(0.75, 0.75, 0.4);
        const spotHousing = new THREE.Mesh(spotHousingGeo, mastMat);
        spotHousing.position.set(-2.1 + s * 0.84, 0, 2.45);
        headAssembly.add(spotHousing);

        // Glowing Emissive Lens
        const lensGeo = new THREE.PlaneGeometry(0.65, 0.65);
        const lens = new THREE.Mesh(lensGeo, this.floodlightMat);
        lens.position.set(-2.1 + s * 0.84, 0, 2.66);
        headAssembly.add(lens);
      }

      singleTower.add(headAssembly);
      towerGroup.add(singleTower);
    });

    this.group.add(towerGroup);
  }

  /**
   * Toggles day/night mode for all trackside illumination and stadium floodlights
   */
  public setNightMode(isNight: boolean): void {
    if (this.floodlightMat) {
      this.floodlightMat.emissiveIntensity = isNight ? 22.0 : 1.2;
      this.floodlightMat.emissive.setHex(isNight ? 0xffffff : 0x94a3b8);
    }
  }

  /**
   * Realistic Multi-Layer Organic Vegetation (Pines, Oaks, and Flowering Shrubs)
   * Safely positioned in deep infield and behind outer perimeter barriers (100% clear of track).
   */
  private buildOrganicVegetation(): void {
    const vegGroup = new THREE.Group();

    // 1. Tall Mediterranean Racing Pines (Deep infield & outfield perimeter)
    const pinePositions: Array<[number, number, number]> = [
      // Infield safe zones
      [-45, -45, 1.2],
      [-55, -30, 1.3],
      [45, -45, 1.3],
      [55, -30, 1.1],
      [45, 45, 1.4],
      [55, 30, 1.2],
      [-45, 45, 1.3],
      [-55, 30, 1.2],
      // Outfield perimeter behind barriers
      [-175, 40, 1.6],
      [-175, -40, 1.5],
      [175, 40, 1.5],
      [175, -40, 1.4],
      [0, -178, 1.6],
      [0, 178, 1.6],
    ];

    pinePositions.forEach(([tx, tz, scale]) => {
      const pine = new THREE.Group();
      pine.position.set(tx, 0, tz);

      const trunkH = 6.5 * scale;
      const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, trunkH, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.treeBarkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      pine.add(trunk);

      // Conical Pine Foliage Tiers
      for (let t = 0; t < 4; t++) {
        const coneH = (3.2 - t * 0.5) * scale;
        const coneR = (2.6 - t * 0.55) * scale;
        const coneGeo = new THREE.ConeGeometry(coneR, coneH, 8);
        const cone = new THREE.Mesh(coneGeo, this.pineFoliageMat);
        cone.position.y = (trunkH * 0.55) + t * (1.6 * scale);
        cone.castShadow = true;
        cone.receiveShadow = true;
        pine.add(cone);
      }

      vegGroup.add(pine);

      this.staticObstacles.push({
        x: tx,
        z: tz,
        radius: 0.8 * scale,
        type: 'tree',
      });
    });

    // 2. Broadleaf Deciduous Oaks (Deep central infield & far outfield)
    const oakPositions: Array<[number, number, number]> = [
      // Central Infield Park
      [0, 0, 1.4],
      [-25, -20, 1.2],
      [35, -15, 1.5],
      [-30, 25, 1.3],
      [25, 25, 1.6],
      [0, 50, 1.4],
      [-15, 55, 1.2],
      [15, 55, 1.3],
      // Far Outfield behind outer grandstands and barriers
      [-170, 0, 1.6],
      [170, 0, 1.5],
      [-80, 175, 1.5],
      [80, 175, 1.4],
      [-80, -175, 1.5],
      [80, -175, 1.4],
    ];

    oakPositions.forEach(([tx, tz, scale]) => {
      const oak = new THREE.Group();
      oak.position.set(tx, 0, tz);

      const trunkH = 5.0 * scale;
      const trunkGeo = new THREE.CylinderGeometry(0.45 * scale, 0.7 * scale, trunkH, 10);
      const trunk = new THREE.Mesh(trunkGeo, this.treeBarkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      oak.add(trunk);

      // Volumetric Dodecahedron Foliage Clusters
      const clusters = [
        { y: trunkH * 0.85, r: 2.5 * scale, x: 0, z: 0 },
        { y: trunkH * 1.15, r: 2.0 * scale, x: 0.5 * scale, z: -0.4 * scale },
        { y: trunkH * 1.40, r: 1.6 * scale, x: -0.4 * scale, z: 0.3 * scale },
      ];

      clusters.forEach((cl) => {
        const leafGeo = new THREE.DodecahedronGeometry(cl.r, 1);
        const leaf = new THREE.Mesh(leafGeo, this.oakFoliageMat);
        leaf.position.set(cl.x, cl.y, cl.z);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        oak.add(leaf);
      });

      vegGroup.add(oak);

      this.staticObstacles.push({
        x: tx,
        z: tz,
        radius: 0.9 * scale,
        type: 'tree',
      });
    });

    // 3. Dense Trackside Shrubs & Bushes in safe infield pockets
    const bushPositions = [
      [35, 35], [40, 32], [32, 40],
      [-35, 35], [-40, 32], [-32, 40],
      [35, -35], [40, -32], [32, -40],
      [-35, -35], [-40, -32], [-32, -40],
      [15, 10], [-15, 10], [10, -15], [-10, -15],
    ];

    bushPositions.forEach(([bx, bz]) => {
      const bushGeo = new THREE.SphereGeometry(1.2, 8, 6);
      bushGeo.scale(1.4, 0.8, 1.4);
      const bush = new THREE.Mesh(bushGeo, this.bushFoliageMat);
      bush.position.set(bx, 0.6, bz);
      bush.castShadow = true;
      vegGroup.add(bush);
    });

    this.group.add(vegGroup);
  }

  /**
   * Team Hospitality Transporter Semitrucks Parked in Paddock Area
   */
  private buildPaddockTransportersAndTrailers(): void {
    const paddockTruckGroup = new THREE.Group();
    const teamColors = [0xdc2626, 0x2563eb, 0x059669, 0xd97706, 0x7c3aed, 0xdb2777];

    for (let i = 0; i < 6; i++) {
      const truckX = -42 + i * 15;
      const truckZ = -92;

      const singleTruck = new THREE.Group();
      singleTruck.position.set(truckX, 0, truckZ);

      // Main Trailer Box (13.6m length x 2.6m width x 4m height)
      const trailerGeo = new THREE.BoxGeometry(12.5, 3.8, 2.6);
      const trailerMat = new THREE.MeshStandardMaterial({
        color: teamColors[i],
        metalness: 0.85,
        roughness: 0.25,
      });
      const trailer = new THREE.Mesh(trailerGeo, trailerMat);
      trailer.position.y = 2.4;
      trailer.castShadow = true;
      singleTruck.add(trailer);

      // Chrome Trim / Livery Stripe
      const stripeGeo = new THREE.BoxGeometry(12.55, 0.4, 2.62);
      const stripe = new THREE.Mesh(stripeGeo, this.metalSilverMat);
      stripe.position.y = 2.4;
      singleTruck.add(stripe);

      // Wheels
      [-4, -2.5, 4].forEach((wx) => {
        [-1.35, 1.35].forEach((wz) => {
          const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
          wheelGeo.rotateX(Math.PI / 2);
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(wx, 0.5, wz);
          wheel.castShadow = true;
          singleTruck.add(wheel);
        });
      });

      // Paddock Team Hospitality Awning / Canopy Roof
      const awningGeo = new THREE.BoxGeometry(12.0, 0.15, 3.5);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 3.8, 2.8);
      awning.castShadow = true;
      singleTruck.add(awning);

      paddockTruckGroup.add(singleTruck);
    }

    this.group.add(paddockTruckGroup);
  }

  /**
   * Official FIA Safety Car, Medical Car & Circuit Recovery Cranes
   */
  private buildServiceAndSafetyVehicles(): void {
    const serviceGroup = new THREE.Group();

    // 1. Official FIA Safety Car parked at Pit Exit bay (x = 42, z = -121.5)
    const scGroup = new THREE.Group();
    scGroup.position.set(42, 0, -121.5);
    scGroup.rotation.y = Math.PI / 2;

    const carBodyGeo = new THREE.BoxGeometry(1.9, 0.75, 4.4);
    const scMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.85, roughness: 0.2 });
    const scBody = new THREE.Mesh(carBodyGeo, scMat);
    scBody.position.y = 0.55;
    scBody.castShadow = true;
    scGroup.add(scBody);

    // Green/Amber Roof Beacon Light Bar
    const lightBarGeo = new THREE.BoxGeometry(1.2, 0.18, 0.3);
    const lightBarMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.2,
    });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.y = 1.35;
    scGroup.add(lightBar);

    serviceGroup.add(scGroup);

    // 2. Heavy-Duty Circuit Recovery Cranes with Telescopic Booms (Corners 2 & 4)
    const cranePositions = [
      { x: 148, z: 148, rot: -Math.PI / 4 },
      { x: -148, z: -148, rot: (3 * Math.PI) / 4 },
    ];

    cranePositions.forEach((cp) => {
      const crane = new THREE.Group();
      crane.position.set(cp.x, 0, cp.z);
      crane.rotation.y = cp.rot;

      // Heavy Truck Chassis (Yellow)
      const chassisGeo = new THREE.BoxGeometry(3.2, 1.8, 8.5);
      const chassisMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.4 });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.y = 1.4;
      chassis.castShadow = true;
      crane.add(chassis);

      // Crane Boom (Extending 12m upward at 45 degree angle)
      const boomGeo = new THREE.CylinderGeometry(0.3, 0.45, 12, 8);
      boomGeo.rotateX(Math.PI / 4);
      const boomMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 });
      const boom = new THREE.Mesh(boomGeo, boomMat);
      boom.position.set(0, 6.5, 2.5);
      boom.castShadow = true;
      crane.add(boom);

      // Amber Flashing Beacon
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf97316,
        emissiveIntensity: 3.5,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 3.2, -2.5);
      crane.add(beacon);

      serviceGroup.add(crane);
    });

    this.group.add(serviceGroup);
  }

  /**
   * FIA Speed Trap Radar Overpass Gantries (North Straight)
   * Spans cleanly across Z axis from z = 114 to z = 146 (safely behind barriers).
   */
  private buildSpeedTrapRadarAndSectorGantries(): void {
    const radarGroup = new THREE.Group();

    // 1. North Straight High-Speed Gantry (x = 0, z = 130)
    const northGantry = new THREE.Group();
    northGantry.position.set(0, 0, this.halfSize);

    const spanZ = 32;
    const gantryH = 7.8;
    // Beam spans along Z axis across the full track width!
    const beamGeo = new THREE.BoxGeometry(1.4, 1.4, spanZ);
    const beam = new THREE.Mesh(beamGeo, this.metalDarkMat);
    beam.position.y = gantryH;
    beam.castShadow = true;
    northGantry.add(beam);

    // Support Pillars safely behind barrier walls (infield and outfield)
    [-spanZ / 2 + 0.8, spanZ / 2 - 0.8].forEach((pz) => {
      const pGeo = new THREE.BoxGeometry(1.2, gantryH, 1.2);
      const pMesh = new THREE.Mesh(pGeo, this.metalDarkMat);
      pMesh.position.set(0, gantryH / 2, pz);
      pMesh.castShadow = true;
      northGantry.add(pMesh);
    });

    // Digital Speed Trap Radar Display
    const radarCanvas = document.createElement('canvas');
    radarCanvas.width = 256;
    radarCanvas.height = 64;
    const rCtx = radarCanvas.getContext('2d')!;
    rCtx.fillStyle = '#09090b';
    rCtx.fillRect(0, 0, 256, 64);
    rCtx.fillStyle = '#38bdf8';
    rCtx.font = 'bold 32px monospace';
    rCtx.fillText('SPEED TRAP: 328 KM/H', 10, 44);
    const radarTex = new THREE.CanvasTexture(radarCanvas);
    const radarMat = new THREE.MeshBasicMaterial({ map: radarTex });
    const radarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 8), radarMat);
    radarMesh.position.set(0.75, gantryH, 0);
    northGantry.add(radarMesh);

    radarGroup.add(northGantry);
    this.group.add(radarGroup);
  }

  /**
   * Elevated Television Camera Scaffold Towers along High-Speed Corners (Safely in Infield & Outer Verge)
   */
  private buildTVBroadcastTowersAndCranes(): void {
    const tvGroup = new THREE.Group();
    const towerCoords = [
      { x: 55, z: -55, rot: -Math.PI / 4 },
      { x: -55, z: 55, rot: (3 * Math.PI) / 4 },
      { x: 0, z: -146, rot: 0 },
    ];

    towerCoords.forEach((tc) => {
      const tvTower = new THREE.Group();
      tvTower.position.set(tc.x, 0, tc.z);
      tvTower.rotation.y = tc.rot;

      // Scaffolding Mast (7m height)
      const mastGeo = new THREE.BoxGeometry(1.8, 7.0, 1.8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 3.5;
      mast.castShadow = true;
      tvTower.add(mast);

      // Broadcast TV Camera Box + Lens
      const camBodyGeo = new THREE.BoxGeometry(0.45, 0.45, 1.2);
      const camLensGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12);
      camLensGeo.rotateX(Math.PI / 2);
      const camMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const camBody = new THREE.Mesh(camBodyGeo, camMat);
      camBody.position.set(0, 7.35, 0);
      tvTower.add(camBody);

      const camLens = new THREE.Mesh(camLensGeo, camMat);
      camLens.position.set(0, 7.35, 0.7);
      tvTower.add(camLens);

      tvGroup.add(tvTower);
    });

    this.group.add(tvGroup);
  }

  /**
   * Pit Lane Overhead Air Booms, Pneumatic Rigs, and Fueling Lines
   */
  private buildPitEquipment(): void {
    const pitEquipGroup = new THREE.Group();

    // 6 Overhead Swiveling Air Booms extending over pit stops
    for (let b = 0; b < 6; b++) {
      const boomX = -38 + b * 15;
      const boom = new THREE.Group();
      boom.position.set(boomX, 4.2, -110.5);

      // Horizontal Arm extending 4.5m forward across pit bay
      const armGeo = new THREE.BoxGeometry(0.15, 0.15, 4.5);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.3 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0, 0, -2.25);
      boom.add(arm);

      // Hanging Pneumatic Hose Coils (Yellow/Red)
      const hoseGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
      const hose = new THREE.Mesh(hoseGeo, hoseMat);
      hose.position.set(0, -1.1, -4.2);
      boom.add(hose);

      pitEquipGroup.add(boom);
    }

    this.group.add(pitEquipGroup);
  }

  /**
   * Dynamic Props: Brake Marker Boards (150m, 100m, 50m) on all 4 Straights,
   * Turn Number Signs (T1, T2, T3, T4), Apex Cones, and Tire Stacks.
   */
  private buildDynamicProps(): void {
    let propId = 0;

    // 1. Distance Brake Marker Boards on All 4 Straights
    const signConfigs = [
      // South Straight (Approach to T1)
      { text: '150m', x: 35, z: -this.halfSize - 10.2 },
      { text: '100m', x: 55, z: -this.halfSize - 10.2 },
      { text: '50m', x: 75, z: -this.halfSize - 10.2 },
      // East Straight (Approach to T2)
      { text: '150m', x: this.halfSize + 10.2, z: 35 },
      { text: '100m', x: this.halfSize + 10.2, z: 55 },
      { text: '50m', x: this.halfSize + 10.2, z: 75 },
      // North Straight (Approach to T3)
      { text: '150m', x: 30, z: this.halfSize + 10.2 },
      { text: '100m', x: -10, z: this.halfSize + 10.2 },
      { text: '50m', x: -50, z: this.halfSize + 10.2 },
      // West Straight (Approach to T4)
      { text: '150m', x: -this.halfSize - 10.2, z: -35 },
      { text: '100m', x: -this.halfSize - 10.2, z: -55 },
      { text: '50m', x: -this.halfSize - 10.2, z: -75 },
    ];

    signConfigs.forEach((cfg) => {
      const signGroup = new THREE.Group();
      signGroup.position.set(cfg.x, 0, cfg.z);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.4, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.7;
      signGroup.add(pole);

      const boardGeo = new THREE.BoxGeometry(1.2, 0.75, 0.05);
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 128;
      bCanvas.height = 80;
      const bCtx = bCanvas.getContext('2d')!;
      bCtx.fillStyle = '#09090b';
      bCtx.fillRect(0, 0, 128, 80);
      bCtx.fillStyle = '#f8fafc';
      bCtx.font = 'bold 36px monospace';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(cfg.text, 64, 40);
      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMat = new THREE.MeshBasicMaterial({ map: bTex });
      const board = new THREE.Mesh(boardGeo, bMat);
      board.position.y = 1.15;
      board.castShadow = true;
      signGroup.add(board);

      this.group.add(signGroup);

      this.dynamicProps.push({
        id: propId++,
        type: 'sign',
        mesh: signGroup,
        position: new THREE.Vector3(cfg.x, 0, cfg.z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        radius: 0.7,
        height: 1.4,
        mass: 12,
        isSleeping: true,
        baseY: 0,
      });
    });

    // 2. Official Turn Number Signs (T1, T2, T3, T4)
    const turnSigns = [
      { text: 'TURN 1', x: 88, z: -145 },
      { text: 'TURN 2', x: 145, z: 88 },
      { text: 'TURN 3', x: -88, z: 145 },
      { text: 'TURN 4', x: -145, z: -88 },
    ];

    turnSigns.forEach((ts) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(ts.x, 0, ts.z);

      const boardGeo = new THREE.BoxGeometry(2.2, 1.1, 0.08);
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 256;
      tCanvas.height = 128;
      const tCtx = tCanvas.getContext('2d')!;
      tCtx.fillStyle = '#1e3a8a';
      tCtx.fillRect(0, 0, 256, 128);
      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'bold 44px sans-serif';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText(ts.text, 128, 64);
      const tTex = new THREE.CanvasTexture(tCanvas);
      const tMat = new THREE.MeshBasicMaterial({ map: tTex });
      const board = new THREE.Mesh(boardGeo, tMat);
      board.position.y = 1.8;
      board.castShadow = true;
      tGroup.add(board);

      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.metalDarkMat);
      leg1.position.set(-0.8, 0.9, 0);
      tGroup.add(leg1);

      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.metalDarkMat);
      leg2.position.set(0.8, 0.9, 0);
      tGroup.add(leg2);

      this.group.add(tGroup);
    });

    // 3. Corner Apex Slalom Cones (Fluorescent Orange)
    const conePositions = [
      { x: 92, z: -84 },
      { x: 84, z: 92 },
      { x: -92, z: 84 },
      { x: -84, z: -92 },
    ];

    conePositions.forEach((pos) => {
      const coneGeo = new THREE.ConeGeometry(0.24, 0.65, 10);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.35,
        metalness: 0.1,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(pos.x, 0.325, pos.z);
      coneMesh.castShadow = true;
      this.group.add(coneMesh);

      this.dynamicProps.push({
        id: propId++,
        type: 'cone',
        mesh: coneMesh,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        radius: 0.35,
        height: 0.65,
        mass: 3.5,
        isSleeping: true,
        baseY: 0.325,
      });
    });
  }

  /**
   * Helper to build a seamless curved road quad mesh in the XZ plane
   */
  private createCornerRoadMesh(
    cx: number,
    cz: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number,
    segments: number = 32
  ): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      positions.push(cx + cosA * innerR, 0.005, cz + sinA * innerR);
      uvs.push(0, t * 6);

      positions.push(cx + cosA * outerR, 0.005, cz + sinA * outerR);
      uvs.push(1, t * 6);
    }

    for (let i = 0; i < segments; i++) {
      const p1 = i * 2;
      const p2 = p1 + 1;
      const p3 = (i + 1) * 2;
      const p4 = p3 + 1;

      indices.push(p1, p3, p2);
      indices.push(p2, p3, p4);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.asphaltMat);
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Dynamic Prop Physics Simulation (Knockdowns, roll, bounce & friction)
   */
  public updateDynamicProps(dt: number): void {
    const gravity = 19.6;
    const airDrag = 0.985;
    const groundFriction = 0.88;

    for (let i = 0; i < this.dynamicProps.length; i++) {
      const prop = this.dynamicProps[i];
      if (prop.isSleeping) continue;

      // Integrate Velocity
      prop.position.x += prop.velocity.x * dt;
      prop.position.z += prop.velocity.z * dt;
      prop.position.y += prop.velocity.y * dt;

      // Apply Gravity
      if (prop.position.y > prop.baseY) {
        prop.velocity.y -= gravity * dt;
      } else {
        prop.position.y = prop.baseY;
        prop.velocity.y = Math.max(0, -prop.velocity.y * 0.35);
        prop.velocity.x *= groundFriction;
        prop.velocity.z *= groundFriction;
        prop.angularVelocity.x *= 0.90;
        prop.angularVelocity.z *= 0.90;
      }

      prop.velocity.x *= airDrag;
      prop.velocity.z *= airDrag;

      // Integrate Rotation
      prop.rotation.x += prop.angularVelocity.x * dt;
      prop.rotation.y += prop.angularVelocity.y * dt;
      prop.rotation.z += prop.angularVelocity.z * dt;

      // Sync Mesh Transform
      prop.mesh.position.copy(prop.position);
      prop.mesh.rotation.set(prop.rotation.x, prop.rotation.y, prop.rotation.z);

      // Sleep Threshold check
      const speedSq = prop.velocity.lengthSq();
      const angSpeedSq = prop.angularVelocity.lengthSq();
      if (speedSq < 0.04 && angSpeedSq < 0.04 && prop.position.y <= prop.baseY + 0.05) {
        prop.isSleeping = true;
        prop.velocity.set(0, 0, 0);
        prop.angularVelocity.set(0, 0, 0);
      }
    }
  }

  /**
   * Imparts crash momentum to a breakaway prop
   */
  public impartImpulseToProp(
    prop: DynamicProp,
    carVelocity: THREE.Vector3,
    contactNormal: THREE.Vector3
  ): void {
    prop.isSleeping = false;
    const impactSpeed = carVelocity.length();
    const impulseStrength = Math.min(28, Math.max(4, impactSpeed * 1.35));

    prop.velocity.x = contactNormal.x * impulseStrength + carVelocity.x * 0.45;
    prop.velocity.z = contactNormal.z * impulseStrength + carVelocity.z * 0.45;
    prop.velocity.y = Math.min(10, impulseStrength * 0.4 + Math.random() * 2);

    prop.angularVelocity.x = (Math.random() - 0.5) * impulseStrength * 1.8;
    prop.angularVelocity.y = (Math.random() - 0.5) * impulseStrength * 2.2;
    prop.angularVelocity.z = (Math.random() - 0.5) * impulseStrength * 1.8;
  }
}
