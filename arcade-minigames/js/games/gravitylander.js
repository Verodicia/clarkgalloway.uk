/**
 * Gravity Lander: Lunar Thrust
 * Precision vector lander physics! Regulate rocket burn, control descent velocity, and touch down on jagged neon platforms.
 */
class GravityLanderGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.logicalWidth = 400;
    this.logicalHeight = 600;

    // Game state
    this.isRunning = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.fuel = 100;
    this.maxFuel = 100;

    // Lander physics
    this.lander = {
      x: 200,
      y: 80,
      vx: 0.8,
      vy: 0,
      angle: 0, // Radians (0 = pointing straight up)
      angVel: 0,
      radius: 12,
      gravity: 0.042,
      thrustPower: 0.095,
      rotSpeed: 0.05
    };

    // Terrain & Landing Pads
    this.terrain = [];
    this.landingPads = [];
    this.fuelCanisters = [];

    // State & FX
    this.isThrusting = false;
    this.isLeftRCS = false;
    this.isRightRCS = false;
    this.isCrashing = false;
    this.isLanded = false;
    this.landedTimer = 0;
    this.shakeIntensity = 0;
    this.particles = [];
    this.floatingTexts = [];

    // Controls
    this.keys = { thrust: false, left: false, right: false };
    this.touchThrust = false;
    this.touchLeft = false;
    this.touchRight = false;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.fuel = 100;
    this.isCrashing = false;
    this.isLanded = false;
    this.landedTimer = 0;
    this.shakeIntensity = 0;

    this.particles = [];
    this.floatingTexts = [];

    this.resetLander();
    this.generateTerrain();

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
  }

  resetLander() {
    this.lander.x = 60 + Math.random() * (this.logicalWidth - 120);
    this.lander.y = 70;
    this.lander.vx = (Math.random() - 0.5) * 1.2;
    this.lander.vy = 0;
    this.lander.angle = 0;
    this.lander.angVel = 0;
    this.isThrusting = false;
    this.isLanded = false;
    this.isCrashing = false;
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
    if (!this.isRunning) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      e.preventDefault();
      this.keys.thrust = true;
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.keys.right = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.thrust = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const btnY = this.logicalHeight - 55;
    if (py >= btnY - 10) {
      const w = this.logicalWidth;
      if (px < w * 0.3) {
        this.touchLeft = true;
      } else if (px > w * 0.7) {
        this.touchRight = true;
      } else {
        this.touchThrust = true;
      }
    } else {
      // Tap upper half to thrust
      this.touchThrust = true;
    }
  }

  handlePointerUp() {
    this.touchThrust = false;
    this.touchLeft = false;
    this.touchRight = false;
  }

  generateTerrain() {
    this.terrain = [];
    this.landingPads = [];
    this.fuelCanisters = [];

    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const groundBaseY = h - 110;

    // Pick 2 landing pad slots (1 wide 1x pad, 1 narrow 3x pad)
    const pad1X = 40 + Math.random() * (w * 0.35);
    const pad1W = 55;
    const pad1Y = groundBaseY - 20 - Math.random() * 40;

    const pad2X = w * 0.55 + Math.random() * (w * 0.3);
    const pad2W = 36;
    const pad2Y = groundBaseY - 10 - Math.random() * 50;

    this.landingPads.push({
      x: pad1X,
      y: pad1Y,
      width: pad1W,
      multiplier: 1,
      color: '#00f3ff'
    });

    this.landingPads.push({
      x: pad2X,
      y: pad2Y,
      width: pad2W,
      multiplier: 3,
      color: '#ff00aa'
    });

    // Build jagged vector terrain connecting edges and pads
    const points = [];
    points.push({ x: 0, y: groundBaseY - 10 + Math.random() * 20 });

    // Midpoints before pad 1
    const p1Left = pad1X;
    const p1Right = pad1X + pad1W;
    points.push({ x: p1Left * 0.5, y: groundBaseY - 60 + Math.random() * 30 });
    // Pad 1 flat surface
    points.push({ x: p1Left, y: pad1Y });
    points.push({ x: p1Right, y: pad1Y });

    // Crag peak between pads
    const midX = (p1Right + pad2X) / 2;
    points.push({ x: midX, y: groundBaseY - 95 + Math.random() * 30 });

    // Pad 2 flat surface
    const p2Right = pad2X + pad2W;
    points.push({ x: pad2X, y: pad2Y });
    points.push({ x: p2Right, y: pad2Y });

    // Slope to right boundary
    points.push({ x: (p2Right + w) / 2, y: groundBaseY - 45 + Math.random() * 25 });
    points.push({ x: w, y: groundBaseY + Math.random() * 20 });

    this.terrain = points;

    // Spawn 1 Fuel Pod floating in the upper canyon
    this.fuelCanisters.push({
      x: midX,
      y: 160 + Math.random() * 80,
      radius: 9,
      collected: false
    });
  }

  update() {
    if (!this.isRunning) return;

    // Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Success landing transition
    if (this.isLanded) {
      this.landedTimer--;
      if (this.landedTimer <= 0) {
        this.level++;
        this.fuel = Math.min(this.maxFuel, this.fuel + 40);
        this.generateTerrain();
        this.resetLander();
      }
      return;
    }

    if (this.isCrashing) return;

    const p = this.lander;

    // Rotation / RCS controls
    const rotateLeft = this.keys.left || this.touchLeft;
    const rotateRight = this.keys.right || this.touchRight;

    if (rotateLeft && this.fuel > 0) {
      p.angle -= p.rotSpeed;
      this.fuel = Math.max(0, this.fuel - 0.08);
      this.isLeftRCS = true;
      if (Math.random() < 0.3 && typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.thrusterRCS();
      }
    } else {
      this.isLeftRCS = false;
    }

    if (rotateRight && this.fuel > 0) {
      p.angle += p.rotSpeed;
      this.fuel = Math.max(0, this.fuel - 0.08);
      this.isRightRCS = true;
      if (Math.random() < 0.3 && typeof ArcadeAudio !== 'undefined') {
        ArcadeAudio.sfx.thrusterRCS();
      }
    } else {
      this.isRightRCS = false;
    }

    // Main Rocket Thruster
    const wantsThrust = (this.keys.thrust || this.touchThrust) && this.fuel > 0;
    if (wantsThrust) {
      this.isThrusting = true;
      this.fuel = Math.max(0, this.fuel - 0.22);

      // Thrust accelerates lander opposite to bottom angle
      p.vx += Math.sin(p.angle) * p.thrustPower;
      p.vy -= Math.cos(p.angle) * p.thrustPower;

      if (typeof ArcadeAudio !== 'undefined' && Math.random() < 0.4) {
        ArcadeAudio.sfx.thrusterRCS();
      }

      // Exhaust flame particles
      const exAngle = p.angle + Math.PI;
      for (let k = 0; k < 2; k++) {
        this.particles.push({
          x: p.x + Math.sin(exAngle) * 12,
          y: p.y - Math.cos(exAngle) * 12,
          vx: Math.sin(exAngle + (Math.random() - 0.5) * 0.5) * (Math.random() * 3 + 2),
          vy: -Math.cos(exAngle + (Math.random() - 0.5) * 0.5) * (Math.random() * 3 + 2),
          life: 0.6,
          decay: 0.06,
          color: Math.random() < 0.5 ? '#00f3ff' : '#ff00aa',
          size: Math.random() * 3.5 + 1.5
        });
      }
    } else {
      this.isThrusting = false;
    }

    // Apply gravity
    p.vy += p.gravity;

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Screen wrapping / walls
    if (p.x < 10) {
      p.x = 10;
      p.vx = -p.vx * 0.5;
    } else if (p.x > this.logicalWidth - 10) {
      p.x = this.logicalWidth - 10;
      p.vx = -p.vx * 0.5;
    }

    // Ceiling limit
    if (p.y < 20) {
      p.y = 20;
      p.vy = 0.5;
    }

    // Collect Fuel Canister
    this.fuelCanisters.forEach(f => {
      if (!f.collected) {
        const dx = p.x - f.x;
        const dy = p.y - f.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.radius + f.radius) {
          f.collected = true;
          this.fuel = Math.min(this.maxFuel, this.fuel + 35);
          this.score += 250;
          this.onScoreUpdate(this.score);
          this.addFloatingText('+35 FUEL!', f.x, f.y, '#00ff88');
          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.fuelPickup();
          }
        }
      }
    });

    // Check Landing & Terrain Collisions
    this.checkTerrainCollisions();

    // Particles & Text
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

  checkTerrainCollisions() {
    const p = this.lander;
    const footY = p.y + p.radius;

    // Check Landing Pads first
    for (const pad of this.landingPads) {
      if (p.x >= pad.x && p.x <= pad.x + pad.width) {
        if (footY >= pad.y - 2 && footY <= pad.y + 12) {
          // Check touchdown safety criteria
          const safeVy = p.vy <= 1.6;
          const safeVx = Math.abs(p.vx) <= 1.2;
          const safeTilt = Math.abs(p.angle) <= 0.35; // ~20 degrees

          if (safeVy && safeVx && safeTilt) {
            // Touchdown SUCCESS!
            this.isLanded = true;
            this.landedTimer = 75;
            p.y = pad.y - p.radius;
            p.vx = 0;
            p.vy = 0;
            p.angle = 0;

            const fuelBonus = Math.floor(this.fuel) * 10;
            const padBonus = 1000 * pad.multiplier;
            const total = padBonus + fuelBonus;

            this.score += total;
            this.onScoreUpdate(this.score);
            this.addFloatingText(`PERFECT LANDING! (${pad.multiplier}x) +${total}`, p.x, p.y - 24, '#00ff88');

            if (typeof ArcadeAudio !== 'undefined') {
              ArcadeAudio.sfx.softLanding();
            }
            return;
          } else {
            // Hard crash on pad!
            this.handleCrash('HARD IMPACT CRASH');
            return;
          }
        }
      }
    }

    // Check jagged terrain collision line segments
    for (let i = 0; i < this.terrain.length - 1; i++) {
      const t1 = this.terrain[i];
      const t2 = this.terrain[i + 1];

      if (p.x >= t1.x && p.x <= t2.x) {
        // Linear interpolation of terrain height at p.x
        const ratio = (p.x - t1.x) / (t2.x - t1.x);
        const terrY = t1.y + ratio * (t2.y - t1.y);

        if (footY >= terrY - 2) {
          this.handleCrash('TERRAIN IMPACT');
          return;
        }
      }
    }
  }

  handleCrash(reason) {
    this.isCrashing = true;
    this.lives--;
    this.shakeIntensity = 22;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.explosion();
    }

    // Explosion debris
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: this.lander.x,
        y: this.lander.y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7 - 2,
        life: 1.0,
        decay: 0.035,
        color: Math.random() < 0.5 ? '#ff0055' : '#ffd200',
        size: Math.random() * 3.5 + 2
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    } else {
      setTimeout(() => {
        this.resetLander();
        this.fuel = Math.max(30, this.fuel);
      }, 600);
    }
  }

  addFloatingText(text, x, y, color = '#00ff88') {
    this.floatingTexts.push({ text, x, y, vy: -1.0, alpha: 1.0, color });
  }

  draw() {
    this.ctx.save();

    // Camera Shake
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // 1. Deep Cosmos Space Background
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#04020a');
    skyGrad.addColorStop(0.7, '#08081a');
    skyGrad.addColorStop(1, '#120b22');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Stars
    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 35; i++) {
      const sx = (i * 47) % w;
      const sy = (i * 31) % (h - 150);
      this.ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // 2. Draw Jagged Terrain
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.terrain.forEach(pt => {
      this.ctx.lineTo(pt.x, pt.y);
    });
    this.ctx.lineTo(w, h);
    this.ctx.closePath();

    this.ctx.fillStyle = '#0a0d18';
    this.ctx.fill();

    this.ctx.strokeStyle = '#2a3b5c';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 3. Draw Landing Pads
    this.landingPads.forEach(pad => {
      this.ctx.save();
      this.ctx.strokeStyle = pad.color;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = pad.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(pad.x, pad.y);
      this.ctx.lineTo(pad.x + pad.width, pad.y);
      this.ctx.stroke();

      // Pad text multiplier
      this.ctx.fillStyle = pad.color;
      this.ctx.font = '8px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${pad.multiplier}X`, pad.x + pad.width / 2, pad.y + 14);
      this.ctx.restore();
    });
    this.ctx.restore();

    // 4. Draw Fuel Canister
    this.fuelCanisters.forEach(f => {
      if (!f.collected) {
        this.ctx.save();
        this.ctx.translate(f.x, f.y);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#02180e';
        this.ctx.font = '7px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚡', 0, 3);
        this.ctx.restore();
      }
    });

    // 5. Draw Lander Craft
    if (this.lives > 0 && !this.isCrashing) {
      this.drawLanderCraft();
    }

    // 6. Particles
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 7. Floating Texts
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 11px "Press Start 2P", monospace';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 8. HUD & Flight Telemetry
    this.drawHUD();

    // 9. Touch Controls
    this.drawTouchControls();

    this.ctx.restore();
  }

  drawLanderCraft() {
    const p = this.lander;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle);

    // Module Body: Polygonal Lunar Pod
    this.ctx.fillStyle = '#111827';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 1.8;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 6;

    this.ctx.beginPath();
    this.ctx.moveTo(0, -p.radius);
    this.ctx.lineTo(p.radius * 0.8, -p.radius * 0.3);
    this.ctx.lineTo(p.radius * 0.7, p.radius * 0.6);
    this.ctx.lineTo(-p.radius * 0.7, p.radius * 0.6);
    this.ctx.lineTo(-p.radius * 0.8, -p.radius * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Cockpit Visor
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.beginPath();
    this.ctx.arc(0, -p.radius * 0.3, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Landing Legs / Struts
    this.ctx.strokeStyle = '#8292ab';
    this.ctx.lineWidth = 1.5;

    // Left leg
    this.ctx.beginPath();
    this.ctx.moveTo(-p.radius * 0.6, p.radius * 0.5);
    this.ctx.lineTo(-p.radius * 1.1, p.radius * 1.1);
    this.ctx.lineTo(-p.radius * 1.3, p.radius * 1.1);
    this.ctx.stroke();

    // Right leg
    this.ctx.beginPath();
    this.ctx.moveTo(p.radius * 0.6, p.radius * 0.5);
    this.ctx.lineTo(p.radius * 1.1, p.radius * 1.1);
    this.ctx.lineTo(p.radius * 1.3, p.radius * 1.1);
    this.ctx.stroke();

    // Thruster Bell
    this.ctx.fillStyle = '#ff00aa';
    this.ctx.fillRect(-3, p.radius * 0.6, 6, 3);

    this.ctx.restore();
  }

  drawHUD() {
    const w = this.logicalWidth;
    const p = this.lander;

    this.ctx.save();
    this.ctx.font = '8px "Press Start 2P", monospace';

    // Lives
    this.ctx.fillStyle = '#8292ab';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LIVES:', 14, 18);
    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(72 + i * 14, 15, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Fuel Bar
    const fuelW = 90;
    const fuelRatio = this.fuel / this.maxFuel;
    const fuelColor = fuelRatio > 0.3 ? '#00ff88' : '#ff0055';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(14, 25, fuelW, 5);
    this.ctx.fillStyle = fuelColor;
    this.ctx.shadowColor = fuelColor;
    this.ctx.shadowBlur = 6;
    this.ctx.fillRect(14, 25, fuelW * fuelRatio, 5);
    this.ctx.shadowBlur = 0;

    // Telemetry: Descent Rate & Horizontal Drift
    this.ctx.textAlign = 'right';
    const safeVy = p.vy <= 1.6;
    this.ctx.fillStyle = safeVy ? '#00ff88' : '#ff0055';
    this.ctx.fillText(`V-SPEED: ${p.vy.toFixed(1)} ${safeVy ? '✔' : '⚠'}`, w - 14, 18);

    const safeVx = Math.abs(p.vx) <= 1.2;
    this.ctx.fillStyle = safeVx ? '#00f3ff' : '#ffd200';
    this.ctx.fillText(`H-DRIFT: ${Math.abs(p.vx).toFixed(1)}`, w - 14, 30);

    this.ctx.restore();
  }

  drawTouchControls() {
    const y = this.logicalHeight - 50;
    const w = this.logicalWidth;

    this.ctx.save();
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';

    // Left RCS
    const btnW = w * 0.28;
    this.ctx.fillStyle = this.touchLeft || this.keys.left ? 'rgba(0, 243, 255, 0.35)' : 'rgba(10, 20, 35, 0.75)';
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    this.ctx.fillRect(10, y, btnW, 40);
    this.ctx.strokeRect(10, y, btnW, 40);
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText('◀ RCS', 10 + btnW / 2, y + 24);

    // Main Thrust
    const midW = w * 0.36;
    const midX = (w - midW) / 2;
    this.ctx.fillStyle = this.touchThrust || this.keys.thrust ? 'rgba(255, 0, 170, 0.35)' : 'rgba(20, 10, 30, 0.75)';
    this.ctx.strokeStyle = 'rgba(255, 0, 170, 0.35)';
    this.ctx.fillRect(midX, y, midW, 40);
    this.ctx.strokeRect(midX, y, midW, 40);
    this.ctx.fillStyle = '#ff00aa';
    this.ctx.fillText('THRUST ▲', midX + midW / 2, y + 24);

    // Right RCS
    const rX = w - 10 - btnW;
    this.ctx.fillStyle = this.touchRight || this.keys.right ? 'rgba(0, 243, 255, 0.35)' : 'rgba(10, 20, 35, 0.75)';
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    this.ctx.fillRect(rX, y, btnW, 40);
    this.ctx.strokeRect(rX, y, btnW, 40);
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText('RCS ▶', rX + btnW / 2, y + 24);

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
