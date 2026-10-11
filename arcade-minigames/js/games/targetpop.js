/**
 * Target Pop - High-speed reflex target popping arcade minigame.
 * Tap shrinking targets before they vanish. Chain combos, pop golden bonus orbs, and dodge red skull hazards!
 */
class TargetPopGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.combo = 1;
    this.lives = 3;
    this.maxLives = 3;

    // Target management
    this.targets = [];
    this.spawnTimer = 0;
    this.nextTargetId = 1;

    // Visuals & Particles
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.animId = null;

    // Bound handlers
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear any previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.combo = 1;
    this.lives = 3;
    this.spawnTimer = 20;
    this.shakeIntensity = 0;

    this.targets = [];
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    // Spawn first target immediately
    this.spawnTarget();

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
  }

  attachEvents() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  detachEvents() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Find clicked target (iterate reverse so top target is hit first)
    // Add +14px touch cushioning for effortless mobile tapping
    const touchPadding = 14;
    let hitIndex = -1;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(px - t.x, py - t.y);
      if (dist <= t.currentRadius + touchPadding) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      // Hit a target!
      const target = this.targets.splice(hitIndex, 1)[0];
      this.handleTargetHit(target);
    } else {
      // Missed (tapped empty space): reset combo
      if (this.combo > 1) {
        this.combo = 1;
        this.createFloatingText('COMBO LOST', px, py, '#8292ab');
      }
    }
  }

  handleTargetHit(target) {
    if (target.type === 'hazard') {
      // Tapped a Skull Hazard! Lose a life
      this.lives--;
      this.combo = 1;
      this.shakeIntensity = 10;
      ArcadeAudio.sfx.buzz();
      this.createShockwave(target.x, target.y, '#ff0055');
      this.createExplosion(target.x, target.y, 350, 20);
      this.createFloatingText('-1 LIFE! 💀', target.x, target.y - 10, '#ff0055');

      if (this.lives <= 0) {
        this.triggerDeath();
      }
      return;
    }

    if (target.type === 'bonus') {
      // Tapped Golden Bonus!
      const bonusPts = 500;
      this.score += bonusPts;
      this.onScoreUpdate(this.score);

      // Restore 1 life if below max
      if (this.lives < this.maxLives) {
        this.lives++;
        this.createFloatingText('+1 LIFE! ❤️', target.x, target.y - 25, '#ff0077');
      }

      this.createFloatingText(`+${bonusPts}`, target.x, target.y, '#ffd700');
      this.createShockwave(target.x, target.y, '#ffd700');
      this.createExplosion(target.x, target.y, 45, 24);
      this.shakeIntensity = 3;
      ArcadeAudio.sfx.star(this.combo);
      return;
    }

    // Standard Target Pop
    const isSmallPerfect = target.currentRadius < target.maxRadius * 0.45;
    const basePts = isSmallPerfect ? 200 : 100;
    const points = basePts * this.combo;

    this.score += points;
    this.onScoreUpdate(this.score);

    this.createShockwave(target.x, target.y, target.color);
    this.createExplosion(target.x, target.y, target.hue, 18);
    ArcadeAudio.sfx.pop(this.combo);

    if (isSmallPerfect) {
      this.shakeIntensity = 4;
      this.createFloatingText(`PERFECT! +${points}`, target.x, target.y, '#00ff88');
    } else {
      this.shakeIntensity = 2;
      this.createFloatingText(`+${points}${this.combo > 1 ? ' (x' + this.combo + ')' : ''}`, target.x, target.y, target.color);
    }

    // Advance combo
    this.combo = Math.min(10, this.combo + 1);
  }

  spawnTarget() {
    const margin = 55;
    const x = margin + Math.random() * (this.logicalWidth - margin * 2);
    const y = 80 + Math.random() * (this.logicalHeight - 140);

    // Lifespan scales down gently as score climbs (starts at 135 frames ~ 2.25s)
    const baseLifespan = Math.max(75, 135 - Math.floor(this.score / 200));

    // Determine target type
    const rand = Math.random();
    let type = 'standard';
    let color = '#00f3ff';
    let hue = 190;
    let maxRadius = 36;

    if (this.score > 300 && rand < 0.12) {
      // Golden Bonus Orb
      type = 'bonus';
      color = '#ffd700';
      hue = 45;
      maxRadius = 32;
    } else if (this.score > 500 && rand < 0.22) {
      // Red Skull Hazard (Do not click!)
      type = 'hazard';
      color = '#ff0055';
      hue = 345;
      maxRadius = 32;
    } else {
      // Standard target
      const isAltColor = Math.random() < 0.45;
      color = isAltColor ? '#ff0077' : '#00f3ff';
      hue = isAltColor ? 330 : 190;
    }

    this.targets.push({
      id: this.nextTargetId++,
      x: x,
      y: y,
      type: type,
      color: color,
      hue: hue,
      maxRadius: maxRadius,
      currentRadius: maxRadius,
      lifespan: baseLifespan,
      maxLifespan: baseLifespan,
      pulse: 0
    });
  }

  createShockwave(x, y, color) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: 55,
      alpha: 0.9,
      color: color
    });
  }

  createExplosion(x, y, hue, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        hue: hue,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.3,
      alpha: 1,
      color: color
    });
  }

  triggerDeath() {
    this.isRunning = false;
    this.shakeIntensity = 14;
    ArcadeAudio.sfx.explosion();
    this.detachEvents();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.onGameOver(this.score);
  }

  update() {
    if (!this.isRunning) return;

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.86;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Target Spawning schedule
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      // Max concurrent targets scales with score (1 up to 4)
      const maxConcurrent = Math.min(4, 1 + Math.floor(this.score / 600));
      if (this.targets.length < maxConcurrent) {
        this.spawnTarget();
      }
      this.spawnTimer = Math.max(30, 60 - Math.floor(this.score / 400));
    }

    // Update Targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.lifespan--;
      t.pulse += 0.08;

      // Shrink radius as lifespan expires
      const lifeRatio = Math.max(0.1, t.lifespan / t.maxLifespan);
      t.currentRadius = t.maxRadius * lifeRatio;

      // Target Expired!
      if (t.lifespan <= 0) {
        this.targets.splice(i, 1);

        if (t.type === 'standard') {
          // Standard target missed! Lose 1 life
          this.lives--;
          this.combo = 1;
          this.shakeIntensity = 8;
          ArcadeAudio.sfx.buzz();
          this.createExplosion(t.x, t.y, 350, 12);
          this.createFloatingText('MISSED! -1 ❤️', t.x, t.y, '#ff0055');

          if (this.lives <= 0) {
            this.triggerDeath();
            return;
          }
        } else if (t.type === 'hazard') {
          // Skull Hazard expired without being clicked: Player successfully dodged it!
          this.score += 50;
          this.onScoreUpdate(this.score);
          this.createFloatingText('DODGED! +50', t.x, t.y, '#00ff88');
        }
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 3.5;
      sw.alpha -= 0.045;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
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

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.03;
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

    // 1. Draw Top HUD (Hearts / Lives & Combo)
    ctx.save();
    // Hearts
    let heartsText = '';
    for (let i = 0; i < this.maxLives; i++) {
      heartsText += i < this.lives ? '❤️ ' : '🖤 ';
    }
    ctx.font = '14px sans-serif';
    ctx.fillText(heartsText.trim(), 20, 32);

    // Combo indicator
    if (this.combo > 1) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'right';
      ctx.fillText(`COMBO x${this.combo}!`, this.logicalWidth - 20, 30);
    }
    ctx.restore();

    // 2. Draw Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Targets
    for (const t of this.targets) {
      ctx.save();
      const r = Math.max(6, t.currentRadius);

      if (t.type === 'bonus') {
        // Golden Bonus Target
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 14;

        // Outer pulsing ring
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Star core
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', t.x, t.y);

      } else if (t.type === 'hazard') {
        // Skull Hazard Target (Do NOT click!)
        ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
        ctx.strokeStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', t.x, t.y);

      } else {
        // Standard Target (Bullseye)
        // Outer shrinking ring
        ctx.strokeStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Inner semi-transparent fill
        ctx.fillStyle = `hsla(${t.hue}, 100%, 50%, 0.18)`;
        ctx.fill();

        // Middle ring
        if (r > 12) {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, r * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Bullseye center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 4. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 5. Draw Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
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
window.TargetPopGame = TargetPopGame;
