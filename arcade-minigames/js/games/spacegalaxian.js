/**
 * Space Galaxian - Retro Arcade Squadron Dive-Bombing Shooter.
 * Features swaying alien armadas, dynamic curving dive-bombers,
 * destructible energy bunkers, twin blasters, power-up drops, and high-DPI touch support.
 */
class SpaceGalaxianGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;

    // Viewport dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // Player Starfighter
    this.player = {
      x: 180,
      y: 490,
      width: 28,
      height: 22,
      speed: 4.8,
      targetX: 180,
      invulnerableTimer: 0,
      fireCooldown: 0,
      tripleShotTimer: 0
    };

    // Projectiles & Entities
    this.playerLasers = [];
    this.alienLasers = [];
    this.aliens = [];
    this.bunkers = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stars = [];

    // Armada formation state
    this.formationX = 0;
    this.formationDir = 1;
    this.formationSpeed = 0.8;
    this.diveTimer = 0;
    this.shakeIntensity = 0;

    // Input state
    this.keys = { left: false, right: false, fire: false };
    this.isPointerDown = false;
    this.pointerX = 180;

    // Bound listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.shakeIntensity = 0;

    this.player.x = this.logicalWidth / 2;
    this.player.targetX = this.player.x;
    this.player.invulnerableTimer = 60;
    this.player.fireCooldown = 0;
    this.player.tripleShotTimer = 0;

    this.playerLasers = [];
    this.alienLasers = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];

    this.initStars();
    this.initBunkers();
    this.initArmada();

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

    this.player.y = this.logicalHeight - 52;
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        size: Math.random() * 1.8 + 0.6,
        speed: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  initBunkers() {
    this.bunkers = [];
    const count = 3;
    const bunkerW = 44;
    const bunkerH = 20;
    const spacing = (this.logicalWidth - bunkerW * count) / (count + 1);

    for (let b = 0; b < count; b++) {
      const bx = spacing + b * (bunkerW + spacing);
      const by = this.logicalHeight - 96;

      // 4x3 cluster of miniature shield blocks
      const blocks = [];
      const cols = 5;
      const rows = 3;
      const bw = bunkerW / cols;
      const bh = bunkerH / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Notch in the middle of bottom row
          if (r === rows - 1 && (c === 1 || c === 2 || c === 3)) continue;
          blocks.push({
            x: bx + c * bw,
            y: by + r * bh,
            w: bw - 1,
            h: bh - 1,
            hp: 2
          });
        }
      }
      this.bunkers.push(blocks);
    }
  }

  initArmada() {
    this.aliens = [];
    this.formationX = 0;
    this.formationDir = 1;
    this.formationSpeed = 0.7 + Math.min(this.wave * 0.15, 1.4);

    const cols = 8;
    const rows = 4;
    const startY = 46;
    const colSpacing = Math.min(36, (this.logicalWidth - 60) / cols);
    const startX = (this.logicalWidth - (cols - 1) * colSpacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = 'drone';
        let basePoints = 30;
        let color = '#00f3ff';

        if (r === 0) {
          type = 'commander';
          basePoints = 150;
          color = '#ffd200';
        } else if (r === 1) {
          type = 'escort';
          basePoints = 80;
          color = '#ff0077';
        }

        this.aliens.push({
          type,
          basePoints,
          color,
          origCol: c,
          origRow: r,
          origX: startX + c * colSpacing,
          origY: startY + r * 26,
          x: startX + c * colSpacing,
          y: startY + r * 26,
          width: 22,
          height: 18,
          isDiving: false,
          diveTime: 0,
          diveAngle: 0,
          diveSpeed: 2.8 + Math.min(this.wave * 0.3, 2.5),
          diveSway: Math.random() * 40 + 30,
          alive: true
        });
      }
    }
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.keys.fire = true;
      this.firePlayerLaser();
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.keys.fire = false;
    }
  }

  handlePointerDown(e) {
    this.isPointerDown = true;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.player.targetX = this.pointerX;
    this.firePlayerLaser();
  }

  handlePointerMove(e) {
    if (!this.isPointerDown) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.player.targetX = this.pointerX;
  }

  handlePointerUp() {
    this.isPointerDown = false;
  }

  firePlayerLaser() {
    if (!this.isRunning || this.player.fireCooldown > 0) return;

    this.player.fireCooldown = 14;

    if (this.player.tripleShotTimer > 0) {
      // Triple Cannon
      this.playerLasers.push({ x: this.player.x, y: this.player.y - 12, vx: 0, vy: -7.5 });
      this.playerLasers.push({ x: this.player.x - 10, y: this.player.y - 8, vx: -1.2, vy: -7.2 });
      this.playerLasers.push({ x: this.player.x + 10, y: this.player.y - 8, vx: 1.2, vy: -7.2 });
    } else {
      // Twin Blasters
      this.playerLasers.push({ x: this.player.x - 7, y: this.player.y - 10, vx: 0, vy: -7.5 });
      this.playerLasers.push({ x: this.player.x + 7, y: this.player.y - 10, vx: 0, vy: -7.5 });
    }

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.blaster();
    }
  }

  spawnDiveBomber() {
    const formationAliens = this.aliens.filter(a => a.alive && !a.isDiving);
    if (formationAliens.length === 0) return;

    // Prioritize commanders or escorts
    const commanders = formationAliens.filter(a => a.type === 'commander');
    let chosen = null;

    if (commanders.length > 0 && Math.random() < 0.4) {
      chosen = commanders[Math.floor(Math.random() * commanders.length)];
      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.diveBomb();
      }
    } else {
      chosen = formationAliens[Math.floor(Math.random() * formationAliens.length)];
    }

    chosen.isDiving = true;
    chosen.diveTime = 0;
  }

  update() {
    if (!this.isRunning) return;

    // Player Movement
    if (this.keys.left) this.player.x -= this.player.speed;
    if (this.keys.right) this.player.x += this.player.speed;

    if (this.isPointerDown) {
      this.player.x += (this.player.targetX - this.player.x) * 0.28;
    }

    // Boundaries
    const halfW = this.player.width / 2;
    this.player.x = Math.max(halfW + 8, Math.min(this.logicalWidth - halfW - 8, this.player.x));

    // Timers
    if (this.player.fireCooldown > 0) this.player.fireCooldown--;
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
    if (this.player.tripleShotTimer > 0) this.player.tripleShotTimer--;

    // Auto-fire while holding space or touch
    if (this.keys.fire && this.player.fireCooldown <= 0) {
      this.firePlayerLaser();
    }

    // Scroll Starfield
    this.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > this.logicalHeight) {
        s.y = 0;
        s.x = Math.random() * this.logicalWidth;
      }
    });

    // Formation Sway
    this.formationX += this.formationSpeed * this.formationDir;
    if (Math.abs(this.formationX) > 28) {
      this.formationDir *= -1;
    }

    // Dive-bombing timer
    this.diveTimer++;
    if (this.diveTimer > Math.max(45, 110 - this.wave * 12)) {
      this.diveTimer = 0;
      this.spawnDiveBomber();
    }

    // Update Aliens
    this.aliens.forEach(a => {
      if (!a.alive) return;

      if (!a.isDiving) {
        // Move with formation
        a.x = a.origX + this.formationX;
        a.y = a.origY;
      } else {
        // Diving trajectory (swooping curve toward player)
        a.diveTime += 0.04;
        a.y += a.diveSpeed;
        a.x += Math.sin(a.diveTime * 3) * 3.5;

        // Occasional alien shot
        if (Math.random() < 0.035 && a.y < this.logicalHeight - 120) {
          this.alienLasers.push({
            x: a.x,
            y: a.y + 10,
            vy: 4.2
          });
          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.alienShoot();
          }
        }

        // Looped around screen bottom?
        if (a.y > this.logicalHeight + 20) {
          a.y = -20;
          a.isDiving = false;
        }

        // Collision with player
        if (this.player.invulnerableTimer <= 0) {
          const dist = Math.hypot(a.x - this.player.x, a.y - this.player.y);
          if (dist < 20) {
            a.alive = false;
            this.handlePlayerHit();
            return;
          }
        }
      }
    });

    // Update Player Lasers
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const l = this.playerLasers[i];
      l.x += l.vx;
      l.y += l.vy;

      // Hit test vs Bunkers
      let hitBunker = false;
      this.bunkers.forEach(bCluster => {
        bCluster.forEach(block => {
          if (block.hp > 0 && l.x > block.x && l.x < block.x + block.w &&
              l.y > block.y && l.y < block.y + block.h) {
            block.hp--;
            hitBunker = true;
          }
        });
      });
      if (hitBunker) {
        this.playerLasers.splice(i, 1);
        continue;
      }

      // Hit test vs Aliens
      let hitAlien = false;
      for (let k = 0; k < this.aliens.length; k++) {
        const a = this.aliens[k];
        if (!a.alive) continue;

        if (Math.abs(l.x - a.x) < a.width / 2 + 4 && Math.abs(l.y - a.y) < a.height / 2 + 4) {
          a.alive = false;
          hitAlien = true;

          // Points calculation
          let pts = a.basePoints;
          if (a.isDiving) {
            pts *= 2; // Double points during dive!
            if (a.type === 'commander') pts = 800;
          }
          this.score += pts;
          this.onScoreUpdate(this.score);

          this.addFloatingText(`+${pts}`, a.x, a.y - 12, a.color);
          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.rockHit(a.type === 'commander' ? 3 : 1);
          }

          // Sparks
          for (let p = 0; p < 14; p++) {
            this.particles.push({
              x: a.x,
              y: a.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 1.0,
              decay: 0.05,
              size: Math.random() * 3 + 1.5,
              color: a.color
            });
          }

          // Chance to drop power-up from diving commander/escort
          if (a.isDiving && Math.random() < 0.4) {
            this.powerups.push({
              x: a.x,
              y: a.y,
              type: 'triple',
              vy: 2.0
            });
          }
          break;
        }
      }

      if (hitAlien) {
        this.playerLasers.splice(i, 1);
        continue;
      }

      if (l.y < -10) {
        this.playerLasers.splice(i, 1);
      }
    }

    // Update Alien Lasers
    for (let i = this.alienLasers.length - 1; i >= 0; i--) {
      const al = this.alienLasers[i];
      al.y += al.vy;

      // Hit test vs Bunkers
      let hitBunker = false;
      this.bunkers.forEach(bCluster => {
        bCluster.forEach(block => {
          if (block.hp > 0 && al.x > block.x && al.x < block.x + block.w &&
              al.y > block.y && al.y < block.y + block.h) {
            block.hp--;
            hitBunker = true;
          }
        });
      });
      if (hitBunker) {
        this.alienLasers.splice(i, 1);
        continue;
      }

      // Hit test vs Player
      if (this.player.invulnerableTimer <= 0) {
        if (Math.abs(al.x - this.player.x) < 14 && Math.abs(al.y - this.player.y) < 14) {
          this.alienLasers.splice(i, 1);
          this.handlePlayerHit();
          return;
        }
      }

      if (al.y > this.logicalHeight + 10) {
        this.alienLasers.splice(i, 1);
      }
    }

    // Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy;

      // Collect
      if (Math.hypot(pu.x - this.player.x, pu.y - this.player.y) < 22) {
        this.player.tripleShotTimer = 420; // 7 seconds
        this.score += 250;
        this.onScoreUpdate(this.score);
        this.addFloatingText('TRIPLE CANNONS! +250', pu.x, pu.y - 15, '#00ff88');

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.star(4);
        }
        this.powerups.splice(i, 1);
        continue;
      }

      if (pu.y > this.logicalHeight + 10) {
        this.powerups.splice(i, 1);
      }
    }

    // Check Wave Cleared
    const remainingAliens = this.aliens.filter(a => a.alive).length;
    if (remainingAliens === 0) {
      this.wave++;
      this.score += 1500;
      this.onScoreUpdate(this.score);
      this.addFloatingText(`WAVE ${this.wave - 1} CLEARED! +1500`, this.logicalWidth / 2, this.logicalHeight / 2, '#00ff88');

      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.newRecord();
      }

      this.initBunkers();
      this.initArmada();
    }

    // Particles & FX
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

    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }
  }

  handlePlayerHit() {
    this.lives--;
    this.shakeIntensity = 16;
    this.player.invulnerableTimer = 90; // 1.5s invulnerability flash

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.explosion();
    }

    // Explosion
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.03,
        size: 3,
        color: '#ff0077'
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    }
  }

  addFloatingText(text, x, y, color = '#ffd200') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.0,
      alpha: 1.0,
      color
    });
  }

  draw() {
    this.ctx.save();

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    // Space Backdrop
    this.ctx.fillStyle = '#050711';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Stars
    this.stars.forEach(s => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw Bunkers
    this.bunkers.forEach(bCluster => {
      bCluster.forEach(block => {
        if (block.hp > 0) {
          this.ctx.fillStyle = block.hp === 2 ? '#00f3ff' : 'rgba(0, 243, 255, 0.45)';
          this.ctx.fillRect(block.x, block.y, block.w, block.h);
        }
      });
    });

    // Draw Aliens
    this.aliens.forEach(a => {
      if (!a.alive) return;

      this.ctx.save();
      this.ctx.translate(a.x, a.y);

      // Pitch angle when diving
      if (a.isDiving) {
        this.ctx.rotate(Math.sin(a.diveTime * 3) * 0.4);
      }

      this.ctx.shadowColor = a.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = a.color;

      if (a.type === 'commander') {
        // Flagship Beetle Crown
        this.ctx.beginPath();
        this.ctx.moveTo(0, -9);
        this.ctx.lineTo(10, 6);
        this.ctx.lineTo(4, 9);
        this.ctx.lineTo(0, 5);
        this.ctx.lineTo(-4, 9);
        this.ctx.lineTo(-10, 6);
        this.ctx.closePath();
        this.ctx.fill();

        // Inner jewel
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (a.type === 'escort') {
        // Red Wing Escort
        this.ctx.beginPath();
        this.ctx.moveTo(0, -7);
        this.ctx.lineTo(9, 4);
        this.ctx.lineTo(0, 7);
        this.ctx.lineTo(-9, 4);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Drone Beetle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(-9, -2, 18, 4);
      }

      this.ctx.restore();
    });

    // Draw Player Lasers
    this.playerLasers.forEach(l => {
      this.ctx.save();
      this.ctx.shadowColor = '#00ff88';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillRect(l.x - 1.5, l.y, 3, 10);
      this.ctx.restore();
    });

    // Draw Alien Lasers
    this.alienLasers.forEach(al => {
      this.ctx.save();
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = '#ff0055';
      this.ctx.fillRect(al.x - 1.5, al.y, 3, 8);
      this.ctx.restore();
    });

    // Draw Power-ups
    this.powerups.forEach(pu => {
      this.ctx.save();
      this.ctx.shadowColor = '#ffd200';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#ffd200';
      this.ctx.beginPath();
      this.ctx.arc(pu.x, pu.y, 7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0a0d14';
      this.ctx.font = 'bold 8px "Chakra Petch", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚡', pu.x, pu.y);
      this.ctx.restore();
    });

    // Draw Player Starfighter
    if (this.lives > 0) {
      const isFlashing = this.player.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0;

      if (!isFlashing) {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#0a192f';
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 2;

        // Fighter Chassis
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12); // Nose
        this.ctx.lineTo(12, 10); // Right wing
        this.ctx.lineTo(6, 6);
        this.ctx.lineTo(0, 9); // Center engine
        this.ctx.lineTo(-6, 6);
        this.ctx.lineTo(-12, 10); // Left wing
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Cockpit
        this.ctx.fillStyle = '#ff0077';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Engine glow
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(-2, 9, 4, 3 + Math.random() * 3);

        this.ctx.restore();
      }
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

    // Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 11px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // Top Stats Bar
    this.ctx.fillStyle = '#8292ab';
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`LIVES: ${'🚀'.repeat(Math.max(0, this.lives))}`, 16, 20);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#ffd200';
    this.ctx.fillText(`WAVE: ${this.wave}`, this.logicalWidth - 16, 20);

    this.ctx.restore();
  }

  loop() {
    if (!this.isRunning && this.particles.length === 0 && this.shakeIntensity <= 0) return;

    this.update();
    this.draw();

    if (this.isRunning || this.particles.length > 0) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }
}
