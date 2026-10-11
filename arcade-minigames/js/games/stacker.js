/**
 * Tower Stacker - Classic arcade block stacking game.
 * Fully touch-compatible, handles high-DPI canvases, slice debris physics, and combo multipliers.
 */
class StackerGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.combo = 0;

    // Dimensions & coordinate mapping
    this.blockHeight = 32;
    this.baseWidth = 200;
    this.blocks = [];
    this.debris = [];
    this.particles = [];

    // Current moving block
    this.current = null;
    this.speed = 3;
    this.direction = 1;

    // Camera view offset
    this.cameraY = 0;
    this.targetCameraY = 0;

    // Screen shake
    this.shakeIntensity = 0;
    this.animId = null;

    // Bound input handlers
    this.handleInput = this.handleInput.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Abort previous RAF loop and detach listeners
    this.resize();
    this.score = 0;
    this.combo = 0;
    this.speed = 3.2;
    this.direction = 1;
    this.blocks = [];
    this.debris = [];
    this.particles = [];
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.shakeIntensity = 0;

    // Base stationary block at bottom
    const startY = this.logicalHeight - 80;
    const startX = (this.logicalWidth - this.baseWidth) / 2;

    this.blocks.push({
      x: startX,
      y: startY,
      width: this.baseWidth,
      height: this.blockHeight,
      hue: 200
    });

    this.spawnNextBlock();
    this.isRunning = true;

    // Attach touch and keyboard listeners
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
    this.canvas.addEventListener('pointerdown', this.handleInput);
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  detachEvents() {
    this.canvas.removeEventListener('pointerdown', this.handleInput);
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault();
      this.handleInput();
    }
  }

  handleInput(e) {
    if (e) {
      e.preventDefault();
    }
    if (!this.isRunning || !this.current) return;
    this.placeBlock();
  }

  spawnNextBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const y = prev.y - this.blockHeight;
    const hue = (this.blocks.length * 14 + 190) % 360;

    this.current = {
      x: this.direction === 1 ? -prev.width : this.logicalWidth,
      y: y,
      width: prev.width,
      height: this.blockHeight,
      hue: hue
    };

    // Keep camera following stack height
    const idealY = this.logicalHeight - 200;
    if (y < idealY) {
      this.targetCameraY = idealY - y;
    }
  }

  placeBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const cur = this.current;

    const diff = cur.x - prev.x;
    const absDiff = Math.abs(diff);

    // 1. Check for Perfect Placement (within 4 pixels tolerance)
    if (absDiff <= 4) {
      cur.x = prev.x;
      this.combo++;
      // Score scaled by 100x
      this.score += (1 + Math.floor(this.combo / 3)) * 100;
      this.shakeIntensity = 4;
      ArcadeAudio.sfx.perfect(this.combo);
      this.createSparkles(cur.x + cur.width / 2, cur.y + cur.height / 2, cur.hue);

      this.blocks.push(cur);
      this.onScoreUpdate(this.score);
      this.speed = Math.min(8.5, this.speed + 0.15);
      this.direction *= -1;
      this.spawnNextBlock();
      return;
    }

    this.combo = 0; // reset combo

    // 2. Check for Complete Miss (Game Over)
    if (absDiff >= prev.width) {
      // Missed entirely - block falls down as debris
      this.debris.push({
        x: cur.x,
        y: cur.y,
        width: cur.width,
        height: cur.height,
        hue: cur.hue,
        vx: this.direction * (this.speed * 0.8),
        vy: 2,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.1
      });
      this.shakeIntensity = 10;
      ArcadeAudio.sfx.drop();
      this.gameOver();
      return;
    }

    // 3. Slice Block Overhang
    const newWidth = prev.width - absDiff;
    let newX, debrisX, debrisWidth;

    if (diff > 0) {
      // Overhang is on right side
      newX = cur.x;
      debrisX = cur.x + newWidth;
      debrisWidth = absDiff;
    } else {
      // Overhang is on left side
      newX = prev.x;
      debrisX = cur.x;
      debrisWidth = absDiff;
    }

    // Kept slice
    const slicedBlock = {
      x: newX,
      y: cur.y,
      width: newWidth,
      height: cur.height,
      hue: cur.hue
    };
    this.blocks.push(slicedBlock);

    // Falling debris slice
    this.debris.push({
      x: debrisX,
      y: cur.y,
      width: debrisWidth,
      height: cur.height,
      hue: cur.hue,
      vx: (diff > 0 ? 2 : -2),
      vy: 1,
      rot: 0,
      vRot: (diff > 0 ? 0.05 : -0.05)
    });

    ArcadeAudio.sfx.slice();
    this.shakeIntensity = 3;
    this.score += 100;
    this.onScoreUpdate(this.score);

    this.speed = Math.min(8.5, this.speed + 0.12);
    this.direction *= -1;
    this.spawnNextBlock();
  }

  createSparkles(x, y, hue) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
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

  gameOver() {
    this.isRunning = false;
    this.current = null;
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

  update() {
    // Smooth camera lag
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.85;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Moving block
    if (this.current) {
      this.current.x += this.speed * this.direction;

      // Bounce against edges
      if (this.current.x + this.current.width > this.logicalWidth + 40) {
        this.direction = -1;
      } else if (this.current.x < -40) {
        this.direction = 1;
      }
    }

    // Debris physics
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.vy += 0.35; // gravity
      d.x += d.vx;
      d.y += d.vy;
      d.rot += d.vRot;

      // Clean up fallen debris
      if (d.y > this.logicalHeight + 200) {
        this.debris.splice(i, 1);
      }
    }

    // Sparkles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
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

    // Camera offset
    ctx.translate(0, this.cameraY);

    // Draw stacked blocks
    for (const b of this.blocks) {
      ctx.fillStyle = `hsl(${b.hue}, 85%, 55%)`;
      ctx.shadowColor = `hsl(${b.hue}, 100%, 50%)`;
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Top bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 0;
      ctx.fillRect(b.x, b.y, b.width, 3);
    }

    // Draw active moving block
    if (this.current) {
      const c = this.current;
      ctx.fillStyle = `hsl(${c.hue}, 90%, 60%)`;
      ctx.shadowColor = `hsl(${c.hue}, 100%, 65%)`;
      ctx.shadowBlur = 12;
      ctx.fillRect(c.x, c.y, c.width, c.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 0;
      ctx.fillRect(c.x, c.y, c.width, 3);
    }

    // Draw debris
    for (const d of this.debris) {
      ctx.save();
      ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
      ctx.rotate(d.rot);
      ctx.fillStyle = `hsl(${d.hue}, 70%, 45%)`;
      ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
      ctx.restore();
    }

    // Draw sparkles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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
window.StackerGame = StackerGame;
