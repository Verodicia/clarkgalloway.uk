/**
 * Cave Thruster - Procedural scrolling gravity cave navigation arcade minigame.
 * Hold touch or Space to apply upward rocket thrust. Dodge jagged cavern ceilings,
 * floors, and stalactites while gathering golden fuel orbs!
 */
class CaveThrusterGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.waitingForStart = true;
    this.hoverTimer = 0;
    this.score = 0;
    this.distance = 0;
    this.orbsCollected = 0;

    // Ship properties
    this.ship = {
      x: 75,
      y: 0,
      vy: 0,
      width: 32,
      height: 18,
      rotation: 0
    };

    // Physics constants
    this.gravity = 0.22;
    this.thrustPower = 0.52;
    this.isThrusting = false;

    // Terrain & Obstacles
    this.terrainNodes = [];
    this.nodeSpacing = 24;
    this.obstacles = [];
    this.orbs = [];
    this.totalScroll = 0;
    this.scrollSpeed = 3.6;

    // Terrain procedural generation state
    this.noisePhase = 0;
    this.minGap = 160;
    this.maxGap = 280;
    this.currentGap = 280;

    // Visuals & Effects
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Clear previous RAF loops & listeners
    this.resize();
    this.score = 0;
    this.distance = 0;
    this.orbsCollected = 0;
    this.totalScroll = 0;
    this.scrollSpeed = 3.6;
    this.shakeIntensity = 0;
    this.noisePhase = Math.random() * 100;

    // Dynamic gaps relative to canvas height
    this.maxGap = Math.min(this.logicalHeight * 0.62, 300);
    this.minGap = Math.max(160, this.logicalHeight * 0.36);
    this.currentGap = this.maxGap;

    // Reset ship to exact center
    this.ship.y = this.logicalHeight / 2;
    this.ship.vy = 0;
    this.ship.rotation = 0;
    this.isThrusting = false;
    this.waitingForStart = true;
    this.hoverTimer = 0;

    this.particles = [];
    this.floatingTexts = [];
    this.obstacles = [];
    this.orbs = [];

    // Initialize initial terrain spanning past the right edge
    this.initTerrain();

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
  }

  getCavernNode(x, phase, isRunway = false) {
    const H = this.logicalHeight;
    const maxDeviation = H * 0.18;
    const centerY = isRunway
      ? H * 0.5
      : (H * 0.5) + Math.sin(phase) * (maxDeviation * 0.65) + Math.sin(phase * 2.1) * (maxDeviation * 0.35);
    const gap = isRunway ? this.maxGap : this.currentGap;
    const halfGap = gap / 2;
    const ceilY = Math.max(35, centerY - halfGap);
    const floorY = Math.min(H - 35, centerY + halfGap);
    return { x, ceilY, floorY };
  }

  initTerrain() {
    this.terrainNodes = [];
    const count = Math.ceil(this.logicalWidth / this.nodeSpacing) + 6;

    for (let i = 0; i < count; i++) {
      const x = i * this.nodeSpacing;
      // First 25 nodes (~600px) form a wide flat runway
      const isRunway = i < 25;
      const node = this.getCavernNode(x, this.noisePhase + i * 0.1, isRunway);
      this.terrainNodes.push(node);
    }
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (this.waitingForStart) {
        this.waitingForStart = false;
      }
      if (!this.isThrusting) {
        this.isThrusting = true;
        ArcadeAudio.sfx.thrust();
      }
    }
  }

  handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.isThrusting = false;
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();
    if (this.waitingForStart) {
      this.waitingForStart = false;
    }
    this.isThrusting = true;
    ArcadeAudio.sfx.thrust();
  }

  handlePointerUp(e) {
    this.isThrusting = false;
  }

  spawnObstacleAndOrb(x, ceilY, floorY) {
    const gap = floorY - ceilY;

    // Stalactite / pillar obstacles only spawn after distance > 75m
    if (this.distance > 75 && Math.random() < 0.26) {
      const isTop = Math.random() < 0.5;
      const obsH = Math.min(gap * 0.32, 40 + Math.random() * 25);
      this.obstacles.push({
        x: x,
        y: isTop ? ceilY : floorY - obsH,
        width: 22,
        height: obsH,
        isTop: isTop
      });
    }

    // 22% chance of golden fuel orb
    if (Math.random() < 0.22) {
      this.orbs.push({
        x: x + 10,
        y: ceilY + gap * (0.3 + Math.random() * 0.4),
        radius: 10,
        pulse: 0
      });
    }
  }

  createSparkles(x, y, hue, count = 16) {
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

  triggerDeath(reason = 'CRASH!') {
    this.isRunning = false;
    this.shakeIntensity = 14;
    this.createSparkles(this.ship.x, this.ship.y, 25, 36); // Fire explosion
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

    // Waiting for first player thrust input (gentle launch hover)
    if (this.waitingForStart) {
      this.hoverTimer += 0.06;
      this.ship.y = (this.logicalHeight / 2) + Math.sin(this.hoverTimer) * 5;
      this.ship.vy = 0;
      this.ship.rotation = Math.sin(this.hoverTimer) * 0.04;
      return;
    }

    // Scroll speed and distance
    this.totalScroll += this.scrollSpeed;
    this.distance = Math.floor(this.totalScroll / 8);
    this.scrollSpeed = Math.min(6.0, 3.6 + (this.distance * 0.0012));

    // Narrows cavern gap smoothly as distance increases
    this.currentGap = Math.max(this.minGap, this.maxGap - (this.distance * 0.07));

    // Score calculation (distance + bonus orbs)
    this.score = this.distance + (this.orbsCollected * 100);
    this.onScoreUpdate(this.score);

    // Ship Vertical Physics
    if (this.isThrusting) {
      this.ship.vy -= this.thrustPower;

      // Thruster exhaust particles
      this.particles.push({
        x: this.ship.x - 14,
        y: this.ship.y + (Math.random() - 0.5) * 6,
        vx: -3 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 1.5,
        size: 3 + Math.random() * 3,
        hue: Math.random() < 0.6 ? 28 : 190, // Fiery orange & cyan
        alpha: 1,
        decay: 0.06
      });
    } else {
      this.ship.vy += this.gravity;
    }

    // Clamp vertical velocity
    this.ship.vy = Math.max(-5.0, Math.min(5.0, this.ship.vy));
    this.ship.y += this.ship.vy;
    this.ship.rotation = this.ship.vy * 0.07; // Pitch tilt

    // Update Terrain Scrolling
    for (const node of this.terrainNodes) {
      node.x -= this.scrollSpeed;
    }

    // Recycle off-screen terrain nodes
    while (this.terrainNodes.length > 0 && this.terrainNodes[0].x < -this.nodeSpacing) {
      this.terrainNodes.shift();
      const lastNode = this.terrainNodes[this.terrainNodes.length - 1];
      const newX = lastNode.x + this.nodeSpacing;

      this.noisePhase += 0.08;
      const isRunway = this.distance < 30;
      const node = this.getCavernNode(newX, this.noisePhase, isRunway);

      this.terrainNodes.push(node);
      this.spawnObstacleAndOrb(newX, node.ceilY, node.floorY);
    }

    // Check Ship Collision against Terrain (Ceiling / Floor)
    for (let i = 0; i < this.terrainNodes.length - 1; i++) {
      const n1 = this.terrainNodes[i];
      const n2 = this.terrainNodes[i + 1];

      if (this.ship.x >= n1.x && this.ship.x <= n2.x) {
        const ratio = (this.ship.x - n1.x) / (n2.x - n1.x);
        const ceilAtShip = n1.ceilY + (n2.ceilY - n1.ceilY) * ratio;
        const floorAtShip = n1.floorY + (n2.floorY - n1.floorY) * ratio;

        // Player hitbox with a small 3px forgiving grace inset
        const shipTop = this.ship.y - this.ship.height / 2 + 3;
        const shipBottom = this.ship.y + this.ship.height / 2 - 3;

        if (shipTop <= ceilAtShip || shipBottom >= floorAtShip) {
          this.triggerDeath('COLLIDED WITH CAVERN WALL!');
          return;
        }
        break;
      }
    }

    // Viewport bounds check
    if (this.ship.y < 0 || this.ship.y > this.logicalHeight) {
      this.triggerDeath('LOST IN DEEP SPACE!');
      return;
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.scrollSpeed;

      // Check collision with ship (AABB box check with grace margins)
      const shipLeft = this.ship.x - this.ship.width / 2 + 4;
      const shipRight = this.ship.x + this.ship.width / 2 - 4;
      const shipTop = this.ship.y - this.ship.height / 2 + 3;
      const shipBottom = this.ship.y + this.ship.height / 2 - 3;

      if (
        shipRight > obs.x &&
        shipLeft < obs.x + obs.width &&
        shipBottom > obs.y &&
        shipTop < obs.y + obs.height
      ) {
        this.triggerDeath('HIT STALACTITE PILLAR!');
        return;
      }

      // Remove offscreen
      if (obs.x + obs.width < -40) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      orb.x -= this.scrollSpeed;
      orb.pulse += 0.08;

      // Check collection by ship
      const dist = Math.hypot(this.ship.x - orb.x, this.ship.y - orb.y);
      if (dist < orb.radius + 14) {
        this.orbsCollected++;
        this.score += 100;
        this.onScoreUpdate(this.score);

        ArcadeAudio.sfx.star(3);
        this.createSparkles(orb.x, orb.y, 48, 18);
        this.createFloatingText('+100 FUEL ⭐', orb.x, orb.y - 15, '#ffd700');
        this.shakeIntensity = 2.5;

        this.orbs.splice(i, 1);
        continue;
      }

      // Remove offscreen
      if (orb.x < -30) {
        this.orbs.splice(i, 1);
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

    // 1. Draw Cavern Background (Deep space cave gradient)
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 2. Draw Cavern Ceiling (Polygon)
    ctx.save();
    ctx.fillStyle = '#101626';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (const node of this.terrainNodes) {
      ctx.lineTo(node.x, node.ceilY);
    }
    ctx.lineTo(this.logicalWidth + 50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Draw Cavern Floor (Polygon)
    ctx.save();
    ctx.fillStyle = '#101626';
    ctx.strokeStyle = '#ff0077';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(0, this.logicalHeight);
    for (const node of this.terrainNodes) {
      ctx.lineTo(node.x, node.floorY);
    }
    ctx.lineTo(this.logicalWidth + 50, this.logicalHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Draw Stalactite Pillars / Obstacles
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.fillStyle = '#192238';
      ctx.strokeStyle = obs.isTop ? '#00f3ff' : '#ff0077';
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (obs.isTop) {
        // Pointing down from ceiling
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
      } else {
        // Pointing up from floor
        ctx.moveTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.lineTo(obs.x, obs.y + obs.height);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Golden Energy Orbs
    for (const orb of this.orbs) {
      ctx.save();
      const glow = Math.sin(orb.pulse) * 3;
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 12 + glow;

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();

      // Core gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orb.x - 2, orb.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Draw Thruster Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 7. Draw Player Rocket Ship
    ctx.save();
    ctx.translate(this.ship.x, this.ship.y);
    ctx.rotate(this.ship.rotation);

    // Ship Hull (Neon Cyan arrow cruiser)
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(this.ship.width / 2, 0); // Nose
    ctx.lineTo(-this.ship.width / 2, -this.ship.height / 2); // Top rear wing
    ctx.lineTo(-this.ship.width / 3, 0); // Rear engine indent
    ctx.lineTo(-this.ship.width / 2, this.ship.height / 2); // Bottom rear wing
    ctx.closePath();
    ctx.fill();

    // Cockpit Glow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rocket Thruster Plume (When holding thrust)
    if (this.isThrusting) {
      ctx.fillStyle = '#ff5500';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-this.ship.width / 3, -4);
      ctx.lineTo(-this.ship.width / 2 - 12 - Math.random() * 6, 0);
      ctx.lineTo(-this.ship.width / 3, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 8. Draw Floating Texts
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

    // 9. Waiting for Start Screen Overlay Banner
    if (this.waitingForStart) {
      ctx.save();
      ctx.textAlign = 'center';
      const promptY = (this.logicalHeight / 2) - 60;

      // Glow backing
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.fillText('HOLD TAP / SPACE TO FLY', this.logicalWidth / 2, promptY);

      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff0077';
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = 8;
      ctx.fillText('▲ THRUST TO ASCEND', this.logicalWidth / 2, promptY + 28);
      ctx.restore();
    }

    // 10. Top HUD: Distance & Orbs
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.fillText(`${this.distance}m`, 20, 28);

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText(`⭐ ${this.orbsCollected}`, this.logicalWidth - 20, 28);
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

window.CaveThrusterGame = CaveThrusterGame;
