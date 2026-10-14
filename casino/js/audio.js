/**
 * Clark's Casino - Web Audio API High-Fidelity Synthesizer
 * 100% synthetic, zero external audio assets required.
 * Features auto-unlock on user gesture, master compression, and punchy casino acoustics.
 */

class CasinoAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.muted = localStorage.getItem('clark_casino_muted') === 'true';
    this.initialized = false;
    this.volume = 1.0;

    // Automatically initialize and set up global gesture unlock listeners
    this.setupAutoUnlock();
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Dynamics Compressor to guarantee punchy, audible sound on laptop/mobile speakers without clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : this.volume, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.initialized = true;
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  setupAutoUnlock() {
    const unlockHandler = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'running') {
        // Play silent 1-sample warmup buffer to wake up hardware
        this.warmupHardware();
        // Remove one-shot unlock listeners
        ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'].forEach(evt => {
          window.removeEventListener(evt, unlockHandler, true);
          document.removeEventListener(evt, unlockHandler, true);
        });
      }
    };

    ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'].forEach(evt => {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
      document.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    });
  }

  warmupHardware() {
    if (!this.ctx) return;
    try {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch (e) {}
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('clark_casino_muted', this.muted);
    this.ensureContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Helper to get time safely
  getTime() {
    this.ensureContext();
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // Tactile ceramic casino chip placement sound (rich double resonant ping + attack)
  playChip() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. High Ceramic Resonant Ping (Sine blend: 2850Hz + 4800Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2850 + Math.random() * 200, t);
    gain1.gain.setValueAtTime(0.55, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.075);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(4600 + Math.random() * 300, t);
    gain2.gain.setValueAtTime(0.35, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.05);

    // 2. Body Clink (Warm 750Hz base)
    const oscBody = this.ctx.createOscillator();
    const gainBody = this.ctx.createGain();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(750, t);
    oscBody.frequency.exponentialRampToValueAtTime(320, t + 0.04);
    gainBody.gain.setValueAtTime(0.3, t);
    gainBody.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    oscBody.connect(gainBody);
    gainBody.connect(this.masterGain);
    oscBody.start(t);
    oscBody.stop(t + 0.05);
  }

  // Card slide / deal / flip sound
  playCard() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Card friction slide (swept noise)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.07);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.08);

    // 2. Card snap flick transient
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1100, t + 0.02);
    snapOsc.frequency.exponentialRampToValueAtTime(400, t + 0.045);
    snapGain.gain.setValueAtTime(0.28, t + 0.02);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(t + 0.02);
    snapOsc.stop(t + 0.055);
  }

  // Wheel click / flapper tick / Roulette ball fret bounce
  playTick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1850 + Math.random() * 250, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.025);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Authentic Craps Dice Rolling / Bouncing Sound
  // Replaces inaudible low-sub tone with genuine crisp acrylic clatter + wood/felt thud
  playDice(strength = 1.0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const vol = Math.max(0.2, Math.min(1.0, strength));

    // 1. Wood/Felt Table Impact Thud (solid acoustic body: 220Hz -> 85Hz)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(220, t);
    thudOsc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

    thudGain.gain.setValueAtTime(0.55 * vol, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(t);
    thudOsc.stop(t + 0.065);

    // 2. Sharp Acrylic Dice Impact Clack (Bandpass noise transient: 3200Hz)
    const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.04), this.ctx.sampleRate);
    const ndata = noiseBuf.getChannelData(0);
    for (let i = 0; i < ndata.length; i++) {
      ndata[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3200 + Math.random() * 400, t);
    noiseFilter.Q.setValueAtTime(3.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65 * vol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.042);

    // 3. High Precision Acrylic Edge Click (2800Hz resonant ping)
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(2800 + Math.random() * 300, t);
    pingOsc.frequency.exponentialRampToValueAtTime(1100, t + 0.03);

    pingGain.gain.setValueAtTime(0.4 * vol, t);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(t);
    pingOsc.stop(t + 0.04);

    // 4. Secondary Collision Click (Dice colliding with each other or felt rebound)
    const t2 = t + 0.024;
    const clack2 = this.ctx.createOscillator();
    const clackGain2 = this.ctx.createGain();
    clack2.type = 'triangle';
    clack2.frequency.setValueAtTime(2400 + Math.random() * 400, t2);
    clack2.frequency.exponentialRampToValueAtTime(900, t2 + 0.025);

    clackGain2.gain.setValueAtTime(0.35 * vol, t2);
    clackGain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.03);

    clack2.connect(clackGain2);
    clackGain2.connect(this.masterGain);
    clack2.start(t2);
    clack2.stop(t2 + 0.035);
  }

  // Mechanical Slot Reel Stop (heavy solenoid thump + metallic pawl latch)
  playReelStop() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Heavy bass mechanical clunk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.07);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);

    // 2. Crisp metallic pawl snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    const snapFilter = this.ctx.createBiquadFilter();

    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(2400, t);
    snapOsc.frequency.exponentialRampToValueAtTime(600, t + 0.03);

    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(2600, t);
    snapFilter.Q.setValueAtTime(3.5, t);

    snapGain.gain.setValueAtTime(0.45, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.masterGain);

    snapOsc.start(t);
    snapOsc.stop(t + 0.04);
  }

  // Mechanical Slot Arm Lever Pull (heavy mechanical ratchet pull)
  playLeverPull() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const clickTime = t + i * 0.032;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420 + i * 75, clickTime);
      osc.frequency.exponentialRampToValueAtTime(140, clickTime + 0.024);

      gain.gain.setValueAtTime(0.38, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.028);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.032);
    }
  }

  // Tension anticipation rise (used when Reel 1 and 2 hit potential jackpot)
  playAnticipation() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.85);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.95);
  }

  // Standard Win Chime (C major arpeggio + harmonic sparkle + coins)
  playWin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.50, d: 0.18 }, // C6
      { f: 1318.51, d: 0.35 }  // E6 triumphant hold
    ];

    notes.forEach((note, idx) => {
      const t = this.ctx.currentTime + idx * 0.085;

      // Fundamental
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.48, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + note.d + 0.02);

      // Bell sparkle harmonic (octave overtone)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.f * 2, t);
      gain2.gain.setValueAtTime(0.2, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + note.d * 0.8);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + note.d);
    });

    // Quick chip clatter
    setTimeout(() => this.playChip(), 280);
    setTimeout(() => this.playChip(), 360);
  }

  // Big Jackpot / Epic Fanfare
  playJackpot() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const fanfare = [
      { f: 523.25, d: 0.14 }, // C5
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.14 }, // G5
      { f: 1046.50, d: 0.28 }, // C6
      { f: 880.00, d: 0.14 },  // A5
      { f: 1046.50, d: 0.18 }, // C6
      { f: 1318.51, d: 0.65 }  // E6
    ];

    let offset = 0;
    fanfare.forEach((note) => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      // Lowpass filter to make it sound like a brass trumpet
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      offset += note.d * 0.88;
    });

    // Cascade of coins
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this.playChip(), offset * 1000 + i * 75);
    }
  }

  // Soft loss tone
  playLose() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.28);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Button UI click
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.035);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }
}

// Global audio instance
window.casinoAudio = new CasinoAudioEngine();
