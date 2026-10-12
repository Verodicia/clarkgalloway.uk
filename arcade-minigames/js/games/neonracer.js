/**
 * Neon Racer: Synthwave Highway (OutRun-style pseudo-3D racer)
 * Navigate a high-speed cyber highway, dodge traffic, hit nitro pads, and chain close-pass combos!
 */
class NeonRacerGame {
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
    this.distance = 0;
    this.lives = 3;
    this.speed = 0;
    this.maxSpeed = 220;
    this.nitroSpeed = 340;
    this.accel = 1.4;
    this.decel = 2.0;
    this.isBraking = false;
    this.isNitro = false;
    this.nitroFuel = 100;
    this.survivalSeconds = 0;
    this.difficulty = 0;

    // Player position: x from -1.0 (left lane) to 1.0 (right lane)
    this.playerX = 0;
    this.playerTargetX = 0;
    this.steerSpeed = 0.045;

    // Road scroll state
    this.roadOffset = 0;
    this.curve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;

    // Traffic & Hazards
    this.traffic = [];
    this.nitroPads = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.isCrashing = false;
    this.invulnerableTimer = 0;

    // Combo system for close near-miss passes
    this.combo = 1;
    this.comboTimer = 0;

    // Controls
    this.keys = { left: false, right: false, up: false, down: false };
    this.touchSteer = 0;
    this.touchNitro = false;
    this.touchBrake = false;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
    this.animId = null;
  }

  start() {
    this.stop();
    this.resize();

    this.score = 0;
    this.distance = 0;
    this.lives = 3;
    this.speed = 100;
    this.playerX = 0;
    this.playerTargetX = 0;
    this.roadOffset = 0;
    this.curve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;
    this.nitroFuel = 100;
    this.survivalSeconds = 0;
    this.difficulty = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.shakeIntensity = 0;
    this.isCrashing = false;
    this.invulnerableTimer = 0;

    this.traffic = [];
    this.nitroPads = [];
    this.particles = [];
    this.floatingTexts = [];

    this.spawnInitialTraffic();

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

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (!this.isRunning) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.keys.right = true;
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      e.preventDefault();
      this.keys.up = true;
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      this.keys.down = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    this.updatePointerInput(e);
  }

  handlePointerMove(e) {
    if (!this.isRunning) return;
    if (e.buttons > 0 || e.pointerType === 'touch') {
      this.updatePointerInput(e);
    }
  }

  updatePointerInput(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check bottom pedal buttons
    const btnY = this.logicalHeight - 55;
    if (py >= btnY) {
      if (px < this.logicalWidth * 0.35) {
        this.touchBrake = true;
        this.touchNitro = false;
        return;
      } else if (px > this.logicalWidth * 0.65) {
        this.touchNitro = true;
        this.touchBrake = false;
        return;
      }
    }

    // Steering zone across width
    const relX = (px / this.logicalWidth) * 2 - 1; // -1 to +1
    this.touchSteer = Math.max(-1, Math.min(1, relX * 1.3));
  }

  handlePointerUp() {
    this.touchSteer = 0;
    this.touchNitro = false;
    this.touchBrake = false;
  }

  spawnInitialTraffic() {
    this.traffic = [];
    // Start with low traffic (2 cars spaced generously)
    for (let i = 0; i < 2; i++) {
      this.traffic.push({
        z: 480 + i * 460,
        x: (Math.random() - 0.5) * 1.4,
        speed: 75 + Math.random() * 40,
        type: Math.random() < 0.35 ? 'truck' : (Math.random() < 0.5 ? 'super' : 'coupe'),
        width: 0.35,
        passed: false
      });
    }

    // Seed nitro pad
    this.nitroPads = [{
      z: 700,
      x: (Math.random() - 0.5) * 1.2,
      passed: false
    }];
  }

  update() {
    // Particles and floating text always update even during crash / game over
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

    if (!this.isRunning) return;

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // Progressive difficulty scaling over time (from 0.0 at start to 1.0 at ~75s)
    this.survivalSeconds += 1 / 60;
    this.difficulty = Math.min(1.0, this.survivalSeconds / 75);

    // Nitro & Brake
    const wantsNitro = (this.keys.up || this.touchNitro) && this.nitroFuel > 5 && !this.isCrashing;
    this.isBraking = (this.keys.down || this.touchBrake) && !this.isCrashing;

    if (wantsNitro) {
      this.isNitro = true;
      this.nitroFuel = Math.max(0, this.nitroFuel - 0.6);
      this.speed += this.accel * 2.2;
      if (this.speed > this.nitroSpeed) this.speed = this.nitroSpeed;

      // Exhaust nitro particles
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.logicalWidth / 2 + this.playerX * 110 + (Math.random() - 0.5) * 20,
          y: this.logicalHeight - 85,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 2,
          life: 0.7,
          decay: 0.05,
          color: Math.random() < 0.5 ? '#00f3ff' : '#ff00aa',
          size: Math.random() * 4 + 2
        });
      }
    } else {
      this.isNitro = false;
      // Refill nitro slowly
      if (this.nitroFuel < 100) this.nitroFuel += 0.18;

      if (this.isBraking) {
        this.speed -= this.decel * 2.5;
        if (this.speed < 50) this.speed = 50;
      } else {
        // Natural cruising throttle
        if (this.speed < this.maxSpeed) {
          this.speed += this.accel;
        } else if (this.speed > this.maxSpeed) {
          this.speed -= this.decel;
        }
      }
    }

    if (this.isCrashing) {
      this.speed = Math.max(0, this.speed - 4);
    }

    // Steering
    let steerDir = 0;
    if (this.keys.left) steerDir -= 1;
    if (this.keys.right) steerDir += 1;
    if (this.touchSteer !== 0) steerDir = this.touchSteer;

    if (!this.isCrashing) {
      this.playerX += steerDir * this.steerSpeed * (this.speed / 140);
      // Clamp within highway boundaries with soft bounce
      if (this.playerX < -1.15) {
        this.playerX = -1.15;
        this.shakeIntensity = 2;
      } else if (this.playerX > 1.15) {
        this.playerX = 1.15;
        this.shakeIntensity = 2;
      }
    }

    // Road scrolling & Curvature
    const deltaZ = (this.speed / 60) * 8;
    this.roadOffset += deltaZ;
    this.distance += Math.floor(deltaZ);

    // Curve cycle
    this.curveTimer++;
    if (this.curveTimer > 280) {
      this.curveTimer = 0;
      this.targetCurve = (Math.random() - 0.5) * 1.8;
    }
    this.curve += (this.targetCurve - this.curve) * 0.015;
    this.playerX -= this.curve * 0.006 * (this.speed / 160);

    // Distance points
    this.score += Math.floor((this.speed / 60) * this.combo);
    this.onScoreUpdate(this.score);

    // Combo timer decay
    if (this.combo > 1) {
      this.comboTimer -= 1;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // Update traffic with progressive incoming approach speed (0.10 -> 0.15 at hardest level)
    const approachRate = 0.10 + this.difficulty * 0.05;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      // Car moves forward at car.speed, player moves at this.speed
      car.z -= (this.speed - car.speed) * approachRate;

      // Check close near-miss pass
      if (!car.passed && car.z < 60 && car.z > 0 && Math.abs(car.x - this.playerX) < 0.65) {
        car.passed = true;
        this.combo = Math.min(5, this.combo + 1);
        this.comboTimer = 180;
        this.score += 200 * this.combo;
        this.onScoreUpdate(this.score);
        this.addFloatingText(`NEAR MISS! x${this.combo}`, this.logicalWidth / 2, this.logicalHeight - 160, '#00ff88');

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.carHorn();
        }
      }

      // Check Collision with player
      if (!this.isCrashing && this.invulnerableTimer <= 0 && car.z < 45 && car.z > -15) {
        const xDist = Math.abs(car.x - this.playerX);
        if (xDist < 0.38) {
          this.handleCrash(car);
          return;
        }
      }

      // Recycle cars that passed far behind or too far ahead
      if (car.z < -60) {
        this.traffic.splice(i, 1);
        this.spawnTrafficAhead();
      }
    }

    // Keep traffic population healthy (ramps from 2 cars up to 5 cars at hardest level)
    const maxTraffic = Math.min(5, Math.floor(2 + this.difficulty * 3.2));
    while (this.traffic.length < maxTraffic) {
      this.spawnTrafficAhead();
    }

    // Update Nitro Pads
    for (let i = this.nitroPads.length - 1; i >= 0; i--) {
      const pad = this.nitroPads[i];
      pad.z -= (this.speed) * 0.15;

      if (!pad.passed && pad.z < 40 && pad.z > -10 && Math.abs(pad.x - this.playerX) < 0.45) {
        pad.passed = true;
        this.nitroFuel = 100;
        this.speed = this.nitroSpeed;
        this.score += 500;
        this.onScoreUpdate(this.score);
        this.addFloatingText('NITRO OVERDRIVE! +500', this.logicalWidth / 2, this.logicalHeight - 170, '#00f3ff');
        this.shakeIntensity = 8;

        if (typeof ArcadeAudio !== 'undefined') {
          ArcadeAudio.sfx.nitroBoost();
        }
      }

      if (pad.z < -40) {
        this.nitroPads.splice(i, 1);
        if (Math.random() < 0.65) {
          this.nitroPads.push({
            z: 900 + Math.random() * 500,
            x: (Math.random() - 0.5) * 1.3,
            passed: false
          });
        }
      }
    }
  }

  spawnTrafficAhead() {
    const maxZ = this.traffic.reduce((max, c) => Math.max(max, c.z), 400);
    // Spacing between cars shrinks as difficulty ramps up to hardest level
    const minGap = 420 - this.difficulty * 170; // 420 -> 250 (current hardest)
    const randomGap = 280 - this.difficulty * 60; // 280 -> 220 (current hardest)

    // Base car speeds: faster cars initially (gentler relative speed), slower trucks at max difficulty
    const baseCarSpeed = 75 - this.difficulty * 15; // 75 -> 60 (current hardest)
    const speedVar = 45 + this.difficulty * 10; // 45 -> 55 (current hardest)

    this.traffic.push({
      z: maxZ + minGap + Math.random() * randomGap,
      x: (Math.random() - 0.5) * 1.5,
      speed: baseCarSpeed + Math.random() * speedVar,
      type: Math.random() < 0.3 ? 'truck' : (Math.random() < 0.45 ? 'super' : 'coupe'),
      width: 0.35,
      passed: false
    });
  }

  handleCrash(car) {
    if (this.isCrashing) return;
    this.isCrashing = true;
    this.lives--;
    this.shakeIntensity = 20;
    this.combo = 1;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.screech();
      ArcadeAudio.sfx.explosion();
    }

    // Spark / wreckage particles
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: this.logicalWidth / 2 + this.playerX * 110,
        y: this.logicalHeight - 95,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 1.0,
        decay: 0.035,
        color: Math.random() < 0.5 ? '#ff0055' : '#ffd200',
        size: Math.random() * 4 + 2
      });
    }

    if (this.lives <= 0) {
      this.isRunning = false;
      setTimeout(() => {
        this.onGameOver(this.score);
      }, 700);
    } else {
      setTimeout(() => {
        this.isCrashing = false;
        this.playerX = 0;
        this.speed = 100;
        this.invulnerableTimer = 60; // 1 sec flashing immunity
        // Clear immediate colliding cars
        this.traffic = this.traffic.filter(c => c.z > 150);
      }, 600);
    }
  }

  addFloatingText(text, x, y, color = '#00ff88') {
    this.floatingTexts.push({ text, x, y, vy: -1.2, alpha: 1.0, color });
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
    const horizon = h * 0.42;

    // 1. Sky & Synthwave Sunset
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#090514');
    skyGrad.addColorStop(0.65, '#260933');
    skyGrad.addColorStop(1, '#660b45');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, horizon);

    // Segmented Synthwave Sun
    const sunR = 48;
    const sunX = w / 2 + this.curve * 40;
    const sunY = horizon - 15;

    for (let r = 0; r < 7; r++) {
      const sy = sunY - sunR + r * 14;
      const sh = 10;
      if (sy + sh > horizon) break;
      this.ctx.fillStyle = r < 3 ? '#ffe600' : (r < 5 ? '#ff007f' : '#b700ff');
      this.ctx.beginPath();
      this.ctx.rect(sunX - sunR, sy, sunR * 2, sh);
      this.ctx.fill();
    }

    // Wireframe Mountain Silhouette
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.28)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, horizon);
    const peaks = [0.1, 0.22, 0.38, 0.5, 0.65, 0.8, 0.92, 1.0];
    peaks.forEach((p, idx) => {
      const px = w * p;
      const py = horizon - (idx % 2 === 0 ? 28 : 16);
      this.ctx.lineTo(px - w * 0.06, py);
      this.ctx.lineTo(px, horizon);
    });
    this.ctx.stroke();

    // 2. Pseudo-3D Road Perspective
    const roadBottomW = w * 0.88;
    const roadTopW = w * 0.08;
    const roadBottomY = h - 50; // Leave space for pedals
    const roadTopY = horizon;

    // Road Grass / Ground
    const groundGrad = this.ctx.createLinearGradient(0, horizon, 0, h);
    groundGrad.addColorStop(0, '#0b001a');
    groundGrad.addColorStop(1, '#020008');
    this.ctx.fillStyle = groundGrad;
    this.ctx.fillRect(0, horizon, w, h - horizon);

    // Draw Perspective Road Slices
    const numSlices = 45;
    for (let i = numSlices - 1; i >= 0; i--) {
      const p1 = i / numSlices;
      const p2 = (i + 1) / numSlices;

      const y1 = roadTopY + Math.pow(p1, 1.8) * (roadBottomY - roadTopY);
      const y2 = roadTopY + Math.pow(p2, 1.8) * (roadBottomY - roadTopY);

      const rw1 = roadTopW + Math.pow(p1, 1.8) * (roadBottomW - roadTopW);
      const rw2 = roadTopW + Math.pow(p2, 1.8) * (roadBottomW - roadTopW);

      const curveOffset1 = Math.pow(p1, 2) * this.curve * 70;
      const curveOffset2 = Math.pow(p2, 2) * this.curve * 70;

      const cx1 = w / 2 + curveOffset1;
      const cx2 = w / 2 + curveOffset2;

      // Segment stripe color alternator
      const stripeIdx = Math.floor((this.roadOffset + i * 20) / 40) % 2;
      const roadColor = stripeIdx === 0 ? '#110b22' : '#170f30';
      const rumbleColor = stripeIdx === 0 ? '#ff007f' : '#00f3ff';
      const laneLineColor = stripeIdx === 0 ? 'rgba(255, 255, 255, 0.7)' : 'transparent';

      // Road tarmac
      this.ctx.fillStyle = roadColor;
      this.ctx.beginPath();
      this.ctx.moveTo(cx1 - rw1 / 2, y1);
      this.ctx.lineTo(cx1 + rw1 / 2, y1);
      this.ctx.lineTo(cx2 + rw2 / 2, y2);
      this.ctx.lineTo(cx2 - rw2 / 2, y2);
      this.ctx.closePath();
      this.ctx.fill();

      // Neon rumble curbs
      const curbW1 = rw1 * 0.07;
      const curbW2 = rw2 * 0.07;
      this.ctx.fillStyle = rumbleColor;
      // Left curb
      this.ctx.beginPath();
      this.ctx.moveTo(cx1 - rw1 / 2 - curbW1, y1);
      this.ctx.lineTo(cx1 - rw1 / 2, y1);
      this.ctx.lineTo(cx2 - rw2 / 2, y2);
      this.ctx.lineTo(cx2 - rw2 / 2 - curbW2, y2);
      this.ctx.fill();
      // Right curb
      this.ctx.beginPath();
      this.ctx.moveTo(cx1 + rw1 / 2, y1);
      this.ctx.lineTo(cx1 + rw1 / 2 + curbW1, y1);
      this.ctx.lineTo(cx2 + rw2 / 2 + curbW2, y2);
      this.ctx.lineTo(cx2 + rw2 / 2, y2);
      this.ctx.fill();

      // Dashed lane divider
      if (laneLineColor !== 'transparent') {
        const lw1 = Math.max(1.5, rw1 * 0.015);
        const lw2 = Math.max(1.5, rw2 * 0.015);
        this.ctx.fillStyle = laneLineColor;
        // Left lane line
        this.ctx.fillRect(cx1 - rw1 * 0.17, y1, lw1, y2 - y1);
        // Right lane line
        this.ctx.fillRect(cx1 + rw1 * 0.17, y1, lw1, y2 - y1);
      }
    }

    // 3. Draw Nitro Pads on Road
    this.nitroPads.forEach(pad => {
      if (pad.z > 0 && pad.z < 800) {
        const p = Math.max(0, 1 - pad.z / 800);
        const py = roadTopY + Math.pow(p, 1.8) * (roadBottomY - roadTopY);
        const rw = roadTopW + Math.pow(p, 1.8) * (roadBottomW - roadTopW);
        const px = w / 2 + Math.pow(p, 2) * this.curve * 70 + (pad.x * rw * 0.4);
        const size = Math.max(8, p * 42);

        this.ctx.save();
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        // Chevron shape
        this.ctx.moveTo(px, py - size);
        this.ctx.lineTo(px - size * 0.6, py);
        this.ctx.lineTo(px, py - size * 0.3);
        this.ctx.lineTo(px + size * 0.6, py);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    // 4. Draw Traffic
    // Sort traffic by z descending so further cars render first
    const sortedTraffic = [...this.traffic].sort((a, b) => b.z - a.z);
    sortedTraffic.forEach(car => {
      if (car.z > 0 && car.z < 800) {
        const p = Math.max(0, 1 - car.z / 800);
        const py = roadTopY + Math.pow(p, 1.8) * (roadBottomY - roadTopY);
        const rw = roadTopW + Math.pow(p, 1.8) * (roadBottomW - roadTopW);
        const px = w / 2 + Math.pow(p, 2) * this.curve * 70 + (car.x * rw * 0.4);

        const carW = Math.max(12, p * 54);
        const carH = carW * 0.65;

        this.drawTrafficCar(px, py, carW, carH, car.type);
      }
    });

    // 5. Draw Player Car
    if (this.lives > 0) {
      const isFlashing = this.invulnerableTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0;
      if (!isFlashing) {
        const pCarX = w / 2 + this.playerX * (roadBottomW * 0.38);
        const pCarY = roadBottomY - 24;
        this.drawPlayerCar(pCarX, pCarY);
      }
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

    // 8. HUD: Speedometer, Nitro Bar, Lives, Combo
    this.drawHUD();

    // 9. Touch Pedals
    this.drawTouchPedals();

    this.ctx.restore();
  }

  drawPlayerCar(x, y) {
    const w = 58;
    const h = 36;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Car shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 8, w * 0.6, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Main Chassis: Cyberpunk Wedged Supercar
    this.ctx.fillStyle = '#0f172a';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.42, 4);
    this.ctx.lineTo(-w * 0.5, -h * 0.3);
    this.ctx.lineTo(-w * 0.32, -h * 0.85);
    this.ctx.lineTo(w * 0.32, -h * 0.85);
    this.ctx.lineTo(w * 0.5, -h * 0.3);
    this.ctx.lineTo(w * 0.42, 4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Cockpit Roof
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.moveTo(-w * 0.24, -h * 0.35);
    this.ctx.lineTo(-w * 0.18, -h * 0.8);
    this.ctx.lineTo(w * 0.18, -h * 0.8);
    this.ctx.lineTo(w * 0.24, -h * 0.35);
    this.ctx.closePath();
    this.ctx.fill();

    // Neon Tail Lights
    this.ctx.fillStyle = this.isBraking ? '#ff0033' : '#ff007f';
    this.ctx.shadowColor = this.ctx.fillStyle;
    this.ctx.shadowBlur = this.isBraking ? 14 : 8;
    this.ctx.fillRect(-w * 0.44, -h * 0.15, w * 0.25, 4.5);
    this.ctx.fillRect(w * 0.19, -h * 0.15, w * 0.25, 4.5);

    // Nitro Thruster Glow
    if (this.isNitro) {
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.arc(0, 1, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawTrafficCar(x, y, w, h, type) {
    this.ctx.save();
    this.ctx.translate(x, y);

    let bodyColor = '#331122';
    let trimColor = '#ff0055';

    if (type === 'truck') {
      bodyColor = '#1f2937';
      trimColor = '#ffd200';
    } else if (type === 'super') {
      bodyColor = '#06202a';
      trimColor = '#00f3ff';
    }

    this.ctx.fillStyle = bodyColor;
    this.ctx.strokeStyle = trimColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.rect(-w / 2, -h, w, h);
    this.ctx.fill();
    this.ctx.stroke();

    // Red tail lights
    this.ctx.fillStyle = trimColor;
    this.ctx.shadowColor = trimColor;
    this.ctx.shadowBlur = 6;
    this.ctx.fillRect(-w * 0.42, -h * 0.3, w * 0.22, Math.max(2, h * 0.25));
    this.ctx.fillRect(w * 0.2, -h * 0.3, w * 0.22, Math.max(2, h * 0.25));

    this.ctx.restore();
  }

  drawHUD() {
    const w = this.logicalWidth;

    // Top Header: Speed & Score
    this.ctx.save();
    this.ctx.font = '9px "Press Start 2P", monospace';

    // Lives
    this.ctx.fillStyle = '#8292ab';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('LIVES:', 14, 20);
    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = '#ff007f';
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(74 + i * 16, 16, 4.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Speedometer
    this.ctx.textAlign = 'right';
    const speedColor = this.isNitro ? '#00f3ff' : '#ffd200';
    this.ctx.fillStyle = speedColor;
    this.ctx.fillText(`${Math.round(this.speed)} KM/H`, w - 14, 20);

    // Nitro Fuel Gauge (Top Bar)
    const nitroW = 110;
    const nitroX = w - 14 - nitroW;
    const nitroY = 28;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(nitroX, nitroY, nitroW, 5);

    this.ctx.fillStyle = '#00f3ff';
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 6;
    this.ctx.fillRect(nitroX, nitroY, nitroW * (this.nitroFuel / 100), 5);
    this.ctx.shadowBlur = 0;

    // Center Traffic / Heat Status
    this.ctx.textAlign = 'center';
    const heatColor = this.difficulty >= 0.85 ? '#ff007f' : (this.difficulty >= 0.45 ? '#ffd200' : '#00ff88');
    this.ctx.fillStyle = heatColor;
    const heatLabel = this.difficulty >= 0.95 ? 'HEAT MAX' : (this.difficulty >= 0.6 ? 'HEAVY TRAFFIC' : (this.difficulty >= 0.3 ? 'MID TRAFFIC' : 'CRUISE'));
    this.ctx.fillText(`${Math.floor(this.distance / 10)}M • ${heatLabel}`, w / 2, 20);

    // Combo Indicator
    if (this.combo > 1) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText(`COMBO x${this.combo}!`, w / 2, 42);
    }

    this.ctx.restore();
  }

  drawTouchPedals() {
    const y = this.logicalHeight - 48;
    const w = this.logicalWidth;

    this.ctx.save();
    this.ctx.font = '8px "Press Start 2P", monospace';

    // Left Brake Pedal
    const brakeW = w * 0.32;
    this.ctx.fillStyle = this.touchBrake || this.keys.down ? 'rgba(255, 0, 85, 0.4)' : 'rgba(20, 10, 30, 0.75)';
    this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
    this.ctx.fillRect(10, y, brakeW, 38);
    this.ctx.strokeRect(10, y, brakeW, 38);

    this.ctx.fillStyle = '#ff0055';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BRAKE', 10 + brakeW / 2, y + 23);

    // Center steer hint
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.fillText('◀ STEER ▶', w / 2, y + 23);

    // Right Nitro Pedal
    const nitroW = w * 0.32;
    const nitroX = w - 10 - nitroW;
    this.ctx.fillStyle = this.touchNitro || this.keys.up ? 'rgba(0, 243, 255, 0.4)' : 'rgba(10, 25, 40, 0.75)';
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    this.ctx.fillRect(nitroX, y, nitroW, 38);
    this.ctx.strokeRect(nitroX, y, nitroW, 38);

    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText('NITRO', nitroX + nitroW / 2, y + 23);

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
