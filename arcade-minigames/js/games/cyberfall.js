/**
 * Cyber Fall: Neon Plunge (Downward Descent Survival)
 * Guide a plasma core down an endless cyber shaft, slipping through platform gaps to evade the lethal rising laser ceiling!
 */
class CyberFallGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.logicalWidth = 400;
    this.logicalHeight = 600;

    // Game state
    this.isRunning = false;
    this.score = 0;
    this.depth = 0;
    this.lives = 3;
    this.scrollSpeed = 1.5;
    this.baseSpeed = 1.5;

    // Player physics - nimble, snappy lateral controls with natural gravity
    this.player = {
      x: 200,
      y: 180,
      vx: 0,
      vy: 0,
      radius: 9,
      moveSpeed: 1.6,
      friction: 0.88,
      gravity: 0.52,
      maxFallSpeed: 11.0
    };

    // Shield & Powerups
    this.hasShield = false;
    this.shieldTimer = 0;
    this.combo = 1;
    this.freeFallTimer = 0;

    // Laser Ceiling at top
    this.laserCeilingY = 24;

    // Level elements
    this.platforms = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.isDying = false;
    this.invulnerableTimer = 0;

    // Input state
    this.keys = { left: false, right: false };
    this.touchSide = null; // 'left' or 'right'

    // Bound handlers
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
    this.depth = 0;
    this.lives = 3;
    this.survivalSeconds = 0;
    this.scrollSpeed = this.baseSpeed;
    this.combo = 1;
    this.freeFallTimer = 0;
    this.hasShield = false;
    this.shieldTimer = 0;
    this.shakeIntensity = 0;
    this.isDying = false;
    this.invulnerableTimer = 0;

    this.player.x = this.logicalWidth / 2;
    this.player.y = 160;
    this.player.vx = 0;
    this.player.vy = 0;

    this.platforms = [];
    this.gems = [];
    this.particles = [];
    this.floatingTexts = [];

    // Seed initial platforms with comfortable spacing
    const spacing = 95;
    for (let y = 260; y < this.logicalHeight + 120; y += spacing) {
      this.spawnPlatform(y);
    }

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
    if (!this.isRunning) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.keys.right = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    this.touchSide = px < this.logicalWidth / 2 ? 'left' : 'right';
  }

  handlePointerUp() {
    this.touchSide = null;
  }

  spawnPlatform(y) {
    const minGap = 85;
    const maxGap = 120;
    const gapWidth = Math.max(minGap, maxGap - Math.min(25, this.depth * 0.012));
    const gapX = 25 + Math.random() * (this.logicalWidth - 50 - gapWidth);

    // 28% chance for dual gaps on wide spans
    const hasDualGap = Math.random() < 0.28 && (this.logicalWidth - gapWidth * 2 > 80);
    const gaps = [{ x: gapX, w: gapWidth }];

    if (hasDualGap) {
      const secondW = gapWidth * 0.85;
      const secondX = (gapX + gapWidth + 60) % (this.logicalWidth - secondW - 30) + 15;
      gaps.push({ x: secondX, w: secondW });
    }

    this.platforms.push({
      y,
      height: 12,
      gaps,
      color: '#bd00ff',
      passed: false
    });

    // Chance to spawn Data Gem on the platform solid section
    if (Math.random() < 0.28) {
      const gemX = Math.max(25, Math.min(this.logicalWidth - 25, gapX - 35));
      this.gems.push({
        x: gemX,
        y: y - 12,
        type: Math.random() < 0.2 ? 'shield' : 'crystal',
        radius: 8,
        life: 1.0
      });
    }
  }

  update() {
    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Particles and floating text always update even while dying or game over
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    if (!this.isRunning || this.isDying) return;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // Dynamic progressive speed acceleration over time
    this.survivalSeconds += 1 / 60;
    const speedBoost = Math.min(3.8, this.survivalSeconds * 0.055);
    this.scrollSpeed = this.baseSpeed + speedBoost;
    this.depth += Math.round(this.scrollSpeed);
    this.score += Math.round(1 + speedBoost * 0.4);
    this.onScoreUpdate(this.score);

    // Gravity and fall speed also scale with game speed to keep controls crisp
    this.player.gravity = 0.52 + Math.min(0.24, speedBoost * 0.06);
    this.player.maxFallSpeed = 11.0 + Math.min(4.0, speedBoost * 0.9);

    // Update Player Movement - snappy lateral control
    if (this.keys.left || this.touchSide === 'left') {
      this.player.vx -= this.player.moveSpeed;
    }
    if (this.keys.right || this.touchSide === 'right') {
      this.player.vx += this.player.moveSpeed;
    }

    this.player.vx *= this.player.friction;
    this.player.x += this.player.vx;

    // Boundary wrapping or clamping
    if (this.player.x < this.player.radius) {
      this.player.x = this.player.radius;
      this.player.vx = 0;
    } else if (this.player.x > this.logicalWidth - this.player.radius) {
      this.player.x = this.logicalWidth - this.player.radius;
      this.player.vx = 0;
    }

    // Apply gravity
    this.player.vy += this.player.gravity;
    if (this.player.vy > this.player.maxFallSpeed) {
      this.player.vy = this.player.maxFallSpeed;
    }

    let onGround = false;
    let standingPlat = null;

    // Platform collisions & movement
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const plat = this.platforms[i];
      plat.y -= this.scrollSpeed;

      // Check collision if falling downwards onto platform
      const prevY = this.player.y;
      const nextY = this.player.y + this.player.vy;

      if (!this.isDying && this.player.vy >= 0) {
        // Is player landing on top of platform?
        if (prevY + this.player.radius <= plat.y + 6 && nextY + this.player.radius >= plat.y) {
          // Check if inside ANY gap (with 8px forgiving edge buffer)
          let inAnyGap = false;
          for (const g of plat.gaps) {
            if (this.player.x >= g.x - 8 && this.player.x <= g.x + g.w + 8) {
              inAnyGap = true;
              break;
            }
          }

          if (!inAnyGap) {
            onGround = true;
            standingPlat = plat;
            this.player.y = plat.y - this.player.radius;
            // CRUCIAL: downward momentum ready to plunge through next gap without floating stutter!
            this.player.vy = 1.0;
            this.combo = 1;
            this.freeFallTimer = 0;
          }
        }
      }

      // Check if safely dropped through gap
      if (!plat.passed && this.player.y > plat.y + plat.height) {
        plat.passed = true;
        this.freeFallTimer++;
        if (this.freeFallTimer > 1) {
          this.combo = Math.min(8, this.combo + 1);
          const bonus = 100 * this.combo;
          this.score += bonus;
          this.onScoreUpdate(this.score);
          this.addFloatingText(`DROP x${this.combo}! +${bonus}`, this.player.x, this.player.y - 12, '#00ff88');

          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.fallGap();
          }
        }
      }

      // Recycle platform when off top
      if (plat.y < -30) {
        this.platforms.splice(i, 1);
      }
    }

    if (!onGround) {
      // Natural free-fall descent
      this.player.y += this.player.vy;
    } else if (standingPlat) {
      // Platform ride
      this.player.y = standingPlat.y - this.player.radius;
    }

    // Ensure platforms keep spawning below
    const lowestPlat = this.platforms.reduce((max, p) => Math.max(max, p.y), 0);
    if (lowestPlat < this.logicalHeight + 60) {
      this.spawnPlatform(lowestPlat + 95);
    }

    // Check Lethal Laser Ceiling
    if (!this.isDying && this.invulnerableTimer <= 0 && this.player.y - this.player.radius <= this.laserCeilingY) {
      if (this.hasShield) {
        this.hasShield = false;
        this.invulnerableTimer = 90; // 1.5s invulnerability
        this.shakeIntensity = 16;

        // Blast the ball far down the screen for a true second chance!
        const targetY = Math.min(this.logicalHeight - 120, this.player.y + 240);
        this.player.y = targetY;
        this.player.vy = 8.0;

        // Vaporize any platforms in the immediate blast path so the player doesn't instantly hit one
        this.platforms = this.platforms.filter(plat => plat.y > targetY + 30 || plat.y < this.laserCeilingY + 15);

        // Radial EMP shockwave particles
        for (let k = 0; k < 36; k++) {
          const ang = (k / 36) * Math.PI * 2;
          const spd = Math.random() * 6 + 4;
          this.particles.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 1.0,
            decay: 0.035,
            color: '#00f3ff',
            size: Math.random() * 3.5 + 2
          });
        }

        this.addFloatingText('🛡️ SHIELD ESCAPE BURST!', this.player.x, this.player.y - 20, '#00f3ff');

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.nitroBoost();
          ArcadeAudio.sfx.laserBuzz();
        }
      } else {
        // Lethal laser impact!
        this.handleDeath();
        return;
      }
    }

    // Check Bottom Screen Fall Void (if dropped past bottom)
    if (this.player.y > this.logicalHeight + 20) {
      this.player.y = this.logicalHeight - 30;
      this.player.vy = -4;
    }

    // Update Gems & Pickups
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.y -= this.scrollSpeed;

      const dx = this.player.x - g.x;
      const dy = this.player.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.player.radius + g.radius) {
        if (g.type === 'shield') {
          this.hasShield = true;
          this.score += 300;
          this.addFloatingText('SHIELD OVERCHARGE!', g.x, g.y, '#00f3ff');
        } else {
          this.score += 500;
          this.addFloatingText('+500 DATA GEM', g.x, g.y, '#ffd200');
        }
        this.onScoreUpdate(this.score);

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.gemCollect();
        }

        this.gems.splice(i, 1);
        continue;
      }

      if (g.y < -30) {
        this.gems.splice(i, 1);
      }
    }
  }

  handleDeath() {
    if (this.isDying) return;
    this.isDying = true;
    this.lives--;
    this.shakeIntensity = 18;
    this.combo = 1;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.laserBuzz();
      ArcadeAudio.sfx.explosion();
    }

    // Plasma disintegration
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.04,
        color: Math.random() < 0.5 ? '#ff0055' : '#00f3ff',
        size: Math.random() * 4 + 2
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    } else {
      setTimeout(() => {
        this.isDying = false;
        this.player.x = this.logicalWidth / 2;
        this.player.y = 180;
        this.player.vx = 0;
        this.player.vy = 2;
        this.invulnerableTimer = 60; // 1s flashing protection
        // Clear any platform directly intersecting respawn zone
        this.platforms = this.platforms.filter(plat => Math.abs(plat.y - 180) > 35);
      }, 600);
    }
  }

  addFloatingText(text, x, y, color = '#00ff88') {
    this.floatingTexts.push({ text, x, y, vy: -1.0, alpha: 1.0, color });
  }

  draw() {
    this.ctx.save();

    // Camera Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // 1. Background Grid & Shaft Abyss
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#100018');
    bgGrad.addColorStop(1, '#02000a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Subtle vertical speed lines
    this.ctx.strokeStyle = 'rgba(189, 0, 255, 0.08)';
    this.ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // 2. Draw Platforms with Gaps
    this.platforms.forEach(plat => {
      this.ctx.save();
      this.ctx.fillStyle = plat.color;
      this.ctx.shadowColor = plat.color;
      this.ctx.shadowBlur = 8;

      const sortedGaps = [...plat.gaps].sort((a, b) => a.x - b.x);
      let curX = 0;

      sortedGaps.forEach(g => {
        if (g.x > curX) {
          this.ctx.fillRect(curX, plat.y, g.x - curX, plat.height);
        }
        // Gap indicator
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.arc(g.x + g.w / 2, plat.y + plat.height / 2, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = plat.color;

        curX = g.x + g.w;
      });

      if (curX < w) {
        this.ctx.fillRect(curX, plat.y, w - curX, plat.height);
      }

      this.ctx.restore();
    });

    // 3. Draw Gems
    this.gems.forEach(g => {
      this.ctx.save();
      this.ctx.translate(g.x, g.y);
      if (g.type === 'shield') {
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = '#ffd200';
        this.ctx.shadowColor = '#ffd200';
        this.ctx.shadowBlur = 10;
        // Diamond
        this.ctx.beginPath();
        this.ctx.moveTo(0, -g.radius);
        this.ctx.lineTo(g.radius, 0);
        this.ctx.lineTo(0, g.radius);
        this.ctx.lineTo(-g.radius, 0);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // 4. Draw Player Plasma Core
    if (this.lives > 0 && !this.isDying) {
      const isFlashing = this.invulnerableTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0;
      if (!isFlashing) {
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);

        // Trail / glow
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 14;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Core center
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        this.ctx.fill();

        // Shield Bubble
        if (this.hasShield) {
          this.ctx.strokeStyle = '#00f3ff';
          this.ctx.lineWidth = 2;
          this.ctx.shadowBlur = 12;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          this.ctx.stroke();
        }

        this.ctx.restore();
      }
    }

    // 5. Draw Menacing Laser Ceiling at Top
    this.drawLaserCeiling();

    // 6. Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 7. Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 11px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 8. HUD & Touch Hints
    this.drawHUD();

    this.ctx.restore();
  }

  drawLaserCeiling() {
    const w = this.logicalWidth;
    const ly = this.laserCeilingY;

    this.ctx.save();
    // Hazard emitter block
    this.ctx.fillStyle = '#1c0512';
    this.ctx.fillRect(0, 0, w, ly - 4);

    // Hazard stripes
    this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.35)';
    this.ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 16) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x + 10, ly - 4);
      this.ctx.stroke();
    }

    // Glowing Laser Beam
    this.ctx.strokeStyle = '#ff0055';
    this.ctx.shadowColor = '#ff0055';
    this.ctx.shadowBlur = 14;
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, ly);
    this.ctx.lineTo(w, ly);
    this.ctx.stroke();

    // Electric sparks along beam
    if (Math.random() < 0.4) {
      const sx = Math.random() * w;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(sx, ly);
      this.ctx.lineTo(sx + (Math.random() - 0.5) * 12, ly + 6);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawHUD() {
    const w = this.logicalWidth;

    this.ctx.save();
    this.ctx.font = '9px "Press Start 2P", monospace';

    // Lives
    this.ctx.fillStyle = '#8292ab';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LIVES:', 14, 18);
    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(74 + i * 16, 15, 4.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Depth & Speed meter
    this.ctx.textAlign = 'right';
    const speedRatio = (this.scrollSpeed / this.baseSpeed).toFixed(1);
    const speedColor = speedRatio > 2.0 ? '#ff00aa' : (speedRatio > 1.4 ? '#ffd200' : '#00f3ff');
    this.ctx.fillStyle = speedColor;
    this.ctx.fillText(`${speedRatio}X • ${Math.floor(this.depth / 10)}M`, w - 14, 18);

    // Combo indicator
    if (this.combo > 1) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText(`FREE-FALL x${this.combo}!`, w / 2, 54);
    }

    // Touch steer hint at bottom
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('◀ TAP SCREEN SIDES TO GLIDE ▶', w / 2, this.logicalHeight - 14);

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
