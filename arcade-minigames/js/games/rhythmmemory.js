/**
 * Rhythm Memory - 4-Quadrant Cyber Simon musical sequence memory arcade minigame.
 * Watch and listen as neon pads flash in sequence. Repeat the melody accurately
 * as tempo accelerates and patterns expand!
 */
class RhythmMemoryGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.round = 1;

    // Game States
    this.STATE_READY = 'READY';
    this.STATE_SHOW_SEQUENCE = 'SHOW';
    this.STATE_PLAYER_TURN = 'PLAYER';
    this.STATE_ROUND_CLEAR = 'CLEAR';
    this.STATE_GAME_OVER = 'GAMEOVER';
    this.state = this.STATE_READY;

    // Sequence memory
    this.sequence = [];
    this.playerStepIndex = 0;
    this.showStepIndex = 0;
    this.showTimer = 0;
    this.stepDuration = 32; // frames on
    this.stepGap = 12; // frames off
    this.showingActiveNote = false;

    // Active pad flash state (0 to 3, or -1 for none)
    this.activePad = -1;
    this.activePadTimer = 0;
    this.allPadsFlash = false;
    this.allPadsFlashColor = '#ffffff';
    this.roundClearTimer = 0;
    this.gameOverTimer = 0;

    // Player turn timeout timer
    this.playerTurnTimer = 0;
    this.maxPlayerTurnTime = 300; // ~5 seconds per note

    // Console Layout
    this.centerX = 0;
    this.centerY = 0;
    this.outerRadius = 135;
    this.innerRadius = 55;
    this.padGapAngle = 0.08; // gap between quadrants in radians

    // 4 Cyber Pads Config
    this.pads = [
      { id: 0, label: '▲', key: '1 / W / ▲', name: 'EMERALD', color: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)', freq: 329.63 },
      { id: 1, label: '▶', key: '2 / D / ▶', name: 'CRIMSON', color: '#ff0055', glow: 'rgba(255, 0, 85, 0.4)', freq: 440.00 },
      { id: 2, label: '▼', key: '3 / S / ▼', name: 'AMBER',   color: '#ffd200', glow: 'rgba(255, 210, 0, 0.4)', freq: 277.18 },
      { id: 3, label: '◀', key: '4 / A / ◀', name: 'CYAN',    color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.4)', freq: 164.81 }
    ];

    // Visuals & Effects
    this.particles = [];
    this.ripples = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.round = 1;
    this.shakeIntensity = 0;
    this.sequence = [];
    this.particles = [];
    this.ripples = [];
    this.floatingTexts = [];

    this.activePad = -1;
    this.activePadTimer = 0;
    this.allPadsFlash = false;
    this.roundClearTimer = 0;
    this.gameOverTimer = 0;

    this.state = this.STATE_READY;
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

    // Center circular console
    this.centerX = this.logicalWidth / 2;
    this.centerY = Math.max(160, Math.min(320, this.logicalHeight * 0.46));

    // Dynamic radius scaled to available space
    const maxDimension = Math.min(this.logicalWidth - 36, this.logicalHeight * 0.62);
    this.outerRadius = Math.max(110, Math.min(150, maxDimension / 2));
    this.innerRadius = Math.round(this.outerRadius * 0.42);
  }

  startFirstRound() {
    this.sequence = [Math.floor(Math.random() * 4)];
    this.startShowSequence();
  }

  startShowSequence() {
    this.state = this.STATE_SHOW_SEQUENCE;
    this.showStepIndex = 0;
    this.showTimer = 25; // Brief 0.4s pause before notes begin
    this.showingActiveNote = false;
    this.activePad = -1;

    // Speed up sequence pacing as rounds advance
    // Round 1: ~600ms per note, Round 6: ~400ms, Round 12+: ~260ms
    const speedFactor = Math.max(0.48, 1 - (this.round - 1) * 0.05);
    this.stepDuration = Math.round(28 * speedFactor);
    this.stepGap = Math.round(10 * speedFactor);
  }

  startPlayerTurn() {
    this.state = this.STATE_PLAYER_TURN;
    this.playerStepIndex = 0;
    this.playerTurnTimer = this.maxPlayerTurnTime;
    this.activePad = -1;
  }

  triggerPad(padIndex, isPlayer = false) {
    this.activePad = padIndex;
    this.activePadTimer = isPlayer ? 14 : this.stepDuration;

    // Play procedural tone
    ArcadeAudio.sfx.simonTone(padIndex, isPlayer ? 0.22 : 0.28);

    // Visual ripple effect
    const pad = this.pads[padIndex];
    const midRadius = (this.innerRadius + this.outerRadius) / 2;
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // top, right, bottom, left
    const angle = angles[padIndex];

    const rx = this.centerX + Math.cos(angle) * midRadius;
    const ry = this.centerY + Math.sin(angle) * midRadius;

    this.ripples.push({
      x: rx,
      y: ry,
      radius: 12,
      maxRadius: 46,
      color: pad.color,
      alpha: 0.9
    });

    this.createSparkles(rx, ry, pad.color, 12);
  }

  handlePlayerInput(padIndex) {
    if (this.state !== this.STATE_PLAYER_TURN) return;

    this.triggerPad(padIndex, true);
    this.playerTurnTimer = this.maxPlayerTurnTime; // Reset turn timer on active input

    // Check against expected sequence step
    const expected = this.sequence[this.playerStepIndex];

    if (padIndex === expected) {
      // Correct note!
      this.playerStepIndex++;
      this.score += 50 * this.round;
      this.onScoreUpdate(this.score);

      // Check if finished entire sequence for this round
      if (this.playerStepIndex === this.sequence.length) {
        // ROUND CLEARED!
        this.state = this.STATE_ROUND_CLEAR;
        const roundBonus = 200 * this.round;
        this.score += roundBonus;
        this.onScoreUpdate(this.score);

        ArcadeAudio.sfx.perfect(Math.min(8, this.round));
        this.createFloatingText(`ROUND ${this.round} CLEARED! +${roundBonus}`, this.centerX, this.centerY - 20, '#00ff88');

        // Flash all pads
        this.allPadsFlash = true;
        this.allPadsFlashColor = '#00ff88';
        this.roundClearTimer = 50; // ~0.8s frame countdown
      }
    } else {
      // WRONG NOTE! Discordant Fail!
      this.state = this.STATE_GAME_OVER;
      this.allPadsFlash = true;
      this.allPadsFlashColor = '#ff0055';
      this.shakeIntensity = 14;
      ArcadeAudio.sfx.buzz();
      this.createFloatingText('INCORRECT NOTE!', this.centerX, this.centerY, '#ff0055');
      this.gameOverTimer = 30; // ~0.5s frame countdown
    }
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    if (this.state === this.STATE_READY) {
      if (e.code === 'Space' || e.code === 'Enter' || e.code.startsWith('Digit') || e.code.startsWith('Arrow')) {
        e.preventDefault();
        this.startFirstRound();
        return;
      }
    }

    if (this.state !== this.STATE_PLAYER_TURN) return;

    let pad = -1;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Digit1') pad = 0;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'Digit2') pad = 1;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Digit3') pad = 2;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'Digit4') pad = 3;

    if (pad !== -1) {
      e.preventDefault();
      this.handlePlayerInput(pad);
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (this.state === this.STATE_READY) {
      this.startFirstRound();
      return;
    }

    if (this.state !== this.STATE_PLAYER_TURN) return;

    // Detect which quadrant was clicked relative to center
    const dx = px - this.centerX;
    const dy = py - this.centerY;
    const dist = Math.hypot(dx, dy);

    // If within console ring radius
    if (dist >= this.innerRadius * 0.75 && dist <= this.outerRadius * 1.25) {
      const angle = Math.atan2(dy, dx); // [-PI to PI]
      // Top: [-3PI/4, -PI/4] -> 0
      // Right: [-PI/4, PI/4] -> 1
      // Bottom: [PI/4, 3PI/4] -> 2
      // Left: elsewhere -> 3
      let pad = -1;
      if (angle >= -3 * Math.PI / 4 && angle < -Math.PI / 4) {
        pad = 0; // Top Green
      } else if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
        pad = 1; // Right Red
      } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
        pad = 2; // Bottom Yellow
      } else {
        pad = 3; // Left Cyan
      }

      if (pad !== -1) {
        this.handlePlayerInput(pad);
      }
    }
  }

  createSparkles(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: color,
        alpha: 1,
        decay: 0.04
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

  triggerDeath(reason = 'RHYTHM MISMATCH!') {
    this.isRunning = false;
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

    // Active pad light countdown
    if (this.activePadTimer > 0) {
      this.activePadTimer--;
      if (this.activePadTimer <= 0) {
        this.activePad = -1;
      }
    }

    // State: Round Cleared transition delay
    if (this.state === this.STATE_ROUND_CLEAR) {
      this.roundClearTimer--;
      if (this.roundClearTimer <= 0) {
        this.allPadsFlash = false;
        this.round++;
        this.sequence.push(Math.floor(Math.random() * 4));
        this.startShowSequence();
      }
      return;
    }

    // State: Game Over transition delay
    if (this.state === this.STATE_GAME_OVER) {
      this.gameOverTimer--;
      if (this.gameOverTimer <= 0) {
        this.triggerDeath('RHYTHM MISMATCH!');
      }
      return;
    }

    // State 1: Demonstrating Sequence
    if (this.state === this.STATE_SHOW_SEQUENCE) {
      this.showTimer--;
      if (this.showTimer <= 0) {
        if (!this.showingActiveNote) {
          // Time to trigger next note
          if (this.showStepIndex < this.sequence.length) {
            const nextNote = this.sequence[this.showStepIndex];
            this.triggerPad(nextNote, false);
            this.showingActiveNote = true;
            this.showTimer = this.stepDuration;
          } else {
            // Finished playing full sequence
            this.startPlayerTurn();
          }
        } else {
          // Note on-time finished, brief off gap
          this.activePad = -1;
          this.showingActiveNote = false;
          this.showStepIndex++;
          this.showTimer = this.stepGap;
        }
      }
    }

    // State 2: Player's turn timeout countdown
    if (this.state === this.STATE_PLAYER_TURN) {
      this.playerTurnTimer--;
      if (this.playerTurnTimer <= 0) {
        // Player took too long!
        this.state = this.STATE_GAME_OVER;
        this.shakeIntensity = 12;
        ArcadeAudio.sfx.buzz();
        this.createFloatingText('TIME EXPIRED!', this.centerX, this.centerY, '#ff0055');
        this.gameOverTimer = 30;
      }
    }

    // Update Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 2.2;
      r.alpha -= 0.04;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
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

  drawQuadrant(pad, startAngle, endAngle) {
    const ctx = this.ctx;
    const isLit = (this.activePad === pad.id) || this.allPadsFlash;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle + this.padGapAngle, endAngle - this.padGapAngle);
    ctx.arc(this.centerX, this.centerY, this.innerRadius, endAngle - this.padGapAngle, startAngle + this.padGapAngle, true);
    ctx.closePath();

    if (isLit) {
      const litColor = this.allPadsFlash ? this.allPadsFlashColor : pad.color;
      ctx.fillStyle = litColor;
      ctx.shadowColor = litColor;
      ctx.shadowBlur = 24;
      ctx.fill();

      // Gleam highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Idle dim state
      ctx.fillStyle = 'rgba(16, 22, 36, 0.85)';
      ctx.fill();
      ctx.strokeStyle = pad.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = pad.color;
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Colored inner glow edge
      ctx.strokeStyle = pad.glow;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Pad Glyph / Vector Arrow Icon (drawn as clean vector to prevent iOS emoji substitution)
    const midAngle = (startAngle + endAngle) / 2;
    const iconDist = (this.innerRadius + this.outerRadius) / 2;
    const ix = this.centerX + Math.cos(midAngle) * iconDist;
    const iy = this.centerY + Math.sin(midAngle) * iconDist;

    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(midAngle);

    const glyphColor = isLit ? '#ffffff' : pad.color;
    ctx.fillStyle = glyphColor;
    ctx.shadowColor = glyphColor;
    ctx.shadowBlur = isLit ? 14 : 5;

    const s = 10;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.75, -s * 0.8);
    ctx.lineTo(-s * 0.75, s * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
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

    // 1. Draw 4 Quadrants
    // Quadrant 0: Top (-3PI/4 to -PI/4)
    this.drawQuadrant(this.pads[0], -3 * Math.PI / 4, -Math.PI / 4);
    // Quadrant 1: Right (-PI/4 to PI/4)
    this.drawQuadrant(this.pads[1], -Math.PI / 4, Math.PI / 4);
    // Quadrant 2: Bottom (PI/4 to 3PI/4)
    this.drawQuadrant(this.pads[2], Math.PI / 4, 3 * Math.PI / 4);
    // Quadrant 3: Left (3PI/4 to 5PI/4)
    this.drawQuadrant(this.pads[3], 3 * Math.PI / 4, 5 * Math.PI / 4);

    // 2. Draw Ripples
    for (const r of this.ripples) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Center Console Core
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e18';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Center Display Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.state === this.STATE_READY) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.fillText('PRESS', this.centerX, this.centerY - 8);
      ctx.fillText('START', this.centerX, this.centerY + 8);
    } else {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`LVL ${this.round}`, this.centerX, this.centerY - 8);

      ctx.font = '7px "Press Start 2P", monospace';
      if (this.state === this.STATE_SHOW_SEQUENCE) {
        ctx.fillStyle = '#ffd200';
        ctx.fillText('LISTEN', this.centerX, this.centerY + 9);
      } else if (this.state === this.STATE_PLAYER_TURN) {
        ctx.fillStyle = '#00ff88';
        ctx.fillText('REPEAT', this.centerX, this.centerY + 9);
      } else if (this.state === this.STATE_ROUND_CLEAR) {
        ctx.fillStyle = '#00ff88';
        ctx.fillText('CLEAR!', this.centerX, this.centerY + 9);
      } else {
        ctx.fillStyle = '#ff0055';
        ctx.fillText('FAIL!', this.centerX, this.centerY + 9);
      }
    }
    ctx.restore();

    // 4. Sequence Step Indicators (Dots below Console)
    if (this.state === this.STATE_PLAYER_TURN || this.state === this.STATE_SHOW_SEQUENCE) {
      ctx.save();
      const dotCount = this.sequence.length;
      const dotSpacing = 16;
      const totalDotWidth = (dotCount - 1) * dotSpacing;
      const dotStartX = this.centerX - totalDotWidth / 2;
      const dotY = this.centerY + this.outerRadius + 30;

      for (let i = 0; i < dotCount; i++) {
        const dx = dotStartX + i * dotSpacing;
        const isDone = this.state === this.STATE_PLAYER_TURN
          ? i < this.playerStepIndex
          : i < this.showStepIndex;

        ctx.beginPath();
        ctx.arc(dx, dotY, 4, 0, Math.PI * 2);
        if (isDone) {
          ctx.fillStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Player Timer Bar (Under Sequence Dots)
    if (this.state === this.STATE_PLAYER_TURN) {
      ctx.save();
      const barW = this.outerRadius * 1.5;
      const barH = 5;
      const barX = this.centerX - barW / 2;
      const barY = this.centerY + this.outerRadius + 44;
      const fillRatio = Math.max(0, this.playerTurnTimer / this.maxPlayerTurnTime);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = fillRatio > 0.3 ? '#00f3ff' : '#ff0055';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.fillRect(barX, barY, barW * fillRatio, barH);
      ctx.restore();
    }

    // 6. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Draw Floating Texts
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


    // 9. Attract / Start Screen Overlay Banner
    if (this.state === this.STATE_READY) {
      ctx.save();
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText('TAP OR HIT SPACE TO BEGIN 🎵', this.centerX, this.centerY + this.outerRadius + 35);
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

window.RhythmMemoryGame = RhythmMemoryGame;
