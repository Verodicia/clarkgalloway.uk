/**
 * Timber Chop - Fast-paced reflex woodchopping arcade minigame.
 * Tap left or right to chop trunk segments while dodging descending branches against a timer!
 */
class TimberChopGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.chops = 0;

    // Trunk & Segment dimensions
    this.trunkWidth = 64;
    this.segmentHeight = 46;
    this.segments = [];
    this.maxSegments = 14;

    // Player state
    this.playerSide = 'left'; // 'left' or 'right'
    this.swingTimer = 0;
    this.isDucking = false;
    this.duckTimer = 0;
    this.branchStreak = 0;

    // Time bar (0 to 100)
    this.timeLeft = 100;
    this.maxTime = 100;
    this.timeDrainRate = 0.35;

    // Visuals & Physics
    this.flyingLogs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear any previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.chops = 0;
    this.playerSide = 'left';
    this.swingTimer = 0;
    this.isDucking = false;
    this.duckTimer = 0;
    this.branchStreak = 0;
    this.timeLeft = 100;
    this.timeDrainRate = 0.35;
    this.shakeIntensity = 0;

    this.flyingLogs = [];
    this.particles = [];
    this.floatingTexts = [];

    // Initialize initial trunk segments (first 4 have no branches for a safe runway)
    this.segments = [];
    for (let i = 0; i < this.maxSegments; i++) {
      if (i < 4) {
        this.segments.push({ branch: 'none' });
      } else {
        this.segments.push(this.generateRandomSegment());
      }
    }

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

    this.trunkX = (this.logicalWidth - this.trunkWidth) / 2;
    this.groundY = this.logicalHeight - 75;
  }

  generateRandomSegment() {
    // Fair arcade rule: An opposing branch can NEVER immediately follow another branch.
    // There MUST be an empty ('none') segment between any left <-> right transition.
    const prev = this.segments[this.segments.length - 1];
    const prevBranch = prev ? prev.branch : 'none';

    // If previous segment had NO branch:
    if (prevBranch === 'none') {
      // 35% chance to remain empty (gives clear breathing room to switch sides)
      if (Math.random() < 0.35) {
        return { branch: 'none' };
      }
      // Otherwise spawn a branch on left or right
      this.branchStreak = 1;
      return { branch: Math.random() < 0.5 ? 'left' : 'right' };
    }

    // If previous segment had a branch ('left' or 'right'):
    // If streak reaches 3, force an empty buffer so player isn't stuck forever
    if (this.branchStreak >= 3 || Math.random() < 0.45) {
      this.branchStreak = 0;
      return { branch: 'none' };
    } else {
      // Continue on the SAME side (so player can stay on opposite side safely)
      this.branchStreak++;
      return { branch: prevBranch };
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
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.chop('left', false);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.chop('right', false);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') {
      e.preventDefault();
      this.chop(this.playerSide, true); // Duck & chop under branches!
    }
  }

  handlePointerDown(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;

    const midLeft = this.logicalWidth * 0.38;
    const midRight = this.logicalWidth * 0.62;

    // Center zone ducks & chops! Left and Right zones chop their respective sides.
    if (px >= midLeft && px <= midRight) {
      this.chop(this.playerSide, true);
    } else if (px < midLeft) {
      this.chop('left', false);
    } else {
      this.chop('right', false);
    }
  }

  createFloatingText(text, x, y, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.4,
      alpha: 1.0,
      color: color
    });
  }

  chop(side, isDucking = false) {
    if (!this.isRunning) return;

    this.playerSide = side;
    this.swingTimer = 6;
    this.isDucking = isDucking;
    if (isDucking) {
      this.duckTimer = 10;
    }

    // Check if player moved directly under a branch that is already at waist/head height
    if (this.segments[0].branch === side && !isDucking) {
      this.triggerDeath('CRUSHED BY BRANCH!');
      return;
    }

    // Chop lowest segment!
    const chopped = this.segments.shift();
    this.chops++;
    this.score += 10;
    this.onScoreUpdate(this.score);

    // Refill time bar (+14% per chop)
    this.timeLeft = Math.min(this.maxTime, this.timeLeft + 14);

    // Create flying log slice
    const flyDir = side === 'left' ? 1 : -1;
    this.flyingLogs.push({
      x: this.trunkX,
      y: this.groundY - this.segmentHeight,
      width: this.trunkWidth,
      height: this.segmentHeight,
      vx: flyDir * (8 + Math.random() * 4),
      vy: -5 - Math.random() * 3,
      rot: 0,
      vRot: flyDir * 0.15,
      branch: chopped.branch
    });

    // Create wood chips
    this.createWoodChips(
      side === 'left' ? this.trunkX : this.trunkX + this.trunkWidth,
      this.groundY - this.segmentHeight / 2
    );

    // Sound and impact
    if (isDucking) {
      ArcadeAudio.sfx.slice();
      this.createFloatingText('DODGE! 🛡️', this.trunkX + (side === 'left' ? -35 : this.trunkWidth + 35), this.groundY - 55, '#00ff88');
    } else {
      ArcadeAudio.sfx.chop();
    }
    this.shakeIntensity = 2.5;

    // Add new segment at top (strictly buffers any side transitions)
    this.segments.push(this.generateRandomSegment());

    // Check if descending branch directly hits player
    if (this.segments[0].branch === side) {
      if (isDucking) {
        // Player ducked safely underneath!
        this.createFloatingText('DODGED! 🛡️', this.trunkX + (side === 'left' ? -35 : this.trunkWidth + 35), this.groundY - 55, '#00ff88');
      } else {
        this.triggerDeath('CRUSHED BY BRANCH!');
      }
    }
  }

  createWoodChips(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        hue: 30 + Math.random() * 15, // Woody amber
        alpha: 1,
        decay: 0.04
      });
    }
  }

  triggerDeath(reason = 'GAME OVER') {
    this.isRunning = false;
    this.shakeIntensity = 12;
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

    // Swing timer
    if (this.swingTimer > 0) {
      this.swingTimer--;
    }

    // Duck timer
    if (this.duckTimer > 0) {
      this.duckTimer--;
      if (this.duckTimer === 0) {
        this.isDucking = false;
      }
    }

    // Drain Time bar (scales gradually with score)
    const currentDrain = this.timeDrainRate + Math.min(0.65, this.score * 0.001);
    this.timeLeft -= currentDrain;

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.triggerDeath("TIME'S UP!");
      return;
    }

    // Flying logs physics
    for (let i = this.flyingLogs.length - 1; i >= 0; i--) {
      const log = this.flyingLogs[i];
      log.vy += 0.55; // gravity
      log.x += log.vx;
      log.y += log.vy;
      log.rot += log.vRot;

      if (log.y > this.logicalHeight + 80) {
        this.flyingLogs.splice(i, 1);
      }
    }

    // Wood chips particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity on chips
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.035;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    ctx.save();

    // Screen shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const oy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(ox, oy);
    }

    // 1. Draw Top Time Bar
    const barWidth = Math.min(260, this.logicalWidth * 0.75);
    const barHeight = 12;
    const barX = (this.logicalWidth - barWidth) / 2;
    const barY = 22;
    const fillRatio = Math.max(0, this.timeLeft / this.maxTime);

    ctx.save();
    // Bar Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Bar Fill with Gradient
    let barColor = '#00ff88';
    if (fillRatio < 0.28) barColor = '#ff0055';
    else if (fillRatio < 0.55) barColor = '#ffd700';

    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(barX + 2, barY + 2, Math.max(0, (barWidth - 4) * fillRatio), barHeight - 4);
    ctx.restore();

    // 2. Ground Platform
    ctx.fillStyle = '#0f1826';
    ctx.fillRect(0, this.groundY, this.logicalWidth, this.logicalHeight - this.groundY);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.logicalWidth, this.groundY);
    ctx.stroke();

    // Tree Stump Base
    ctx.fillStyle = '#6d4c2b';
    ctx.fillRect(this.trunkX - 8, this.groundY - 14, this.trunkWidth + 16, 14);

    // 3. Draw Tree Trunk & Branches
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const y = this.groundY - (i + 1) * this.segmentHeight;

      // Trunk segment
      ctx.save();
      ctx.fillStyle = i % 2 === 0 ? '#8d5b32' : '#7a4e29';
      ctx.fillRect(this.trunkX, y, this.trunkWidth, this.segmentHeight);

      // Bark texture line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.trunkX + 16, y);
      ctx.lineTo(this.trunkX + 16, y + this.segmentHeight);
      ctx.stroke();

      // Branch
      const branchWidth = 72;
      const branchHeight = 16;
      if (seg.branch === 'left') {
        const bx = this.trunkX - branchWidth;
        const by = y + (this.segmentHeight - branchHeight) / 2;
        ctx.fillStyle = '#664121';
        ctx.fillRect(bx, by, branchWidth, branchHeight);

        // Neon cyber foliage
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fillRect(bx, by - 4, branchWidth * 0.7, 6);
      } else if (seg.branch === 'right') {
        const bx = this.trunkX + this.trunkWidth;
        const by = y + (this.segmentHeight - branchHeight) / 2;
        ctx.fillStyle = '#664121';
        ctx.fillRect(bx, by, branchWidth, branchHeight);

        // Neon cyber foliage
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fillRect(bx + branchWidth * 0.3, by - 4, branchWidth * 0.7, 6);
      }
      ctx.restore();
    }

    // 4. Draw Flying Chopped Logs
    for (const log of this.flyingLogs) {
      ctx.save();
      ctx.translate(log.x + log.width / 2, log.y + log.height / 2);
      ctx.rotate(log.rot);
      ctx.fillStyle = '#a06a3b';
      ctx.fillRect(-log.width / 2, -log.height / 2, log.width, log.height);

      if (log.branch === 'left') {
        ctx.fillStyle = '#664121';
        ctx.fillRect(-log.width / 2 - 50, -8, 50, 16);
      } else if (log.branch === 'right') {
        ctx.fillStyle = '#664121';
        ctx.fillRect(log.width / 2, -8, 50, 16);
      }
      ctx.restore();
    }

    // 5. Draw Player Character (With Crouching / Ducking visual)
    ctx.save();
    const isLeft = this.playerSide === 'left';
    const playerX = isLeft ? this.trunkX - 42 : this.trunkX + this.trunkWidth + 14;
    const isDucked = this.duckTimer > 0;
    const playerY = this.groundY - (isDucked ? 32 : 50);

    // Shield glow when ducking
    if (isDucked) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(playerX + 14, playerY + 14, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Body (Cyber lumberjack)
    ctx.fillStyle = isDucked ? '#00ff88' : '#00f3ff';
    ctx.shadowColor = isDucked ? '#00ff88' : '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(playerX, playerY + (isDucked ? 6 : 12), 28, isDucked ? 26 : 38);

    // Head / Helmet
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(playerX + 4, playerY - (isDucked ? 4 : 4), 20, 14);

    // Axe swing animation
    const axeSwing = this.swingTimer > 0;
    const axeX = isLeft 
      ? (axeSwing ? playerX + 34 : playerX + 16) 
      : (axeSwing ? playerX - 16 : playerX + 6);
    const axeY = playerY + (isDucked ? 8 : 18);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillRect(axeX, axeY, 14, 10); // Axe head
    ctx.fillStyle = '#a66a38';
    ctx.fillRect(axeX + (isLeft ? -8 : 8), axeY + 3, 10, 4); // Handle

    ctx.restore();

    // 6. Draw Wood Chips Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 90%, 55%, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Draw Floating Texts (e.g. "DODGED! 🛡️")
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

    // 8. On-screen Touch Controls (Visible guide zones at bottom: Left, Duck, Right)
    ctx.save();
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('« CHOP', this.logicalWidth * 0.18, this.groundY + 38);

    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 6;
    ctx.fillText('🛡️ DUCK', this.logicalWidth * 0.50, this.groundY + 38);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.fillText('CHOP »', this.logicalWidth * 0.82, this.groundY + 38);
    ctx.restore();

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
window.TimberChopGame = TimberChopGame;
