/**
 * ArcadeAudio - Procedural 8-bit Sound FX Synthesizer using Web Audio API.
 * Requires zero asset downloads and handles browser autoplay policies seamlessly.
 */
const ArcadeAudio = (() => {
  let audioCtx = null;
  let isMuted = ArcadeStorage.getPref('muted', false);

  const initContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  // Helper to play synthesized tones
  const playTone = (freq, type = 'square', duration = 0.1, gainValue = 0.1, pitchDecay = 0) => {
    if (isMuted) return;
    initContext();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (pitchDecay !== 0) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(10, freq + pitchDecay), 
          audioCtx.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Standard Arcade Sound Presets
  const sfx = {
    click: () => {
      playTone(600, 'sine', 0.04, 0.06);
    },
    countdownTick: (num = 3) => {
      const freqs = { 3: 440, 2: 554, 1: 659 };
      const f = freqs[num] || 500;
      playTone(f, 'triangle', 0.12, 0.16);
      playTone(f * 1.5, 'sine', 0.08, 0.08);
    },
    countdownGo: () => {
      playTone(880, 'square', 0.14, 0.18, 80);
      setTimeout(() => playTone(1108, 'sine', 0.22, 0.22), 60);
    },
    drop: () => {
      playTone(220, 'triangle', 0.08, 0.15, -60);
    },
    perfect: (combo = 1) => {
      // Dynamic rising pitch for combo streaks!
      const baseFreq = 440;
      const step = Math.min(combo, 8) * 60;
      playTone(baseFreq + step, 'sine', 0.15, 0.12);
      setTimeout(() => {
        playTone(baseFreq + step + 120, 'sine', 0.18, 0.14);
      }, 50);
    },
    slice: () => {
      playTone(320, 'sawtooth', 0.06, 0.08, -100);
    },
    knifeThrow: () => {
      playTone(560, 'triangle', 0.05, 0.08, 140);
    },
    knifeHit: () => {
      playTone(340, 'square', 0.04, 0.12, -80);
      playTone(180, 'triangle', 0.07, 0.16, -40);
    },
    knifeClash: () => {
      playTone(880, 'sawtooth', 0.09, 0.22, -220);
      playTone(660, 'square', 0.11, 0.2, -160);
    },
    chop: () => {
      playTone(260, 'square', 0.05, 0.16, -140);
      playTone(120, 'triangle', 0.08, 0.2, -60);
    },
    thrust: () => {
      playTone(110, 'triangle', 0.05, 0.08, -30);
    },
    blaster: () => {
      playTone(760, 'sawtooth', 0.06, 0.14, -420);
      playTone(380, 'square', 0.04, 0.08, -180);
    },
    hyperspace: () => {
      playTone(300, 'sine', 0.18, 0.2, 500);
      setTimeout(() => playTone(800, 'sawtooth', 0.12, 0.15, -600), 70);
    },
    rockHit: (size = 1) => {
      const base = size === 3 ? 120 : size === 2 ? 190 : 280;
      playTone(base, 'triangle', 0.08, 0.2, -40);
      playTone(base * 0.7, 'square', 0.07, 0.15, -30);
    },
    pop: (combo = 1) => {
      const base = 420 + Math.min(combo, 15) * 45;
      playTone(base, 'sine', 0.08, 0.18, 120);
      playTone(base * 1.6, 'triangle', 0.05, 0.12, 60);
    },
    buzz: () => {
      playTone(130, 'sawtooth', 0.18, 0.22, -40);
      playTone(90, 'square', 0.18, 0.2, -20);
    },
    pongBounce: (streak = 1) => {
      const base = 480 + Math.min(streak, 20) * 25;
      playTone(base, 'triangle', 0.09, 0.16);
      playTone(base * 1.5, 'sine', 0.06, 0.08);
    },
    brickHit: (combo = 1) => {
      const base = 520 + Math.min(combo, 16) * 40;
      playTone(base, 'triangle', 0.06, 0.15);
      playTone(base * 1.5, 'sine', 0.04, 0.09);
    },
    laser: () => {
      playTone(880, 'sawtooth', 0.05, 0.12, -450);
    },
    gearClunk: () => {
      playTone(95, 'square', 0.08, 0.18, -30);
      playTone(65, 'sawtooth', 0.1, 0.15, -20);
    },
    star: (combo = 1) => {
      const base = 587.33; // D5
      const note2 = base * (1 + Math.min(combo, 6) * 0.15);
      playTone(base, 'sine', 0.1, 0.15);
      setTimeout(() => playTone(note2, 'triangle', 0.15, 0.15), 60);
    },
    explosion: () => {
      if (isMuted) return;
      initContext();
      playTone(150, 'sawtooth', 0.3, 0.25, -120);
      playTone(80, 'square', 0.35, 0.2, -60);
    },
    gameover: () => {
      if (isMuted) return;
      initContext();
      [240, 200, 160, 110].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 'sawtooth', 0.18, 0.12), idx * 120);
      });
    },
    simonTone: (padIndex, duration = 0.26) => {
      // 4 Harmonious Retro Tones: Green (E4), Red (A4), Yellow (C#4), Blue (E3)
      const freqs = [329.63, 440.00, 277.18, 164.81];
      const freq = freqs[padIndex % freqs.length] || 330;
      playTone(freq, 'sine', duration, 0.22);
      playTone(freq * 2, 'triangle', duration * 0.7, 0.08);
    },
    newRecord: () => {
      if (isMuted) return;
      initContext();
      [330, 440, 550, 660, 880].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 'triangle', 0.22, 0.15), idx * 100);
      });
    },
    flap: () => {
      playTone(400, 'sine', 0.08, 0.12, 260);
      playTone(620, 'triangle', 0.06, 0.06, 120);
    },
    pellet: () => {
      playTone(330, 'square', 0.035, 0.07, -40);
    },
    powerPellet: () => {
      playTone(520, 'sine', 0.14, 0.15, 180);
      setTimeout(() => playTone(780, 'triangle', 0.18, 0.16, -100), 60);
    },
    ghostEaten: (multiplier = 1) => {
      const base = 440 * Math.min(multiplier, 4);
      playTone(base, 'sawtooth', 0.15, 0.18, 300);
      setTimeout(() => playTone(base * 1.5, 'sine', 0.2, 0.15, 200), 80);
    },
    tileSlide: () => {
      playTone(180, 'sine', 0.06, 0.08, 60);
    },
    tileMerge: (value = 4) => {
      const step = Math.min(11, Math.round(Math.log2(value)));
      const baseFreq = 261.63 * Math.pow(1.08, step);
      playTone(baseFreq, 'sine', 0.14, 0.18);
      setTimeout(() => playTone(baseFreq * 1.5, 'triangle', 0.18, 0.14), 45);
    },
    diveBomb: () => {
      playTone(680, 'sawtooth', 0.22, 0.15, -420);
    },
    alienShoot: () => {
      playTone(420, 'square', 0.05, 0.08, -200);
    },
    springBounce: () => {
      playTone(320, 'sine', 0.15, 0.18, 480);
      setTimeout(() => playTone(820, 'triangle', 0.12, 0.15, 200), 50);
    },
    hexPulseTick: () => {
      playTone(720, 'triangle', 0.04, 0.09, -150);
    },
    hop: () => {
      playTone(480, 'sine', 0.06, 0.1, 160);
    },
    trafficZap: () => {
      playTone(280, 'sawtooth', 0.08, 0.1, -120);
    },
    splash: () => {
      playTone(180, 'square', 0.18, 0.16, -100);
      playTone(110, 'sawtooth', 0.22, 0.14, -60);
    },
    jetpack: () => {
      playTone(220, 'sawtooth', 0.12, 0.12, 80);
    },
    nitroBoost: () => {
      playTone(320, 'sawtooth', 0.28, 0.22, 540);
      setTimeout(() => playTone(860, 'sine', 0.18, 0.18, 200), 80);
    },
    carHorn: () => {
      playTone(380, 'square', 0.12, 0.15, 0);
      playTone(475, 'square', 0.12, 0.15, 0);
    },
    screech: () => {
      playTone(680, 'sawtooth', 0.09, 0.14, -300);
    },
    fallGap: () => {
      playTone(520, 'sine', 0.05, 0.09, -180);
    },
    laserBuzz: () => {
      playTone(130, 'sawtooth', 0.12, 0.16, 20);
    },
    gemCollect: () => {
      playTone(740, 'triangle', 0.08, 0.12, 240);
      setTimeout(() => playTone(1100, 'sine', 0.1, 0.15, 0), 40);
    },
    rotateTile: () => {
      playTone(560, 'triangle', 0.04, 0.1, -120);
    },
    circuitConnect: () => {
      playTone(440, 'sine', 0.08, 0.15, 120);
      setTimeout(() => playTone(660, 'sine', 0.09, 0.16, 140), 60);
      setTimeout(() => playTone(880, 'sine', 0.14, 0.18, 200), 120);
      setTimeout(() => playTone(1320, 'triangle', 0.22, 0.2, 0), 180);
    },
    thrusterRCS: () => {
      playTone(160, 'sawtooth', 0.06, 0.08, -30);
    },
    softLanding: () => {
      playTone(520, 'sine', 0.12, 0.16, 140);
      setTimeout(() => playTone(780, 'triangle', 0.18, 0.18, 160), 80);
      setTimeout(() => playTone(1040, 'sine', 0.25, 0.22, 0), 160);
    },
    fuelPickup: () => {
      playTone(460, 'sine', 0.08, 0.14, 180);
      setTimeout(() => playTone(690, 'sine', 0.12, 0.16, 220), 50);
    }
  };

  const toggleMute = () => {
    initContext();
    isMuted = !isMuted;
    ArcadeStorage.setPref('muted', isMuted);
    return isMuted;
  };

  const getMuted = () => isMuted;

  return {
    init: initContext,
    toggleMute,
    getMuted,
    playTone,
    sfx
  };
})();
