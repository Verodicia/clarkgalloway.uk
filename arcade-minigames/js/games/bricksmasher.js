/**
 * Brick Smasher: Descent - Cyberpunk Breakout meets Space Invaders.
 * Descending neon brick grid, variable angle paddle deflections, combo multipliers,
 * explosive bomb bricks, twin laser power-ups, multiball, and a bottom danger line.
 */
class BrickSmasherGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.stage = 1;

    // Arena geometry
    this.logicalWidth = 360;
    this.logicalHeight = 540;
    this.dangerY = 440;

    // Paddle properties
    this.paddle = {
      x: 180,
      y: 485,
      width: 84,
      baseWidth: 84,
      targetWidth: 84,
      height: 12,
      targetX: 180,
      scaleX: 1,
      scaleY: 1
    };

    // Balls list (supports multi-ball!)
    this.balls = [];

    // Bricks grid
    this.cols = 7;
    this.paddingX = 14;
    this.gap = 5;
    this.brickW = 42;
    this.brickH = 18;
    this.topOffset = 52;
    this.bricks = [];
    this.nextBrickId = 1;

    // Descent mechanics & dynamic progression
    this.gameTime = 0; // elapsed frames since match start
    this.descentCount = 0; // total descents triggered
    this.lastSpeedTier = 1.0; // tracks milestone alerts (1.2x, 1.4x, etc.)
    this.descentTimer = 0;
    this.descentMaxTime = 600; // ~10 seconds at 60fps initially, scales down over time
    this.paddleBounceCounter = 0;

    // Power-ups
    this.powerups = []; // falling capsules
    this.lasers = []; // laser projectiles
    this.laserTimer = 0; // remaining frames of laser power
    this.laserCooldown = 0;
    this.wideTimer = 0; // remaining frames of wide paddle
    this.slowTimer = 0; // remaining frames of slow-mo

    // Visual polish
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.shakeIntensity = 0;
    this.isDangerNear = false;
    this.isDying = false;
    this.deathTimer = 0;

    // Input state
    this.keys = { left: false, right: false };
    this.isPointerDown = false;
    this.pointerX = 180;

    // Animation frame handle
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  getSpeedMultiplier() {
    const elapsedSec = this.gameTime / 60;
    // Scales dynamically: +0.05 every 10s of play + 0.12 per wave cleared + 0.02 per descent survived
    const timeBonus = (elapsedSec / 10) * 0.05;
    const stageBonus = (this.stage - 1) * 0.12;
    const descentBonus = this.descentCount * 0.02;
    return Math.min(2.2, 1.0 + timeBonus + stageBonus + descentBonus);
  }

  getBaseBallSpeed() {
    return 5.2 * this.getSpeedMultiplier();
  }

  getDescentMaxTime() {
    const elapsedSec = this.gameTime / 60;
    // Scales down from 600 frames (10.0s) to 240 frames (4.0s) for escalating descent pressure
    const timeReduction = Math.floor(elapsedSec * 3.2);
    const stageReduction = (this.stage - 1) * 35;
    const descentReduction = this.descentCount * 8;
    return Math.max(240, 600 - timeReduction - stageReduction - descentReduction);
  }

  start() {
    this.stop(); // Cleanly abort existing loops & listeners
    this.resize();

    this.score = 0;
    this.lives = 3;
    this.stage = 1;
    this.gameTime = 0;
    this.descentCount = 0;
    this.lastSpeedTier = 1.0;
    this.shakeIntensity = 0;
    this.isDying = false;
    this.deathTimer = 0;

    this.paddle.x = this.logicalWidth / 2;
    this.paddle.targetX = this.paddle.x;
    this.paddle.width = this.paddle.baseWidth;
    this.paddle.targetWidth = this.paddle.baseWidth;
    this.paddle.scaleX = 1;
    this.paddle.scaleY = 1;

    this.laserTimer = 0;
    this.laserCooldown = 0;
    this.wideTimer = 0;
    this.slowTimer = 0;

    this.balls = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];

    this.descentTimer = 0;
    this.descentMaxTime = this.getDescentMaxTime();
    this.paddleBounceCounter = 0;

    this.initBricks();
    this.spawnDockedBall();

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

    // Compute layout positions
    this.dangerY = this.logicalHeight - 96;
    this.paddle.y = this.logicalHeight - 48;

    this.brickW = (this.logicalWidth - this.paddingX * 2 - (this.cols - 1) * this.gap) / this.cols;

    // Keep paddle within logical boundaries
    this.paddle.x = Math.max(this.paddle.width / 2 + 4, Math.min(this.logicalWidth - this.paddle.width / 2 - 4, this.paddle.x));
    this.paddle.targetX = this.paddle.x;

    // Update existing bricks horizontal positions to match new width
    this.bricks.forEach(b => {
      b.w = this.brickW;
      b.x = this.paddingX + b.col * (this.brickW + this.gap);
    });
  }

  initBricks() {
    this.bricks = [];
    this.nextBrickId = 1;
    const initialRows = 5;

    for (let r = 0; r < initialRows; r++) {
      this.spawnRow(r, initialRows - 1 - r);
    }
  }

  spawnRow(gridRowIndex, initialDistanceOffset = 0) {
    const rowY = this.topOffset + gridRowIndex * (this.brickH + this.gap);

    for (let c = 0; c < this.cols; c++) {
      // 8% chance empty spot for tactical breakways
      if (Math.random() < 0.08 && gridRowIndex > 1) continue;

      const rand = Math.random();
      let hp = 1;
      let type = 'normal';
      let powerup = null;

      // Brick type determination
      if (rand < 0.08) {
        type = 'bomb';
        hp = 1;
      } else if (rand < 0.28) {
        hp = 3; // Armored
      } else if (rand < 0.60) {
        hp = 2; // Reinforced
      } else {
        hp = 1; // Standard
      }

      // Power-up assignment (~20% chance on non-bomb bricks)
      if (type !== 'bomb' && Math.random() < 0.22) {
        const pRand = Math.random();
        if (pRand < 0.30) powerup = 'multiball';
        else if (pRand < 0.55) powerup = 'laser';
        else if (pRand < 0.75) powerup = 'wide';
        else if (pRand < 0.90) powerup = 'bomb';
        else powerup = 'slow';
      }

      const bx = this.paddingX + c * (this.brickW + this.gap);

      this.bricks.push({
        id: this.nextBrickId++,
        col: c,
        row: gridRowIndex,
        x: bx,
        y: rowY - (initialDistanceOffset * (this.brickH + this.gap)),
        targetY: rowY,
        w: this.brickW,
        h: this.brickH,
        hp: hp,
        maxHp: hp,
        type: type,
        powerup: powerup,
        flashTimer: 0
      });
    }
  }

  triggerDescent() {
    if (!this.isRunning || this.isDying) return;

    this.descentCount++;
    this.descentMaxTime = this.getDescentMaxTime();

    ArcadeAudio.sfx.gearClunk();
    this.shakeIntensity = Math.max(this.shakeIntensity, 4);

    // Shift all existing bricks down 1 row
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      b.row += 1;
      b.targetY += (this.brickH + this.gap);
    }

    // Spawn a fresh new row at row 0 (top)
    const newRowY = this.topOffset;
    for (let c = 0; c < this.cols; c++) {
      if (Math.random() < 0.08) continue;

      const rand = Math.random();
      let hp = 1;
      let type = 'normal';
      let powerup = null;

      if (rand < 0.10) {
        type = 'bomb';
        hp = 1;
      } else if (rand < 0.38) {
        hp = 3;
      } else if (rand < 0.70) {
        hp = 2;
      } else {
        hp = 1;
      }

      if (type !== 'bomb' && Math.random() < 0.24) {
        const pRand = Math.random();
        if (pRand < 0.30) powerup = 'multiball';
        else if (pRand < 0.55) powerup = 'laser';
        else if (pRand < 0.75) powerup = 'wide';
        else if (pRand < 0.90) powerup = 'bomb';
        else powerup = 'slow';
      }

      const bx = this.paddingX + c * (this.brickW + this.gap);

      this.bricks.push({
        id: this.nextBrickId++,
        col: c,
        row: 0,
        x: bx,
        y: newRowY - (this.brickH + this.gap) * 1.5, // Slide down smoothly into position
        targetY: newRowY,
        w: this.brickW,
        h: this.brickH,
        hp: hp,
        maxHp: hp,
        type: type,
        powerup: powerup,
        flashTimer: 0
      });
    }

    this.createFloatingText('▼ DESCENT! ▼', this.logicalWidth / 2, this.dangerY - 20, '#ff0055');

    // Check if any brick has breached the danger line
    this.checkDangerBreach();
  }

  checkDangerBreach() {
    let breached = false;
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      if (b.targetY + b.h >= this.dangerY) {
        breached = true;
        break;
      }
    }

    if (breached) {
      this.triggerGameOver('DEFENSE LINE BREACHED!');
    }
  }

  spawnDockedBall() {
    const speed = this.getBaseBallSpeed();
    this.balls.push({
      x: this.paddle.x,
      y: this.paddle.y - this.paddle.height / 2 - 7,
      vx: 0,
      vy: 0,
      radius: 5.5,
      speed: speed,
      docked: true,
      combo: 0,
      trail: []
    });
  }

  launchDockedBalls() {
    let launched = false;
    const currentSpeed = this.getBaseBallSpeed();
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      if (b.docked) {
        b.docked = false;
        b.speed = currentSpeed;
        // Launch at an upward diagonal angle (-65 to -75 deg)
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.45;
        b.vx = Math.sin(angle) * currentSpeed;
        b.vy = Math.cos(angle) * currentSpeed;
        b.combo = 0;
        launched = true;
      }
    }
    if (launched) {
      ArcadeAudio.sfx.drop();
      this.createFloatingText('BALL LAUNCH! 🚀', this.paddle.x, this.paddle.y - 30, '#00f3ff');
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
    } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.launchDockedBalls();
      if (this.laserTimer > 0) {
        this.fireLasers();
      }
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = false;
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    this.isPointerDown = true;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.paddle.targetX = this.pointerX;

    this.launchDockedBalls();
    if (this.laserTimer > 0) {
      this.fireLasers();
    }
  }

  handlePointerMove(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
    this.paddle.targetX = this.pointerX;
  }

  handlePointerUp() {
    this.isPointerDown = false;
  }

  fireLasers() {
    if (this.laserCooldown > 0) return;
    this.laserCooldown = 12; // brief rate limiter for tap-fire

    ArcadeAudio.sfx.laser();
    const halfW = this.paddle.width / 2;
    // Twin laser bolts from paddle tips
    this.lasers.push({
      x: this.paddle.x - halfW * 0.75,
      y: this.paddle.y - this.paddle.height / 2 - 6,
      vy: -11,
      w: 4,
      h: 14
    });
    this.lasers.push({
      x: this.paddle.x + halfW * 0.75,
      y: this.paddle.y - this.paddle.height / 2 - 6,
      vy: -11,
      w: 4,
      h: 14
    });
  }

  update() {
    if (this.isDying) {
      this.deathTimer++;
      if (this.deathTimer > 45) {
        this.finishGameOver();
      }
      return;
    }

    // Advance match game time
    this.gameTime++;

    // Check speed tier milestones for celebratory announcement
    const currentMult = this.getSpeedMultiplier();
    const currentTier = Math.floor(currentMult * 5) / 5;
    if (currentTier > this.lastSpeedTier) {
      this.lastSpeedTier = currentTier;
      ArcadeAudio.sfx.star(4);
      this.createFloatingText(`⚡ SPEED UP! ${currentTier.toFixed(1)}x ⚡`, this.logicalWidth / 2, this.logicalHeight * 0.42, '#ffd700');
      this.createShockwave(this.logicalWidth / 2, this.logicalHeight * 0.42, '#ffd700');
    }

    // 1. Paddle movement & physics interpolation
    const keyboardSpeed = 7.5 * Math.min(1.35, 0.75 + currentMult * 0.25);
    if (this.keys.left) {
      this.paddle.targetX -= keyboardSpeed;
    }
    if (this.keys.right) {
      this.paddle.targetX += keyboardSpeed;
    }

    const minX = this.paddle.width / 2 + 6;
    const maxX = this.logicalWidth - this.paddle.width / 2 - 6;
    this.paddle.targetX = Math.max(minX, Math.min(maxX, this.paddle.targetX));

    // Smooth paddle tracking
    this.paddle.x += (this.paddle.targetX - this.paddle.x) * 0.35;

    // Paddle spring recoil
    this.paddle.scaleX += (1 - this.paddle.scaleX) * 0.2;
    this.paddle.scaleY += (1 - this.paddle.scaleY) * 0.2;

    // Wide paddle powerup management
    if (this.wideTimer > 0) {
      this.wideTimer--;
      this.paddle.targetWidth = 126;
    } else {
      this.paddle.targetWidth = this.paddle.baseWidth;
    }
    this.paddle.width += (this.paddle.targetWidth - this.paddle.width) * 0.15;

    // Laser timer & auto-firing
    if (this.laserTimer > 0) {
      this.laserTimer--;
      if (this.laserCooldown > 0) this.laserCooldown--;
      if (this.laserTimer % 22 === 0) {
        this.fireLasers();
      }
    }

    // Slow-mo timer
    if (this.slowTimer > 0) {
      this.slowTimer--;
    }

    // 2. Descent timer & speed
    this.descentMaxTime = this.getDescentMaxTime();
    const slowFactor = this.slowTimer > 0 ? 0.6 : 1.0;
    this.descentTimer += slowFactor;
    if (this.descentTimer >= this.descentMaxTime) {
      this.descentTimer = 0;
      this.triggerDescent();
    }

    // 3. Smooth brick animation towards targetY
    let minDistanceToDanger = 999;
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      b.y += (b.targetY - b.y) * 0.2;
      if (b.flashTimer > 0) b.flashTimer--;

      const dist = this.dangerY - (b.y + b.h);
      if (dist < minDistanceToDanger) {
        minDistanceToDanger = dist;
      }
    }
    this.isDangerNear = minDistanceToDanger < 38;

    // 4. Update Balls
    const ballSpeedMod = this.slowTimer > 0 ? 0.8 : 1.0;
    const targetMinSpeed = this.getBaseBallSpeed();

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      if (ball.docked) {
        ball.speed = targetMinSpeed;
        ball.x = this.paddle.x;
        ball.y = this.paddle.y - this.paddle.height / 2 - ball.radius - 1;
        continue;
      }

      // Smoothly accelerate ball in flight if below the escalating base speed floor
      const curSpeed = Math.hypot(ball.vx, ball.vy);
      if (curSpeed < targetMinSpeed && curSpeed > 0.1) {
        const factor = Math.min(1.025, targetMinSpeed / curSpeed);
        ball.vx *= factor;
        ball.vy *= factor;
      }

      // Ball trail
      ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.6 });
      if (ball.trail.length > 8) ball.trail.shift();

      // Dynamic substep movement for high-speed precision (prevents tunneling through bricks)
      const currentBallSpeed = Math.hypot(ball.vx, ball.vy);
      const steps = Math.max(2, Math.ceil(currentBallSpeed / 3.0));
      const stepVx = (ball.vx * ballSpeedMod) / steps;
      const stepVy = (ball.vy * ballSpeedMod) / steps;

      for (let s = 0; s < steps; s++) {
        ball.x += stepVx;
        ball.y += stepVy;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          ArcadeAudio.sfx.drop();
        } else if (ball.x + ball.radius >= this.logicalWidth) {
          ball.x = this.logicalWidth - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          ArcadeAudio.sfx.drop();
        }

        // Ceiling collision
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          ArcadeAudio.sfx.drop();
        }

        // Brick collisions check
        let hitBrick = false;
        for (let bIdx = this.bricks.length - 1; bIdx >= 0; bIdx--) {
          const brick = this.bricks[bIdx];
          if (this.checkBallBrickCollision(ball, brick)) {
            hitBrick = true;
            break;
          }
        }
        if (hitBrick) break;

        // Paddle collision check
        if (ball.vy > 0 && this.checkBallPaddleCollision(ball)) {
          break;
        }
      }

      // Safeguard against purely horizontal bounces
      if (Math.abs(ball.vy) < 1.2) {
        ball.vy = ball.vy >= 0 ? 1.5 : -1.5;
      }

      // Ball lost below screen
      if (ball.y - ball.radius > this.logicalHeight) {
        this.balls.splice(i, 1);
      }
    }

    // 5. Check if all balls were lost
    if (this.balls.length === 0) {
      this.lives--;
      this.shakeIntensity = 8;
      ArcadeAudio.sfx.buzz();

      if (this.lives > 0) {
        this.createFloatingText(`BALL LOST! ❤️ ${this.lives} REMAINING`, this.logicalWidth / 2, this.paddle.y - 40, '#ff0055');
        this.spawnDockedBall();
      } else {
        this.triggerGameOver('ALL BALLS LOST!');
      }
    }

    // 6. Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y += l.vy;

      // Check collision with bricks
      let hit = false;
      for (let bIdx = this.bricks.length - 1; bIdx >= 0; bIdx--) {
        const brick = this.bricks[bIdx];
        if (
          l.x >= brick.x &&
          l.x <= brick.x + brick.w &&
          l.y >= brick.y &&
          l.y <= brick.y + brick.h
        ) {
          hit = true;
          this.damageBrick(brick, 1, 1);
          this.createLaserImpact(l.x, l.y);
          break;
        }
      }

      if (hit || l.y < -20) {
        this.lasers.splice(i, 1);
      }
    }

    // 7. Update Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy;

      // Paddle collection check
      const halfW = this.paddle.width / 2;
      const halfH = this.paddle.height / 2;
      if (
        p.y + p.radius >= this.paddle.y - halfH &&
        p.y - p.radius <= this.paddle.y + halfH &&
        p.x >= this.paddle.x - halfW - 6 &&
        p.x <= this.paddle.x + halfW + 6
      ) {
        // Power-up caught!
        this.applyPowerup(p.type);
        this.createFloatingText(`+ ${p.name.toUpperCase()}!`, this.paddle.x, this.paddle.y - 25, p.color);
        this.powerups.splice(i, 1);
        continue;
      }

      // Fallen below screen
      if (p.y > this.logicalHeight + 30) {
        this.powerups.splice(i, 1);
      }
    }

    // 8. Update Shockwaves & Particles
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.vRadius;
      sw.alpha -= 0.04;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 9. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // 10. Board Clear Check: if all bricks are cleared, force extra rows!
    if (this.bricks.length === 0 && !this.isDying && this.isRunning) {
      this.handleBoardCleared();
    }
  }

  handleBoardCleared() {
    if (!this.isRunning || this.isDying) return;

    this.stage += 1;
    const clearBonus = 2000 + (this.stage * 500);
    this.score += clearBonus;
    this.onScoreUpdate(this.score);

    ArcadeAudio.sfx.perfect(8);
    setTimeout(() => ArcadeAudio.sfx.star(5), 90);
    this.shakeIntensity = 8;

    this.createFloatingText(`BOARD CLEARED! +${clearBonus} 🌟`, this.logicalWidth / 2, this.logicalHeight * 0.36, '#00ff88');
    this.createFloatingText('EXTRA ROWS INCOMING! ⚡', this.logicalWidth / 2, this.logicalHeight * 0.36 + 24, '#00f3ff');
    this.createShockwave(this.logicalWidth / 2, this.logicalHeight * 0.36, '#00f3ff');

    // Reset descent timer so player has a fresh timer cycle to clear the new rows
    this.descentTimer = 0;
    this.descentMaxTime = this.getDescentMaxTime();

    // Force a couple of extra rows (spawns 3 fresh rows at top with slide-in animation)
    const extraRows = 3;
    for (let r = 0; r < extraRows; r++) {
      this.spawnRow(r, 2);
    }
  }

  checkBallBrickCollision(ball, brick) {
    // Find closest point on brick to ball center
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < ball.radius * ball.radius) {
      // Collision detected!
      // Resolve bounce axis based on penetration depth
      const overlapX = ball.radius - Math.abs(dx);
      const overlapY = ball.radius - Math.abs(dy);

      if (overlapX < overlapY) {
        ball.vx = -ball.vx;
        ball.x += dx > 0 ? overlapX : -overlapX;
      } else {
        ball.vy = -ball.vy;
        ball.y += dy > 0 ? overlapY : -overlapY;
      }

      // Damage the brick
      ball.combo++;
      this.damageBrick(brick, 1, ball.combo);
      return true;
    }

    return false;
  }

  damageBrick(brick, amount, comboMultiplier = 1) {
    brick.hp -= amount;
    brick.flashTimer = 6;
    this.shakeIntensity = Math.max(this.shakeIntensity, 2);

    if (brick.hp > 0) {
      // Damaged but still standing
      ArcadeAudio.sfx.brickHit(comboMultiplier);
      const pts = 50 * comboMultiplier;
      this.score += pts;
      this.onScoreUpdate(this.score);
      this.createDebris(brick.x + brick.w / 2, brick.y + brick.h / 2, this.getBrickColor(brick), 4);
    } else {
      // Brick obliterated!
      this.destroyBrick(brick, comboMultiplier);
    }
  }

  destroyBrick(brick, comboMultiplier = 1) {
    // Remove from bricks list
    const idx = this.bricks.indexOf(brick);
    if (idx !== -1) {
      this.bricks.splice(idx, 1);
    }

    const bx = brick.x + brick.w / 2;
    const by = brick.y + brick.h / 2;

    if (brick.type === 'bomb') {
      // Detonate 3x3 explosive bomb!
      ArcadeAudio.sfx.explosion();
      this.shakeIntensity = 10;
      this.createBombExplosion(bx, by);

      const pts = 800 * comboMultiplier;
      this.score += pts;
      this.onScoreUpdate(this.score);
      this.createFloatingText(`BOOM! +${pts}`, bx, by, '#ff9900');

      // Explode adjacent bricks within radius
      const blastRadius = 78;
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const other = this.bricks[i];
        const ox = other.x + other.w / 2;
        const oy = other.y + other.h / 2;
        const dist = Math.hypot(ox - bx, oy - by);
        if (dist <= blastRadius) {
          this.damageBrick(other, other.hp, comboMultiplier + 1);
        }
      }
    } else {
      // Standard / Reinforced / Armored destruction
      ArcadeAudio.sfx.brickHit(comboMultiplier);
      const basePoints = brick.maxHp === 3 ? 500 : brick.maxHp === 2 ? 250 : 100;
      const pts = basePoints * comboMultiplier;
      this.score += pts;
      this.onScoreUpdate(this.score);

      const bonusLabel = comboMultiplier > 1 ? `+${pts} (x${comboMultiplier})` : `+${pts}`;
      this.createFloatingText(bonusLabel, bx, by, this.getBrickColor(brick));
      this.createDebris(bx, by, this.getBrickColor(brick), 10);

      // Spawn falling power-up capsule if brick carried one
      if (brick.powerup) {
        this.spawnPowerup(bx, by, brick.powerup);
      }
    }
  }

  checkBallPaddleCollision(ball) {
    const halfW = this.paddle.width / 2;
    const halfH = this.paddle.height / 2;

    if (
      ball.y + ball.radius >= this.paddle.y - halfH &&
      ball.y - ball.radius <= this.paddle.y + halfH &&
      ball.x >= this.paddle.x - halfW - 4 &&
      ball.x <= this.paddle.x + halfW + 4
    ) {
      // Deflect! Variable bounce angle based on point of contact
      const offsetNorm = (ball.x - this.paddle.x) / halfW;
      const clampedOffset = Math.max(-0.92, Math.min(0.92, offsetNorm));

      // Up to ~68 degrees angle from vertical
      const maxBounceAngle = Math.PI * 0.38;
      const bounceAngle = clampedOffset * maxBounceAngle - Math.PI / 2;

      // Dynamic speed scaling with rallies and time-based floor & ceiling
      const minSpeed = this.getBaseBallSpeed();
      const currentSpeed = Math.hypot(ball.vx, ball.vy);
      const maxSpeed = 8.6 * Math.min(1.5, this.getSpeedMultiplier());
      const newSpeed = Math.min(maxSpeed, Math.max(minSpeed, currentSpeed + 0.08));

      ball.vx = Math.cos(bounceAngle) * newSpeed;
      ball.vy = Math.sin(bounceAngle) * newSpeed;

      // Ensure ball doesn't clip into paddle
      ball.y = this.paddle.y - halfH - ball.radius - 1;

      // Reset ball combo for next volley & play bounce sound
      ArcadeAudio.sfx.pongBounce(Math.min(ball.combo, 8));
      ball.combo = 0;

      // Paddle spring squish
      this.paddle.scaleX = 1.18;
      this.paddle.scaleY = 0.72;

      // Increment paddle hits towards next descent
      this.paddleBounceCounter++;
      if (this.paddleBounceCounter % 14 === 0) {
        this.descentTimer += 80; // accelerate descent if player takes long rallies
      }

      return true;
    }

    return false;
  }

  spawnPowerup(x, y, type) {
    let color = '#00f3ff';
    let name = 'Multiball';
    let label = 'M';

    if (type === 'laser') {
      color = '#ff0055';
      name = 'Twin Lasers';
      label = 'L';
    } else if (type === 'wide') {
      color = '#00ff88';
      name = 'Wide Paddle';
      label = 'W';
    } else if (type === 'bomb') {
      color = '#ffaa00';
      name = 'Row Nuke';
      label = 'B';
    } else if (type === 'slow') {
      color = '#bf55ec';
      name = 'Slow-Mo';
      label = 'S';
    }

    this.powerups.push({
      x: x,
      y: y,
      vy: 2.1 * Math.min(1.4, this.getSpeedMultiplier()),
      radius: 11,
      type: type,
      name: name,
      label: label,
      color: color
    });
  }

  applyPowerup(type) {
    ArcadeAudio.sfx.star(3);

    if (type === 'multiball') {
      // Spawn 2 extra active balls with divergent upward paths scaled to current tempo
      const currentBallSpeed = this.getBaseBallSpeed();
      const baseBall = this.balls[0] || { x: this.paddle.x, y: this.paddle.y - 20, speed: currentBallSpeed };
      for (let k = -1; k <= 1; k += 2) {
        this.balls.push({
          x: baseBall.x,
          y: baseBall.y,
          vx: k * (currentBallSpeed * 0.65),
          vy: -(currentBallSpeed * 0.8),
          radius: 5.5,
          speed: currentBallSpeed,
          docked: false,
          combo: 0,
          trail: []
        });
      }
    } else if (type === 'laser') {
      this.laserTimer = 540; // 9 seconds
    } else if (type === 'wide') {
      this.wideTimer = 600; // 10 seconds
    } else if (type === 'bomb') {
      // Nuke the lowest row of bricks
      this.nukeLowestRow();
    } else if (type === 'slow') {
      this.slowTimer = 480; // 8 seconds
    }
  }

  nukeLowestRow() {
    if (this.bricks.length === 0) return;

    let maxRow = -1;
    for (let i = 0; i < this.bricks.length; i++) {
      if (this.bricks[i].row > maxRow) {
        maxRow = this.bricks[i].row;
      }
    }

    ArcadeAudio.sfx.explosion();
    this.shakeIntensity = 12;

    const rowBricks = this.bricks.filter(b => b.row === maxRow);
    rowBricks.forEach(b => {
      this.destroyBrick(b, 2);
    });

    this.createFloatingText('ROW OBLITERATED! 💣', this.logicalWidth / 2, this.dangerY - 30, '#ffaa00');
  }

  createDebris(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        size: 3 + Math.random() * 5,
        alpha: 1,
        color: color
      });
    }
  }

  createShockwave(x, y, color = '#00f3ff') {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 12,
      vRadius: 7,
      alpha: 1,
      color: color
    });
  }

  createBombExplosion(x, y) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      vRadius: 6,
      alpha: 1,
      color: '#ff9900'
    });

    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        size: 4 + Math.random() * 7,
        alpha: 1,
        color: i % 2 === 0 ? '#ff0055' : '#ffcc00'
      });
    }
  }

  createLaserImpact(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 2) + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: 0,
        vRot: 0,
        size: 2.5,
        alpha: 1,
        color: '#ff0055'
      });
    }
  }

  createFloatingText(text, x, y, color = '#00f3ff') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.3,
      alpha: 1,
      color: color
    });
  }

  getBrickColor(brick) {
    if (brick.type === 'bomb') return '#ff5500';
    if (brick.hp === 3) return '#ffaa00'; // Amber/Gold
    if (brick.hp === 2) return '#ff0077'; // Magenta
    return '#00f3ff'; // Cyan
  }

  triggerGameOver(reason) {
    if (this.isDying) return;
    this.isDying = true;
    this.deathTimer = 0;
    this.shakeIntensity = 14;
    ArcadeAudio.sfx.explosion();
    this.createFloatingText(reason, this.logicalWidth / 2, this.logicalHeight / 2 - 20, '#ff0055');
  }

  finishGameOver() {
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

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // Clear background
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Subtle cyber grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridStep = 30;
    for (let x = 0; x < this.logicalWidth; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.logicalHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.logicalHeight; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.logicalWidth, y);
      ctx.stroke();
    }
    ctx.restore();

    // 1. Danger Threshold Line
    this.renderDangerLine(ctx);

    // 2. Bricks
    this.renderBricks(ctx);

    // 3. Shockwaves & Particles
    this.renderEffects(ctx);

    // 4. Powerup Capsules
    this.renderPowerups(ctx);

    // 5. Laser Projectiles
    this.renderLasers(ctx);

    // 6. Paddle
    this.renderPaddle(ctx);

    // 7. Balls
    this.renderBalls(ctx);

    // 8. HUD & Descent Gauge
    this.renderHUD(ctx);

    // 9. Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderDangerLine(ctx) {
    ctx.save();
    const isPulsing = this.isDangerNear;
    const alpha = isPulsing ? 0.85 + Math.sin(Date.now() * 0.012) * 0.15 : 0.45;
    const strokeColor = isPulsing ? `rgba(255, 0, 85, ${alpha})` : `rgba(255, 60, 60, ${alpha})`;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    ctx.moveTo(0, this.dangerY);
    ctx.lineTo(this.logicalWidth, this.dangerY);
    ctx.stroke();

    // Danger text warning badge
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = isPulsing ? '#ff0055' : 'rgba(255, 60, 60, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ DANGER THRESHOLD ⚠️', this.logicalWidth / 2, this.dangerY + 14);

    ctx.restore();
  }

  renderBricks(ctx) {
    for (let i = 0; i < this.bricks.length; i++) {
      const b = this.bricks[i];
      ctx.save();

      const color = this.getBrickColor(b);
      const isFlashing = b.flashTimer > 0;

      // Glow outline
      ctx.shadowColor = color;
      ctx.shadowBlur = isFlashing ? 14 : 6;

      // Brick background
      ctx.fillStyle = isFlashing ? '#ffffff' : color;
      this.drawRoundedRect(ctx, b.x, b.y, b.w, b.h, 3);
      ctx.fill();

      // Inner bevel / shaded gradient
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(b.x + 2, b.y + b.h - 4, b.w - 4, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, 2);

      // Cracked visual if damaged
      if (b.hp < b.maxHp && b.type !== 'bomb') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.3, b.y + 2);
        ctx.lineTo(b.x + b.w * 0.45, b.y + b.h * 0.55);
        ctx.lineTo(b.x + b.w * 0.7, b.y + b.h - 2);
        ctx.stroke();
      }

      // Bomb icon or Powerup Indicator Badge inside brick
      if (b.type === 'bomb') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', b.x + b.w / 2, b.y + b.h / 2);
      } else if (b.powerup) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelMap = { multiball: 'M', laser: 'L', wide: 'W', bomb: 'B', slow: 'S' };
        ctx.fillText(`★${labelMap[b.powerup]}`, b.x + b.w / 2, b.y + b.h / 2);
      }

      ctx.restore();
    }
  }

  renderPaddle(ctx) {
    ctx.save();
    ctx.translate(this.paddle.x, this.paddle.y);
    ctx.scale(this.paddle.scaleX, this.paddle.scaleY);

    const halfW = this.paddle.width / 2;
    const halfH = this.paddle.height / 2;

    const hasLaser = this.laserTimer > 0;
    const hasWide = this.wideTimer > 0;

    const paddleColor = hasLaser ? '#ff0055' : hasWide ? '#00ff88' : '#00f3ff';

    // Paddle neon glow
    ctx.shadowColor = paddleColor;
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = paddleColor;
    this.drawRoundedRect(ctx, -halfW, -halfH, this.paddle.width, this.paddle.height, 5);
    ctx.fill();

    // Core neon stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-halfW + 8, -2, this.paddle.width - 16, 4);

    // Twin laser cannons mounted if laser powerup is active
    if (hasLaser) {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-halfW * 0.85, -halfH - 6, 5, 8);
      ctx.fillRect(halfW * 0.85 - 5, -halfH - 6, 5, 8);
    }

    ctx.restore();
  }

  renderBalls(ctx) {
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      ctx.save();

      // Ball trail
      for (let t = 0; t < b.trail.length; t++) {
        const pt = b.trail[t];
        ctx.fillStyle = `rgba(0, 243, 255, ${pt.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, b.radius * (0.4 + (t / b.trail.length) * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // Ball glow & core
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Docked aiming reticle & launch prompt
      if (b.docked) {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y - 45);
        ctx.stroke();

        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f3ff';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO LAUNCH 🚀', this.logicalWidth / 2, this.paddle.y - 36);
      }

      ctx.restore();
    }
  }

  renderPowerups(ctx) {
    for (let i = 0; i < this.powerups.length; i++) {
      const p = this.powerups[i];
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      // Capsule body
      ctx.fillStyle = p.color;
      this.drawRoundedRect(ctx, p.x - p.radius, p.y - p.radius * 0.7, p.radius * 2, p.radius * 1.4, 6);
      ctx.fill();

      // Capsule text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x, p.y);

      ctx.restore();
    }
  }

  renderLasers(ctx) {
    for (let i = 0; i < this.lasers.length; i++) {
      const l = this.lasers[i];
      ctx.save();
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(l.x - l.w / 4, l.y + 2, l.w / 2, l.h - 4);
      ctx.restore();
    }
  }

  renderEffects(ctx) {
    // Shockwaves
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  renderHUD(ctx) {
    ctx.save();

    // Top status row
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    // Lives indicator
    let hearts = '';
    for (let i = 0; i < this.lives; i++) hearts += '❤️';
    ctx.fillText(hearts || '💀', 16, 24);

    // Active power-up indicators & Speed status
    const speedMult = this.getSpeedMultiplier();
    const speedMultStr = `${speedMult.toFixed(1)}x`;
    let powerLabel = '';
    if (this.laserTimer > 0) powerLabel += 'LASERS ';
    if (this.wideTimer > 0) powerLabel += 'WIDE ';
    if (this.slowTimer > 0) powerLabel += 'SLOW ';

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'right';

    if (powerLabel) {
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`${powerLabel.trim()} ${speedMultStr}`, this.logicalWidth - 16, 24);
    } else {
      ctx.fillStyle = speedMult >= 1.4 ? '#ffd700' : 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(`W${this.stage} • ${speedMultStr} SPD`, this.logicalWidth - 16, 24);
    }

    // Descent Warning Gauge Bar
    const gaugeW = 120;
    const gaugeH = 6;
    const gaugeX = this.logicalWidth / 2 - gaugeW / 2;
    const gaugeY = 18;

    const progress = Math.min(1, this.descentTimer / this.descentMaxTime);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);

    const gaugeColor = progress > 0.8 ? '#ff0055' : progress > 0.5 ? '#ffaa00' : '#00f3ff';
    ctx.fillStyle = gaugeColor;
    ctx.shadowColor = gaugeColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(gaugeX, gaugeY, gaugeW * progress, gaugeH);

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = gaugeColor;
    ctx.textAlign = 'center';
    ctx.fillText('DESCENT', this.logicalWidth / 2, 14);

    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
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

window.BrickSmasherGame = BrickSmasherGame;
