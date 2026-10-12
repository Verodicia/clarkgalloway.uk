/**
 * Cyber 2048 - High-Juice Cyberpunk Slide-and-Merge Grid Puzzle.
 * Features animated tile interpolations, musical synth scale chimes,
 * merge particle bursts, swipe & touch controls, and high-DPI canvas scaling.
 */
class Cyber2048Game {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.highestTile = 2;
    this.hasWon2048 = false;

    // Viewport dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // 4x4 Grid definition
    this.size = 4;
    this.grid = []; // 4x4 array of tile objects
    this.animatedTiles = []; // for slide transitions

    // Particles & FX
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;

    // Touch gesture tracking
    this.touchStartPos = null;

    // Tile color palette map
    this.tileColors = {
      2: { bg: '#0e243a', text: '#00f3ff', border: 'rgba(0, 243, 255, 0.4)' },
      4: { bg: '#10304c', text: '#00d2ff', border: 'rgba(0, 210, 255, 0.6)' },
      8: { bg: '#231548', text: '#a855f7', border: 'rgba(168, 85, 247, 0.6)' },
      16: { bg: '#351252', text: '#c084fc', border: 'rgba(192, 132, 252, 0.7)' },
      32: { bg: '#400c32', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.7)' },
      64: { bg: '#4c0519', text: '#ff0055', border: 'rgba(255, 0, 85, 0.8)' },
      128: { bg: '#451a03', text: '#fb923c', border: 'rgba(251, 146, 60, 0.8)' },
      256: { bg: '#422006', text: '#facc15', border: 'rgba(250, 204, 21, 0.9)' },
      512: { bg: '#052e16', text: '#4ade80', border: 'rgba(74, 222, 128, 0.9)' },
      1024: { bg: '#042f2e', text: '#2dd4bf', border: 'rgba(45, 212, 191, 1)' },
      2048: { bg: '#2e1065', text: '#ffd200', border: 'rgba(255, 210, 0, 1)' },
      4096: { bg: '#3b0764', text: '#ffffff', border: 'rgba(255, 255, 255, 1)' }
    };

    // Bound listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.highestTile = 2;
    this.hasWon2048 = false;
    this.shakeIntensity = 0;
    this.particles = [];
    this.floatingTexts = [];

    this.initGrid();
    this.spawnTile();
    this.spawnTile();

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

    // Compute board size & cell dimensions
    const maxBoardDim = Math.min(this.logicalWidth - 32, this.logicalHeight - 130);
    this.boardSize = Math.floor(Math.min(360, maxBoardDim));
    this.boardX = Math.floor((this.logicalWidth - this.boardSize) / 2);
    this.boardY = 56 + Math.floor((this.logicalHeight - 130 - this.boardSize) / 2);

    this.cellGap = 10;
    this.cellSize = Math.floor((this.boardSize - this.cellGap * 5) / 4);
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.size; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.size; c++) {
        this.grid[r][c] = null;
      }
    }
  }

  spawnTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) return null;

    const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const val = Math.random() < 0.9 ? 2 : 4;

    const tile = {
      val,
      r: chosen.r,
      c: chosen.c,
      scale: 0.1,
      targetScale: 1.0,
      merged: false
    };

    this.grid[chosen.r][chosen.c] = tile;
    return tile;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    let dir = null;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') dir = 'up';
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') dir = 'down';
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir = 'left';
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = 'right';

    if (dir) {
      e.preventDefault();
      this.move(dir);
    }
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Bottom touch D-pad helper check
    const dpadY = this.logicalHeight - 48;
    if (y > dpadY - 20) {
      this.handleDpadClick(x);
      return;
    }

    this.touchStartPos = { x, y };
  }

  handlePointerUp(e) {
    if (!this.touchStartPos || !this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - this.touchStartPos.x;
    const dy = y - this.touchStartPos.y;
    const dist = Math.hypot(dx, dy);

    this.touchStartPos = null;

    if (dist > 25) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.move(dx > 0 ? 'right' : 'left');
      } else {
        this.move(dy > 0 ? 'down' : 'up');
      }
    }
  }

  handleDpadClick(px) {
    const w = this.logicalWidth;
    if (px < w * 0.25) this.move('left');
    else if (px < w * 0.5) this.move('down');
    else if (px < w * 0.75) this.move('up');
    else this.move('right');
  }

  move(direction) {
    let moved = false;
    let turnScore = 0;
    let highestMerged = 0;

    // Reset merged flags
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c]) {
          this.grid[r][c].merged = false;
        }
      }
    }

    // Traversal vectors
    const vector = {
      up: { r: -1, c: 0 },
      down: { r: 1, c: 0 },
      left: { r: 0, c: -1 },
      right: { r: 0, c: 1 }
    }[direction];

    // Build row/col traversal orders
    const rIndices = direction === 'down' ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const cIndices = direction === 'right' ? [3, 2, 1, 0] : [0, 1, 2, 3];

    rIndices.forEach(r => {
      cIndices.forEach(c => {
        const tile = this.grid[r][c];
        if (!tile) return;

        let currR = r;
        let currC = c;
        let nextR = currR + vector.r;
        let nextC = currC + vector.c;

        while (nextR >= 0 && nextR < this.size && nextC >= 0 && nextC < this.size) {
          const nextTile = this.grid[nextR][nextC];

          if (!nextTile) {
            // Slide into empty space
            this.grid[nextR][nextC] = tile;
            this.grid[currR][currC] = null;
            tile.r = nextR;
            tile.c = nextC;
            currR = nextR;
            currC = nextC;
            nextR = currR + vector.r;
            nextC = currC + vector.c;
            moved = true;
          } else if (nextTile.val === tile.val && !nextTile.merged) {
            // Merge matching tiles!
            const mergedVal = tile.val * 2;
            nextTile.val = mergedVal;
            nextTile.merged = true;
            nextTile.scale = 1.35; // bounce pop

            this.grid[currR][currC] = null;
            moved = true;
            turnScore += mergedVal;
            highestMerged = Math.max(highestMerged, mergedVal);

            // Trigger merge effects
            this.triggerMergeJuice(nextR, nextC, mergedVal);
            break;
          } else {
            // Blocked
            break;
          }
        }
      });
    });

    if (moved) {
      if (turnScore > 0) {
        this.score += turnScore;
        this.onScoreUpdate(this.score);

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.tileMerge(highestMerged);
        }
      } else {
        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.tileSlide();
        }
      }

      this.spawnTile();

      // Check win or lose
      this.checkState();
    }
  }

  triggerMergeJuice(r, c, val) {
    const px = this.boardX + this.cellGap + c * (this.cellSize + this.cellGap) + this.cellSize / 2;
    const py = this.boardY + this.cellGap + r * (this.cellSize + this.cellGap) + this.cellSize / 2;

    this.highestTile = Math.max(this.highestTile, val);

    // Floating score popup
    this.floatingTexts.push({
      text: `+${val}`,
      x: px,
      y: py - 10,
      vy: -1.2,
      alpha: 1.0,
      color: (this.tileColors[val] || {}).text || '#ffd200'
    });

    // Particle sparks
    const color = (this.tileColors[val] || {}).text || '#00f3ff';
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        decay: 0.05,
        size: Math.random() * 3 + 1.5,
        color
      });
    }

    if (val >= 128) {
      this.shakeIntensity = Math.min(12, Math.log2(val) * 1.2);
    }

    if (val === 2048 && !this.hasWon2048) {
      this.hasWon2048 = true;
      this.floatingTexts.push({
        text: '★ 2048 ACHIEVED! ★',
        x: this.logicalWidth / 2,
        y: this.boardY - 20,
        vy: -0.6,
        alpha: 1.0,
        color: '#ffd200'
      });
      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.newRecord();
      }
    }
  }

  checkState() {
    // Check if any empty cell exists
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) return; // Still playable
      }
    }

    // Check if any adjacent horizontal or vertical merge is possible
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c].val;
        if (r < this.size - 1 && this.grid[r + 1][c].val === val) return;
        if (c < this.size - 1 && this.grid[r][c + 1].val === val) return;
      }
    }

    // No valid moves left -> Game Over!
    this.isRunning = false;
    this.shakeIntensity = 10;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.gameover();
    }

    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
  }

  update() {
    // Smooth tile scale bounce decay
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const t = this.grid[r][c];
        if (t && t.scale !== 1.0) {
          t.scale += (1.0 - t.scale) * 0.22;
        }
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }
  }

  draw() {
    this.ctx.save();

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    // Background
    this.ctx.fillStyle = '#060a14';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Header info (Highest Tile reached)
    this.ctx.fillStyle = '#8292ab';
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('TARGET: 2048', this.boardX, 32);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText(`TOP TILE: ${this.highestTile}`, this.boardX + this.boardSize, 32);

    // Draw Board Cabinet Shell
    this.ctx.fillStyle = '#0d1322';
    this.ctx.fillRect(this.boardX, this.boardY, this.boardSize, this.boardSize);
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.boardX, this.boardY, this.boardSize, this.boardSize);

    // Draw Empty Cell Slots
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cx = this.boardX + this.cellGap + c * (this.cellSize + this.cellGap);
        const cy = this.boardY + this.cellGap + r * (this.cellSize + this.cellGap);

        this.ctx.fillStyle = '#131b2e';
        this.ctx.fillRect(cx, cy, this.cellSize, this.cellSize);
      }
    }

    // Draw Occupied Tiles
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        const cx = this.boardX + this.cellGap + c * (this.cellSize + this.cellGap);
        const cy = this.boardY + this.cellGap + r * (this.cellSize + this.cellGap);
        const style = this.tileColors[tile.val] || this.tileColors[4096];

        this.ctx.save();
        this.ctx.translate(cx + this.cellSize / 2, cy + this.cellSize / 2);
        this.ctx.scale(tile.scale, tile.scale);

        // Tile Box
        this.ctx.shadowColor = style.text;
        this.ctx.shadowBlur = tile.val >= 64 ? 12 : 4;
        this.ctx.fillStyle = style.bg;
        this.ctx.fillRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);

        // Border Glow
        this.ctx.strokeStyle = style.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);

        // Tile Number Text
        this.ctx.fillStyle = style.text;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const fontSize = tile.val >= 1024 ? 14 : tile.val >= 128 ? 16 : 20;
        this.ctx.font = `bold ${fontSize}px "Chakra Petch", system-ui, sans-serif`;
        this.ctx.fillText(tile.val.toString(), 0, 1);

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
      this.ctx.font = 'bold 12px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // Touch D-Pad Helper at Bottom
    this.drawTouchDpad();

    this.ctx.restore();
  }

  drawTouchDpad() {
    const y = this.logicalHeight - 34;
    const w = this.logicalWidth;
    const btnW = w / 4;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(18, 24, 36, 0.7)';
    this.ctx.fillRect(0, y - 14, w, 48);

    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0, y - 14, w, 48);

    const labels = ['◀ LEFT', '▼ DOWN', '▲ UP', 'RIGHT ▶'];
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00f3ff';

    for (let i = 0; i < 4; i++) {
      this.ctx.fillText(labels[i], i * btnW + btnW / 2, y + 10);
      if (i > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * btnW, y - 14);
        this.ctx.lineTo(i * btnW, y + 34);
        this.ctx.stroke();
      }
    }
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
