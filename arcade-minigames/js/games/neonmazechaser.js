/**
 * Neon Maze Chaser - Futuristic Cyberpunk Labyrinth Crawler.
 * Features the Cyber Probe Delta-7, 4 unique AI Security Drones,
 * 3 alternating sector maps upon level clearance, rock-solid grid turn buffering,
 * EMP overload mechanics, and responsive multi-touch / keyboard / D-Pad controls.
 */
class NeonMazeChaserGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.ghostStreak = 0;
    this.gameTime = 0;

    // Viewport dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // 3 Distinct Sector Maps (19 cols x 21 rows)
    // 1: Wall, 0: Data Bit, 3: EMP Core, 2: Empty Corridor, 4: Drone Gateway
    this.maps = [
      {
        name: 'Sector 1: Mainframe Core',
        shortName: 'SEC-1: CORE',
        wallColor: '#0055ff',
        wallBg: '#0a1122',
        layout: [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
          [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
          [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
          [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
          [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
          [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
          [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
          [1,1,1,1,0,1,2,1,1,4,1,1,2,1,0,1,1,1,1],
          [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
          [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
          [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
          [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
          [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
          [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
          [1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1],
          [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
          [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
          [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      },
      {
        name: 'Sector 2: Cyber Vault',
        shortName: 'SEC-2: VAULT',
        wallColor: '#bd00ff',
        wallBg: '#180728',
        layout: [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,3,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,3,1],
          [1,0,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1],
          [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
          [1,0,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1],
          [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
          [1,1,1,0,1,0,1,1,1,2,1,1,1,0,1,0,1,1,1],
          [2,2,1,0,0,0,1,2,2,2,2,2,1,0,0,0,1,2,2],
          [1,1,1,0,1,0,1,2,1,2,1,2,1,0,1,0,1,1,1],
          [1,2,2,0,1,0,2,1,1,4,1,1,2,0,1,0,2,2,1],
          [2,2,2,0,1,0,2,1,2,2,2,1,2,0,1,0,2,2,2],
          [1,1,1,0,1,0,2,1,1,1,1,1,2,0,1,0,1,1,1],
          [2,2,1,0,0,0,1,2,2,2,2,2,1,0,0,0,1,2,2],
          [1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1],
          [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
          [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
          [1,3,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,3,1],
          [1,1,1,0,0,1,0,1,1,1,1,1,0,1,0,0,1,1,1],
          [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
          [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      },
      {
        name: 'Sector 3: Matrix Grid',
        shortName: 'SEC-3: MATRIX',
        wallColor: '#00f3ff',
        wallBg: '#051824',
        layout: [
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,3,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,3,1],
          [1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1],
          [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
          [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
          [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
          [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
          [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
          [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
          [1,0,0,0,0,1,2,1,1,4,1,1,2,1,0,0,0,0,1],
          [2,2,2,1,0,0,2,1,2,2,2,1,2,0,0,1,2,2,2],
          [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
          [1,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,1],
          [2,2,2,1,0,1,1,1,1,2,1,1,1,1,0,1,2,2,2],
          [1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,1,1,1,1],
          [1,0,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,1],
          [1,3,1,1,0,1,0,0,0,2,0,0,0,1,0,1,1,3,1],
          [1,0,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,0,1],
          [1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1],
          [1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
      }
    ];

    this.cols = 19;
    this.rows = 21;
    this.grid = [];
    this.totalPellets = 0;
    this.pelletsRemaining = 0;

    // Player: Cyber Probe Delta-7
    this.player = {
      tileX: 9,
      tileY: 16,
      x: 0,
      y: 0,
      dir: { x: 0, y: 0 },
      nextDir: { x: -1, y: 0 },
      speed: 2.3,
      angle: 0,
      targetAngle: 0,
      pulse: 0
    };

    // Security Hunter Drones
    this.drones = [];
    this.frightenedTimer = 0;

    // Visual FX & Polish
    this.floatingTexts = [];
    this.particles = [];
    this.wakeTrail = [];
    this.shakeIntensity = 0;

    // Input Tracking
    this.touchStartPos = null;
    this.activeDpadDir = null;

    // Bound listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  getCurrentMap() {
    const mapIndex = (this.level - 1) % this.maps.length;
    return this.maps[mapIndex];
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.ghostStreak = 0;
    this.frightenedTimer = 0;
    this.gameTime = 0;
    this.shakeIntensity = 0;
    this.floatingTexts = [];
    this.particles = [];
    this.wakeTrail = [];

    this.initMaze();
    this.resetPositions();

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

    // Compute cell dimensions & arena centering
    // Reserve 54px at bottom for illuminated cyber D-pad
    const maxAvailableH = this.logicalHeight - 92;
    this.cellSize = Math.floor(Math.min((this.logicalWidth - 14) / this.cols, maxAvailableH / this.rows));
    this.offsetX = Math.floor((this.logicalWidth - this.cols * this.cellSize) / 2);
    this.offsetY = 32 + Math.floor((maxAvailableH - this.rows * this.cellSize) / 2);

    // Sync pixel positions
    if (this.player) {
      this.player.x = this.getTileCenterX(this.player.tileX);
      this.player.y = this.getTileCenterY(this.player.tileY);
    }
    if (this.drones) {
      this.drones.forEach(d => {
        d.x = this.getTileCenterX(d.tileX);
        d.y = this.getTileCenterY(d.tileY);
      });
    }
  }

  getTileCenterX(c) {
    return this.offsetX + c * this.cellSize + this.cellSize / 2;
  }

  getTileCenterY(r) {
    return this.offsetY + r * this.cellSize + this.cellSize / 2;
  }

  initMaze() {
    const currentMap = this.getCurrentMap();
    this.grid = [];
    this.totalPellets = 0;

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const val = currentMap.layout[r][c];
        this.grid[r][c] = val;
        if (val === 0 || val === 3) {
          this.totalPellets++;
        }
      }
    }
    this.pelletsRemaining = this.totalPellets;
  }

  resetPositions() {
    // Reset Player (Probe Delta-7)
    this.player.tileX = 9;
    this.player.tileY = 16;
    this.player.x = this.getTileCenterX(9);
    this.player.y = this.getTileCenterY(16);
    this.player.dir = { x: 0, y: 0 };
    this.player.nextDir = { x: -1, y: 0 };
    this.player.angle = Math.PI;
    this.player.targetAngle = Math.PI;

    // Reset 4 Security Hunter Drones with tailored spawn directions
    this.drones = [
      {
        id: 'apex',
        name: 'Apex Striker',
        model: 'stealth-wing',
        color: '#ff0055',
        glowColor: '#ff0055',
        tileX: 9,
        tileY: 8,
        x: this.getTileCenterX(9),
        y: this.getTileCenterY(8),
        dir: { x: -1, y: 0 },
        speed: 1.85,
        state: 'chase',
        target: { x: 0, y: 0 }
      },
      {
        id: 'vapor',
        name: 'Vapor Phantom',
        model: 'orbital-disc',
        color: '#ff00cc',
        glowColor: '#ff55ee',
        tileX: 9,
        tileY: 10,
        x: this.getTileCenterX(9),
        y: this.getTileCenterY(10),
        dir: { x: 0, y: -1 }, // Ascend through Gateway
        speed: 1.75,
        state: 'chase',
        target: { x: 0, y: 0 }
      },
      {
        id: 'glitch',
        name: 'Glitch Seeker',
        model: 'gyro-cube',
        color: '#00f3ff',
        glowColor: '#00f3ff',
        tileX: 8,
        tileY: 10,
        x: this.getTileCenterX(8),
        y: this.getTileCenterY(10),
        dir: { x: 1, y: 0 }, // Move towards center, then exit
        speed: 1.7,
        state: 'chase',
        target: { x: 0, y: 0 }
      },
      {
        id: 'spark',
        name: 'Spark Sentry',
        model: 'armored-hex',
        color: '#ffaa00',
        glowColor: '#ffd200',
        tileX: 10,
        tileY: 10,
        x: this.getTileCenterX(10),
        y: this.getTileCenterY(10),
        dir: { x: -1, y: 0 }, // Move towards center, then exit
        speed: 1.65,
        state: 'chase',
        target: { x: 0, y: 0 }
      }
    ];

    this.frightenedTimer = 0;
    this.ghostStreak = 0;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    let dir = null;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') dir = { x: 0, y: -1 };
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') dir = { x: 0, y: 1 };
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir = { x: -1, y: 0 };
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') dir = { x: 1, y: 0 };

    if (dir) {
      e.preventDefault();
      this.bufferDirection(dir);
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check if tapping bottom touch D-Pad area
    const dpadY = this.logicalHeight - 52;
    if (py >= dpadY - 14) {
      this.handleDpadClick(px);
      return;
    }

    // Otherwise initiate swipe or directional tap relative to player
    this.touchStartPos = { x: px, y: py };

    const dx = px - this.player.x;
    const dy = py - this.player.y;
    if (Math.hypot(dx, dy) > 20) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.bufferDirection({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        this.bufferDirection({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    }
  }

  handlePointerMove(e) {
    if (!this.touchStartPos || !this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const dx = px - this.touchStartPos.x;
    const dy = py - this.touchStartPos.y;
    const dist = Math.hypot(dx, dy);

    // Fast swipe sensitivity
    if (dist > 14) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.bufferDirection({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        this.bufferDirection({ x: 0, y: dy > 0 ? 1 : -1 });
      }
      this.touchStartPos = { x: px, y: py };
    }
  }

  handlePointerUp() {
    this.touchStartPos = null;
    this.activeDpadDir = null;
  }

  handleDpadClick(px) {
    const w = this.logicalWidth;
    const btnW = w / 4;
    let dir = null;

    if (px < btnW) {
      dir = { x: -1, y: 0 };
      this.activeDpadDir = 'left';
    } else if (px < btnW * 2) {
      dir = { x: 0, y: 1 };
      this.activeDpadDir = 'down';
    } else if (px < btnW * 3) {
      dir = { x: 0, y: -1 };
      this.activeDpadDir = 'up';
    } else {
      dir = { x: 1, y: 0 };
      this.activeDpadDir = 'right';
    }

    if (dir) {
      this.bufferDirection(dir);
    }
  }

  bufferDirection(dir) {
    this.player.nextDir = dir;

    // Instant 180° turn on same axis without waiting for intersection!
    if (this.player.dir.x === -dir.x && this.player.dir.y === -dir.y) {
      this.player.dir = dir;
      this.updatePlayerAngle();
      return;
    }

    // If currently stopped, immediately start moving if target corridor is free!
    if (this.player.dir.x === 0 && this.player.dir.y === 0) {
      const nextTileX = this.player.tileX + dir.x;
      const nextTileY = this.player.tileY + dir.y;
      if (!this.isWall(nextTileX, nextTileY, false)) {
        this.player.dir = dir;
        this.player.x = this.getTileCenterX(this.player.tileX);
        this.player.y = this.getTileCenterY(this.player.tileY);
        this.updatePlayerAngle();
      }
    }
  }

  updatePlayerAngle() {
    if (this.player.dir.x === 1) this.player.targetAngle = 0;
    else if (this.player.dir.x === -1) this.player.targetAngle = Math.PI;
    else if (this.player.dir.y === 1) this.player.targetAngle = Math.PI / 2;
    else if (this.player.dir.y === -1) this.player.targetAngle = -Math.PI / 2;
  }

  isWall(col, row, isDrone = false, isEyes = false) {
    if (col < 0 || col >= this.cols) return false; // wrap-around tunnels
    if (row < 0 || row >= this.rows) return true;
    const tile = this.grid[row][col];

    // Wall (1) is always solid
    if (tile === 1) return true;

    // Drone Gateway Barrier (4):
    // Player CAN NEVER enter. Drones CAN exit or enter when returning as eyes!
    if (tile === 4) {
      return !isDrone;
    }

    return false;
  }

  update() {
    if (!this.isRunning) return;
    this.gameTime++;

    // Update EMP Overload / Frightened Timer
    if (this.frightenedTimer > 0) {
      this.frightenedTimer--;
      if (this.frightenedTimer === 0) {
        this.ghostStreak = 0;
        this.drones.forEach(d => {
          if (d.state === 'frightened') d.state = 'chase';
        });
      }
    }

    // Move Player (Cyber Probe Delta-7)
    this.updatePlayerMovement();

    // Move Security Drones
    this.drones.forEach(d => this.updateDroneMovement(d));

    // Collision Check: Player vs Drones
    this.checkCollisions();

    // Wake trail decay
    for (let i = this.wakeTrail.length - 1; i >= 0; i--) {
      const w = this.wakeTrail[i];
      w.alpha -= 0.05;
      if (w.alpha <= 0) this.wakeTrail.splice(i, 1);
    }

    // Particles decay
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Floating text decay
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

  updatePlayerMovement() {
    const p = this.player;
    p.pulse += 0.08;

    // Smooth angle interpolation
    let diff = p.targetAngle - p.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    p.angle += diff * 0.25;

    // Current cell coordinates & center
    const cx = this.getTileCenterX(p.tileX);
    const cy = this.getTileCenterY(p.tileY);

    // Check buffered turn execution at crossroads / intersections
    if (p.nextDir.x !== 0 || p.nextDir.y !== 0) {
      const isPerpendicular = (p.dir.x !== 0 && p.nextDir.y !== 0) || (p.dir.y !== 0 && p.nextDir.x !== 0);

      if (isPerpendicular) {
        // Generous threshold around cell center
        const nearX = Math.abs(p.x - cx) <= p.speed * 1.5;
        const nearY = Math.abs(p.y - cy) <= p.speed * 1.5;

        if (nearX && nearY) {
          const targetTileX = p.tileX + p.nextDir.x;
          const targetTileY = p.tileY + p.nextDir.y;

          if (!this.isWall(targetTileX, targetTileY, false)) {
            // Snap cleanly to intersection center line!
            p.x = cx;
            p.y = cy;
            p.dir = p.nextDir;
            this.updatePlayerAngle();
          }
        }
      }
    }

    // Advancing along current direction
    if (p.dir.x !== 0 || p.dir.y !== 0) {
      const aheadTileX = p.tileX + p.dir.x;
      const aheadTileY = p.tileY + p.dir.y;
      const isBlockedAhead = this.isWall(aheadTileX, aheadTileY, false);

      if (isBlockedAhead) {
        // Clamp cleanly at tile center so probe stops precisely in center
        let reachedCenter = false;

        if (p.dir.x === 1 && p.x + p.speed >= cx) {
          p.x = cx;
          reachedCenter = true;
        } else if (p.dir.x === -1 && p.x - p.speed <= cx) {
          p.x = cx;
          reachedCenter = true;
        } else if (p.dir.y === 1 && p.y + p.speed >= cy) {
          p.y = cy;
          reachedCenter = true;
        } else if (p.dir.y === -1 && p.y - p.speed <= cy) {
          p.y = cy;
          reachedCenter = true;
        }

        if (reachedCenter) {
          p.dir = { x: 0, y: 0 };

          // Try buffered direction immediately upon stop
          if (!this.isWall(p.tileX + p.nextDir.x, p.tileY + p.nextDir.y, false)) {
            p.dir = p.nextDir;
            this.updatePlayerAngle();
          }
        } else {
          p.x += p.dir.x * p.speed;
          p.y += p.dir.y * p.speed;
        }
      } else {
        // Free path ahead
        p.x += p.dir.x * p.speed;
        p.y += p.dir.y * p.speed;
      }

      // Add thruster wake trail particles
      if (this.gameTime % 3 === 0) {
        this.wakeTrail.push({
          x: p.x - p.dir.x * 6,
          y: p.y - p.dir.y * 6,
          alpha: 0.65,
          color: '#00f3ff'
        });
      }
    }

    // Tunnel wrap-around horizontally
    const minX = this.offsetX - this.cellSize / 2;
    const maxX = this.offsetX + this.cols * this.cellSize + this.cellSize / 2;
    if (p.x < minX) {
      p.x = maxX - 2;
      p.tileX = this.cols - 1;
    } else if (p.x > maxX) {
      p.x = minX + 2;
      p.tileX = 0;
    }

    // Update tile indices based on current pixel position
    p.tileX = Math.floor((p.x - this.offsetX) / this.cellSize);
    p.tileY = Math.floor((p.y - this.offsetY) / this.cellSize);

    // Consume Data Bits and EMP Cores
    if (p.tileX >= 0 && p.tileX < this.cols && p.tileY >= 0 && p.tileY < this.rows) {
      const tile = this.grid[p.tileY][p.tileX];
      if (tile === 0) {
        // Standard Data Bit
        this.grid[p.tileY][p.tileX] = 2;
        this.score += 10;
        this.pelletsRemaining--;
        this.onScoreUpdate(this.score);

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.pellet();
        }

        this.checkWinCondition();
      } else if (tile === 3) {
        // EMP Overload Core
        this.grid[p.tileY][p.tileX] = 2;
        this.score += 50;
        this.pelletsRemaining--;
        this.onScoreUpdate(this.score);
        this.frightenedTimer = 360; // 6 seconds at 60fps
        this.ghostStreak = 0;

        this.drones.forEach(d => {
          if (d.state !== 'eyes') {
            d.state = 'frightened';
            d.dir = { x: -d.dir.x, y: -d.dir.y }; // Reverse immediately
          }
        });

        this.addFloatingText('EMP OVERLOAD! ⚡', p.x, p.y - 14, '#00f3ff');
        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.powerPellet();
        }

        this.checkWinCondition();
      }
    }
  }

  updateDroneMovement(d) {
    const isEyes = d.state === 'eyes';
    const isFrightened = d.state === 'frightened';
    const speedBoost = Math.min(0.5, (this.level - 1) * 0.12);
    const speed = isEyes ? 3.6 : isFrightened ? 1.05 : (d.speed + speedBoost);

    // Target tile destination based on current direction
    const targetTileX = d.tileX + d.dir.x;
    const targetTileY = d.tileY + d.dir.y;
    const targetX = this.getTileCenterX(targetTileX);
    const targetY = this.getTileCenterY(targetTileY);

    const dx = targetX - d.x;
    const dy = targetY - d.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= speed) {
      // Arrived precisely at target tile center
      d.x = targetX;
      d.y = targetY;
      d.tileX = targetTileX;
      d.tileY = targetTileY;

      // Handle horizontal tunnel wrap
      if (d.tileX < 0) {
        d.tileX = this.cols - 1;
        d.x = this.getTileCenterX(d.tileX);
      } else if (d.tileX >= this.cols) {
        d.tileX = 0;
        d.x = this.getTileCenterX(d.tileX);
      }

      // Check state transition for eyes returning to bay
      if (isEyes && d.tileX === 9 && (d.tileY === 9 || d.tileY === 10)) {
        d.state = 'chase';
      }

      // Choose next step direction
      d.dir = this.chooseDroneDirection(d);
    } else {
      // Advance toward destination
      d.x += (dx / dist) * speed;
      d.y += (dy / dist) * speed;
    }
  }

  chooseDroneDirection(d) {
    const isEyes = d.state === 'eyes';
    const isFrightened = d.state === 'frightened';

    const allDirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    // Find all valid walkable corridors from current tile
    const validDirs = allDirs.filter(dir => {
      return !this.isWall(d.tileX + dir.x, d.tileY + dir.y, true, isEyes);
    });

    if (validDirs.length === 0) {
      return { x: -d.dir.x, y: -d.dir.y };
    }

    // Filter out 180° turn unless dead-end
    const nonReverseDirs = validDirs.filter(dir => {
      return !(dir.x === -d.dir.x && dir.y === -d.dir.y);
    });

    const candidates = nonReverseDirs.length > 0 ? nonReverseDirs : validDirs;

    // Determine tactical target tile
    let targetX = this.player.tileX;
    let targetY = this.player.tileY;

    if (isEyes) {
      targetX = 9;
      targetY = 9; // Core Gateway
    } else if (isFrightened) {
      // Random wandering when scrambled
      return candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      if (d.id === 'vapor') {
        // Flanker: target 4 tiles ahead of player
        targetX += this.player.dir.x * 4;
        targetY += this.player.dir.y * 4;
      } else if (d.id === 'glitch') {
        // Distractor: retreat if too close
        const distToPlayer = Math.hypot(d.tileX - this.player.tileX, d.tileY - this.player.tileY);
        if (distToPlayer < 6) {
          targetX = 1;
          targetY = 1;
        }
      } else if (d.id === 'spark') {
        // Perimeter Sentry: retreat to corner if too close
        const distToPlayer = Math.hypot(d.tileX - this.player.tileX, d.tileY - this.player.tileY);
        if (distToPlayer < 5) {
          targetX = 17;
          targetY = 19;
        }
      }
    }

    // Pick candidate minimizing Euclidean distance to destination
    let bestDir = candidates[0];
    let bestDist = Infinity;

    candidates.forEach(dir => {
      const nextTileX = d.tileX + dir.x;
      const nextTileY = d.tileY + dir.y;
      const dist = Math.hypot(nextTileX - targetX, nextTileY - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    });

    return bestDir;
  }

  checkCollisions() {
    const p = this.player;

    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      const dist = Math.hypot(p.x - d.x, p.y - d.y);

      if (dist < this.cellSize * 0.78) {
        if (d.state === 'frightened') {
          // Deactivate Drone & Extract AI Core!
          d.state = 'eyes';
          this.ghostStreak++;
          const points = Math.min(1600, 200 * Math.pow(2, this.ghostStreak - 1));
          this.score += points;
          this.onScoreUpdate(this.score);

          this.addFloatingText(`CORE +${points}`, d.x, d.y - 12, '#00ff88');
          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.ghostEaten(this.ghostStreak);
          }

          // Electric spark burst
          for (let k = 0; k < 16; k++) {
            this.particles.push({
              x: d.x,
              y: d.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 1.0,
              decay: 0.045,
              size: Math.random() * 3 + 1.5,
              color: d.color
            });
          }
        } else if (d.state === 'chase') {
          // Probe hit!
          this.handlePlayerDeath();
          return;
        }
      }
    }
  }

  handlePlayerDeath() {
    this.lives--;
    this.shakeIntensity = 16;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.gameover();
    }

    // Ship disintegrates into cyber sparks
    for (let k = 0; k < 28; k++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.03,
        size: Math.random() * 3.5 + 1.5,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ffd200'
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    } else {
      setTimeout(() => {
        this.resetPositions();
      }, 600);
    }
  }

  checkWinCondition() {
    if (this.pelletsRemaining <= 0) {
      this.level++;
      this.score += 1000;
      this.onScoreUpdate(this.score);

      const nextMap = this.getCurrentMap();
      this.addFloatingText(`${nextMap.shortName}! +1000`, this.logicalWidth / 2, this.logicalHeight / 2 - 10, '#00ff88');
      this.shakeIntensity = 8;

      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.newRecord();
      }

      // Victory sparks
      for (let k = 0; k < 30; k++) {
        this.particles.push({
          x: this.logicalWidth / 2 + (Math.random() - 0.5) * 140,
          y: this.logicalHeight / 2 + (Math.random() - 0.5) * 140,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 1.0,
          decay: 0.03,
          size: Math.random() * 3 + 2,
          color: '#00ff88'
        });
      }

      this.initMaze();
      this.resetPositions();
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

    // Space / Labyrinth Backdrop
    this.ctx.fillStyle = '#050711';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Current Sector Color Theme
    const currentMap = this.getCurrentMap();
    const wallColor = currentMap.wallColor;
    const wallBg = currentMap.wallBg;

    // Draw Labyrinth Grid
    const cs = this.cellSize;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const px = this.offsetX + c * cs;
        const py = this.offsetY + r * cs;
        const val = this.grid[r][c];

        if (val === 1) {
          // Cyber Wall Block with thematic neon edge
          this.ctx.fillStyle = wallBg;
          this.ctx.fillRect(px, py, cs, cs);
          this.ctx.strokeStyle = wallColor;
          this.ctx.lineWidth = 1.2;
          this.ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);

          // Internal circuit core
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          this.ctx.fillRect(px + 3, py + 3, cs - 6, cs - 6);
        } else if (val === 4) {
          // Gateway Forcefield
          this.ctx.fillStyle = 'rgba(255, 0, 119, 0.45)';
          this.ctx.fillRect(px, py + cs / 2 - 2, cs, 4);
          this.ctx.strokeStyle = '#ff0077';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px, py + cs / 2 - 2, cs, 4);
        } else if (val === 0) {
          // Data Bit: Glowing rotating micro-diamond
          this.ctx.save();
          this.ctx.translate(px + cs / 2, py + cs / 2);
          this.ctx.rotate(Math.PI / 4);
          this.ctx.fillStyle = '#ffd200';
          this.ctx.fillRect(-2, -2, 4, 4);
          this.ctx.restore();
        } else if (val === 3) {
          // EMP Overload Core: Pulsing multi-ring reactor cell
          const pulse = Math.sin(Date.now() * 0.008) * 1.5 + 5.5;
          this.ctx.save();
          this.ctx.shadowColor = '#00f3ff';
          this.ctx.shadowBlur = 8;
          this.ctx.fillStyle = '#00f3ff';
          this.ctx.beginPath();
          this.ctx.arc(px + cs / 2, py + cs / 2, pulse, 0, Math.PI * 2);
          this.ctx.fill();

          // Outer rotating containment ring
          this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.arc(px + cs / 2, py + cs / 2, pulse + 3, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }

    // Draw Wake Trail
    this.wakeTrail.forEach(w => {
      this.ctx.fillStyle = `rgba(0, 243, 255, ${w.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(w.x, w.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw Player: Cyber Probe Delta-7
    if (this.lives > 0) {
      this.drawPlayerProbe();
    }

    // Draw Security Drones
    this.drones.forEach(d => this.drawSecurityDrone(d));

    // Draw Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 11px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // Top Status HUD
    this.drawTopHUD();

    // Bottom Illuminated Cyber D-Pad
    this.drawCyberDpad();

    this.ctx.restore();
  }

  drawPlayerProbe() {
    const p = this.player;
    const r = this.cellSize * 0.44;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);

    // Forward Scanning Radar Beam Cone
    const grad = this.ctx.createRadialGradient(0, 0, 2, 14, 0, 22);
    grad.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
    grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(4, 0);
    this.ctx.lineTo(24, -12);
    this.ctx.lineTo(24, 12);
    this.ctx.closePath();
    this.ctx.fill();

    // Faceted Diamond Hull
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#0a1d37';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 1.8;

    this.ctx.beginPath();
    this.ctx.moveTo(r, 0); // Front nose
    this.ctx.lineTo(-r * 0.7, -r * 0.85); // Top wing
    this.ctx.lineTo(-r * 0.4, 0); // Engine notch
    this.ctx.lineTo(-r * 0.7, r * 0.85); // Bottom wing
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Central Luminous Cyber Core
    this.ctx.fillStyle = '#ffd200';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Dual Micro-Thruster Flares at rear
    if (p.dir.x !== 0 || p.dir.y !== 0) {
      this.ctx.fillStyle = '#00ff88';
      this.ctx.beginPath();
      this.ctx.moveTo(-r * 0.5, -2);
      this.ctx.lineTo(-r * 0.9 - Math.random() * 4, 0);
      this.ctx.lineTo(-r * 0.5, 2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawSecurityDrone(d) {
    const r = this.cellSize * 0.42;
    this.ctx.save();
    this.ctx.translate(d.x, d.y);

    if (d.state === 'eyes') {
      // Exposed AI Memory Core (Spinning Data Octahedron)
      const rot = (Date.now() * 0.006) % (Math.PI * 2);
      this.ctx.rotate(rot);

      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 10;
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(-5, -5, 10, 10);

      this.ctx.fillStyle = '#ffd200';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
      return;
    }

    if (d.state === 'frightened') {
      // System Glitch / Overload Mode: Jittering wireframe cage
      const jitterX = (Math.random() - 0.5) * 2;
      const jitterY = (Math.random() - 0.5) * 2;
      this.ctx.translate(jitterX, jitterY);

      const isBlinking = this.frightenedTimer < 90 && Math.floor(Date.now() / 140) % 2 === 0;
      const cageColor = isBlinking ? '#ffffff' : '#4a2599';

      this.ctx.strokeStyle = cageColor;
      this.ctx.lineWidth = 1.8;
      this.ctx.strokeRect(-r, -r, r * 2, r * 2);

      // Warning exclamation core
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.font = 'bold 9px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚡', 0, 0);

      this.ctx.restore();
      return;
    }

    // Active Combat State: Bespoke Futuristic Drone Architectures
    this.ctx.shadowColor = d.glowColor;
    this.ctx.shadowBlur = 7;

    if (d.model === 'stealth-wing') {
      // Apex Striker (Red): Swept-wing hunter drone
      this.ctx.fillStyle = '#2a0512';
      this.ctx.strokeStyle = d.color;
      this.ctx.lineWidth = 1.8;

      this.ctx.beginPath();
      this.ctx.moveTo(0, -r);
      this.ctx.lineTo(r, r * 0.7);
      this.ctx.lineTo(0, r * 0.3);
      this.ctx.lineTo(-r, r * 0.7);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Cyclops scanning optic
      this.ctx.fillStyle = '#ff0033';
      this.ctx.beginPath();
      this.ctx.arc(0, -2, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (d.model === 'orbital-disc') {
      // Vapor Phantom (Magenta): Hovering disc with orbiting nodes
      this.ctx.fillStyle = '#22002b';
      this.ctx.strokeStyle = d.color;
      this.ctx.lineWidth = 1.8;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Orbiting satellite sensor orbs
      const angle = (Date.now() * 0.005) % (Math.PI * 2);
      const orbDist = r * 0.95;
      for (let i = 0; i < 2; i++) {
        const a = angle + i * Math.PI;
        this.ctx.fillStyle = '#ff77ee';
        this.ctx.beginPath();
        this.ctx.arc(Math.cos(a) * orbDist, Math.sin(a) * orbDist, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (d.model === 'gyro-cube') {
      // Glitch Seeker (Cyan): High-tech gyro-cube
      this.ctx.fillStyle = '#051b2e';
      this.ctx.strokeStyle = d.color;
      this.ctx.lineWidth = 1.8;

      this.ctx.save();
      this.ctx.rotate(Math.PI / 4);
      this.ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      this.ctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      this.ctx.restore();

      // Core electric eye
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Spark Sentry (Amber Gold): Armored hexagon orbital sentry
      this.ctx.fillStyle = '#2d1c02';
      this.ctx.strokeStyle = d.color;
      this.ctx.lineWidth = 1.8;

      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.cos(a) * r * 0.8;
        const hy = Math.sin(a) * r * 0.8;
        if (i === 0) this.ctx.moveTo(hx, hy);
        else this.ctx.lineTo(hx, hy);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Central warning optic
      this.ctx.fillStyle = '#ffd200';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawTopHUD() {
    this.ctx.fillStyle = '#8292ab';
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';

    // Lives indicated by miniature Cyber Probe vector craft
    this.ctx.fillText('PROBES: ', 16, 20);
    const startX = 86;
    for (let i = 0; i < this.lives; i++) {
      this.ctx.save();
      this.ctx.translate(startX + i * 16, 17);
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.beginPath();
      this.ctx.moveTo(5, 0);
      this.ctx.lineTo(-4, -4);
      this.ctx.lineTo(-2, 0);
      this.ctx.lineTo(-4, 4);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }

    // Current Sector Indicator
    const currentMap = this.getCurrentMap();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = currentMap.wallColor;
    this.ctx.fillText(currentMap.shortName, this.logicalWidth / 2, 20);

    // EMP Overload Countdown
    if (this.frightenedTimer > 0) {
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#00f3ff';
      const secLeft = (this.frightenedTimer / 60).toFixed(1);
      this.ctx.fillText(`EMP: ${secLeft}s ⚡`, this.logicalWidth - 16, 20);
    }
  }

  drawCyberDpad() {
    const y = this.logicalHeight - 44;
    const w = this.logicalWidth;
    const btnW = w / 4;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
    this.ctx.fillRect(0, y - 10, w, 54);

    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0, y - 10, w, 54);

    const buttons = [
      { id: 'left', label: '◀ LEFT' },
      { id: 'down', label: '▼ DOWN' },
      { id: 'up', label: '▲ UP' },
      { id: 'right', label: 'RIGHT ▶' }
    ];

    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';

    buttons.forEach((btn, i) => {
      const bx = i * btnW;
      const isLit = this.activeDpadDir === btn.id;

      if (isLit) {
        this.ctx.fillStyle = 'rgba(0, 243, 255, 0.18)';
        this.ctx.fillRect(bx, y - 10, btnW, 54);
      }

      this.ctx.fillStyle = isLit ? '#ffffff' : '#00f3ff';
      this.ctx.fillText(btn.label, bx + btnW / 2, y + 15);

      if (i > 0) {
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(bx, y - 10);
        this.ctx.lineTo(bx, y + 44);
        this.ctx.stroke();
      }
    });

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
