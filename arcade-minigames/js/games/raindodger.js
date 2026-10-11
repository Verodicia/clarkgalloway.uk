/**
 * Rain Dodger - Arcade reflex & evasion minigame.
 * Dodge plummeting meteors and acid hazards while grabbing golden multiplier stars.
 * Optimized for mobile touch drag & desktop keyboard navigation.
 */
class RainDodgerGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.combo = 1;
    this.lastStarTime = 0;

    // Player craft
    this.player = {
      x: 0,
      y: 0,
      targetX: 0,
      width: 36,
      height: 22,
      speed: 8
    };

    // Game objects
    this.hazards = [];
    this.stars = [];
    this.particles = [];
    this.floatingTexts = [];

    // Timers & pacing
    this.survivalTimer = 0;
    this.hazardSpawnCooldown = 0;
    this.starSpawnCooldown = 0;
    this.difficultyFactor = 1.0;

    // Keys / touch state
    this.keys = { left: false, right: false };
    this.isPointerDown = false;
    this.shakeIntensity = 0;

    // Animation tracker
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Abort previous RAF loop and detach listeners
    this.resize();
    this.score = 0;
    this.combo = 1;
    this.survivalTimer = 0;
    this.hazardSpawnCooldown = 0;
    this.starSpawnCooldown = 90;
    this.difficultyFactor = 1.0;
    this.shakeIntensity = 0;

    this.hazards = [];
    this.stars = [];
    this.particles = [];
    this.floatingTexts = [];

    // Position player near bottom center
    this.player.x = this.logicalWidth / 2;
    this.player.targetX = this.player.x;
    this.player.y = this.logicalHeight - 55;

    this.isRunning = true;
    this.attachEvents();
    this.onScoreUpdate(this.score);

    this.animId = requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;

    this.canvas.width = this.logicalWidth * dpr;
    this.canvas.height = this.logicalHeight * dpr;
    this.ctx.scale(dpr, dpr);

    if (this.player) {
      this.player.y = this.logicalHeight - 55;
    }
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = false;
    }
  }

  getCanvasRelativeX(e) {
    const rect = this.canvas.getBoundingClientRect();
    return Math.max(20, Math.min(this.logicalWidth - 20, e.clientX - rect.left));
  }

  handlePointerDown(e) {
    e.preventDefault();
    this.isPointerDown = true;
    this.player.targetX = this.getCanvasRelativeX(e);
  }

  handlePointerMove(e) {
    if (this.isPointerDown) {
      e.preventDefault();
      this.player.targetX = this.getCanvasRelativeX(e);
    }
  }

  handlePointerUp() {
    this.isPointerDown = false;
  }

  spawnHazard() {
    const isBig = Math.random() < 0.18;
    const radius = isBig ? (18 + Math.random() * 8) : (8 + Math.random() * 5);
    const speed = (isBig ? 2.5 : 4.5) * (1 + (this.difficultyFactor - 1) * 0.45);

    this.hazards.push({
      x: radius + Math.random() * (this.logicalWidth - radius * 2),
      y: -radius - 10,
      radius: radius,
      speedY: speed + Math.random() * 1.5,
      speedX: (Math.random() - 0.5) * 1.2,
      hue: Math.random() < 0.6 ? 345 : 25, // Red or fiery amber
      isBig: isBig
    });
  }

  spawnStar() {
    this.stars.push({
      x: 30 + Math.random() * (this.logicalWidth - 60),
      y: -20,
      radius: 12,
      speedY: 2.2 + Math.random() * 1.2,
      angle: 0
    });
  }

  createExplosion(x, y, hue = 350) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        hue: hue,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.5,
      alpha: 1.0,
      color: color
    });
  }

  update() {
    if (!this.isRunning) return;

    // Difficulty scaling over time
    this.survivalTimer++;
    this.difficultyFactor = 1 + (this.survivalTimer / 500);

    // Passive score for surviving
    if (this.survivalTimer % 12 === 0) {
      this.score += 1;
      this.onScoreUpdate(this.score);
    }

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Reset combo if too much time passed since last star
    if (Date.now() - this.lastStarTime > 4000) {
      this.combo = 1;
    }

    // Player Movement - Keyboard input
    if (this.keys.left) {
      this.player.targetX -= this.player.speed;
    }
    if (this.keys.right) {
      this.player.targetX += this.player.speed;
    }

    // Clamp targetX to canvas boundaries
    const halfW = this.player.width / 2;
    this.player.targetX = Math.max(halfW + 4, Math.min(this.logicalWidth - halfW - 4, this.player.targetX));

    // Smooth lerp to target
    this.player.x += (this.player.targetX - this.player.x) * 0.35;

    // Engine exhaust particles
    if (Math.random() < 0.6) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 10,
        y: this.player.y + 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2 + Math.random() * 2,
        size: 2 + Math.random() * 2,
        hue: 185, // Cyan exhaust
        alpha: 0.8,
        decay: 0.05
      });
    }

    // Spawning Hazards
    this.hazardSpawnCooldown--;
    if (this.hazardSpawnCooldown <= 0) {
      this.spawnHazard();
      // Ramp up spawn rate (down to ~20 frames at high difficulty)
      this.hazardSpawnCooldown = Math.max(18, Math.floor(45 / Math.sqrt(this.difficultyFactor)));
    }

    // Spawning Stars
    this.starSpawnCooldown--;
    if (this.starSpawnCooldown <= 0) {
      this.spawnStar();
      this.starSpawnCooldown = 120 + Math.floor(Math.random() * 90);
    }

    // Update Hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.y += h.speedY;
      h.x += h.speedX;

      // Bounce slightly if hitting walls
      if (h.x - h.radius < 0 || h.x + h.radius > this.logicalWidth) {
        h.speedX *= -1;
      }

      // Trail particle
      if (Math.random() < 0.4) {
        this.particles.push({
          x: h.x,
          y: h.y - h.radius * 0.5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -1,
          size: h.radius * 0.4,
          hue: h.hue,
          alpha: 0.6,
          decay: 0.06
        });
      }

      // Check collision with player
      const dx = h.x - this.player.x;
      const dy = h.y - this.player.y;
      const distance = Math.hypot(dx, dy);

      if (distance < h.radius + 14) {
        // Impact! Game Over
        this.createExplosion(this.player.x, this.player.y, 350);
        this.shakeIntensity = 12;
        ArcadeAudio.sfx.explosion();
        this.gameOver();
        return;
      }

      // Remove off-screen
      if (h.y - h.radius > this.logicalHeight + 20) {
        this.hazards.splice(i, 1);
      }
    }

    // Update Stars
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      s.y += s.speedY;
      s.angle += 0.05;

      // Slight magnetic pull toward player if within 70px
      const dx = this.player.x - s.x;
      const dy = this.player.y - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 80) {
        s.x += (dx / dist) * 3;
        s.y += (dy / dist) * 3;
      }

      // Check Collection
      if (dist < s.radius + 18) {
        const points = 50 * this.combo;
        this.score += points;
        this.onScoreUpdate(this.score);
        this.lastStarTime = Date.now();

        ArcadeAudio.sfx.star(this.combo);
        this.createFloatingText(`+${points}${this.combo > 1 ? ' (x' + this.combo + ')' : ''}`, s.x, s.y);
        this.createExplosion(s.x, s.y, 50); // Gold sparkle
        this.shakeIntensity = 3;

        this.combo = Math.min(8, this.combo + 1);
        this.stars.splice(i, 1);
        continue;
      }

      // Remove off-screen
      if (s.y - s.radius > this.logicalHeight + 20) {
        this.stars.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    ctx.save();

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const oy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(ox, oy);
    }

    // Grid Floor
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.player.y + 18);
    ctx.lineTo(this.logicalWidth, this.player.y + 18);
    ctx.stroke();

    // Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw Hazards (Meteors / Acid drops)
    for (const h of this.hazards) {
      ctx.save();
      ctx.fillStyle = `hsl(${h.hue}, 95%, 50%)`;
      ctx.shadowColor = `hsl(${h.hue}, 100%, 60%)`;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner molten core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Stars
    for (const s of this.stars) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 14;

      // 4-point star shape
      ctx.beginPath();
      const rOuter = s.radius;
      const rInner = s.radius * 0.4;
      for (let j = 0; j < 8; j++) {
        const r = j % 2 === 0 ? rOuter : rInner;
        const a = (j * Math.PI) / 4;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Draw Player Ship (Neon triangular hovercraft)
    if (this.isRunning) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Ship body
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(0, -this.player.height / 2);
      ctx.lineTo(this.player.width / 2, this.player.height / 2);
      ctx.lineTo(0, this.player.height / 3);
      ctx.lineTo(-this.player.width / 2, this.player.height / 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Combo indicator HUD in game
    if (this.combo > 1) {
      ctx.save();
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${this.combo}!`, this.logicalWidth / 2, 30);
      ctx.restore();
    }

    ctx.restore();
  }

  gameOver() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.detachEvents();
    this.onGameOver(this.score);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.detachEvents();
  }

  loop() {
    if (!this.isRunning) {
      this.animId = null;
      return;
    }
    this.update();
    this.render();
    if (this.isRunning) {
      this.animId = requestAnimationFrame(this.loop);
    } else {
      this.animId = null;
    }
  }
}
window.RainDodgerGame = RainDodgerGame;
