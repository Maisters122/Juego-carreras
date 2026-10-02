/**
 * VehiclePhysics.ts - High-Grip Circuit Racing Physics Engine
 * Designed for authentic high-downforce GT/LeMans Prototype racing:
 * - High-speed on-rails cornering with ZERO unwanted drifting or sliding
 * - Agile, fast turn-in through 90° corners
 * - Rock-solid straight-line tracking with instant caster self-centering
 * - Controlled power slides ONLY when holding the Handbrake button
 * - Comprehensive damage degradation and pit stop repair system
 */

import * as THREE from 'three';

export interface CarInputs {
  throttle: number;   // 0.0 to 1.0
  brake: number;      // 0.0 to 1.0
  steering: number;   // -1.0 (left) to 1.0 (right)
  handbrake: boolean; // boolean
}

export interface DamageState {
  overallHealth: number;    // 0 to 100
  engineHealth: number;     // 0 to 100
  suspensionLeft: number;   // 0 to 100
  suspensionRight: number;  // 0 to 100
  frontCrumple: number;     // 0.0 to 1.0
  rearCrumple: number;      // 0.0 to 1.0
  wingLoose: boolean;
  isTotaled: boolean;
}

export class VehiclePhysics {
  // World transforms
  public position = { x: 0, y: 0.35, z: 0 };
  public yaw: number = 0;              // Heading angle in radians
  public pitch: number = 0;            // Weight transfer pitch (dive / squat)
  public roll: number = 0;             // Cornering roll angle

  // Velocities
  public speed: number = 0;            // m/s (positive = forward, negative = reverse)
  public lateralSpeed: number = 0;     // m/s
  public angularVelocity: number = 0;  // rad/s

  // Steering
  public steerAngle: number = 0;       // Current wheel steer angle in radians
  private targetSteerAngle: number = 0;

  // Engine & Transmission
  public rpm: number = 1000;
  public engineTemp: number = 85.0;    // Engine core temperature in °C (85°C to 135°C)
  public gear: number = 1;             // -1 = R, 0 = N, 1..6 = D
  public isShifting: boolean = false;
  private shiftTimer: number = 0;

  // Gear ratios & parameters
  private readonly gearRatios = [3.8, 2.6, 1.85, 1.35, 1.05, 0.85];
  private readonly reverseRatio = 3.2;
  private readonly finalDrive = 3.45;
  private readonly maxRpm = 9200;
  private readonly idleRpm = 1000;

  // Physical specifications
  public readonly mass = 1240;         // kg
  public readonly wheelbase = 2.75;     // meters
  public readonly trackWidth = 1.95;    // meters
  private readonly dragCoeff = 0.28;   // Low drag aerodynamic monocoque
  private readonly downforceCoeff = 3.2; // Massive racing downforce

  // Telemetry & Grip
  public slipRatio: number = 0;
  public isDrifting: boolean = false;
  public wheelRotations = [0, 0, 0, 0];

  // Damage System
  public damage: DamageState = {
    overallHealth: 100,
    engineHealth: 100,
    suspensionLeft: 100,
    suspensionRight: 100,
    frontCrumple: 0,
    rearCrumple: 0,
    wingLoose: false,
    isTotaled: false,
  };

  // Pit Stop Repair State
  public isInPitStop: boolean = false;
  public pitRepairProgress: number = 0;
  public isLockedInPit: boolean = false;

  // Sound triggers
  public onBackfire?: (isHighRpm: boolean) => void;
  public onCrash?: (impactForce: number) => void;
  public onPitFinish?: () => void;

  constructor(startX: number = 0, startZ: number = 0, startYaw: number = 0) {
    this.reset(startX, startZ, startYaw);
  }

  public reset(x: number = 0, z: number = 0, yaw: number = 0): void {
    this.position.x = x;
    this.position.y = 0.35;
    this.position.z = z;
    this.yaw = yaw;
    this.speed = 0;
    this.lateralSpeed = 0;
    this.angularVelocity = 0;
    this.steerAngle = 0;
    this.targetSteerAngle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.gear = 1;
    this.rpm = 1000;
    this.wheelRotations = [0, 0, 0, 0];
    this.repairFull();
  }

  public repairFull(): void {
    this.damage.overallHealth = 100;
    this.damage.engineHealth = 100;
    this.damage.suspensionLeft = 100;
    this.damage.suspensionRight = 100;
    this.damage.frontCrumple = 0;
    this.damage.rearCrumple = 0;
    this.damage.wingLoose = false;
    this.damage.isTotaled = false;
    this.pitRepairProgress = 0;
  }

  /**
   * Main High-Grip Physics Simulation Tick
   */
  public update(dt: number, inputs: CarInputs): void {
    const clampedDt = Math.min(dt, 0.05);

    if (this.isLockedInPit) {
      this.speed = 0;
      this.lateralSpeed = 0;
      this.angularVelocity = 0;
      this.rpm = 1000 + Math.sin(Date.now() * 0.006) * 120;
      this.gear = 1;
      return;
    }

    this.updatePitRepair(clampedDt);

    const enginePowerFactor = Math.max(0.25, this.damage.engineHealth / 100);
    const speedKmh = Math.abs(this.speed) * 3.6;

    // --- 1. PRECISE STEERING WITH RACING SPEED-SENSITIVE RACK RATIO ---
    // At low speeds (<40 km/h): 0.58 rad (~33°) for hairpin agility
    // At high speeds (>150 km/h): 0.14 rad (~8°) to prevent extreme oversteer and roll-over
    const speedRatio = Math.min(1.0, speedKmh / 180);
    const maxLock = THREE.MathUtils.lerp(0.58, 0.14, Math.pow(speedRatio, 0.75));

    const suspensionDiff = (this.damage.suspensionLeft - this.damage.suspensionRight);
    const suspensionBias = Math.abs(suspensionDiff) > 8 ? suspensionDiff * 0.0008 : 0;

    if (Math.abs(inputs.steering) > 0.02) {
      this.targetSteerAngle = (inputs.steering * maxLock) - suspensionBias;
      const steerSpeed = 16.0; // Instant response
      this.steerAngle += (this.targetSteerAngle - this.steerAngle) * Math.min(1.0, steerSpeed * clampedDt);
    } else {
      // Immediate elastic snap back to center (zero veering)
      const casterReturnSpeed = 22.0;
      this.steerAngle += (0 - this.steerAngle) * Math.min(1.0, casterReturnSpeed * clampedDt);
      if (Math.abs(this.steerAngle) < 0.001) this.steerAngle = 0;
    }

    // --- 2. TRANSMISSION & ENGINE RPM ---
    this.updateTransmission(clampedDt, inputs.throttle, enginePowerFactor);

    // --- 3. LONGITUDINAL DRIVE & BRAKING (SMOOTH REVERSE GEAR) ---
    let drivingForce = 0;
    let brakeForce = 0;
    const currentRatio = this.gear === -1 ? this.reverseRatio : (this.gearRatios[this.gear - 1] || 1.0);
    const totalGearRatio = currentRatio * this.finalDrive;

    if (this.gear === -1) {
      // IN REVERSE GEAR:
      if (inputs.brake > 0.05) {
        // Holding Brake (pedal or S key) drives the car backwards!
        const reverseEfficiency = 5800 * enginePowerFactor * inputs.brake;
        drivingForce = -reverseEfficiency;
        // Limit reverse top speed to ~45 km/h (12.5 m/s)
        if (this.speed < -12.5) {
          drivingForce = 0;
        }
      }

      if (inputs.throttle > 0.05) {
        if (this.speed < -0.3) {
          // Pressing Gas while moving backwards brakes the reverse motion
          brakeForce = inputs.throttle * 9500;
        } else {
          // Shift out of reverse into 1st gear and drive forward!
          this.gear = 1;
          const normalizedRpm = this.rpm / this.maxRpm;
          const torqueEfficiency = Math.sin(normalizedRpm * Math.PI) * 0.4 + 0.6;
          const baseEngineForce = 6800 * enginePowerFactor * inputs.throttle * torqueEfficiency;
          drivingForce = (baseEngineForce * totalGearRatio) / 3.8;
        }
      }
    } else {
      // IN FORWARD GEARS (1..6):
      if (inputs.throttle > 0 && !this.isShifting) {
        const normalizedRpm = this.rpm / this.maxRpm;
        const torqueEfficiency = Math.sin(normalizedRpm * Math.PI) * 0.4 + 0.6;
        const baseEngineForce = 6800 * enginePowerFactor * inputs.throttle * torqueEfficiency;
        drivingForce = (baseEngineForce * totalGearRatio) / 3.8;
      }

      if (inputs.brake > 0.05) {
        if (this.speed > 0.4) {
          // Active high-performance braking
          brakeForce = -inputs.brake * 12500;
        } else {
          // Car has come to a complete stop: automatically engage Reverse gear!
          this.speed = 0;
          this.gear = -1;
          drivingForce = -inputs.brake * 4500 * enginePowerFactor;
        }
      }
    }

    // Aerodynamics & Rolling Resistance
    const airResistance = 0.5 * 1.225 * this.dragCoeff * 2.1 * Math.sign(this.speed) * (this.speed * this.speed);
    const rollingResistance = 0.012 * this.mass * 9.81 * Math.sign(this.speed);

    const netLongForce = drivingForce + brakeForce - airResistance - rollingResistance;
    const longAccel = netLongForce / this.mass;
    this.speed += longAccel * clampedDt;

    if (inputs.throttle === 0 && inputs.brake === 0) {
      this.speed *= (1.0 - 0.7 * clampedDt);
      if (Math.abs(this.speed) < 0.05) this.speed = 0;
    }

    // --- 4. HIGH-GRIP RACING CORNERING (NO UNWANTED SLIDING) ---
    // Unless the driver explicitly uses the Handbrake, the car has 100% lateral grip ("on rails")
    if (inputs.handbrake) {
      // Intentional drift when handbrake is held
      this.isDrifting = Math.abs(this.speed) > 5;
      this.lateralSpeed += -Math.sign(this.lateralSpeed || 1) * 8.0 * clampedDt;
      this.speed *= (1.0 - 0.35 * clampedDt);
      this.slipRatio = 0.75;
    } else {
      // PURE RACING GRIP: zero lateral slide, car carves cleanly along the racing line!
      this.isDrifting = false;
      this.lateralSpeed = 0;
      this.slipRatio = (inputs.brake > 0.85 && speedKmh > 60) ? 0.35 : (inputs.throttle > 0.85 && speedKmh < 15 ? 0.5 : 0);
    }

    // --- 5. REALISTIC HIGH-SPEED RACING YAW DYNAMICS ---
    // Turn rate scales smoothly with speed: agile in 90° corners, downforce-fast at high speed
    if (Math.abs(this.steerAngle) > 0.001 && Math.abs(this.speed) > 0.2) {
      // Calculate realistic curvature: w = v * curvature
      // Higher turn rate so 90° corners are conquered quickly and cleanly!
      const speedNorm = Math.min(1.0, speedKmh / 140);
      const turnPower = 2.1 + speedNorm * 0.7; // 2.1 to 2.8 rad/s
      const speedGate = Math.min(1.0, Math.max(0.2, speedKmh / 22));

      // Handbrake boost if drifting
      const driftBoost = inputs.handbrake ? 1.35 : 1.0;
      const targetYawRate = (this.steerAngle * turnPower * speedGate * Math.sign(this.speed)) * driftBoost;

      const yawResponse = 20.0;
      this.angularVelocity += (targetYawRate - this.angularVelocity) * Math.min(1.0, yawResponse * clampedDt);
    } else {
      // Immediate straight-line alignment
      this.angularVelocity *= (1.0 - 24.0 * clampedDt);
      if (Math.abs(this.angularVelocity) < 0.001) this.angularVelocity = 0;
    }

    this.yaw += this.angularVelocity * clampedDt;

    // --- 6. INTEGRATE WORLD VELOCITY (ON-RAILS TRACKING) ---
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    const worldVx = (forwardX * this.speed) + (rightX * this.lateralSpeed);
    const worldVz = (forwardZ * this.speed) + (rightZ * this.lateralSpeed);

    this.position.x += worldVx * clampedDt;
    this.position.z += worldVz * clampedDt;

    // --- 7. CHASSIS PITCH & ROLL DYNAMICS (STIFF RACING ANTI-ROLL BARS) ---
    // Stiff racing anti-roll bar (ARB) damping: chassis roll strictly limited to +/- 0.018 rad (~1.0°)
    // Absolutely prevents lifting on two wheels and keeps all 4 tires glued flat to the tarmac!
    const maxRoll = 0.018; // approx 1.0 degree maximum body roll
    const lateralAccel = this.speed * this.angularVelocity;
    const targetRoll = THREE.MathUtils.clamp((lateralAccel / 9.81) * 0.004, -maxRoll, maxRoll);
    this.roll += (targetRoll - this.roll) * Math.min(1.0, 18 * clampedDt);

    // Stiff racing heave/pitch damper: prevents excessive nose dive/squat
    const maxPitch = 0.022;
    const targetPitch = THREE.MathUtils.clamp((-longAccel / 9.81) * 0.012, -maxPitch, maxPitch);
    this.pitch += (targetPitch - this.pitch) * Math.min(1.0, 16 * clampedDt);

    // --- 8. FORWARD WHEEL ROLLING ---
    const wheelRotSpeed = this.speed / (2.05 / (2 * Math.PI));
    for (let i = 0; i < 4; i++) {
      this.wheelRotations[i] += wheelRotSpeed * clampedDt;
    }
  }

  private updateTransmission(dt: number, throttle: number, powerFactor: number): void {
    if (this.shiftTimer > 0) {
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        this.isShifting = false;
      }
    }

    if (this.gear === -1) {
      this.rpm = Math.min(this.maxRpm, this.idleRpm + Math.abs(this.speed) * 350);
      return;
    }

    const currentRatio = this.gearRatios[this.gear - 1] || 1.0;
    const speedRatioRpm = (Math.abs(this.speed) * currentRatio * this.finalDrive * 60) / 2.05;
    const targetRpm = Math.max(this.idleRpm, speedRatioRpm);

    if (Math.abs(this.speed) < 1.0 && throttle > 0.05) {
      this.rpm += (throttle * 8000 - this.rpm) * Math.min(1.0, 8 * dt);
    } else {
      this.rpm += (targetRpm - this.rpm) * Math.min(1.0, 14 * dt);
    }

    if (this.rpm >= this.maxRpm) {
      this.rpm = this.maxRpm - 250;
      if (Math.random() < 0.35 && this.onBackfire) {
        this.onBackfire(true);
      }
    }

    if (!this.isShifting && this.gear < 6 && this.rpm > 7900 * powerFactor && this.speed > 8) {
      this.gear++;
      this.isShifting = true;
      this.shiftTimer = 0.16;
      this.rpm -= 1800;
      if (this.onBackfire) this.onBackfire(false);
    }

    if (!this.isShifting && this.gear > 1 && this.rpm < 3200 && this.speed < 200) {
      this.gear--;
      this.isShifting = true;
      this.shiftTimer = 0.14;
      this.rpm += 1600;
      if (this.onBackfire) this.onBackfire(true);
    }

    // --- ENGINE TEMPERATURE THERMODYNAMICS (°C) ---
    // Base operating temp: 85°C. Rises up to 125°C-135°C under heavy throttle & high RPM
    const rpmLoad = (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm);
    const radiatorCooling = (Math.min(1.0, Math.abs(this.speed) / 75.0) * 8.0);
    const targetTemp = 85.0 + (rpmLoad * 32.0) + (throttle * 16.0) - radiatorCooling;
    this.engineTemp += (targetTemp - this.engineTemp) * Math.min(1.0, 0.45 * dt);
  }

  public handleCollision(
    normalX: number,
    normalZ: number,
    penetration: number,
    isStaticSolid: boolean = true
  ): void {
    this.position.x += normalX * penetration;
    this.position.z += normalZ * penetration;

    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const carVx = forwardX * this.speed;
    const carVz = forwardZ * this.speed;

    const normalDot = carVx * normalX + carVz * normalZ;

    if (normalDot < 0) {
      const impactSpeed = Math.abs(normalDot);
      const impactKmh = impactSpeed * 3.6;

      const restitution = isStaticSolid ? 0.20 : 0.40;
      const impulse = -(1 + restitution) * normalDot;

      const newVx = carVx + impulse * normalX;
      const newVz = carVz + impulse * normalZ;

      this.speed = (newVx * forwardX + newVz * forwardZ) * 0.4;
      this.lateralSpeed *= 0.4;

      const bumpTorque = (normalX * forwardZ - normalZ * forwardX) * 2.0;
      this.angularVelocity += bumpTorque;

      if (impactKmh > 12) {
        const damageAmount = Math.min(45, (impactKmh - 10) * 0.55);

        const localDot = forwardX * -normalX + forwardZ * -normalZ;
        if (localDot > 0.4) {
          this.damage.frontCrumple = Math.min(1.0, this.damage.frontCrumple + (impactKmh / 160));
          this.damage.engineHealth = Math.max(10, this.damage.engineHealth - damageAmount * 0.85);
          if (damageAmount > 20) this.damage.wingLoose = true;
        } else if (localDot < -0.4) {
          this.damage.rearCrumple = Math.min(1.0, this.damage.rearCrumple + (impactKmh / 180));
          this.damage.wingLoose = true;
        }

        const rightDot = (Math.cos(this.yaw) * -normalX) - (Math.sin(this.yaw) * -normalZ);
        if (Math.abs(rightDot) > 0.4) {
          if (rightDot > 0) {
            this.damage.suspensionRight = Math.max(20, this.damage.suspensionRight - damageAmount * 0.5);
          } else {
            this.damage.suspensionLeft = Math.max(20, this.damage.suspensionLeft - damageAmount * 0.5);
          }
        }

        this.damage.overallHealth = Math.max(0, this.damage.overallHealth - damageAmount);
        if (this.damage.overallHealth <= 0) {
          this.damage.isTotaled = true;
        }

        if (this.onCrash) {
          this.onCrash(impactSpeed);
        }
      }
    }
  }

  private updatePitRepair(dt: number): void {
    if (this.isInPitStop && Math.abs(this.speed) < 2.0) {
      if (this.damage.overallHealth < 100 || this.damage.engineHealth < 100 || this.damage.frontCrumple > 0) {
        const repairRate = 34.0;
        this.damage.overallHealth = Math.min(100, this.damage.overallHealth + repairRate * dt);
        this.damage.engineHealth = Math.min(100, this.damage.engineHealth + repairRate * dt);
        this.damage.suspensionLeft = Math.min(100, this.damage.suspensionLeft + repairRate * dt);
        this.damage.suspensionRight = Math.min(100, this.damage.suspensionRight + repairRate * dt);
        this.damage.frontCrumple = Math.max(0, this.damage.frontCrumple - (0.38 * dt));
        this.damage.rearCrumple = Math.max(0, this.damage.rearCrumple - (0.38 * dt));
        this.damage.wingLoose = false;
        this.damage.isTotaled = false;

        this.pitRepairProgress = this.damage.overallHealth / 100;

        if (this.damage.overallHealth >= 99.8) {
          this.repairFull();
          if (this.onPitFinish) {
            this.onPitFinish();
          }
        }
      }
    } else {
      this.pitRepairProgress = 0;
    }
  }
}
