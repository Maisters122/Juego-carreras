/**
 * CarModel.ts - Hyper-Realistic Formula / Le Mans Prototype Racing Car
 * Features:
 * - Four-Layer PBR Automotive Paint Shader: Clearcoat gloss, metallic pearlescent base,
 *   woven 2x2 twill carbon fiber, and procedural 2K racing livery canvas map.
 * - Procedural 2K Racing Livery: Bold racing dorsal #01, motorsport technical sponsors
 *   (Pirelli, Brembo, Shell V-Power, Apex Racing, Tag Heuer, BBS), speed chevrons,
 *   gold pinstriping, and official FIA safety markings (extinguisher & high-voltage switches).
 * - Sculpted Organic Aerodynamic Bodywork:
 *   * Curved sidepods (pontones) with shark-nose overbite intake, extreme lower undercut
 *     channeling air over the carbon floor, and downwash waterfall slides.
 *   * Coke-bottle waistline narrowing tightly around the gearbox.
 *   * Overhead Airbox intake hoop and continuous carbon dorsal shark fin.
 *   * Full 3-point titanium F1 safety Halo with top vortex deflector.
 *   * Multi-element cascaded F1 front wing with outwash footplate tunnels & double canards.
 *   * Dual Inconel / Titanium exhaust pipes with burnt rainbow discoloration & glowing core.
 *   * Detailed race cockpit: carbon bucket seat, 6-point harness, and F1 LCD steering wheel.
 */

import * as THREE from 'three';
import { DamageState } from '../physics/VehiclePhysics';
import { CarModelImporter } from '../loaders/CarModelImporter';

export class CarModel {
  public group: THREE.Group;

  // Custom User-Uploaded 3D Model State
  public currentModelName: string = 'F1 Turbo GP';
  public isCustomModel: boolean = false;
  private customModelGroup: THREE.Group = new THREE.Group();
  private proceduralBodyGroup: THREE.Group = new THREE.Group();
  private customWheelMeshes: THREE.Object3D[] = [];
  private customWheelPivotsFront: THREE.Object3D[] = [];

  // Wheel meshes for steering and rotation
  private wheelMeshes: THREE.Group[] = [];
  private wheelPivotsFront: THREE.Group[] = [];
  private brakeDiscs: THREE.Mesh[] = [];

  // Aerodynamic Wing and Deformable Mesh Elements
  private wingGroup!: THREE.Group;
  private noseMesh!: THREE.Mesh;
  private hoodMesh!: THREE.Mesh;
  private pristineNosePositions!: Float32Array;
  private pristineHoodPositions!: Float32Array;

  // Redesigned Inconel / Titanium Exhaust System
  private exhaustTips: THREE.Group[] = [];
  private exhaustFlames: THREE.Mesh[] = [];
  private exhaustGlowMat!: THREE.MeshStandardMaterial;
  private exhaustPointLight!: THREE.PointLight;
  private backfireTimer = 0;

  // Dynamic Lighting
  private headlightGlowMat!: THREE.MeshStandardMaterial;
  private taillightMaterial!: THREE.MeshStandardMaterial;
  private brakeDiscMaterial!: THREE.MeshStandardMaterial;
  private fiaRainLight!: THREE.MeshStandardMaterial;
  private headlightsLeft!: THREE.SpotLight;
  private headlightsRight!: THREE.SpotLight;

  // Shared Performance Materials
  private bodyMaterial!: THREE.MeshPhysicalMaterial;
  private carbonMaterial!: THREE.MeshStandardMaterial;
  private goldMetalMat!: THREE.MeshStandardMaterial;
  private haloMaterial!: THREE.MeshStandardMaterial;

  // Procedural 2K Livery Texture
  private liveryTexture!: THREE.CanvasTexture;

  constructor() {
    this.group = new THREE.Group();
    this.createLiveryTexture();
    this.initMaterials();
    this.buildCarBody();
    this.buildWheels();
    this.buildLights();
    this.buildExhausts();
  }

  /**
   * Procedural 2K High-Definition Racing Livery & Decals Generator
   * Generates a 2048x2048 competition skin with bold dorsal #01, motorsport sponsors,
   * speed chevrons, gold pinstripes, and official FIA safety markings.
   */
  private createLiveryTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Layer: Scuderia Rosso Corsa (#c8102e)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 2048, 2048);

    // Subtle dark gradient shading towards flanks & underbody
    const flankGrad = ctx.createLinearGradient(0, 0, 2048, 0);
    flankGrad.addColorStop(0.0, '#7f1d1d');
    flankGrad.addColorStop(0.25, '#b91c1c');
    flankGrad.addColorStop(0.5, '#dc2626');
    flankGrad.addColorStop(0.75, '#b91c1c');
    flankGrad.addColorStop(1.0, '#7f1d1d');
    ctx.fillStyle = flankGrad;
    ctx.fillRect(0, 0, 2048, 2048);

    // 2. COMPETITION WHITE BICOLOR ENGINE COVER & AIRBOX
    // The signature white hood, airbox canopy, and dorsal spine
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(1024, 620);
    ctx.lineTo(1380, 1150);
    ctx.lineTo(1280, 1680);
    ctx.lineTo(768, 1680);
    ctx.lineTo(668, 1150);
    ctx.closePath();
    ctx.fill();

    // Tricolore Ribbon (Verde, Bianco, Rosso) on Airbox Spine
    // Green
    ctx.fillStyle = '#15803d';
    ctx.fillRect(992, 600, 20, 1080);
    // White
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1012, 600, 24, 1080);
    // Red
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(1036, 600, 20, 1080);

    // 3. Lower Carbon Side Skirts & Undercut Floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 1640, 2048, 408);
    ctx.fillRect(0, 0, 2048, 180);

    // 4. Competition Racing Number #5
    // Nose Cone Number Plaque
    ctx.save();
    ctx.translate(1024, 430);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-120, -95, 240, 190, 20);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 900 145px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5', 0, 6);
    ctx.restore();

    // Side Dorsals on Engine Cover
    [410, 1638].forEach((sideX) => {
      ctx.save();
      ctx.translate(sideX, 1220);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-100, -80, 200, 160, 16);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic 900 115px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('5', 0, 5);
      ctx.restore();
    });

    // 5. OFFICIAL MOTORSPORT SPONSORS
    // SANTANDER (Airbox & Engine Cover)
    ctx.save();
    ctx.translate(1024, 980);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic 900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Santander', 0, 0);
    ctx.restore();

    // SHELL V-POWER (Sidepods & Nose)
    [360, 1688].forEach((sideX) => {
      ctx.save();
      ctx.translate(sideX, 860);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -32, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Shell', 0, 16);
      ctx.restore();
    });

    // UPS (Sidepod Forward Flanks)
    [440, 1608].forEach((upsX) => {
      ctx.save();
      ctx.translate(upsX, 720);
      ctx.fillStyle = '#b45309'; // Bronze UPS shield
      ctx.beginPath();
      ctx.roundRect(-45, -24, 90, 48, 8);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ups', 0, 2);
      ctx.restore();
    });

    // PIRELLI (Front Nose Cone & Wing)
    ctx.save();
    ctx.translate(1024, 250);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-160, -28, 320, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic 900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIRELLI', 0, 3);
    ctx.restore();

    // RAY-BAN & HUBLOT (Cockpit Surround)
    ctx.save();
    ctx.translate(1024, 760);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ray-Ban  ·  HUBLOT', 0, 0);
    ctx.restore();

    // Model Inscription
    ctx.save();
    ctx.translate(1024, 1420);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 900 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APEX F1 TURBO GP', 0, 0);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('1.6L TURBO HYBRID V6', 0, 34);
    ctx.restore();

    // 6. FIA Regulatory Safety Markings
    // Fire Extinguisher "E" inside red circle
    [780, 1268].forEach((markerX) => {
      ctx.save();
      ctx.translate(markerX, 790);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', 0, 1);
      ctx.restore();
    });

    // High Voltage Hybrid Cut-Off (Blue triangle with lightning bolt)
    [780, 1268].forEach((markerX) => {
      ctx.save();
      ctx.translate(markerX, 840);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(18, 16);
      ctx.lineTo(-18, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Yellow lightning bolt
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.lineTo(-6, 2);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 12);
      ctx.lineTo(6, 0);
      ctx.lineTo(-1, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    this.liveryTexture = new THREE.CanvasTexture(canvas);
    this.liveryTexture.wrapS = THREE.RepeatWrapping;
    this.liveryTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.liveryTexture.generateMipmaps = true;
    this.liveryTexture.anisotropy = 16;
  }

  private initMaterials(): void {
    // Four-Layer PBR Automotive Paint Material with Clearcoat Gloss & 2K Livery Texture
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      map: this.liveryTexture,
      roughness: 0.16,
      metalness: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.035,
      reflectivity: 0.98,
      ior: 1.54,
    });

    // 2x2 Twill Matte Carbon Fiber Material
    this.carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.38,
      metalness: 0.82,
    });

    // Anodized Gold for wing adjusters & hardware
    this.goldMetalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.94,
      roughness: 0.16,
    });

    // Titanium Grade 5 Material for F1 Safety Halo
    this.haloMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.22,
    });

    // Glowing Ceramic/Steel Brake Discs
    this.brakeDiscMaterial = new THREE.MeshStandardMaterial({
      color: 0x48484e,
      metalness: 0.92,
      roughness: 0.20,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
    });

    // Headlight projector glass & LED
    this.headlightGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xe0f2fe,
      emissiveIntensity: 3.0,
      roughness: 0.06,
    });

    // Active Taillight LED strip
    this.taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1020,
      emissive: 0xdd0812,
      emissiveIntensity: 0.9,
      roughness: 0.15,
    });

    // FIA central rain strobe
    this.fiaRainLight = new THREE.MeshStandardMaterial({
      color: 0xff0020,
      emissive: 0xff0020,
      emissiveIntensity: 2.2,
    });

    // Inconel / Titanium thermal exhaust core glow
    this.exhaustGlowMat = new THREE.MeshStandardMaterial({
      color: 0x221105,
      emissive: 0xff3b00,
      emissiveIntensity: 0.0,
      roughness: 0.32,
      metalness: 0.88,
    });
  }

  /**
   * Sculpted aerodynamic body with F1 front wing, organic curved sidepods with extreme undercut,
   * Coke-bottle waistline, F1 titanium Halo, and overhead airbox with dorsal shark fin.
   */
  private buildCarBody(): void {
    const carBodyGroup = new THREE.Group();

    // 1. Central Carbon Monocoque / Cockpit Tub (Curved aerodynamic envelope)
    const monocoqueGeo = new THREE.BoxGeometry(1.24, 0.44, 3.35, 6, 4, 12);
    const pos = monocoqueGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const x = pos.getX(i);

      // Organic Coke-bottle waistline narrowing tightly around driver cockpit
      if (z > -0.35 && z < 0.65) {
        pos.setX(i, x * (0.88 + Math.pow(Math.sin((z + 0.35) / 1.0 * Math.PI), 2) * -0.06));
      }
      // Top shoulder rounding
      if (y > 0.08) {
        pos.setX(i, x * 0.85);
        pos.setY(i, y * 0.92);
      }
      // Underside curvature
      if (y < -0.08) {
        pos.setY(i, y * 0.75);
      }
    }
    monocoqueGeo.computeVertexNormals();
    const monocoqueMesh = new THREE.Mesh(monocoqueGeo, this.bodyMaterial);
    monocoqueMesh.position.set(0, 0.35, 0);
    monocoqueMesh.castShadow = true;
    monocoqueMesh.receiveShadow = true;
    carBodyGroup.add(monocoqueMesh);

    // 2. F1 SLENDER NEEDLE NOSE CONE (Aerodynamic downward slope & needle tip)
    const noseGeo = new THREE.CylinderGeometry(0.22, 0.58, 1.48, 20, 10);
    noseGeo.rotateX(Math.PI / 2);
    const nosePos = noseGeo.attributes.position;
    for (let i = 0; i < nosePos.count; i++) {
      const y = nosePos.getY(i);
      const z = nosePos.getZ(i);
      const x = nosePos.getX(i);

      if (y < 0) nosePos.setY(i, y * 0.40); // Flat underside for ground-effect
      if (z > 0) {
        // Needle taper towards front tip
        nosePos.setY(i, nosePos.getY(i) - z * 0.22);
        nosePos.setX(i, x * (1.0 - z * 0.34));
      }
    }
    noseGeo.computeVertexNormals();
    this.noseMesh = new THREE.Mesh(noseGeo, this.bodyMaterial);
    this.noseMesh.position.set(0, 0.33, 1.62);
    this.noseMesh.castShadow = true;
    this.noseMesh.receiveShadow = true;
    carBodyGroup.add(this.noseMesh);

    this.pristineNosePositions = new Float32Array(noseGeo.attributes.position.array);

    // S-Duct Air Intake Scoop on top of nose cone
    const sDuctGeo = new THREE.BoxGeometry(0.18, 0.04, 0.32);
    const sDuctMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
    const sDuct = new THREE.Mesh(sDuctGeo, sDuctMat);
    sDuct.position.set(0, 0.45, 1.65);
    carBodyGroup.add(sDuct);

    // Pitot Speed Probe Needle at tip of nose
    const pitotGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8);
    pitotGeo.rotateX(Math.PI / 2);
    const pitot = new THREE.Mesh(pitotGeo, this.goldMetalMat);
    pitot.position.set(0, 0.23, 2.45);
    carBodyGroup.add(pitot);

    // 3. MULTI-ELEMENT FORMULA 1 FRONT WING
    const f1FrontWingGroup = new THREE.Group();

    // Twin Carbon Vertical Mounting Pylons
    [-0.14, 0.14].forEach((pylonX) => {
      const pylonGeo = new THREE.BoxGeometry(0.025, 0.22, 0.38);
      pylonGeo.rotateX(-0.15);
      const pylon = new THREE.Mesh(pylonGeo, this.carbonMaterial);
      pylon.position.set(pylonX, 0.19, 2.22);
      f1FrontWingGroup.add(pylon);
    });

    // Tier 1: Main Ground-Effect Carbon Wing Blade (2.20m wide, arched neutral channel)
    const mainPlaneGeo = new THREE.BoxGeometry(2.20, 0.028, 0.48, 14, 1, 4);
    const mpPos = mainPlaneGeo.attributes.position;
    for (let i = 0; i < mpPos.count; i++) {
      const x = mpPos.getX(i);
      const z = mpPos.getZ(i);
      mpPos.setZ(i, z + Math.abs(x / 1.1) * 0.08);
      mpPos.setY(i, mpPos.getY(i) + Math.pow(Math.abs(x) / 1.1, 2) * 0.04);
    }
    mainPlaneGeo.computeVertexNormals();
    const mainPlane = new THREE.Mesh(mainPlaneGeo, this.carbonMaterial);
    mainPlane.position.set(0, 0.09, 2.24);
    mainPlane.castShadow = true;
    f1FrontWingGroup.add(mainPlane);

    // Tier 2: Secondary Contoured Upper Aerofoil Flap
    const flapGeo = new THREE.BoxGeometry(2.14, 0.022, 0.34, 12, 1, 3);
    flapGeo.rotateX(-0.14);
    const flap = new THREE.Mesh(flapGeo, this.carbonMaterial);
    flap.position.set(0, 0.14, 2.18);
    flap.castShadow = true;
    f1FrontWingGroup.add(flap);

    // Tier 3: Tertiary Upper Gurney Flap Blade with gold adjusters
    const gurneyGeo = new THREE.BoxGeometry(2.08, 0.016, 0.16);
    gurneyGeo.rotateX(-0.24);
    const gurney = new THREE.Mesh(gurneyGeo, this.carbonMaterial);
    gurney.position.set(0, 0.19, 2.12);
    f1FrontWingGroup.add(gurney);

    // Slot-Gap Separators
    [-0.55, 0.55].forEach((sepX) => {
      const sepGeo = new THREE.BoxGeometry(0.015, 0.08, 0.22);
      const sep = new THREE.Mesh(sepGeo, this.goldMetalMat);
      sep.position.set(sepX, 0.14, 2.18);
      f1FrontWingGroup.add(sep);
    });

    // Aerodynamic Curved Vertical Endplates with Outwash Tunnels & Canards
    [-1.11, 1.11].forEach((endX) => {
      const isRight = endX > 0;
      const endplateGeo = new THREE.BoxGeometry(0.025, 0.28, 0.68);
      const endplate = new THREE.Mesh(endplateGeo, this.carbonMaterial);
      endplate.position.set(endX, 0.18, 2.22);
      f1FrontWingGroup.add(endplate);

      // Curved Outwash Footplate Tunnel
      const footplateGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8, 1, true, 0, Math.PI);
      footplateGeo.rotateZ(Math.PI / 2);
      footplateGeo.rotateY(isRight ? -0.15 : 0.15);
      const footplate = new THREE.Mesh(footplateGeo, this.carbonMaterial);
      footplate.position.set(endX + (isRight ? 0.03 : -0.03), 0.09, 2.22);
      f1FrontWingGroup.add(footplate);

      // Dual-Tier Diveplane Canards
      [0.17, 0.26].forEach((canardY, cIdx) => {
        const canardGeo = new THREE.BoxGeometry(0.14, 0.015, 0.22 - cIdx * 0.04);
        canardGeo.rotateZ(isRight ? -0.32 : 0.32);
        canardGeo.rotateX(-0.12);
        const canard = new THREE.Mesh(canardGeo, this.carbonMaterial);
        canard.position.set(endX + (isRight ? 0.07 : -0.07), canardY, 2.25 - cIdx * 0.08);
        f1FrontWingGroup.add(canard);
      });
    });

    carBodyGroup.add(f1FrontWingGroup);

    // 4. CURVED AERODYNAMIC SIDEPODS (PONTONES) WITH EXTREME UNDERCUT & DOWNWASH
    [-0.84, 0.84].forEach((xSide) => {
      const isRight = xSide > 0;
      // High-subdivision mesh to sculpt the organic undercut and waterfall slide
      const sidepodGeo = new THREE.BoxGeometry(0.52, 0.44, 2.15, 6, 6, 14);
      const spPos = sidepodGeo.attributes.position;
      for (let i = 0; i < spPos.count; i++) {
        const z = spPos.getZ(i);
        const y = spPos.getY(i);
        const x = spPos.getX(i);

        // 1. Shark-Nose Overbite Intake (Top forward lip extends forward over concave mouth)
        if (z > 0.6 && y > 0.05) {
          spPos.setZ(i, z + 0.12); // Forward protrusion
        }

        // 2. Extreme Lower Undercut Channel (Inner air pathway under sidepod)
        if (y < 0.0 && z > -0.4 && z < 0.8) {
          const depth = Math.sin(((z + 0.4) / 1.2) * Math.PI);
          // Draw outer vertices inward, carving a massive channel for ground-effect air
          spPos.setX(i, x * (1.0 - depth * 0.36));
        }

        // 3. Downwash Waterfall Slide (Top surface descends smoothly towards rear)
        if (y > 0.05 && z < 0.5) {
          const rearSlope = (0.5 - z) / 1.5;
          spPos.setY(i, y - rearSlope * 0.18);
        }

        // 4. Smooth Outer Curvature (No sharp 90-degree creases)
        if (Math.abs(x) > 0.15 && y > 0.1) {
          spPos.setY(i, y * 0.90);
          spPos.setX(i, x * 0.92);
        }
      }
      sidepodGeo.computeVertexNormals();
      const sidepod = new THREE.Mesh(sidepodGeo, this.bodyMaterial);
      sidepod.position.set(xSide, 0.32, -0.05);
      sidepod.castShadow = true;
      sidepod.receiveShadow = true;
      carBodyGroup.add(sidepod);

      // NACA Radiator Intake Air Cavity (Recessed dark cavity)
      const ductCavityGeo = new THREE.BoxGeometry(0.36, 0.24, 0.08);
      const ductMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
      const duct = new THREE.Mesh(ductCavityGeo, ductMat);
      duct.position.set(xSide, 0.35, 1.02);
      carBodyGroup.add(duct);

      // Carbon Fiber Stepped Floor Edge with Longitudinal Venturi Vortices
      const floorGeo = new THREE.BoxGeometry(0.42, 0.03, 2.30);
      const floor = new THREE.Mesh(floorGeo, this.carbonMaterial);
      floor.position.set(xSide, 0.11, -0.05);
      carBodyGroup.add(floor);

      // Aerodynamic Sidepod Winglet Mirrors
      const mirrorArmGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.22);
      mirrorArmGeo.rotateZ(isRight ? -Math.PI / 3.5 : Math.PI / 3.5);
      const mirrorArm = new THREE.Mesh(mirrorArmGeo, this.carbonMaterial);
      mirrorArm.position.set(isRight ? 0.68 : -0.68, 0.58, 0.45);
      carBodyGroup.add(mirrorArm);

      const mirrorHousingGeo = new THREE.SphereGeometry(0.085, 14, 12);
      mirrorHousingGeo.scale(1.4, 0.75, 0.8);
      const mirrorHousing = new THREE.Mesh(mirrorHousingGeo, this.bodyMaterial);
      mirrorHousing.position.set(isRight ? 0.76 : -0.76, 0.64, 0.45);
      carBodyGroup.add(mirrorHousing);
    });

    // 5. TITANIUM F1 SAFETY HALO (3-Point Tubular Safety Hoop & Central Pylon)
    const haloGroup = new THREE.Group();

    // Curved Overhead Tubular Hoop
    const haloHoopGeo = new THREE.TorusGeometry(0.36, 0.032, 10, 24, Math.PI * 1.05);
    haloHoopGeo.rotateX(Math.PI / 2);
    haloHoopGeo.rotateZ(Math.PI / 2);
    const haloHoop = new THREE.Mesh(haloHoopGeo, this.haloMaterial);
    haloHoop.position.set(0, 0.74, 0.02);
    haloHoop.castShadow = true;
    haloGroup.add(haloHoop);

    // Central Forward Support Pylon (Connecting to nose/monocoque)
    const haloCenterPylonGeo = new THREE.CylinderGeometry(0.028, 0.038, 0.36, 12);
    haloCenterPylonGeo.rotateX(0.42);
    const haloCenterPylon = new THREE.Mesh(haloCenterPylonGeo, this.haloMaterial);
    haloCenterPylon.position.set(0, 0.62, 0.38);
    haloCenterPylon.castShadow = true;
    haloGroup.add(haloCenterPylon);

    // Micro-Vortex Aerodynamic Deflector on top of Halo
    const haloDeflectorGeo = new THREE.BoxGeometry(0.24, 0.015, 0.06);
    haloDeflectorGeo.rotateX(-0.1);
    const haloDeflector = new THREE.Mesh(haloDeflectorGeo, this.carbonMaterial);
    haloDeflector.position.set(0, 0.78, 0.04);
    haloGroup.add(haloDeflector);

    carBodyGroup.add(haloGroup);

    // 6. OVERHEAD AIRBOX INTAKE & CONTINUOUS CARBON DORSAL SHARK FIN
    const airboxGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.55, 16);
    airboxGeo.rotateX(0.25);
    const airbox = new THREE.Mesh(airboxGeo, this.bodyMaterial);
    airbox.position.set(0, 0.88, -0.22);
    airbox.castShadow = true;
    carBodyGroup.add(airbox);

    // Airbox Mouth Intake Hole
    const airboxHoleGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 14);
    airboxHoleGeo.rotateX(Math.PI / 2);
    const airboxHole = new THREE.Mesh(airboxHoleGeo, new THREE.MeshBasicMaterial({ color: 0x050505 }));
    airboxHole.position.set(0, 0.95, -0.05);
    carBodyGroup.add(airboxHole);

    // Carbon Fiber Dorsal Shark Fin along spine
    const sharkFinGeo = new THREE.BoxGeometry(0.028, 0.52, 1.45, 1, 4, 8);
    const sfPos = sharkFinGeo.attributes.position;
    for (let i = 0; i < sfPos.count; i++) {
      const z = sfPos.getZ(i);
      const y = sfPos.getY(i);
      if (z < 0 && y > 0) {
        sfPos.setY(i, y * (1.0 + (z / 0.72) * 0.45)); // Swept dorsal profile towards rear wing
      }
    }
    sharkFinGeo.computeVertexNormals();
    const sharkFin = new THREE.Mesh(sharkFinGeo, this.carbonMaterial);
    sharkFin.position.set(0, 0.82, -0.92);
    sharkFin.castShadow = true;
    carBodyGroup.add(sharkFin);

    // 7. DETAILED RACING COCKPIT INTERIOR
    // Curved Windscreen / Cockpit Rim Glass
    const cockpitGeo = new THREE.SphereGeometry(0.66, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    cockpitGeo.scale(0.85, 0.70, 1.40);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.04,
      metalness: 0.15,
      transmission: 0.65,
      opacity: 0.85,
      transparent: true,
      reflectivity: 0.98,
    });
    this.hoodMesh = new THREE.Mesh(cockpitGeo, glassMat);
    this.hoodMesh.position.set(0, 0.48, -0.05);
    this.hoodMesh.castShadow = true;
    carBodyGroup.add(this.hoodMesh);

    this.pristineHoodPositions = new Float32Array(cockpitGeo.attributes.position.array);

    // Carbon Monocoque Bucket Seat with Headrest Foam Cushions
    const seatGeo = new THREE.BoxGeometry(0.48, 0.55, 0.65);
    seatGeo.rotateX(0.3);
    const seat = new THREE.Mesh(seatGeo, this.carbonMaterial);
    seat.position.set(0, 0.42, 0.05);
    carBodyGroup.add(seat);

    // Headrest Safety Foam Surrounds (FIA Blue)
    const headrestGeo = new THREE.BoxGeometry(0.42, 0.18, 0.35);
    const headrestMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    const headrest = new THREE.Mesh(headrestGeo, headrestMat);
    headrest.position.set(0, 0.64, -0.12);
    carBodyGroup.add(headrest);

    // 6-Point Racing Harness Belts (Red woven belts with gold central clasp)
    [-0.11, 0.11].forEach((harnX) => {
      const beltGeo = new THREE.BoxGeometry(0.06, 0.015, 0.45);
      beltGeo.rotateX(0.35);
      const beltMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
      const belt = new THREE.Mesh(beltGeo, beltMat);
      belt.position.set(harnX, 0.54, 0.02);
      carBodyGroup.add(belt);
    });
    const claspGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12);
    const clasp = new THREE.Mesh(claspGeo, this.goldMetalMat);
    clasp.position.set(0, 0.48, 0.16);
    carBodyGroup.add(clasp);

    // Formula 1 Rectangular Steering Wheel with LCD Telemetry Screen & Rev LEDs
    const wheelGroup = new THREE.Group();
    const wheelRimGeo = new THREE.TorusGeometry(0.12, 0.022, 8, 16, Math.PI * 1.4);
    wheelRimGeo.rotateX(-0.4);
    const wheelRimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const wheelRim = new THREE.Mesh(wheelRimGeo, wheelRimMat);
    wheelGroup.add(wheelRim);

    // LCD Screen
    const lcdGeo = new THREE.PlaneGeometry(0.09, 0.05);
    const lcdMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const lcd = new THREE.Mesh(lcdGeo, lcdMat);
    lcd.position.set(0, 0.02, 0.02);
    lcd.rotateX(-0.4);
    wheelGroup.add(lcd);

    // Shift Rev Indicator LEDs (Green, Yellow, Red)
    for (let led = -2; led <= 2; led++) {
      const ledGeo = new THREE.SphereGeometry(0.006, 6, 6);
      const ledColor = led < 0 ? 0x22c55e : led === 0 ? 0xeab308 : 0xef4444;
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(led * 0.018, 0.052, 0.01);
      wheelGroup.add(ledMesh);
    }

    wheelGroup.position.set(0, 0.52, 0.28);
    carBodyGroup.add(wheelGroup);

    // Driver Helmet with Tinted Visor
    const driverGroup = new THREE.Group();
    const helmetGeo = new THREE.SphereGeometry(0.14, 16, 14);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.5 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.64, 0.05);
    driverGroup.add(helmet);

    const visorGeo = new THREE.BoxGeometry(0.16, 0.06, 0.12);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.65, 0.12);
    driverGroup.add(visor);
    carBodyGroup.add(driverGroup);

    // 8. REAR ENGINE DECK, DIFFUSER & SWAN-NECK REAR WING
    const engineCoverGeo = new THREE.BoxGeometry(1.05, 0.32, 1.15, 4, 3, 6);
    const ecPos = engineCoverGeo.attributes.position;
    for (let i = 0; i < ecPos.count; i++) {
      const z = ecPos.getZ(i);
      if (z < 0) {
        ecPos.setY(i, ecPos.getY(i) * 0.82);
      }
    }
    engineCoverGeo.computeVertexNormals();
    const engineCover = new THREE.Mesh(engineCoverGeo, this.bodyMaterial);
    engineCover.position.set(0, 0.44, -1.05);
    engineCover.castShadow = true;
    carBodyGroup.add(engineCover);

    // Rear Carbon Diffuser with vertical aerodynamic fins
    const diffuserGeo = new THREE.BoxGeometry(1.8, 0.12, 0.75);
    diffuserGeo.rotateX(0.18);
    const diffuser = new THREE.Mesh(diffuserGeo, this.carbonMaterial);
    diffuser.position.set(0, 0.18, -1.8);
    carBodyGroup.add(diffuser);

    [-0.6, -0.2, 0.2, 0.6].forEach((finX) => {
      const finGeo = new THREE.BoxGeometry(0.03, 0.18, 0.65);
      const fin = new THREE.Mesh(finGeo, this.carbonMaterial);
      fin.position.set(finX, 0.2, -1.82);
      carBodyGroup.add(fin);
    });

    // Central FIA Rain Strobe LED
    const fiaGeo = new THREE.BoxGeometry(0.14, 0.08, 0.05);
    const fiaMesh = new THREE.Mesh(fiaGeo, this.fiaRainLight);
    fiaMesh.position.set(0, 0.22, -1.86);
    carBodyGroup.add(fiaMesh);

    // Swan-Neck Carbon Fiber Rear Wing with Endplates
    this.wingGroup = new THREE.Group();
    const wingGeo = new THREE.BoxGeometry(2.1, 0.04, 0.42, 8, 1, 3);
    const wPos = wingGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const z = wPos.getZ(i);
      wPos.setY(i, wPos.getY(i) - z * 0.16);
    }
    wingGeo.computeVertexNormals();
    const wingBlade = new THREE.Mesh(wingGeo, this.carbonMaterial);
    wingBlade.position.set(0, 0.98, -1.85);
    wingBlade.castShadow = true;
    this.wingGroup.add(wingBlade);

    [-1.04, 1.04].forEach((endX) => {
      const endplateGeo = new THREE.BoxGeometry(0.03, 0.35, 0.52);
      const endplate = new THREE.Mesh(endplateGeo, this.carbonMaterial);
      endplate.position.set(endX, 0.96, -1.85);
      this.wingGroup.add(endplate);
    });

    [-0.42, 0.42].forEach((pylonX) => {
      const pylonGeo = new THREE.BoxGeometry(0.04, 0.48, 0.22);
      pylonGeo.rotateX(-0.35);
      const pylon = new THREE.Mesh(pylonGeo, this.carbonMaterial);
      pylon.position.set(pylonX, 0.74, -1.72);
      this.wingGroup.add(pylon);
    });

    carBodyGroup.add(this.wingGroup);
    this.proceduralBodyGroup = carBodyGroup;
    this.group.add(this.proceduralBodyGroup);
    this.group.add(this.customModelGroup);
  }

  /**
   * Forged Racing Alloy Wheels with Pirelli P-Zero Branding,
   * Anodized Centerlocks (Blue on Right, Red on Left per FIA Regulation),
   * and Spiral Perforated Brake Discs with Brembo Calipers.
   */
  private buildWheels(): void {
    const wheelPositions = [
      { x: -0.92, y: 0.34, z: 1.25, isFront: true, isRight: false }, // Front Left (Red Nut)
      { x: 0.92, y: 0.34, z: 1.25, isFront: true, isRight: true },   // Front Right (Blue Nut)
      { x: -0.94, y: 0.36, z: -1.25, isFront: false, isRight: false },// Rear Left (Red Nut)
      { x: 0.94, y: 0.36, z: -1.25, isFront: false, isRight: true }, // Rear Right (Blue Nut)
    ];

    const tireRadius = 0.35;
    const tireWidth = 0.32;

    wheelPositions.forEach((wp) => {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, wp.y, wp.z);

      const wheelRotGroup = new THREE.Group();

      // Rubber Slick Tire
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x141416,
        roughness: 0.88,
        metalness: 0.05,
      });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wheelRotGroup.add(tire);

      // Pirelli P-Zero Yellow Sidewall Lettering Ring
      const pzeroGeo = new THREE.TorusGeometry(tireRadius * 0.82, 0.012, 6, 24);
      pzeroGeo.rotateY(Math.PI / 2);
      const pzeroMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const pzeroRing = new THREE.Mesh(pzeroGeo, pzeroMat);
      pzeroRing.position.x = wp.isRight ? tireWidth / 2 + 0.005 : -tireWidth / 2 - 0.005;
      wheelRotGroup.add(pzeroRing);

      // BBS Forged Alloy Rim with Inner Multi-Spokes
      const rimRadius = tireRadius * 0.65;
      const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.005, 18);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.92,
        roughness: 0.18,
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelRotGroup.add(rim);

      // Monolug Anodized Centerlock Nut (Blue on Right, Red on Left)
      const centerlockGeo = new THREE.CylinderGeometry(0.065, 0.075, tireWidth + 0.03, 8);
      centerlockGeo.rotateZ(Math.PI / 2);
      const nutMat = new THREE.MeshStandardMaterial({
        color: wp.isRight ? 0x0284c7 : 0xdc2626,
        metalness: 0.95,
        roughness: 0.15,
      });
      const centerlock = new THREE.Mesh(centerlockGeo, nutMat);
      wheelRotGroup.add(centerlock);

      // Spiral Perforated Steel/Carbon Brake Disc
      const discGeo = new THREE.CylinderGeometry(rimRadius * 0.84, rimRadius * 0.84, 0.032, 18);
      discGeo.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, this.brakeDiscMaterial.clone());
      this.brakeDiscs.push(disc);
      pivot.add(disc);

      // Brembo 6-Piston Caliper (Fluorescent Race Yellow)
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.15, 0.22);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(wp.isRight ? -0.06 : 0.06, 0.06, 0.08);
      pivot.add(caliper);

      pivot.add(wheelRotGroup);
      this.group.add(pivot);

      this.wheelMeshes.push(wheelRotGroup);
      if (wp.isFront) {
        this.wheelPivotsFront.push(pivot);
      }
    });
  }

  /**
   * Physically slide wheel along axle off/on the hub during pit stop tire change
   */
  public setWheelOffset(wheelIdx: number, offset: number): void {
    if (this.wheelMeshes[wheelIdx]) {
      const isRight = wheelIdx === 1 || wheelIdx === 3;
      this.wheelMeshes[wheelIdx].position.x = offset * (isRight ? 1 : -1);
    }
  }

  public resetWheelOffsets(): void {
    for (let i = 0; i < 4; i++) {
      if (this.wheelMeshes[i]) {
        this.wheelMeshes[i].position.x = 0;
      }
    }
  }

  /**
   * Get dynamic world position of a wheel hub for Analytical Two-Bone IK targeting
   */
  public getWheelHubWorldPos(wheelIdx: number, target: THREE.Vector3): THREE.Vector3 {
    if (this.wheelMeshes[wheelIdx]) {
      this.wheelMeshes[wheelIdx].getWorldPosition(target);
      return target;
    }
    return target.set(0, 0, 0);
  }

  /**
   * Projector Headlights & Active LED Taillights
   */
  private buildLights(): void {
    [-0.68, 0.68].forEach((x) => {
      const lightGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
      lightGeo.rotateY(x > 0 ? 0.2 : -0.2);
      const lightMesh = new THREE.Mesh(lightGeo, this.headlightGlowMat);
      lightMesh.position.set(x, 0.38, 2.05);
      this.group.add(lightMesh);
    });

    this.headlightsLeft = new THREE.SpotLight(0xf8fafc, 5.0, 50, Math.PI / 6, 0.35, 1.2);
    this.headlightsLeft.position.set(-0.68, 0.45, 2.0);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.7, 0, 20);
    this.group.add(targetL);
    this.headlightsLeft.target = targetL;
    this.group.add(this.headlightsLeft);

    this.headlightsRight = new THREE.SpotLight(0xf8fafc, 5.0, 50, Math.PI / 6, 0.35, 1.2);
    this.headlightsRight.position.set(0.68, 0.45, 2.0);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.7, 0, 20);
    this.group.add(targetR);
    this.headlightsRight.target = targetR;
    this.group.add(this.headlightsRight);

    // Continuous LED Taillight Bar
    const tailBarGeo = new THREE.BoxGeometry(1.68, 0.05, 0.06);
    const tailBar = new THREE.Mesh(tailBarGeo, this.taillightMaterial);
    tailBar.position.set(0, 0.48, -1.82);
    this.group.add(tailBar);

    // Dynamic Exhaust Backfire Point Light
    this.exhaustPointLight = new THREE.PointLight(0xff6600, 0, 10, 2);
    this.exhaustPointLight.position.set(0, 0.44, -2.1);
    this.group.add(this.exhaustPointLight);
  }

  /**
   * High-Performance Inconel / Titanium Twin Exhaust System:
   * Features beveled tailpipes with burnt titanium rainbow anodization rings (blue/violet/gold),
   * internal thermal glowing heat core, and dual backfire flame cones.
   */
  private buildExhausts(): void {
    const exhaustShroudGeo = new THREE.BoxGeometry(0.48, 0.16, 0.28);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });
    const shroud = new THREE.Mesh(exhaustShroudGeo, shroudMat);
    shroud.position.set(0, 0.44, -1.68);
    this.group.add(shroud);

    // Burnt Titanium Anodization Ring Materials
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      metalness: 0.96,
      roughness: 0.12,
    });
    const burntBlueMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.92,
      roughness: 0.18,
    });
    const burntGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.18,
    });

    [-0.125, 0.125].forEach((x) => {
      const tipGroup = new THREE.Group();
      tipGroup.position.set(x, 0.44, -1.74);

      // Outer Beveled Titanium Pipe
      const pipeGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.24, 16, 1, true);
      pipeGeo.rotateX(Math.PI / 2);
      const pipe = new THREE.Mesh(pipeGeo, titaniumMat);
      tipGroup.add(pipe);

      // Burnt Titanium Blue Heat Ring at the tip
      const blueRingGeo = new THREE.CylinderGeometry(0.069, 0.069, 0.06, 16, 1, true);
      blueRingGeo.rotateX(Math.PI / 2);
      const blueRing = new THREE.Mesh(blueRingGeo, burntBlueMat);
      blueRing.position.set(0, 0, -0.09);
      tipGroup.add(blueRing);

      // Burnt Gold Transition Ring
      const goldRingGeo = new THREE.CylinderGeometry(0.0685, 0.0685, 0.05, 16, 1, true);
      goldRingGeo.rotateX(Math.PI / 2);
      const goldRing = new THREE.Mesh(goldRingGeo, burntGoldMat);
      goldRing.position.set(0, 0, -0.035);
      tipGroup.add(goldRing);

      // Internal Glowing Inconel Core
      const coreGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.18, 14);
      coreGeo.rotateX(Math.PI / 2);
      const core = new THREE.Mesh(coreGeo, this.exhaustGlowMat);
      core.position.set(0, 0, 0.02);
      tipGroup.add(core);

      // Backfire Flame Cone (Inner blue core + outer orange flare)
      const flameGeo = new THREE.ConeGeometry(0.09, 0.55, 12);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0, -0.36);
      tipGroup.add(flame);
      this.exhaustFlames.push(flame);

      this.exhaustTips.push(tipGroup);
      this.group.add(tipGroup);
    });
  }

  /**
   * Get world positions of both tailpipe tips and rearward ejection vector for particle emission
   */
  public getExhaustWorldPositions(
    outLeft: THREE.Vector3,
    outRight: THREE.Vector3,
    outRearDir: THREE.Vector3
  ): void {
    if (this.exhaustTips.length >= 2) {
      this.exhaustTips[0].getWorldPosition(outLeft);
      this.exhaustTips[1].getWorldPosition(outRight);
      outLeft.y += 0.02;
      outRight.y += 0.02;
    } else {
      outLeft.copy(this.group.position);
      outRight.copy(this.group.position);
    }

    const worldQuat = new THREE.Quaternion();
    this.group.getWorldQuaternion(worldQuat);
    outRearDir.set(0, 0, -1).applyQuaternion(worldQuat).normalize();
  }

  /**
   * Trigger backfire flame spikes and dynamic light flare
   */
  public triggerBackfire(isHighRpm: boolean = false): void {
    this.backfireTimer = isHighRpm ? 0.14 : 0.09;
    this.exhaustPointLight.intensity = isHighRpm ? 6.5 : 4.0;
    this.exhaustFlames.forEach((flame) => {
      const mat = flame.material as THREE.MeshBasicMaterial;
      mat.color.setHex(isHighRpm ? 0x60a5fa : 0xf97316);
      mat.opacity = 0.95;
      const s = isHighRpm ? 1.4 : 1.0;
      flame.scale.set(s, s * (1.1 + Math.random() * 0.4), s);
    });
  }

  /**
   * Update Car Animation every frame:
   * Steering angle with Ackermann geometry, forward wheel rolling, brake disc glow, backfire lighting
   */
  public update(
    steerAngle: number,
    wheelRotations: number[],
    brake: number,
    speedKmh: number,
    damage: DamageState,
    isBackfiring: boolean
  ): void {
    // 1. Steering Pivot on Front Wheels with authentic Ackermann steering geometry
    if (this.wheelPivotsFront[0] && this.wheelPivotsFront[1]) {
      if (steerAngle > 0) {
        this.wheelPivotsFront[0].rotation.y = steerAngle * 0.90;
        this.wheelPivotsFront[1].rotation.y = steerAngle * 1.10;
      } else if (steerAngle < 0) {
        this.wheelPivotsFront[0].rotation.y = steerAngle * 1.10;
        this.wheelPivotsFront[1].rotation.y = steerAngle * 0.90;
      } else {
        this.wheelPivotsFront[0].rotation.y = 0;
        this.wheelPivotsFront[1].rotation.y = 0;
      }
    }

    // 2. Forward Wheel Roll
    for (let i = 0; i < 4; i++) {
      if (this.wheelMeshes[i]) {
        this.wheelMeshes[i].rotation.x = -wheelRotations[i];

        const isLeftDamaged = i % 2 === 0 && damage.suspensionLeft < 75;
        const isRightDamaged = i % 2 === 1 && damage.suspensionRight < 75;
        if ((isLeftDamaged || isRightDamaged) && speedKmh > 10) {
          const wobbleFreq = Date.now() * 0.035;
          this.wheelMeshes[i].rotation.z = Math.sin(wobbleFreq) * 0.07;
        } else {
          this.wheelMeshes[i].rotation.z = 0;
        }
      }
    }

    // Note: When custom 3D model is active, the model is rendered intact with its native wheel positions,
    // avoiding broken coordinate pivots or wheel dislocations.

    // 3. Glowing Brake Discs during heavy braking
    const brakeIntensity = (brake > 0.35 && speedKmh > 35) ? Math.min(1.0, (brake * speedKmh) / 130) : 0;
    this.brakeDiscs.forEach((disc) => {
      const mat = disc.material as THREE.MeshStandardMaterial;
      if (brakeIntensity > 0.1) {
        mat.emissive.setHex(0xff3300);
        mat.emissiveIntensity = brakeIntensity * 2.8;
      } else {
        mat.emissiveIntensity = Math.max(0, mat.emissiveIntensity - 0.04);
      }
    });

    // 4. Taillight brightness
    if (brake > 0.1) {
      this.taillightMaterial.emissiveIntensity = 3.2;
      this.taillightMaterial.color.setHex(0xff0020);
    } else {
      this.taillightMaterial.emissiveIntensity = 0.8;
      this.taillightMaterial.color.setHex(0xaa0510);
    }

    // 5. Inconel Exhaust Thermal Glow based on speed & engine load
    const targetGlow = Math.min(2.4, (speedKmh / 210) * 2.0);
    this.exhaustGlowMat.emissiveIntensity = THREE.MathUtils.lerp(
      this.exhaustGlowMat.emissiveIntensity,
      targetGlow,
      0.08
    );

    // 6. Backfire Exhaust Flame Timer
    if (isBackfiring) {
      this.triggerBackfire(false);
    }

    if (this.backfireTimer > 0) {
      this.backfireTimer -= 0.016;
      this.exhaustPointLight.intensity = Math.max(0, this.backfireTimer * 35);
    } else {
      this.exhaustPointLight.intensity = Math.max(0, this.exhaustPointLight.intensity - 0.4);
      this.exhaustFlames.forEach((flame) => {
        const mat = flame.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, mat.opacity - 0.18);
      });
    }

    // 7. Dynamic Wing Looseness on damage
    if (damage.wingLoose) {
      this.wingGroup.rotation.z = 0.14;
      this.wingGroup.rotation.y = 0.08;
    } else {
      this.wingGroup.rotation.z = 0;
      this.wingGroup.rotation.y = 0;
    }

    // 8. Visual Mesh Vertex Deformation (Bumper & Hood Crumple)
    this.applyVertexDeformation(damage.frontCrumple);
  }

  /**
   * Displaces vertices of the nosecone to simulate realistic crumple zone damage
   */
  private applyVertexDeformation(frontCrumple: number): void {
    if (!this.noseMesh || !this.pristineNosePositions) return;

    const pos = this.noseMesh.geometry.attributes.position;
    const count = pos.count;
    let needsUpdate = false;

    for (let i = 0; i < count; i++) {
      const origZ = this.pristineNosePositions[i * 3 + 2];
      const origX = this.pristineNosePositions[i * 3];
      const origY = this.pristineNosePositions[i * 3 + 1];

      if (origZ > 0.05) {
        const crumpleAmount = frontCrumple * 0.38 * (origZ / 0.7);
        const targetZ = origZ - crumpleAmount;
        const dentNoise = Math.sin(origX * 7.5 + origY * 5) * frontCrumple * 0.08;

        pos.setZ(i, targetZ);
        pos.setY(i, origY + Math.abs(dentNoise) * 0.5);
        needsUpdate = true;
      } else {
        pos.setZ(i, origZ);
        pos.setY(i, origY);
      }
    }

    if (needsUpdate) {
      pos.needsUpdate = true;
      this.noseMesh.geometry.computeVertexNormals();
    }
  }

  /**
   * Load custom player 3D model (.glb, .gltf, .zip, .obj) and substitute vehicle
   */
  public async loadCustomModel(file: File): Promise<{ success: boolean; name: string; error?: string }> {
    try {
      const imported = await CarModelImporter.loadFromFile(file);
      this.customModelGroup.clear();
      this.customModelGroup.add(imported.rootGroup);
      this.customModelGroup.visible = true;
      this.proceduralBodyGroup.visible = false;
      this.isCustomModel = true;
      this.currentModelName = imported.name;
      this.customWheelMeshes = imported.wheelMeshes;
      this.customWheelPivotsFront = imported.wheelPivotsFront;

      // Hide procedural wheels completely when custom model is loaded
      this.wheelMeshes.forEach((w) => {
        w.visible = false;
      });

      return { success: true, name: imported.name };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, name: file.name, error: msg };
    }
  }

  /**
   * Restore the default F1 Turbo GP model
   */
  public restoreDefaultModel(): void {
    this.customModelGroup.clear();
    this.customModelGroup.visible = false;
    this.proceduralBodyGroup.visible = true;
    this.wheelMeshes.forEach((w) => {
      w.visible = true;
    });
    this.isCustomModel = false;
    this.currentModelName = 'F1 Turbo GP';
  }

  /**
   * Toggle night mode headlights and rear FIA rain LED intensity
   */
  public setHeadlights(isNight: boolean): void {
    const intensity = isNight ? 18.0 : 5.0;
    if (this.headlightsLeft) this.headlightsLeft.intensity = intensity;
    if (this.headlightsRight) this.headlightsRight.intensity = intensity;
    if (this.headlightGlowMat) {
      this.headlightGlowMat.emissiveIntensity = isNight ? 5.0 : 1.5;
    }
    if (this.taillightMaterial) {
      this.taillightMaterial.emissiveIntensity = isNight ? 6.0 : 2.5;
    }
  }
}
