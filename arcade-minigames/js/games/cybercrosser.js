/**
 * Cyber Crosser - Retro Cyberpunk Frogger-style Traffic & Void Stream Hopper.
 * Features multi-lane hover-traffic, floating data platforms, 5 docking terminals,
 * swipe/keyboard/D-pad controls, and high-DPI canvas scaling.
 */
class CyberCrosserGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // Arena geometry (11 cols x 13 rows)
    this.logicalWidth = 360;
    this.logicalHeight = 540;
    this.cols = 11;
    this.rows = 13;
    this.cellW = 32;
    this.cellH = 34;

    // Player (Hopper Drone)
    this.player = {
      col: 5,
      row: 12,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      hopAnim: 0
    };

    // Lanes definition
    this.trafficLanes = [];
    this.riverLanes = [];
    this.dockBays = []; // 5 docking bays on row 1

    // Visuals & FX
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.isDying = false;
    this.invulnerableTimer = 0;
    this.activeDpadDir = null;

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
    this.lives = 4;
    this.level = 1;
    this.shakeIntensity = 0;
    this.isDying = false;
    this.invulnerableTimer = 0;
    this.particles = [];
    this.floatingTexts = [];

    this.initDocks();
    this.initLanes();
    this.resetPlayer();

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

    // Compute cell dimensions & grid centering
    // Reserve 54px for bottom D-Pad
    const maxAvailableH = this.logicalHeight - 85;
    this.cellW = Math.floor(this.logicalWidth / this.cols);
    this.cellH = Math.floor(maxAvailableH / this.rows);
    this.arenaX = Math.floor((this.logicalWidth - this.cols * this.cellW) / 2);
    this.arenaY = 28 + Math.floor((maxAvailableH - this.rows * this.cellH) / 2);

    this.syncPlayerCoords();
  }

  initDocks() {
    // 5 Docking Terminals on row 1 (columns 1, 3, 5, 7, 9)
    this.dockBays = [1, 3, 5, 7, 9].map(col => ({
      col,
      occupied: false
    }));
  }

  initLanes() {
    // Dynamic difficulty scaling as levels are completed
    const speedScale = 1.0 + Math.min(1.2, (this.level - 1) * 0.18);
    const riverSpeedScale = 1.0 + Math.min(1.0, (this.level - 1) * 0.15);
    const trafficSpacingReduction = Math.min(75, (this.level - 1) * 15);
    const platformWidthReduction = Math.min(26, (this.level - 1) * 5.5);
    const platformSpacingIncrease = Math.min(45, (this.level - 1) * 8);

    // Traffic Lanes (Rows 8, 9, 10, 11) - progressively faster and denser
    this.trafficLanes = [
      {
        row: 11,
        dir: 1,
        speed: 1.2 * speedScale,
        color: '#ff0055',
        width: 38,
        spacing: Math.max(125, 205 - trafficSpacingReduction),
        vehicles: []
      },
      {
        row: 10,
        dir: -1,
        speed: 1.6 * speedScale,
        color: '#ffd200',
        width: 44,
        spacing: Math.max(150, 235 - trafficSpacingReduction),
        vehicles: []
      },
      {
        row: 9,
        dir: 1,
        speed: 1.9 * speedScale,
        color: '#00f3ff',
        width: 32,
        spacing: Math.max(145, 225 - trafficSpacingReduction),
        vehicles: []
      },
      {
        row: 8,
        dir: -1,
        speed: 1.4 * speedScale,
        color: '#ff00aa',
        width: 48,
        spacing: Math.max(170, 255 - trafficSpacingReduction),
        vehicles: []
      }
    ];

    // Seed initial vehicles
    this.trafficLanes.forEach(lane => {
      lane.vehicles = [];
      for (let x = -60; x < this.logicalWidth + 60; x += lane.spacing) {
        lane.vehicles.push({ x: x + Math.random() * 20 });
      }
    });

    // River Lanes (Rows 3, 4, 5, 6)
    // Floating cyber-platforms - progressively narrower and faster drift
    this.riverLanes = [
      {
        row: 6,
        dir: 1,
        speed: 0.9 * riverSpeedScale,
        width: Math.max(54, 88 - platformWidthReduction),
        spacing: 160 + platformSpacingIncrease,
        logs: []
      },
      {
        row: 5,
        dir: -1,
        speed: 1.2 * riverSpeedScale,
        width: Math.max(48, 72 - platformWidthReduction),
        spacing: 150 + platformSpacingIncrease,
        logs: []
      },
      {
        row: 4,
        dir: 1,
        speed: 1.4 * riverSpeedScale,
        width: Math.max(68, 104 - platformWidthReduction),
        spacing: 190 + platformSpacingIncrease,
        logs: []
      },
      {
        row: 3,
        dir: -1,
        speed: 1.0 * riverSpeedScale,
        width: Math.max(52, 80 - platformWidthReduction),
        spacing: 160 + platformSpacingIncrease,
        logs: []
      }
    ];

    // Seed initial logs
    this.riverLanes.forEach(lane => {
      lane.logs = [];
      for (let x = -80; x < this.logicalWidth + 80; x += lane.spacing) {
        lane.logs.push({ x });
      }
    });
  }

  resetPlayer() {
    this.player.col = 5;
    this.player.row = 12;
    this.syncPlayerCoords();
    this.player.hopAnim = 0;
  }

  syncPlayerCoords() {
    this.player.x = this.arenaX + this.player.col * this.cellW + this.cellW / 2;
    this.player.y = this.arenaY + this.player.row * this.cellH + this.cellH / 2;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.hop(0, -1);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      this.hop(0, 1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.hop(-1, 0);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.hop(1, 0);
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check bottom D-Pad
    const dpadY = this.logicalHeight - 52;
    if (py >= dpadY - 14) {
      const w = this.logicalWidth;
      const btnW = w / 4;
      if (px < btnW) {
        this.activeDpadDir = 'left';
        this.hop(-1, 0);
      } else if (px < btnW * 2) {
        this.activeDpadDir = 'down';
        this.hop(0, 1);
      } else if (px < btnW * 3) {
        this.activeDpadDir = 'up';
        this.hop(0, -1);
      } else {
        this.activeDpadDir = 'right';
        this.hop(1, 0);
      }
      return;
    }

    // Tap relative to player
    const dx = px - this.player.x;
    const dy = py - this.player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.hop(dx > 0 ? 1 : -1, 0);
    } else {
      this.hop(0, dy > 0 ? 1 : -1);
    }
  }

  handlePointerUp() {
    this.activeDpadDir = null;
  }

  hop(dx, dy) {
    if (!this.isRunning || this.isDying) return;

    const nextCol = this.player.col + dx;
    const nextRow = this.player.row + dy;

    // Horizontal boundaries
    if (nextCol < 0 || nextCol >= this.cols) return;
    // Cannot move below starting pad
    if (nextRow > 12) return;
    // Top boundary check
    if (nextRow < 1) return;

    this.player.col = nextCol;
    this.player.row = nextRow;
    this.syncPlayerCoords();
    this.player.hopAnim = 1.0;

    // Forward progress score
    if (dy < 0) {
      this.score += 10;
      this.onScoreUpdate(this.score);
    }

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.hop();
    }

    // Check if entered Docking Row 1
    if (nextRow === 1) {
      this.checkDocking();
    }
  }

  checkDocking() {
    const bay = this.dockBays.find(b => b.col === this.player.col);

    if (bay && !bay.occupied) {
      bay.occupied = true;
      this.score += 250;
      this.onScoreUpdate(this.score);
      this.addFloatingText('TERMINAL DOCKED! +250', this.player.x, this.player.y - 12, '#00ff88');

      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.star(3);
      }

      // Check if all 5 bays filled
      const allFilled = this.dockBays.every(b => b.occupied);
      if (allFilled) {
        this.level++;
        const clearBonus = 1000 + (this.level - 1) * 500;
        this.score += clearBonus;
        this.onScoreUpdate(this.score);

        // Award bonus life if below 4
        let lifeText = '';
        if (this.lives < 4) {
          this.lives++;
          lifeText = ' • +1 LIFE!';
        }

        const hazardSubtitles = [
          'TRAFFIC ACCELERATING',
          'STREAM VELOCITY SURGE',
          'HIGHWAY CONGESTION +20%',
          'PLATFORMS NARROWED • HYPER-FLOW',
          'CRITICAL MATRIX OVERLOAD'
        ];
        const sub = hazardSubtitles[(this.level - 2) % hazardSubtitles.length] || 'GRID OVERLOAD!';

        this.addFloatingText(`ROUND ${this.level - 1} CLEARED! +${clearBonus}${lifeText}`, this.logicalWidth / 2, this.logicalHeight / 2 - 14, '#00ff88');
        this.addFloatingText(`ROUND ${this.level}: ${sub}`, this.logicalWidth / 2, this.logicalHeight / 2 + 12, '#ffd200');

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.newRecord();
        }

        this.initDocks();
        this.initLanes();
      }

      this.resetPlayer();
    } else {
      // Hit an occupied bay or concrete wall barrier
      this.handlePlayerDeath('BARRIER CRASH');
    }
  }

  update() {
    if (!this.isRunning) return;

    // Animate hop squash
    if (this.player.hopAnim > 0) {
      this.player.hopAnim -= 0.12;
      if (this.player.hopAnim < 0) this.player.hopAnim = 0;
    }

    // Update Traffic Lanes
    this.trafficLanes.forEach(lane => {
      lane.vehicles.forEach(v => {
        v.x += lane.dir * lane.speed;

        // Wrap around
        if (lane.dir === 1 && v.x > this.logicalWidth + 30) {
          v.x = -lane.width - 20;
        } else if (lane.dir === -1 && v.x < -lane.width - 30) {
          v.x = this.logicalWidth + 20;
        }
      });
    });

    // Update River Lanes
    this.riverLanes.forEach(lane => {
      lane.logs.forEach(l => {
        l.x += lane.dir * lane.speed;

        if (lane.dir === 1 && l.x > this.logicalWidth + 40) {
          l.x = -lane.width - 20;
        } else if (lane.dir === -1 && l.x < -lane.width - 40) {
          l.x = this.logicalWidth + 20;
        }
      });
    });

    // Check Traffic Collision (Rows 8 to 11)
    if (!this.isDying && this.invulnerableTimer <= 0 && this.player.row >= 8 && this.player.row <= 11) {
      const activeLane = this.trafficLanes.find(l => l.row === this.player.row);
      if (activeLane) {
        const pLeft = this.player.x - 6;
        const pRight = this.player.x + 6;

        for (let i = 0; i < activeLane.vehicles.length; i++) {
          const v = activeLane.vehicles[i];
          if (pRight > v.x && pLeft < v.x + activeLane.width) {
            this.handlePlayerDeath('TRAFFIC HIT');
            return;
          }
        }
      }
    }

    // Check River Stream (Rows 3 to 6)
    if (!this.isDying && this.invulnerableTimer <= 0 && this.player.row >= 3 && this.player.row <= 6) {
      const activeRiver = this.riverLanes.find(l => l.row === this.player.row);
      if (activeRiver) {
        // Player MUST be standing on a floating log (with 8px forgiving edge margin)
        let onLog = false;
        let logSpeed = 0;

        for (let i = 0; i < activeRiver.logs.length; i++) {
          const l = activeRiver.logs[i];
          if (this.player.x >= l.x - 8 && this.player.x <= l.x + activeRiver.width + 8) {
            onLog = true;
            logSpeed = activeRiver.dir * activeRiver.speed;
            break;
          }
        }

        if (onLog) {
          // Carry player with river current
          this.player.x += logSpeed;
          this.player.col = Math.floor((this.player.x - this.arenaX) / this.cellW);

          // Check if carried offscreen
          if (this.player.x < 10 || this.player.x > this.logicalWidth - 10) {
            this.handlePlayerDeath('STREAM DRIFT');
            return;
          }
        } else {
          // Splashed into toxic data void stream!
          this.handlePlayerDeath('VOID SPLASH');
          return;
        }
      }
    }

    // Decay Screen Shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Invulnerability timer decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
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
  }

  handlePlayerDeath(reason) {
    if (this.isDying) return; // Prevent multi-frame cascading hits
    this.isDying = true;
    this.lives--;
    this.shakeIntensity = 15;

    if (reason === 'VOID SPLASH' && typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.splash();
    } else if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.explosion();
    }

    // Disintegration particles
    for (let i = 0; i < 22; i++) {
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        decay: 0.04,
        size: Math.random() * 3 + 1.5,
        color: '#ff0077'
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    } else {
      setTimeout(() => {
        this.resetPlayer();
        this.isDying = false;
        this.invulnerableTimer = 45; // ~0.75s flashing protection on respawn
      }, 600);
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

    // Base Arena Backdrop
    this.ctx.fillStyle = '#060814';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw Rows Backgrounds
    const cw = this.cellW;
    const ch = this.cellH;

    // Row 12: Starting Pad (Neon Cyber Grid)
    this.ctx.fillStyle = '#0a1628';
    this.ctx.fillRect(0, this.arenaY + 12 * ch, this.logicalWidth, ch);

    // Rows 8-11: Highway Asphalt with lane divider marks
    this.ctx.fillStyle = '#111420';
    this.ctx.fillRect(0, this.arenaY + 8 * ch, this.logicalWidth, 4 * ch);

    for (let r = 8; r <= 11; r++) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.setLineDash([8, 8]);
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.arenaY + r * ch);
      this.ctx.lineTo(this.logicalWidth, this.arenaY + r * ch);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Row 7: Median Rest Island
    this.ctx.fillStyle = '#152138';
    this.ctx.fillRect(0, this.arenaY + 7 * ch, this.logicalWidth, ch);
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(0, this.arenaY + 7 * ch, this.logicalWidth, ch);

    // Rows 3-6: Toxic Data Void Stream (flowing river)
    this.ctx.fillStyle = '#051829';
    this.ctx.fillRect(0, this.arenaY + 3 * ch, this.logicalWidth, 4 * ch);

    // River water stream ripples
    this.ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
    for (let r = 3; r <= 6; r++) {
      this.ctx.fillRect(0, this.arenaY + r * ch + 4, this.logicalWidth, 2);
    }

    // Row 1: Target Dock Bays & Barrier Walls
    this.ctx.fillStyle = '#08101c';
    this.ctx.fillRect(0, this.arenaY + ch, this.logicalWidth, ch);

    // Draw 5 Dock Bays
    this.dockBays.forEach(bay => {
      const bx = this.arenaX + bay.col * cw;
      const by = this.arenaY + ch;

      this.ctx.save();
      if (bay.occupied) {
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(bx + 4, by + 4, cw - 8, ch - 8);

        // Occupied badge
        this.ctx.fillStyle = '#061226';
        this.ctx.font = 'bold 9px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✔', bx + cw / 2, by + ch / 2 + 3);
      } else {
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(bx + 4, by + 4, cw - 8, ch - 8);
      }
      this.ctx.restore();
    });

    // Draw Floating Logs in River (Rows 3-6)
    this.riverLanes.forEach(lane => {
      const ry = this.arenaY + lane.row * ch;
      lane.logs.forEach(l => {
        this.ctx.save();
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = '#0b3558';
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 1.5;

        this.ctx.fillRect(l.x, ry + 4, lane.width, ch - 8);
        this.ctx.strokeRect(l.x, ry + 4, lane.width, ch - 8);

        // Platform circuit connectors
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillRect(l.x + 6, ry + ch / 2 - 2, 4, 4);
        this.ctx.fillRect(l.x + lane.width - 10, ry + ch / 2 - 2, 4, 4);
        this.ctx.restore();
      });
    });

    // Draw Hover-Traffic in Highway (Rows 8-11)
    this.trafficLanes.forEach(lane => {
      const vy = this.arenaY + lane.row * ch;
      lane.vehicles.forEach(v => {
        this.ctx.save();
        this.ctx.shadowColor = lane.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = lane.color;

        // Vehicle Chassis
        this.ctx.fillRect(v.x, vy + 6, lane.width, ch - 12);

        // Cockpit window
        this.ctx.fillStyle = '#ffffff';
        const winX = lane.dir === 1 ? v.x + lane.width - 14 : v.x + 4;
        this.ctx.fillRect(winX, vy + 9, 10, ch - 18);

        // Headlight beams
        this.ctx.fillStyle = lane.dir === 1 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 0, 85, 0.4)';
        const lightX = lane.dir === 1 ? v.x + lane.width : v.x - 12;
        this.ctx.fillRect(lightX, vy + 8, 12, ch - 16);

        this.ctx.restore();
      });
    });

    // Draw Player: Hopper Drone
    if (this.lives > 0 && !this.isDying) {
      const isFlashing = this.invulnerableTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0;
      if (!isFlashing) {
        const p = this.player;
        const squash = 1.0 + p.hopAnim * 0.25;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.scale(1 / squash, squash);

        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#0a2e1d';
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;

        // Hex Drone Pod
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Optics
        this.ctx.fillStyle = '#ffd200';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
        this.ctx.arc(3, -3, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

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

    // Top HUD (Lives & Round)
    this.ctx.fillStyle = '#8292ab';
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LIVES:', 16, 20);

    for (let i = 0; i < this.lives; i++) {
      const lx = 78 + i * 18;
      this.ctx.fillStyle = '#0a2e1d';
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 1.5;
      this.ctx.shadowColor = '#00ff88';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(lx, 16, 5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#00ff88';
      this.ctx.beginPath();
      this.ctx.arc(lx, 16, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText(`ROUND: ${this.level}`, this.logicalWidth - 16, 20);

    // Bottom Touch D-Pad
    this.drawTouchDpad();

    this.ctx.restore();
  }

  drawTouchDpad() {
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
      { id: 'down', label: '▼ BACK' },
      { id: 'up', label: '▲ HOP' },
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
