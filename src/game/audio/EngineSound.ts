/**
 * EngineSound.ts - Web Audio API Synthesizer for high-performance race cars
 * Procedurally generates realistic multi-oscillator V8/V10 racing engine roar,
 * gearshift pops, turbo whistle, tire screeching, collision impact crunch and pit stop chimes.
 */

export class EngineSound {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Engine oscillators
  private oscBase: OscillatorNode | null = null;
  private oscHarmonic1: OscillatorNode | null = null;
  private oscHarmonic2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;

  // Turbo whistle
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire screech
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechNoiseBuffer: AudioBuffer | null = null;
  private screechSource: AudioBufferSourceNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Waveshaper for throaty race engine saturation
      this.distortion = this.ctx.createWaveShaper();
      this.distortion.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;
      this.distortion.oversample = '2x';

      // Engine low-pass filter (opens with throttle)
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.distortion.connect(this.engineFilter);
      this.engineFilter.connect(this.masterGain);

      // Oscillator 1: Fundamental cylinder pulse (Sawtooth)
      this.oscBase = this.ctx.createOscillator();
      this.oscBase.type = 'sawtooth';
      this.oscBase.frequency.setValueAtTime(45, this.ctx.currentTime);
      const gainBase = this.ctx.createGain();
      gainBase.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.oscBase.connect(gainBase);
      gainBase.connect(this.distortion);
      this.oscBase.start();

      // Oscillator 2: First harmonic (Triangle for warmth)
      this.oscHarmonic1 = this.ctx.createOscillator();
      this.oscHarmonic1.type = 'triangle';
      this.oscHarmonic1.frequency.setValueAtTime(90, this.ctx.currentTime);
      const gainH1 = this.ctx.createGain();
      gainH1.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.oscHarmonic1.connect(gainH1);
      gainH1.connect(this.distortion);
      this.oscHarmonic1.start();

      // Oscillator 3: High resonance exhaust rasp (Square)
      this.oscHarmonic2 = this.ctx.createOscillator();
      this.oscHarmonic2.type = 'square';
      this.oscHarmonic2.frequency.setValueAtTime(135, this.ctx.currentTime);
      const gainH2 = this.ctx.createGain();
      gainH2.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.oscHarmonic2.connect(gainH2);
      gainH2.connect(this.distortion);
      this.oscHarmonic2.start();

      // Oscillator 4: Sub-bass rumble
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(30, this.ctx.currentTime);
      const gainSub = this.ctx.createGain();
      gainSub.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.oscSub.connect(gainSub);
      gainSub.connect(this.masterGain);
      this.oscSub.start();

      // Turbo Spool Whistle
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(2400, this.ctx.currentTime);
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();

      // Tire Screech Loop
      this.setupTireScreech();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not initialize automatically:', e);
    }
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupTireScreech(): void {
    if (!this.ctx || !this.masterGain) return;

    // Create 2 seconds of pink/white noise for tire screech
    const bufferSize = this.ctx.sampleRate * 2;
    this.screechNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.screechNoiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);

    this.startScreechLoop();
  }

  private startScreechLoop(): void {
    if (!this.ctx || !this.screechNoiseBuffer || !this.screechFilter) return;
    this.screechSource = this.ctx.createBufferSource();
    this.screechSource.buffer = this.screechNoiseBuffer;
    this.screechSource.loop = true;
    this.screechSource.connect(this.screechFilter);
    this.screechSource.start();
  }

  public resume(): void {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Update engine sound parameters every frame
   * @param rpm Current engine RPM (e.g. 1000 - 9500)
   * @param throttle Throttle pedal position (0.0 - 1.0)
   * @param slipRatio Lateral/longitudinal tire slip factor (0.0 - 1.0)
   * @param speed Car speed in m/s
   * @param engineHealth Factor 0.0 to 1.0
   */
  public update(rpm: number, throttle: number, slipRatio: number, speed: number, engineHealth: number = 1.0): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Cylinder firing frequency (V8 firing 4 pulses per revolution)
    // Revs per second = rpm / 60
    const rps = rpm / 60;
    const baseFreq = Math.max(25, rps * 2.2);

    // Subtle sputtering frequency jitter if engine is damaged
    const healthJitter = engineHealth < 0.6 ? (Math.random() - 0.5) * (1 - engineHealth) * 30 : 0;

    if (this.oscBase) {
      this.oscBase.frequency.setTargetAtTime(baseFreq + healthJitter, t, 0.04);
    }
    if (this.oscHarmonic1) {
      this.oscHarmonic1.frequency.setTargetAtTime(baseFreq * 2.05, t, 0.04);
    }
    if (this.oscHarmonic2) {
      this.oscHarmonic2.frequency.setTargetAtTime(baseFreq * 3.12, t, 0.04);
    }
    if (this.oscSub) {
      this.oscSub.frequency.setTargetAtTime(Math.max(20, baseFreq * 0.5), t, 0.05);
    }

    // Filter frequency opens wide on throttle
    if (this.engineFilter) {
      const minCutoff = 700;
      const maxCutoff = 6500;
      const targetCutoff = minCutoff + (maxCutoff - minCutoff) * Math.pow(throttle, 1.4) * (0.6 + 0.4 * (rpm / 9000));
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, t, 0.06);
    }

    // Turbo spool sound
    if (this.turboOsc && this.turboGain) {
      const turboPitch = 1800 + Math.min(speed * 45, 3200) + throttle * 1200;
      this.turboOsc.frequency.setTargetAtTime(turboPitch, t, 0.1);
      const turboVol = Math.max(0.001, throttle * 0.09 * Math.min(1, speed / 15));
      this.turboGain.gain.setTargetAtTime(turboVol, t, 0.08);
    }

    // Tire Screech volume & pitch
    if (this.screechGain && this.screechFilter) {
      const targetScreech = Math.min(1.0, Math.max(0, (slipRatio - 0.22) * 1.5)) * Math.min(1, speed / 4);
      this.screechGain.gain.setTargetAtTime(targetScreech * 0.28, t, 0.05);
      const screechPitch = 1100 + slipRatio * 600 + speed * 10;
      this.screechFilter.frequency.setTargetAtTime(screechPitch, t, 0.05);
    }
  }

  /**
   * Sound effect for gear changes and exhaust backfires
   */
  public triggerBackfire(isHighRpm: boolean = false): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Burst of noise with low-pass envelope
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHighRpm ? 2800 : 1600, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isHighRpm ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noiseSource.start();
  }

  /**
   * Collision sound effect with volume and pitch scaled by impact force
   */
  public triggerCrash(impactForce: number): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const normalizedForce = Math.min(1.0, Math.max(0.1, impactForce / 35));

    // Low frequency punch
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(normalizedForce * 0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.4);

    // Crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(normalizedForce * 0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(t);
  }

  /**
   * Sound effect for pneumatic hydraulic car lift jacks (hiss & clank)
   */
  public triggerPneumaticJack(isUp: boolean): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Compressed air burst (noise with bandpass sweep)
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isUp ? 2200 : 1200, t);
    filter.frequency.exponentialRampToValueAtTime(isUp ? 600 : 300, t + 0.35);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start(t);

    // Mechanical jack latch clank
    const clankOsc = this.ctx.createOscillator();
    const clankGain = this.ctx.createGain();
    clankOsc.type = 'triangle';
    clankOsc.frequency.setValueAtTime(isUp ? 380 : 180, t + 0.05);
    clankOsc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    clankGain.gain.setValueAtTime(0.4, t + 0.05);
    clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    clankOsc.connect(clankGain);
    clankGain.connect(this.masterGain!);
    clankOsc.start(t + 0.05);
    clankOsc.stop(t + 0.22);
  }

  /**
   * Sound effect for high-speed pneumatic impact wrench unbolting/bolting wheel nuts
   */
  public triggerWheelGunRattle(): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Rapid rat-tat-tat pulses
    const pulseCount = 6;
    for (let p = 0; p < pulseCount; p++) {
      const pt = t + p * 0.038;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, pt);
      osc.frequency.exponentialRampToValueAtTime(350, pt + 0.03);

      gain.gain.setValueAtTime(0.22, pt);
      gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(pt);
      osc.stop(pt + 0.04);
    }
  }

  /**
   * Pit stop completion sound
   */
  public triggerPitChime(): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  /**
   * Synthesize authentic F1 Pit Radio communications with VHF static, bandpass filter & roger beeps
   */
  public triggerPitRadio(cue: 'box' | 'tyres' | 'go'): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. VHF Radio Static Squelch Burst (Opening chirp)
    const squelchBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.09), this.ctx.sampleRate);
    const data = squelchBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const squelchSource = this.ctx.createBufferSource();
    squelchSource.buffer = squelchBuf;

    const squelchFilter = this.ctx.createBiquadFilter();
    squelchFilter.type = 'bandpass';
    squelchFilter.frequency.setValueAtTime(2100, t);
    squelchFilter.Q.setValueAtTime(4.0, t);

    const squelchGain = this.ctx.createGain();
    squelchGain.gain.setValueAtTime(0.18, t);
    squelchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

    squelchSource.connect(squelchFilter);
    squelchFilter.connect(squelchGain);
    squelchGain.connect(this.masterGain!);
    squelchSource.start(t);

    // 2. F1 Team Radio Audio Bus with telephone bandpass filter (400Hz to 3200Hz)
    const radioFilter = this.ctx.createBiquadFilter();
    radioFilter.type = 'bandpass';
    radioFilter.frequency.setValueAtTime(1400, t);
    radioFilter.Q.setValueAtTime(1.8, t);

    const radioGain = this.ctx.createGain();
    radioGain.gain.setValueAtTime(0.24, t);
    radioGain.connect(this.masterGain!);
    radioFilter.connect(radioGain);

    // 3. Formant Vocal Cues depending on event
    if (cue === 'box') {
      // "Box, Box, Box" - three rhythmic harmonic pulses
      [0.08, 0.28, 0.48].forEach((timeOffset, idx) => {
        const osc = this.ctx!.createOscillator();
        const oGain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320 + idx * 25, t + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(240, t + timeOffset + 0.12);

        oGain.gain.setValueAtTime(0.3, t + timeOffset);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.14);

        osc.connect(oGain);
        oGain.connect(radioFilter);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.15);
      });
    } else if (cue === 'tyres') {
      // "Tyres on" - dual harmonic vocal burst
      [0.08, 0.26].forEach((timeOffset, idx) => {
        const osc = this.ctx!.createOscillator();
        const oGain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440 - idx * 60, t + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(300, t + timeOffset + 0.14);

        oGain.gain.setValueAtTime(0.28, t + timeOffset);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.15);

        osc.connect(oGain);
        oGain.connect(radioFilter);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.16);
      });
    } else if (cue === 'go') {
      // "Go, Go, Go!" - rising triple urgent burst
      [0.08, 0.22, 0.36].forEach((timeOffset, idx) => {
        const osc = this.ctx!.createOscillator();
        const oGain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380 + idx * 90, t + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(540 + idx * 80, t + timeOffset + 0.1);

        oGain.gain.setValueAtTime(0.32, t + timeOffset);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.11);

        osc.connect(oGain);
        oGain.connect(radioFilter);
        osc.start(t + timeOffset);
        osc.stop(t + timeOffset + 0.12);
      });
    }

    // 4. Roger Beep (Transmission end chirp at t + 0.68s)
    const beepTime = t + 0.68;
    const beepOsc = this.ctx.createOscillator();
    const beepGain = this.ctx.createGain();
    beepOsc.type = 'sine';
    beepOsc.frequency.setValueAtTime(1920, beepTime);
    beepGain.gain.setValueAtTime(0.15, beepTime);
    beepGain.gain.exponentialRampToValueAtTime(0.001, beepTime + 0.05);

    beepOsc.connect(beepGain);
    beepGain.connect(this.masterGain!);
    beepOsc.start(beepTime);
    beepOsc.stop(beepTime + 0.06);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}
