/**
 * Endless Snake - Cyberpunk arcade grid snake with input turn-buffering,
 * swipe gestures, on-screen D-pad, golden bonus apples, and high-DPI rendering.
 */
class SnakeGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.applesEaten = 0;

    // Grid properties
    this.gridCols = 20;
    this.gridRows = 20;
    this.cellSize = 18;
    this.boardX = 0;
    this.boardY = 0;

    // Snake state
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.inputQueue = [];

    // Food items
    this.food = { x: 0, y: 0 };
    this.bonusFood = null; // { x, y, timer, maxTimer }
    this.bonusSpawnCounter = 0;

    // Timing & tick
    this.lastTickTime = 0;
    this.baseTickDelay = 130; // ms
    this.currentTickDelay = 130;

    // Visuals & Effects
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.animId = null;

    // Touch swipe state
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Virtual Thumb Joystick State
    this.joystickBase = { x: 0, y: 0, radius: 44 };
    this.joystickKnob = { x: 0, y: 0, radius: 21 };
    this.joystickTargetKnob = { x: 0, y: 0 };
    this.joystickActive = false;
    this.joystickDeadzone = 11;
    this.joystickMaxDist = 32;
    this.lastJoystickDir = { x: 0, y: 0 };

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.applesEaten = 0;
    this.shakeIntensity = 0;
    this.baseTickDelay = 130;
    this.currentTickDelay = 130;
    this.lastTickTime = performance.now();

    this.particles = [];
    this.floatingTexts = [];
    this.inputQueue = [];

    // Reset joystick state
    this.joystickActive = false;
    this.lastJoystickDir = { x: 0, y: 0 };
    this.joystickKnob.x = this.joystickBase.x;
    this.joystickKnob.y = this.joystickBase.y;
    this.joystickTargetKnob.x = this.joystickBase.x;
    this.joystickTargetKnob.y = this.joystickBase.y;

    // Starting snake (length 4, center-left heading right)
    const midY = Math.floor(this.gridRows / 2);
    this.snake = [
      { x: 6, y: midY },
      { x: 5, y: midY },
      { x: 4, y: midY },
      { x: 3, y: midY }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };

    this.spawnFood();
    this.bonusFood = null;
    this.bonusSpawnCounter = 0;

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

    // Calculate maximum square grid size leaving room for bottom HUD/Joystick
    const availableW = this.logicalWidth - 24;
    const availableH = this.logicalHeight - 130;
    const boardSize = Math.floor(Math.min(availableW, availableH));

    this.cellSize = Math.floor(boardSize / this.gridCols);
    const actualBoardSize = this.cellSize * this.gridCols;

    this.boardX = Math.floor((this.logicalWidth - actualBoardSize) / 2);
    this.boardY = 46; // Below score header

    // Setup on-screen Joystick Base (centered in bottom control area)
    const bottomAreaHeight = this.logicalHeight - (this.boardY + actualBoardSize);
    const joyCenterY = this.boardY + actualBoardSize + (bottomAreaHeight / 2) - 3;
    const joyCenterX = this.logicalWidth / 2;

    const baseRadius = Math.max(38, Math.min(48, bottomAreaHeight * 0.36));
    const knobRadius = Math.round(baseRadius * 0.48);

    this.joystickBase = { x: joyCenterX, y: joyCenterY, radius: baseRadius };
    this.joystickKnob = { x: joyCenterX, y: joyCenterY, radius: knobRadius };
    this.joystickTargetKnob = { x: joyCenterX, y: joyCenterY };
    this.joystickMaxDist = baseRadius * 0.72;
    this.joystickDeadzone = 11;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.queueTurn(0, -1);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      this.queueTurn(0, 1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.queueTurn(-1, 0);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.queueTurn(1, 0);
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    this.touchStartX = px;
    this.touchStartY = py;

    const distToJoy = Math.hypot(px - this.joystickBase.x, py - this.joystickBase.y);
    const inBottomArea = py >= (this.boardY + (this.cellSize * this.gridCols) - 10);

    // If tapping on/near joystick or anywhere in bottom control region:
    if (distToJoy <= this.joystickBase.radius * 1.6 || inBottomArea) {
      this.joystickActive = true;
      this.updateJoystick(px, py);
    }
  }

  handlePointerMove(e) {
    if (!this.isRunning) return;
    if (!this.joystickActive) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    this.updateJoystick(px, py);
  }

  updateJoystick(px, py) {
    const dx = px - this.joystickBase.x;
    const dy = py - this.joystickBase.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, this.joystickMaxDist);
    this.joystickTargetKnob.x = this.joystickBase.x + Math.cos(angle) * clampedDist;
    this.joystickTargetKnob.y = this.joystickBase.y + Math.sin(angle) * clampedDist;

    // Detect cardinal direction beyond deadzone
    if (dist >= this.joystickDeadzone) {
      let dirX = 0;
      let dirY = 0;

      // 4-Way cardinal slice (-180 to 180 deg)
      if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
        dirX = 1;
        dirY = 0;
      } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
        dirX = 0;
        dirY = 1;
      } else if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
        dirX = 0;
        dirY = -1;
      } else {
        dirX = -1;
        dirY = 0;
      }

      if (dirX !== this.lastJoystickDir.x || dirY !== this.lastJoystickDir.y) {
        this.lastJoystickDir = { x: dirX, y: dirY };
        this.queueTurn(dirX, dirY);
        ArcadeAudio.sfx.click();
      }
    }
  }

  handlePointerUp(e) {
    if (!this.isRunning) return;

    if (this.joystickActive) {
      this.joystickActive = false;
      this.lastJoystickDir = { x: 0, y: 0 };
      // Spring knob back to center
      this.joystickTargetKnob.x = this.joystickBase.x;
      this.joystickTargetKnob.y = this.joystickBase.y;
      return;
    }

    // Grid swipe support
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const dx = px - this.touchStartX;
    const dy = py - this.touchStartY;

    if (Math.hypot(dx, dy) > 24) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.queueTurn(dx > 0 ? 1 : -1, 0);
      } else {
        this.queueTurn(0, dy > 0 ? 1 : -1);
      }
    }
  }

  queueTurn(x, y) {
    // Determine the reference direction (last queued or current)
    const lastDir = this.inputQueue.length > 0
      ? this.inputQueue[this.inputQueue.length - 1]
      : this.direction;

    // Prevent 180-degree direct reverse into self
    if (x === -lastDir.x && y === -lastDir.y) return;
    // Prevent duplicate turn in same direction
    if (x === lastDir.x && y === lastDir.y) return;

    // Buffer up to 2 pending turns
    if (this.inputQueue.length < 2) {
      this.inputQueue.push({ x, y });
    }
  }

  spawnFood() {
    let emptySpots = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const inSnake = this.snake.some(s => s.x === c && s.y === r);
        const inBonus = this.bonusFood && this.bonusFood.x === c && this.bonusFood.y === r;
        if (!inSnake && !inBonus) {
          emptySpots.push({ x: c, y: r });
        }
      }
    }

    if (emptySpots.length > 0) {
      this.food = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }
  }

  spawnBonusFood() {
    let emptySpots = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const inSnake = this.snake.some(s => s.x === c && s.y === r);
        const inFood = this.food.x === c && this.food.y === r;
        if (!inSnake && !inFood) {
          emptySpots.push({ x: c, y: r });
        }
      }
    }

    if (emptySpots.length > 0) {
      const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
      this.bonusFood = {
        x: spot.x,
        y: spot.y,
        timer: 80, // ~10 seconds at tick rate
        maxTimer: 80
      };
    }
  }

  step() {
    // Process next queued turn
    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // 1. Check Wall Collision (Solid arcade boundary)
    if (newHead.x < 0 || newHead.x >= this.gridCols || newHead.y < 0 || newHead.y >= this.gridRows) {
      this.triggerDeath('CRASHED INTO WALL!');
      return;
    }

    // 2. Check Self Collision
    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.triggerDeath('SELF-COLLISION!');
      return;
    }

    // Move snake head forward
    this.snake.unshift(newHead);

    // 3. Check Normal Food Eat
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.applesEaten++;
      this.score += 100;
      this.onScoreUpdate(this.score);

      // Accelerate tick speed slightly as snake grows
      this.currentTickDelay = Math.max(68, this.baseTickDelay - Math.floor(this.snake.length * 1.4));

      const foodPxX = this.boardX + this.food.x * this.cellSize + this.cellSize / 2;
      const foodPxY = this.boardY + this.food.y * this.cellSize + this.cellSize / 2;
      this.createSparkles(foodPxX, foodPxY, 140, 14);
      this.createFloatingText('+100', foodPxX, foodPxY, '#00ff88');
      ArcadeAudio.sfx.pop(Math.min(8, Math.floor(this.snake.length / 3)));

      this.spawnFood();

      // Spawn bonus food every 4 normal apples
      this.bonusSpawnCounter++;
      if (this.bonusSpawnCounter >= 4 && !this.bonusFood) {
        this.bonusSpawnCounter = 0;
        this.spawnBonusFood();
      }
    } else if (this.bonusFood && newHead.x === this.bonusFood.x && newHead.y === this.bonusFood.y) {
      // 4. Check Bonus Star Apple Eat
      const bonusPts = 300;
      this.score += bonusPts;
      this.onScoreUpdate(this.score);

      const bPxX = this.boardX + this.bonusFood.x * this.cellSize + this.cellSize / 2;
      const bPxY = this.boardY + this.bonusFood.y * this.cellSize + this.cellSize / 2;
      this.createSparkles(bPxX, bPxY, 48, 22);
      this.createFloatingText(`+${bonusPts}! ⭐`, bPxX, bPxY, '#ffd700');
      this.shakeIntensity = 3;
      ArcadeAudio.sfx.star(4);

      this.bonusFood = null;
    } else {
      // No food eaten: remove tail segment
      this.snake.pop();
    }

    // Tick down bonus food timer
    if (this.bonusFood) {
      this.bonusFood.timer--;
      if (this.bonusFood.timer <= 0) {
        this.bonusFood = null;
      }
    }
  }

  createSparkles(x, y, hue, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
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
      vy: -1.3,
      alpha: 1,
      color: color
    });
  }

  triggerDeath(reason = 'GAME OVER') {
    this.isRunning = false;
    this.shakeIntensity = 12;

    const head = this.snake[0];
    const hx = this.boardX + head.x * this.cellSize + this.cellSize / 2;
    const hy = this.boardY + head.y * this.cellSize + this.cellSize / 2;
    this.createSparkles(hx, hy, 350, 30);

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

    // Smooth knob spring interpolation (lerp towards target)
    this.joystickKnob.x += (this.joystickTargetKnob.x - this.joystickKnob.x) * 0.38;
    this.joystickKnob.y += (this.joystickTargetKnob.y - this.joystickKnob.y) * 0.38;

    // Grid Tick pacing
    const now = performance.now();
    if (now - this.lastTickTime >= this.currentTickDelay) {
      this.step();
      this.lastTickTime = now;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text
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

    const actualBoardSize = this.cellSize * this.gridCols;

    // 1. Draw Top Length HUD
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.fillText(`LENGTH: ${this.snake.length}`, this.boardX, 30);

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`APPLES: ${this.applesEaten}`, this.boardX + actualBoardSize, 30);
    ctx.restore();

    // 2. Draw Grid Arena Border & Subtle Grid Lines
    ctx.save();
    ctx.fillStyle = '#0b101c';
    ctx.fillRect(this.boardX, this.boardY, actualBoardSize, actualBoardSize);

    // Inner subtle grid checker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridCols; i++) {
      ctx.beginPath();
      ctx.moveTo(this.boardX + i * this.cellSize, this.boardY);
      ctx.lineTo(this.boardX + i * this.cellSize, this.boardY + actualBoardSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.boardX, this.boardY + i * this.cellSize);
      ctx.lineTo(this.boardX + actualBoardSize, this.boardY + i * this.cellSize);
      ctx.stroke();
    }

    // Outer Glowing Border
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.strokeRect(this.boardX, this.boardY, actualBoardSize, actualBoardSize);
    ctx.restore();

    // 3. Draw Normal Food (Glowing Apple / Gem)
    ctx.save();
    const fx = this.boardX + this.food.x * this.cellSize + this.cellSize / 2;
    const fy = this.boardY + this.food.y * this.cellSize + this.cellSize / 2;
    const fr = (this.cellSize / 2) * 0.78;

    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fill();

    // Core gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Draw Bonus Food (Golden Star)
    if (this.bonusFood) {
      ctx.save();
      const bx = this.boardX + this.bonusFood.x * this.cellSize + this.cellSize / 2;
      const by = this.boardY + this.bonusFood.y * this.cellSize + this.cellSize / 2;
      const br = (this.cellSize / 2) * 0.85;

      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', bx, by);
      ctx.restore();
    }

    // 5. Draw Snake Body & Head
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const sx = this.boardX + seg.x * this.cellSize;
      const sy = this.boardY + seg.y * this.cellSize;
      const isHead = (i === 0);

      ctx.save();
      if (isHead) {
        // Glowing Head
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(sx + 1, sy + 1, this.cellSize - 2, this.cellSize - 2);

        // Head Eyes
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        const eyeOffset = 3;
        const eyeSize = 3;

        // Position eyes based on direction
        let e1x = sx + eyeOffset, e1y = sy + eyeOffset;
        let e2x = sx + this.cellSize - eyeOffset - eyeSize, e2y = sy + eyeOffset;

        if (this.direction.x === 1) {
          e1x = sx + this.cellSize - eyeOffset - eyeSize; e1y = sy + eyeOffset;
          e2x = sx + this.cellSize - eyeOffset - eyeSize; e2y = sy + this.cellSize - eyeOffset - eyeSize;
        } else if (this.direction.x === -1) {
          e1x = sx + eyeOffset; e1y = sy + eyeOffset;
          e2x = sx + eyeOffset; e2y = sy + this.cellSize - eyeOffset - eyeSize;
        } else if (this.direction.y === 1) {
          e1x = sx + eyeOffset; e1y = sy + this.cellSize - eyeOffset - eyeSize;
          e2x = sx + this.cellSize - eyeOffset - eyeSize; e2y = sy + this.cellSize - eyeOffset - eyeSize;
        }

        ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
        ctx.fillRect(e2x, e2y, eyeSize, eyeSize);

      } else {
        // Gradient Body Segment
        const prog = 1 - (i / this.snake.length);
        const hue = 185 - Math.floor(prog * 50); // Cyan to neon green gradient
        ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
        ctx.fillRect(sx + 1.5, sy + 1.5, this.cellSize - 3, this.cellSize - 3);
      }
      ctx.restore();
    }

    // 6. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
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

    // 8. Draw Virtual Thumb Joystick (Touch Controls at bottom)
    const base = this.joystickBase;
    const knob = this.joystickKnob;

    ctx.save();

    // 8a. Outer Base Housing Plate
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 18, 30, 0.8)';
    ctx.fill();
    ctx.strokeStyle = this.joystickActive ? 'rgba(0, 243, 255, 0.7)' : 'rgba(0, 243, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = this.joystickActive ? 12 : 4;
    ctx.stroke();

    // Inner subtle concentric guide circle
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 8b. Four Directional Notches / Arrows
    const drawNotch = (dx, dy, dirX, dirY) => {
      const isActive = this.lastJoystickDir.x === dirX && this.lastJoystickDir.y === dirY;
      const notchDist = base.radius * 0.76;
      const nx = base.x + dx * notchDist;
      const ny = base.y + dy * notchDist;

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(Math.atan2(dy, dx));

      if (isActive) {
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.45)';
        ctx.shadowBlur = 0;
      }

      // Crisp vector triangle arrow (immune to iOS emoji substitution)
      const s = 6.5;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.7, -s * 0.75);
      ctx.lineTo(-s * 0.7, s * 0.75);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawNotch(0, -1, 0, -1); // Up
    drawNotch(0, 1, 0, 1);   // Down
    drawNotch(-1, 0, -1, 0); // Left
    drawNotch(1, 0, 1, 0);   // Right

    // 8c. Stem / Connecting Rod
    const stemDist = Math.hypot(knob.x - base.x, knob.y - base.y);
    if (stemDist > 3) {
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(knob.x, knob.y);
      ctx.strokeStyle = this.joystickActive ? 'rgba(0, 243, 255, 0.5)' : 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // 8d. Thumbstick Knob (Cap)
    const knobGrad = ctx.createRadialGradient(
      knob.x - knob.radius * 0.3, knob.y - knob.radius * 0.3, 2,
      knob.x, knob.y, knob.radius
    );
    if (this.joystickActive) {
      knobGrad.addColorStop(0, '#00ffff');
      knobGrad.addColorStop(0.5, '#00b8ff');
      knobGrad.addColorStop(1, '#052942');
    } else {
      knobGrad.addColorStop(0, '#00c3ff');
      knobGrad.addColorStop(0.6, '#035e8c');
      knobGrad.addColorStop(1, '#081c2c');
    }

    ctx.beginPath();
    ctx.arc(knob.x, knob.y, knob.radius, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = this.joystickActive ? 14 : 6;
    ctx.fill();

    // Knob rim highlight
    ctx.strokeStyle = this.joystickActive ? '#ffffff' : 'rgba(0, 243, 255, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Thumb grip center ring
    ctx.beginPath();
    ctx.arc(knob.x, knob.y, knob.radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 8e. Joystick Tip label
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(130, 146, 171, 0.6)';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('THUMB JOYSTICK', base.x, base.y + base.radius + 5);

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
window.SnakeGame = SnakeGame;
