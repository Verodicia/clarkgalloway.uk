/**
 * Hex Pulse - 360° Rotational Geometric Survival Game.
 * Features rotating polygonal core, contracting obstacle walls,
 * BPM screen pulses, touch left/right orbit controls, and high-DPI canvas scaling.
 */
class HexPulseGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.survivalTime = 0;

    // Viewport dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // Core & Orbit properties
    this.sides = 6;
    this.coreRadius = 28;
    this.playerRadius = 44;
    this.playerAngle = 0;
    this.rotateSpeed = 0.098;
    this.globalRotation = 0;
    this.rotationVel = 0.009;

    // Contracting Walls (Spaced out for fair reaction time)
    this.walls = [];
    this.wallTimer = 0;
    this.wallSpawnRate = 125; // frames between wall groups (more breathing room)
    this.wallSpeed = 2.1;

    // Visuals & Beat
    this.beatPulse = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;

    // Input state
    this.keys = { left: false, right: false };
    this.touchSide = null; // 'left' or 'right'

    // Bound listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.survivalTime = 0;
    this.playerAngle = 0;
    this.globalRotation = 0;
    this.rotationVel = 0.009;
    this.wallSpeed = 1.8;
    this.wallSpawnRate = 140;
    this.wallTimer = 0;
    this.shakeIntensity = 0;

    this.walls = [];
    this.particles = [];
    this.floatingTexts = [];

    this.isRunning = true;
    this.attachEvents();
    this.onScoreUpdate(this.score);

    this.animId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.detachEvents();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;

    this.canvas.width = this.logicalWidth * dpr;
    this.canvas.height = this.logicalHeight * dpr;
    this.ctx.scale(dpr, dpr);

    this.centerX = this.logicalWidth / 2;
    this.centerY = this.logicalHeight / 2 - 10;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    this.touchSide = px < this.logicalWidth / 2 ? 'left' : 'right';
  }

  handlePointerUp() {
    this.touchSide = null;
  }

  spawnWallPattern() {
    const initialDist = Math.max(this.logicalWidth, this.logicalHeight) * 0.72;
    const thickness = 13; // Slimmer walls to avoid clipping
    const openSide = Math.floor(Math.random() * this.sides);

    // Progressive difficulty: more gaps early, tightening up as survival time increases
    if (this.survivalTime < 18) {
      // Early Stage: 3 blocked, 3 open gaps (very accessible)
      for (let s = 0; s < this.sides; s++) {
        const isBlocked = (s - openSide + this.sides) % this.sides < 3;
        if (isBlocked) {
          this.walls.push({
            side: s,
            dist: initialDist,
            thickness,
            passed: false
          });
        }
      }
    } else if (this.survivalTime < 38) {
      // Mid Stage: Alternating sides or 2 open gaps
      const patternType = Math.random();
      for (let s = 0; s < this.sides; s++) {
        let isBlocked = false;
        if (patternType < 0.45) {
          isBlocked = s % 2 === 0;
        } else {
          isBlocked = s !== openSide && s !== (openSide + 1) % this.sides;
        }
        if (isBlocked) {
          this.walls.push({
            side: s,
            dist: initialDist,
            thickness,
            passed: false
          });
        }
      }
    } else {
      // Advanced Stage (38s+): 5 blocked, 1 open or 4 blocked
      const patternType = Math.random();
      for (let s = 0; s < this.sides; s++) {
        let isBlocked = false;
        if (patternType < 0.6) {
          isBlocked = s !== openSide;
        } else {
          isBlocked = s !== openSide && s !== (openSide + 1) % this.sides;
        }
        if (isBlocked) {
          this.walls.push({
            side: s,
            dist: initialDist,
            thickness,
            passed: false
          });
        }
      }
    }
  }

  update() {
    if (!this.isRunning) return;

    this.survivalTime += 1 / 60;
    this.score = Math.floor(this.survivalTime * 100);
    this.onScoreUpdate(this.score);

    // Smooth, gradual difficulty escalation
    this.wallSpeed = 1.8 + Math.min(this.survivalTime * 0.018, 1.3);
    this.wallSpawnRate = Math.max(75, 140 - Math.floor(this.survivalTime * 0.65));

    // Reverse spin direction occasionally
    if (Math.floor(this.survivalTime) % 10 === 0 && Math.random() < 0.015) {
      this.rotationVel *= -1;
    }
    this.globalRotation += this.rotationVel;

    // Player Rotation
    if (this.keys.left || this.touchSide === 'left') {
      this.playerAngle -= this.rotateSpeed;
    }
    if (this.keys.right || this.touchSide === 'right') {
      this.playerAngle += this.rotateSpeed;
    }

    // Keep angle normalized [0, 2PI)
    while (this.playerAngle < 0) this.playerAngle += Math.PI * 2;
    while (this.playerAngle >= Math.PI * 2) this.playerAngle -= Math.PI * 2;

    // Wall Spawning
    this.wallTimer++;
    if (this.wallTimer >= this.wallSpawnRate) {
      this.wallTimer = 0;
      this.spawnWallPattern();
    }

    // Compute player's current side segment (0 to 5)
    // Account for global world rotation
    let effectiveAngle = this.playerAngle - this.globalRotation;
    while (effectiveAngle < 0) effectiveAngle += Math.PI * 2;
    while (effectiveAngle >= Math.PI * 2) effectiveAngle -= Math.PI * 2;

    const segmentAngle = (Math.PI * 2) / this.sides;
    const playerSide = Math.floor(effectiveAngle / segmentAngle) % this.sides;

    // Update Walls & Collision
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const w = this.walls[i];
      w.dist -= this.wallSpeed;

      // Check collision with player
      if (w.side === playerSide) {
        if (w.dist - w.thickness <= this.playerRadius && w.dist >= this.playerRadius - 6) {
          this.handleGameOver();
          return;
        }
      }

      // Check clearance
      if (!w.passed && w.dist < this.coreRadius) {
        w.passed = true;
        if (typeof ArcadeAudio !== 'undefined' && i % 4 === 0) {
          ArcadeAudio.sfx.hexPulseTick();
        }
      }

      // Remove inside core
      if (w.dist <= this.coreRadius - 10) {
        this.walls.splice(i, 1);
      }
    }

    // Beat pulse animation
    this.beatPulse = Math.sin(this.survivalTime * 8) * 0.5 + 0.5;

    // Particles decay
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  handleGameOver() {
    this.isRunning = false;
    this.shakeIntensity = 18;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.explosion();
    }

    // Burst player into glowing fragments
    const px = this.centerX + Math.cos(this.playerAngle) * this.playerRadius;
    const py = this.centerY + Math.sin(this.playerAngle) * this.playerRadius;

    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 6 + 2;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1.0,
        decay: 0.03,
        size: 3,
        color: '#ff0077'
      });
    }

    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  draw() {
    this.ctx.save();

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    // Pulsing Backdrop
    const hue = Math.floor((this.survivalTime * 20 + 260) % 360);
    this.ctx.fillStyle = `hsl(${hue}, 40%, 6%)`;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw Radial Sector Triangles
    const segAngle = (Math.PI * 2) / this.sides;
    for (let s = 0; s < this.sides; s++) {
      const a1 = this.globalRotation + s * segAngle;
      const a2 = this.globalRotation + (s + 1) * segAngle;

      this.ctx.fillStyle = s % 2 === 0
        ? `hsla(${hue}, 60%, 12%, 0.5)`
        : `hsla(${hue}, 60%, 8%, 0.5)`;

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.arc(this.centerX, this.centerY, this.logicalHeight, a1, a2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Draw Contracting Walls
    this.walls.forEach(w => {
      const a1 = this.globalRotation + w.side * segAngle;
      const a2 = this.globalRotation + (w.side + 1) * segAngle;

      const innerDist = Math.max(1, w.dist - w.thickness);
      const outerDist = w.dist;

      this.ctx.save();
      this.ctx.shadowColor = `hsl(${(hue + 120) % 360}, 100%, 50%)`;
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = `hsl(${(hue + 120) % 360}, 90%, 55%)`;

      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, outerDist, a1, a2);
      this.ctx.arc(this.centerX, this.centerY, innerDist, a2, a1, true);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Central Pulsing Hexagon Core
    const corePulse = this.coreRadius + this.beatPulse * 3;
    this.ctx.save();
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#061226';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 2.5;

    this.ctx.beginPath();
    for (let i = 0; i < this.sides; i++) {
      const a = this.globalRotation + i * segAngle;
      const x = this.centerX + Math.cos(a) * corePulse;
      const y = this.centerY + Math.sin(a) * corePulse;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Draw Orbiting Player Triangle
    if (this.isRunning) {
      const px = this.centerX + Math.cos(this.playerAngle) * this.playerRadius;
      const py = this.centerY + Math.sin(this.playerAngle) * this.playerRadius;

      this.ctx.save();
      this.ctx.translate(px, py);
      this.ctx.rotate(this.playerAngle + Math.PI / 2);

      this.ctx.shadowColor = '#ffd200';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#ffd200';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -7);
      this.ctx.lineTo(5, 5);
      this.ctx.lineTo(-5, 5);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    // Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Top HUD
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`TIME: ${this.survivalTime.toFixed(1)}s`, 16, 24);

    // Touch Zones Visual Cue
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.fillRect(0, this.logicalHeight - 50, this.logicalWidth / 2 - 2, 50);
    this.ctx.fillRect(this.logicalWidth / 2 + 2, this.logicalHeight - 50, this.logicalWidth / 2 - 2, 50);

    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
    this.ctx.fillText('◀ HOLD LEFT', this.logicalWidth * 0.25, this.logicalHeight - 20);
    this.ctx.fillText('HOLD RIGHT ▶', this.logicalWidth * 0.75, this.logicalHeight - 20);

    this.ctx.restore();
  }

  loop() {
    if (!this.isRunning && this.particles.length === 0) return;

    this.update();
    this.draw();

    if (this.isRunning || this.particles.length > 0) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }
}
