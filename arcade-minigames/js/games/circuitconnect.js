/**
 * Circuit Connect: Data Conduit
 * Rotate cybernetic logic conduits on a PCB matrix to route electric power from the Reactor Core to the Mainframe!
 */
class CircuitConnectGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.logicalWidth = 400;
    this.logicalHeight = 600;

    // Grid specs (5x5 matrix)
    this.gridSize = 5;
    this.grid = [];
    this.tileSize = 60;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    // Game state
    this.isRunning = false;
    this.score = 0;
    this.level = 1;
    this.timeLeft = 45;
    this.maxTime = 45;
    this.isConnected = false;
    this.completedTimer = 0;

    // FX
    this.particles = [];
    this.floatingTexts = [];
    this.pulsePhase = 0;

    // Bound handlers
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.level = 1;
    this.timeLeft = 45;
    this.maxTime = 45;
    this.isConnected = false;
    this.completedTimer = 0;

    this.particles = [];
    this.floatingTexts = [];

    this.generatePuzzle();

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

    // Fit grid nicely centered with room for top and bottom terminal banners
    const maxAvailableH = this.logicalHeight - 155;
    this.tileSize = Math.floor(Math.min((this.logicalWidth - 52) / this.gridSize, maxAvailableH / this.gridSize));
    this.gridOffsetX = Math.floor((this.logicalWidth - this.gridSize * this.tileSize) / 2);
    this.gridOffsetY = 74 + Math.floor((maxAvailableH - this.gridSize * this.tileSize) / 2);
  }

  attachEvents() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  detachEvents() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  handlePointerDown(e) {
    if (!this.isRunning || this.isConnected) return;

    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const col = Math.floor((px - this.gridOffsetX) / this.tileSize);
    const row = Math.floor((py - this.gridOffsetY) / this.tileSize);

    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      const tile = this.grid[row][col];
      // Rotate 90 deg clockwise
      tile.rot = (tile.rot + 1) % 4;
      tile.rotAnim = 1.0;

      if (typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.rotateTile();
      }

      this.recomputeCircuit();
    }
  }

  /*
   * Tile Openings definitions based on 4 directions:
   * 0: Up, 1: Right, 2: Down, 3: Left
   * Types:
   * 'line': [0, 2] (vertical when rot=0)
   * 'corner': [0, 1] (up & right when rot=0)
   * 'tee': [0, 1, 2] (up, right, down when rot=0)
   * 'cross': [0, 1, 2, 3] (all 4 directions)
   */
  getTileOpenings(type, rot) {
    let base = [];
    if (type === 'line') base = [0, 2];
    else if (type === 'corner') base = [0, 1];
    else if (type === 'tee') base = [0, 1, 2];
    else if (type === 'cross') base = [0, 1, 2, 3];

    return base.map(dir => (dir + rot) % 4);
  }

  /*
   * Returns a tile type and rotation that has BOTH d1 and d2 open.
   * Directions: 0: Up, 1: Right, 2: Down, 3: Left
   */
  getTileForDirs(d1, d2) {
    const isOpposite = Math.abs(d1 - d2) === 2;

    if (isOpposite) {
      // Opposite directions: 0 & 2 (vertical) or 1 & 3 (horizontal)
      const roll = Math.random();
      if (roll < 0.72) {
        const rot = (d1 === 0 || d1 === 2) ? 0 : 1;
        return { type: 'line', rot };
      } else if (roll < 0.9) {
        // T-junction containing both directions
        for (let r = 0; r < 4; r++) {
          const ops = this.getTileOpenings('tee', r);
          if (ops.includes(d1) && ops.includes(d2)) {
            return { type: 'tee', rot: r };
          }
        }
      }
      return { type: 'cross', rot: 0 };
    } else {
      // 90-degree corner
      const roll = Math.random();
      if (roll < 0.75) {
        for (let r = 0; r < 4; r++) {
          const ops = this.getTileOpenings('corner', r);
          if (ops.includes(d1) && ops.includes(d2)) {
            return { type: 'corner', rot: r };
          }
        }
      } else {
        // T-junction containing corner directions
        for (let r = 0; r < 4; r++) {
          const ops = this.getTileOpenings('tee', r);
          if (ops.includes(d1) && ops.includes(d2)) {
            return { type: 'tee', rot: r };
          }
        }
      }
      return { type: 'cross', rot: 0 };
    }
  }

  generatePuzzle() {
    const size = this.gridSize;
    const OPPOSITE = [2, 3, 0, 1]; // 0: Up, 1: Right, 2: Down, 3: Left

    // Backtracking DFS to guarantee a 100% continuous, unbroken path from (0,0) to (4,4)
    const dirs = [
      { dr: 1, dc: 0, d: 2 }, // Down
      { dr: 0, dc: 1, d: 1 }, // Right
      { dr: -1, dc: 0, d: 0 }, // Up
      { dr: 0, dc: -1, d: 3 }  // Left
    ];

    const findPathDFS = (r, c, visited) => {
      if (r === size - 1 && c === size - 1) return [{ r, c }];
      // Randomize direction exploration with natural bias towards goal
      const shuffled = [...dirs].sort(() => Math.random() - 0.42);
      for (const { dr, dc, d } of shuffled) {
        const nr = r + dr;
        const nc = c + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(key)) {
          visited.add(key);
          const res = findPathDFS(nr, nc, visited);
          if (res) return [{ r, c, exitDir: d }, ...res];
          visited.delete(key);
        }
      }
      return null;
    };

    // Find verified continuous path
    let path = findPathDFS(0, 0, new Set(['0,0']));
    while (!path || path[path.length - 1].r !== size - 1 || path[path.length - 1].c !== size - 1) {
      path = findPathDFS(0, 0, new Set(['0,0']));
    }

    // Initialize clean grid
    this.grid = Array.from({ length: size }, () => Array(size).fill(null));

    // Assign guaranteed matching tile types along the solution path
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      // Entrance: (0,0) enters from Left (3). Intermediate nodes enter from opposite of previous exitDir.
      const inDir = (i === 0) ? 3 : OPPOSITE[path[i - 1].exitDir];
      // Exit: (4,4) exits to Right (1). Intermediate nodes exit via node.exitDir.
      const outDir = (i === path.length - 1) ? 1 : node.exitDir;

      const tileConfig = this.getTileForDirs(inDir, outDir);
      this.grid[node.r][node.c] = {
        type: tileConfig.type,
        solvedRot: tileConfig.rot,
        rot: tileConfig.rot,
        rotAnim: 0,
        powered: false,
        isPath: true
      };
    }

    // Fill all remaining tiles with varied decoy conduits
    const fillerTypes = ['line', 'corner', 'corner', 'tee'];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!this.grid[r][c]) {
          const type = fillerTypes[Math.floor(Math.random() * fillerTypes.length)];
          const solvedRot = Math.floor(Math.random() * 4);
          this.grid[r][c] = {
            type,
            solvedRot,
            rot: solvedRot,
            rotAnim: 0,
            powered: false,
            isPath: false
          };
        }
      }
    }

    // Scramble rotations so puzzle requires solving (ensure at least 1-3 turns away)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const t = this.grid[r][c];
        const scramble = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 rotations
        t.rot = (t.solvedRot + scramble) % 4;
      }
    }

    this.isConnected = false;
    this.recomputeCircuit();

    // If initial scramble accidentally solved the puzzle right away, scramble 2 tiles on the path by 1 turn
    if (this.isConnected) {
      const p1 = path[Math.floor(path.length / 3)];
      const p2 = path[Math.floor((path.length * 2) / 3)];
      this.grid[p1.r][p1.c].rot = (this.grid[p1.r][p1.c].solvedRot + 1) % 4;
      this.grid[p2.r][p2.c].rot = (this.grid[p2.r][p2.c].solvedRot + 1) % 4;
      this.isConnected = false;
      this.recomputeCircuit();
    }
  }

  recomputeCircuit() {
    // Reset all power
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c].powered = false;
      }
    }

    // BFS Flood Fill from Start: Left port of (0,0)
    // Opposite directions: 0 <-> 2, 1 <-> 3
    const opposite = [2, 3, 0, 1];
    const dr = [-1, 0, 1, 0];
    const dc = [0, 1, 0, -1];

    const startTile = this.grid[0][0];
    const startOpenings = this.getTileOpenings(startTile.type, startTile.rot);

    // Power must enter from Left (3)
    if (!startOpenings.includes(3)) {
      this.isConnected = false;
      return;
    }

    startTile.powered = true;
    const queue = [{ r: 0, c: 0 }];
    const visited = new Set(['0,0']);

    let connectedToMainframe = false;

    while (queue.length > 0) {
      const cur = queue.shift();
      const tile = this.grid[cur.r][cur.c];
      const openings = this.getTileOpenings(tile.type, tile.rot);

      // Check if End tile (gridSize-1, gridSize-1) is connected out to Right (1)
      if (cur.r === this.gridSize - 1 && cur.c === this.gridSize - 1) {
        if (openings.includes(1)) {
          connectedToMainframe = true;
        }
      }

      for (const dir of openings) {
        const nr = cur.r + dr[dir];
        const nc = cur.c + dc[dir];

        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            const neighbor = this.grid[nr][nc];
            const neighborOpenings = this.getTileOpenings(neighbor.type, neighbor.rot);

            // Mutual connection: neighbor must have opening towards current tile
            if (neighborOpenings.includes(opposite[dir])) {
              neighbor.powered = true;
              visited.add(key);
              queue.push({ r: nr, c: nc });
            }
          }
        }
      }
    }

    if (connectedToMainframe && !this.isConnected) {
      this.handleCircuitComplete();
    }
  }

  handleCircuitComplete() {
    this.isConnected = true;
    this.completedTimer = 70;

    const timeBonus = Math.floor(this.timeLeft) * 30;
    const levelBonus = this.level * 400;
    const totalBonus = 500 + timeBonus + levelBonus;

    this.score += totalBonus;
    this.onScoreUpdate(this.score);

    this.addFloatingText(`CIRCUIT ENERGIZED! +${totalBonus}`, this.logicalWidth / 2, this.gridOffsetY - 18, '#00ff88');

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.circuitConnect();
    }

    // Energize explosion sparks
    for (let k = 0; k < 45; k++) {
      this.particles.push({
        x: this.gridOffsetX + Math.random() * (this.gridSize * this.tileSize),
        y: this.gridOffsetY + Math.random() * (this.gridSize * this.tileSize),
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        decay: 0.03,
        color: Math.random() < 0.5 ? '#00f3ff' : '#00ff88',
        size: Math.random() * 3.5 + 1.5
      });
    }
  }

  update() {
    if (!this.isRunning) return;

    this.pulsePhase += 0.08;

    // Timer countdown
    if (!this.isConnected) {
      this.timeLeft -= 1 / 60;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.isRunning = false;
        setTimeout(() => {
          this.onGameOver(this.score);
        }, 700);
      }
    } else {
      // Completed transition to next level
      this.completedTimer--;
      if (this.completedTimer <= 0) {
        this.level++;
        this.timeLeft = Math.min(60, this.timeLeft + 15);
        this.isConnected = false;
        this.generatePuzzle();
      }
    }

    // Tile rotation animations
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const t = this.grid[r][c];
        if (t.rotAnim > 0) {
          t.rotAnim -= 0.15;
          if (t.rotAnim < 0) t.rotAnim = 0;
        }
      }
    }

    // Particles & Floating Text
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

  addFloatingText(text, x, y, color = '#00ff88') {
    this.floatingTexts.push({ text, x, y, vy: -1.0, alpha: 1.0, color });
  }

  draw() {
    this.ctx.save();

    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // 1. PCB Dark Cyber Blueprint Background
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#06131c');
    bgGrad.addColorStop(1, '#02070c');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Microchip decorative traces
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
    this.ctx.lineWidth = 1;
    for (let x = 15; x < w; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // 2. Prominent START & FINISH Terminal Markers
    const startX = this.gridOffsetX;
    const startY = this.gridOffsetY;
    const endX = this.gridOffsetX + (this.gridSize - 1) * this.tileSize;
    const endY = this.gridOffsetY + (this.gridSize - 1) * this.tileSize;
    const ts = this.tileSize;

    // A. Top-Left START Banner & Wire Lead
    this.ctx.save();
    // Glowing Start Banner above tile (0,0)
    this.ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = '#00ff88';
    this.ctx.shadowBlur = 8;
    const bannerW = Math.max(76, ts * 1.35);
    this.ctx.fillRect(startX - 2, startY - 30, bannerW, 20);
    this.ctx.strokeRect(startX - 2, startY - 30, bannerW, 20);

    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = '7.5px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('⚡ START', startX + 5, startY - 16);

    // Entry lead wire entering from left of (0,0)
    const entryY = startY + ts / 2;
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 6;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(startX - 20, entryY);
    this.ctx.lineTo(startX, entryY);
    this.ctx.stroke();

    // Pulsing entrance arrow
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(startX - 2, entryY);
    this.ctx.lineTo(startX - 9, entryY - 5);
    this.ctx.lineTo(startX - 9, entryY + 5);
    this.ctx.closePath();
    this.ctx.fill();

    // B. Bottom-Right GOAL / CPU Banner & Wire Lead
    const goalColor = this.isConnected ? '#00ff88' : '#ffd200';
    this.ctx.fillStyle = this.isConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 210, 0, 0.15)';
    this.ctx.strokeStyle = goalColor;
    this.ctx.shadowColor = goalColor;
    this.ctx.shadowBlur = 8;

    const goalBannerW = Math.max(76, ts * 1.35);
    const goalBannerX = endX + ts - goalBannerW + 2;
    this.ctx.fillRect(goalBannerX, endY + ts + 10, goalBannerW, 20);
    this.ctx.strokeRect(goalBannerX, endY + ts + 10, goalBannerW, 20);

    this.ctx.fillStyle = goalColor;
    this.ctx.textAlign = 'right';
    this.ctx.fillText(this.isConnected ? '⚡ ONLINE' : '💻 GOAL', endX + ts - 5, endY + ts + 24);

    // Exit lead wire exiting right of (4,4)
    const exitY = endY + ts / 2;
    this.ctx.strokeStyle = goalColor;
    this.ctx.lineWidth = 6;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(endX + ts, exitY);
    this.ctx.lineTo(endX + ts + 20, exitY);
    this.ctx.stroke();

    // Exit arrow
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(endX + ts + 18, exitY);
    this.ctx.lineTo(endX + ts + 11, exitY - 5);
    this.ctx.lineTo(endX + ts + 11, exitY + 5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 3. Draw Grid Tiles
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tx = this.gridOffsetX + c * this.tileSize;
        const ty = this.gridOffsetY + r * this.tileSize;
        this.drawConduitTile(tx, ty, this.grid[r][c], r, c);
      }
    }

    // 4. Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 5. Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 11px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 6. HUD: Level, Timer Bar, Hint
    this.drawHUD();

    this.ctx.restore();
  }

  drawConduitTile(tx, ty, tile, r, c) {
    const ts = this.tileSize;
    const half = ts / 2;
    const pad = 3;

    const isStartTile = (r === 0 && c === 0);
    const isGoalTile = (r === this.gridSize - 1 && c === this.gridSize - 1);

    this.ctx.save();
    this.ctx.translate(tx + half, ty + half);

    // Base chip background
    let bgFill = tile.powered ? 'rgba(0, 243, 255, 0.09)' : 'rgba(10, 25, 40, 0.75)';
    let strokeCol = tile.powered ? 'rgba(0, 243, 255, 0.45)' : 'rgba(0, 243, 255, 0.15)';

    if (isStartTile) {
      bgFill = 'rgba(0, 255, 136, 0.15)';
      strokeCol = '#00ff88';
    } else if (isGoalTile) {
      bgFill = this.isConnected ? 'rgba(0, 255, 136, 0.22)' : 'rgba(255, 210, 0, 0.15)';
      strokeCol = this.isConnected ? '#00ff88' : '#ffd200';
    }

    this.ctx.fillStyle = bgFill;
    this.ctx.strokeStyle = strokeCol;
    this.ctx.lineWidth = (isStartTile || isGoalTile) ? 2 : 1;
    this.ctx.fillRect(-half + pad, -half + pad, ts - pad * 2, ts - pad * 2);
    this.ctx.strokeRect(-half + pad, -half + pad, ts - pad * 2, ts - pad * 2);

    // Apply rotation for wire traces
    this.ctx.save();
    const angle = (tile.rot - tile.rotAnim * 0.4) * (Math.PI / 2);
    this.ctx.rotate(angle);

    // Wire Color & Glow
    const wireColor = tile.powered ? '#00f3ff' : '#2a4358';
    const coreColor = tile.powered ? '#ffffff' : '#142838';

    this.ctx.strokeStyle = wireColor;
    this.ctx.lineWidth = 7;
    this.ctx.lineCap = 'round';
    if (tile.powered) {
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 8;
    }

    // Draw conduit segments
    const drawTrace = (x1, y1, x2, y2) => {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      // Inner wire core
      this.ctx.save();
      this.ctx.strokeStyle = coreColor;
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
      this.ctx.restore();
    };

    if (tile.type === 'line') {
      drawTrace(0, -half + pad, 0, half - pad);
    } else if (tile.type === 'corner') {
      drawTrace(0, -half + pad, 0, 0);
      drawTrace(0, 0, half - pad, 0);
    } else if (tile.type === 'tee') {
      drawTrace(0, -half + pad, 0, half - pad);
      drawTrace(0, 0, half - pad, 0);
    } else if (tile.type === 'cross') {
      drawTrace(0, -half + pad, 0, half - pad);
      drawTrace(-half + pad, 0, half - pad, 0);
    }

    // Center node solder pad
    this.ctx.fillStyle = tile.powered ? '#00ff88' : '#233748';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore(); // Restore unrotated context

    // Corner labels on the tile corners (unrotated)
    if (isStartTile) {
      this.ctx.fillStyle = '#00ff88';
      this.ctx.font = '6.5px "Press Start 2P", monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('IN', -half + pad + 3, -half + pad + 9);
    } else if (isGoalTile) {
      this.ctx.fillStyle = this.isConnected ? '#00ff88' : '#ffd200';
      this.ctx.font = '6.5px "Press Start 2P", monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('OUT', half - pad - 3, half - pad - 4);
    }

    this.ctx.restore();
  }

  drawHUD() {
    const w = this.logicalWidth;

    this.ctx.save();
    this.ctx.font = '9px "Press Start 2P", monospace';

    // Level
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SECTOR: ${this.level}`, 16, 22);

    // Timer
    this.ctx.textAlign = 'right';
    const timeRatio = this.timeLeft / this.maxTime;
    const timeColor = timeRatio > 0.4 ? '#00ff88' : (timeRatio > 0.2 ? '#ffd200' : '#ff0055');
    this.ctx.fillStyle = timeColor;
    this.ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}S`, w - 16, 22);

    // Time Progress Bar
    const barW = w - 32;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.ctx.fillRect(16, 30, barW, 4);

    this.ctx.fillStyle = timeColor;
    this.ctx.shadowColor = timeColor;
    this.ctx.shadowBlur = 6;
    this.ctx.fillRect(16, 30, barW * timeRatio, 4);
    this.ctx.shadowBlur = 0;

    // Bottom Hint & Navigation Breadcrumb
    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = '7.5px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ START (TOP-L) ──▶ ROUTE CURRENT ──▶ 💻 CPU (BOT-R)', w / 2, this.logicalHeight - 14);

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
