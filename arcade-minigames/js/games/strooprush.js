/**
 * Stroop Rush - High-speed mental reflex & color-word mismatch arcade minigame.
 * Determine if the word meaning matches its font color against a rapidly shrinking countdown!
 */
class StroopRushGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.streak = 0;
    this.lives = 3;
    this.maxLives = 3;

    // Palette definitions
    this.PALETTE = [
      { name: 'RED', hex: '#ff0055', hue: 345 },
      { name: 'CYAN', hex: '#00f3ff', hue: 185 },
      { name: 'GREEN', hex: '#00ff88', hue: 145 },
      { name: 'GOLD', hex: '#ffd700', hue: 48 },
      { name: 'PURPLE', hex: '#b026ff', hue: 275 }
    ];

    // Current round state
    this.currentWord = '';
    this.currentColor = null;
    this.isMatch = false;
    this.roundTimer = 0;
    this.maxRoundTime = 110;

    // Visuals & Effects
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.feedbackFlash = null; // { color: string, alpha: number }
    this.animId = null;

    // Button touch bounds
    this.btnLeftBounds = { x: 0, y: 0, w: 0, h: 0 };
    this.btnRightBounds = { x: 0, y: 0, w: 0, h: 0 };

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear any previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.streak = 0;
    this.lives = 3;
    this.shakeIntensity = 0;
    this.feedbackFlash = null;

    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    this.nextRound();

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

    // Compute interactive touch button areas at bottom
    const btnW = Math.min(170, (this.logicalWidth - 36) / 2);
    const btnH = 64;
    const btnY = this.logicalHeight - btnH - 24;

    this.btnLeftBounds = {
      x: (this.logicalWidth / 2) - btnW - 8,
      y: btnY,
      w: btnW,
      h: btnH
    };

    this.btnRightBounds = {
      x: (this.logicalWidth / 2) + 8,
      y: btnY,
      w: btnW,
      h: btnH
    };
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  nextRound() {
    // 50% chance of being a match, 50% chance of mismatch
    this.isMatch = Math.random() < 0.5;

    const wordItem = this.PALETTE[Math.floor(Math.random() * this.PALETTE.length)];
    this.currentWord = wordItem.name;

    if (this.isMatch) {
      this.currentColor = wordItem;
    } else {
      // Pick a different color
      const otherColors = this.PALETTE.filter(c => c.name !== wordItem.name);
      this.currentColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    }

    // Time allowance scales down from 110 frames (~1.8s) to 58 frames (~0.95s) at high streak
    this.maxRoundTime = Math.max(58, 110 - Math.floor(this.streak * 2.2));
    this.roundTimer = this.maxRoundTime;
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.submitAnswer(false); // MISMATCH
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.submitAnswer(true); // MATCH
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;

    // Left half taps Mismatch, Right half taps Match
    if (px < this.logicalWidth / 2) {
      this.submitAnswer(false);
    } else {
      this.submitAnswer(true);
    }
  }

  submitAnswer(playerSaidMatch) {
    if (!this.isRunning) return;

    const isCorrect = (playerSaidMatch === this.isMatch);

    if (isCorrect) {
      // Correct!
      this.streak++;
      const speedBonus = Math.floor((this.roundTimer / this.maxRoundTime) * 80);
      const points = (100 + speedBonus) * Math.min(6, 1 + Math.floor(this.streak / 4));

      this.score += points;
      this.onScoreUpdate(this.score);

      // Effects
      this.feedbackFlash = { color: 'rgba(0, 255, 136, 0.18)', alpha: 1.0 };
      this.createShockwave(this.logicalWidth / 2, this.logicalHeight / 2, '#00ff88');
      this.createSparkles(this.logicalWidth / 2, this.logicalHeight / 2, this.currentColor.hue);
      this.createFloatingText(`+${points}!`, this.logicalWidth / 2, this.logicalHeight / 2 - 50, '#00ff88');
      ArcadeAudio.sfx.perfect(Math.min(8, this.streak));

      this.nextRound();
    } else {
      // Incorrect!
      this.handleMistake('WRONG MATCH!');
    }
  }

  handleMistake(reason = 'WRONG!') {
    this.lives--;
    this.streak = 0; // reset streak
    this.shakeIntensity = 10;
    this.feedbackFlash = { color: 'rgba(255, 0, 85, 0.25)', alpha: 1.0 };

    ArcadeAudio.sfx.buzz();
    this.createFloatingText(`${reason} -1 ❤️`, this.logicalWidth / 2, this.logicalHeight / 2 - 50, '#ff0055');
    this.createSparkles(this.logicalWidth / 2, this.logicalHeight / 2, 345, 16);

    if (this.lives <= 0) {
      this.triggerDeath();
    } else {
      this.nextRound();
    }
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

  createShockwave(x, y, color) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 20,
      maxRadius: 80,
      alpha: 0.9,
      color: color
    });
  }

  createSparkles(x, y, hue, count = 14) {
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
        decay: 0.035
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.4,
      alpha: 1,
      color: color
    });
  }

  update() {
    if (!this.isRunning) return;

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.86;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Flash dampening
    if (this.feedbackFlash) {
      this.feedbackFlash.alpha -= 0.06;
      if (this.feedbackFlash.alpha <= 0) this.feedbackFlash = null;
    }

    // Round countdown timer
    this.roundTimer--;
    if (this.roundTimer <= 0) {
      this.handleMistake("TIME'S UP!");
      return;
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 4;
      sw.alpha -= 0.05;
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

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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

    // Feedback Flash overlay
    if (this.feedbackFlash) {
      ctx.fillStyle = this.feedbackFlash.color;
      ctx.globalAlpha = Math.max(0, this.feedbackFlash.alpha);
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      ctx.globalAlpha = 1.0;
    }

    // 1. Top HUD: Hearts & Streak
    ctx.save();
    let heartsText = '';
    for (let i = 0; i < this.maxLives; i++) {
      heartsText += i < this.lives ? '❤️ ' : '🖤 ';
    }
    ctx.font = '14px sans-serif';
    ctx.fillText(heartsText.trim(), 20, 32);

    if (this.streak > 0) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'right';
      ctx.fillText(`STREAK: ${this.streak}`, this.logicalWidth - 20, 30);
    }
    ctx.restore();

    // 2. Round Timer Bar
    const timerW = Math.min(280, this.logicalWidth * 0.76);
    const timerH = 10;
    const timerX = (this.logicalWidth - timerW) / 2;
    const timerY = 55;
    const timeRatio = Math.max(0, this.roundTimer / this.maxRoundTime);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.fillRect(timerX, timerY, timerW, timerH);
    ctx.strokeRect(timerX, timerY, timerW, timerH);

    let barColor = '#00f3ff';
    if (timeRatio < 0.3) barColor = '#ff0055';
    else if (timeRatio < 0.6) barColor = '#ffd700';

    ctx.fillStyle = barColor;
    ctx.shadowBlur = 0;
    ctx.fillRect(timerX + 2, timerY + 2, Math.max(0, (timerW - 4) * timeRatio), timerH - 4);
    ctx.restore();

    // 3. Prompt Question Text
    ctx.save();
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('DOES WORD MATCH COLOR?', this.logicalWidth / 2, this.logicalHeight * 0.30);
    ctx.restore();

    // 4. Large Tactile Touch Buttons at Bottom
    const { btnLeftBounds: bl, btnRightBounds: br } = this;

    // LEFT BUTTON: [ ✖ MISMATCH ]
    ctx.save();
    ctx.fillStyle = 'rgba(25, 32, 48, 0.9)';
    ctx.strokeStyle = 'rgba(255, 80, 120, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    this.drawRoundedRect(ctx, bl.x, bl.y, bl.w, bl.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff6b8b';
    ctx.textAlign = 'center';
    ctx.fillText('✖ NO', bl.x + bl.w / 2, bl.y + 26);
    ctx.font = '9px "Chakra Petch", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('MISMATCH', bl.x + bl.w / 2, bl.y + 46);
    ctx.restore();

    // RIGHT BUTTON: [ ✔ MATCH ]
    ctx.save();
    ctx.fillStyle = 'rgba(25, 32, 48, 0.9)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    this.drawRoundedRect(ctx, br.x, br.y, br.w, br.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'center';
    ctx.fillText('✔ YES', br.x + br.w / 2, br.y + 26);
    ctx.font = '9px "Chakra Petch", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('MATCH', br.x + br.w / 2, br.y + 46);
    ctx.restore();

    // 5. Draw Shockwaves
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

    // 6. Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Floating Texts
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

    // 8. TOP LAYER: Central Word Card & The Big Colored Word (Rendered on topmost layer so it is always fully visible)
    if (this.currentWord && this.currentColor) {
      const centerY = this.logicalHeight * 0.46;
      const cardW = Math.min(308, this.logicalWidth * 0.86);
      const cardH = 92;

      // Card Bezel Container
      ctx.save();
      ctx.fillStyle = 'rgba(12, 17, 30, 0.95)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      this.drawRoundedRect(
        ctx,
        (this.logicalWidth - cardW) / 2,
        centerY - cardH / 2,
        cardW,
        cardH,
        14
      );
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // The Big Stroop Word (Top Layer)
      ctx.save();
      ctx.font = '900 40px "Chakra Petch", "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.currentColor.hex;
      ctx.shadowColor = this.currentColor.hex;
      ctx.shadowBlur = 14;
      ctx.fillText(this.currentWord, this.logicalWidth / 2, centerY);
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
window.StroopRushGame = StroopRushGame;
