/**
 * Mini Asteroids - Classic Vector Space Combat Arcade Game.
 * Complete touch-screen parity with Virtual Flight Thumbstick, Boost, Rapid Fire, and Warp.
 * Full multi-touch support for iOS/Android and Arrow/WASD keyboard controls for desktop.
 */
class MiniAsteroidsGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;

    // Arena dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // Ship properties
    this.ship = {
      x: 180,
      y: 270,
      angle: -Math.PI / 2, // Upwards default
      targetAngle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 9,
      rotSpeed: 0.082,
      thrustPower: 0.14,
      maxSpeed: 6.5,
      friction: 0.985,
      isThrusting: false,
      shieldTimer: 140, // Spawn invulnerability
      tripleShotTimer: 0, // Bonus weapon
      hyperspaceCooldown: 0
    };

    // Bullets list
    this.bullets = [];
    this.fireCooldown = 0;

    // Asteroids list
    this.asteroids = [];
    this.nextAsteroidId = 1;

    // Alien Flying Saucer (UFO)
    this.ufo = null;
    this.ufoSpawnTimer = 850;
    this.ufoBullets = [];

    // Starfield background
    this.stars = [];

    // Visuals & FX
    this.particles = [];
    this.floatingTexts = [];
    this.debrisLines = [];
    this.shakeIntensity = 0;
    this.isDying = false;
    this.deathTimer = 0;
    this.waveTransitionTimer = 0;

    // Audio throttle
    this.thrustAudioTimer = 0;

    // Keyboard state
    this.keys = {
      left: false,
      right: false,
      thrust: false,
      fire: false
    };

    // Touch Screen Controls Architecture
    this.joystick = {
      baseX: 75,
      baseY: 470,
      baseRadius: 44,
      knobX: 75,
      knobY: 470,
      targetKnobX: 75,
      targetKnobY: 470,
      knobRadius: 22,
      maxDist: 38,
      deadzone: 10,
      active: false,
      touchId: null,
      angle: -Math.PI / 2,
      dist: 0
    };

    this.boostBtn = {
      x: 145,
      y: 470,
      radius: 24,
      isDown: false,
      touchId: null
    };

    this.fireBtn = {
      x: 305,
      y: 466,
      radius: 35,
      isDown: false,
      touchId: null
    };

    this.warpBtn = {
      x: 238,
      y: 470,
      radius: 24,
      isDown: false,
      touchId: null
    };

    // Animation frame handle
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Cleanly abort existing RAF loops & listeners
    this.resize();

    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.shakeIntensity = 0;
    this.isDying = false;
    this.deathTimer = 0;
    this.waveTransitionTimer = 0;

    this.bullets = [];
    this.ufoBullets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.debrisLines = [];
    this.ufo = null;
    this.ufoSpawnTimer = 750;

    this.resetShip(true);
    this.resetJoystick();
    this.initStars();
    this.initWave(this.wave);

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

    this.layoutTouchControls();
  }

  layoutTouchControls() {
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Left Flight Joystick Base
    const joyBaseY = h - 65;
    const joyBaseX = Math.max(65, Math.min(85, w * 0.2));
    this.joystick.baseX = joyBaseX;
    this.joystick.baseY = joyBaseY;
    this.joystick.knobX = joyBaseX;
    this.joystick.knobY = joyBaseY;
    this.joystick.targetKnobX = joyBaseX;
    this.joystick.targetKnobY = joyBaseY;

    // Boost Button next to joystick
    this.boostBtn.x = joyBaseX + 66;
    this.boostBtn.y = joyBaseY;

    // Right Action Buttons
    this.fireBtn.x = w - 52;
    this.fireBtn.y = joyBaseY;

    this.warpBtn.x = w - 120;
    this.warpBtn.y = joyBaseY;
  }

  resetJoystick() {
    this.joystick.active = false;
    this.joystick.touchId = null;
    this.joystick.dist = 0;
    this.joystick.targetKnobX = this.joystick.baseX;
    this.joystick.targetKnobY = this.joystick.baseY;
  }

  initStars() {
    this.stars = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        size: Math.random() < 0.25 ? 2 : 1,
        alpha: 0.3 + Math.random() * 0.7,
        blinkSpeed: 0.02 + Math.random() * 0.04
      });
    }
  }

  resetShip(fullReset = false) {
    this.ship.x = this.logicalWidth / 2;
    this.ship.y = this.logicalHeight * 0.42;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.angle = -Math.PI / 2;
    this.ship.targetAngle = -Math.PI / 2;
    this.ship.isThrusting = false;
    this.ship.shieldTimer = 140; // ~2.3 seconds of invulnerability
    if (fullReset) {
      this.ship.tripleShotTimer = 0;
      this.ship.hyperspaceCooldown = 0;
    }
  }

  initWave(waveNum) {
    this.asteroids = [];
    this.wave = waveNum;
    const numRocks = 3 + Math.min(5, waveNum);

    for (let i = 0; i < numRocks; i++) {
      let spawnX, spawnY, dist;
      do {
        spawnX = Math.random() * this.logicalWidth;
        spawnY = Math.random() * this.logicalHeight;
        dist = Math.hypot(spawnX - this.ship.x, spawnY - this.ship.y);
      } while (dist < 110);

      const angle = Math.random() * Math.PI * 2;
      const speed = (0.7 + Math.random() * 0.75) * (1 + (waveNum - 1) * 0.08);
      const isBonus = Math.random() < 0.15;

      this.asteroids.push(this.createAsteroid(spawnX, spawnY, 3, Math.cos(angle) * speed, Math.sin(angle) * speed, isBonus));
    }

    this.createFloatingText(`SECTOR ${waveNum}`, this.logicalWidth / 2, this.logicalHeight * 0.35, '#00f3ff');
  }

  createAsteroid(x, y, size, vx, vy, isBonus = false) {
    const baseRadius = size === 3 ? 32 : size === 2 ? 18 : 10;
    const numVerts = size === 3 ? 11 : size === 2 ? 9 : 7;
    const points = [];

    for (let i = 0; i < numVerts; i++) {
      const a = (Math.PI * 2 / numVerts) * i;
      const r = baseRadius * (0.74 + Math.random() * 0.44);
      points.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r
      });
    }

    return {
      id: this.nextAsteroidId++,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      size: size,
      radius: baseRadius,
      points: points,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.035,
      isBonus: isBonus,
      color: isBonus ? '#ffd700' : '#00f3ff'
    };
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Native Touch Events with { passive: false } for rock-solid iOS/Android multi-touch
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    // Desktop Mouse Fallback
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);

    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = true;
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.keys.thrust = true;
    } else if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ') {
      e.preventDefault();
      this.keys.fire = true;
      this.fireBullet();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'KeyX' || e.code === 'KeyC') {
      e.preventDefault();
      this.hyperspaceJump();
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = false;
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.keys.thrust = false;
    } else if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ') {
      this.keys.fire = false;
    }
  }

  getTouchCoords(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  // --- MULTI-TOUCH ENGINE ---
  handleTouchStart(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const { x, y } = this.getTouchCoords(touch);

      // 1. Check Fire Button
      if (Math.hypot(x - this.fireBtn.x, y - this.fireBtn.y) <= this.fireBtn.radius + 14) {
        this.fireBtn.isDown = true;
        this.fireBtn.touchId = touch.identifier;
        this.fireBullet();
        continue;
      }

      // 2. Check Warp Button
      if (Math.hypot(x - this.warpBtn.x, y - this.warpBtn.y) <= this.warpBtn.radius + 12) {
        this.warpBtn.isDown = true;
        this.warpBtn.touchId = touch.identifier;
        this.hyperspaceJump();
        continue;
      }

      // 3. Check Boost Button
      if (Math.hypot(x - this.boostBtn.x, y - this.boostBtn.y) <= this.boostBtn.radius + 12) {
        this.boostBtn.isDown = true;
        this.boostBtn.touchId = touch.identifier;
        continue;
      }

      // 4. Check Left Thumbstick Region (Bottom-left area or within 75px of joystick)
      const distToJoy = Math.hypot(x - this.joystick.baseX, y - this.joystick.baseY);
      const isLeftFlightArea = (x < this.logicalWidth * 0.52 && y > this.logicalHeight - 140);

      if (distToJoy <= this.joystick.baseRadius * 1.8 || isLeftFlightArea) {
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;
        this.updateJoystick(x, y);
        continue;
      }

      // 5. Direct Arena Touch: Aim ship towards touch point and fire!
      const aimAngle = Math.atan2(y - this.ship.y, x - this.ship.x);
      this.ship.angle = aimAngle;
      this.fireBullet();
    }
  }

  handleTouchMove(e) {
    if (!this.isRunning) return;
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const { x, y } = this.getTouchCoords(touch);

      // Update Joystick
      if (touch.identifier === this.joystick.touchId) {
        this.updateJoystick(x, y);
      }

      // Check Fire Button drag tracking
      if (touch.identifier === this.fireBtn.touchId) {
        this.fireBtn.isDown = Math.hypot(x - this.fireBtn.x, y - this.fireBtn.y) <= this.fireBtn.radius + 20;
      }

      // Check Boost Button drag tracking
      if (touch.identifier === this.boostBtn.touchId) {
        this.boostBtn.isDown = Math.hypot(x - this.boostBtn.x, y - this.boostBtn.y) <= this.boostBtn.radius + 18;
      }
    }
  }

  handleTouchEnd(e) {
    if (!this.isRunning) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      if (touch.identifier === this.joystick.touchId) {
        this.resetJoystick();
      }
      if (touch.identifier === this.fireBtn.touchId) {
        this.fireBtn.isDown = false;
        this.fireBtn.touchId = null;
      }
      if (touch.identifier === this.boostBtn.touchId) {
        this.boostBtn.isDown = false;
        this.boostBtn.touchId = null;
      }
      if (touch.identifier === this.warpBtn.touchId) {
        this.warpBtn.isDown = false;
        this.warpBtn.touchId = null;
      }
    }
  }

  // --- DESKTOP MOUSE HANDLERS ---
  handleMouseDown(e) {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (Math.hypot(x - this.fireBtn.x, y - this.fireBtn.y) <= this.fireBtn.radius + 10) {
      this.fireBtn.isDown = true;
      this.fireBullet();
    } else if (Math.hypot(x - this.warpBtn.x, y - this.warpBtn.y) <= this.warpBtn.radius + 10) {
      this.hyperspaceJump();
    } else if (Math.hypot(x - this.boostBtn.x, y - this.boostBtn.y) <= this.boostBtn.radius + 10) {
      this.boostBtn.isDown = true;
    } else if (Math.hypot(x - this.joystick.baseX, y - this.joystick.baseY) <= this.joystick.baseRadius * 1.5) {
      this.joystick.active = true;
      this.updateJoystick(x, y);
    } else {
      // Direct Aim & Fire
      this.ship.angle = Math.atan2(y - this.ship.y, x - this.ship.x);
      this.fireBullet();
    }
  }

  handleMouseMove(e) {
    if (!this.isRunning || !this.joystick.active) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.updateJoystick(x, y);
  }

  handleMouseUp() {
    this.resetJoystick();
    this.fireBtn.isDown = false;
    this.boostBtn.isDown = false;
    this.warpBtn.isDown = false;
  }

  updateJoystick(px, py) {
    const dx = px - this.joystick.baseX;
    const dy = py - this.joystick.baseY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, this.joystick.maxDist);
    this.joystick.targetKnobX = this.joystick.baseX + Math.cos(angle) * clampedDist;
    this.joystick.targetKnobY = this.joystick.baseY + Math.sin(angle) * clampedDist;
    this.joystick.angle = angle;
    this.joystick.dist = dist;

    // Steer ship smoothly towards joystick angle if pushed past deadzone
    if (dist >= this.joystick.deadzone) {
      this.ship.targetAngle = angle;
    }
  }

  fireBullet() {
    if (!this.isRunning || this.isDying) return;
    if (this.fireCooldown > 0) return;
    if (this.bullets.length >= 8) return;

    this.fireCooldown = 10;
    ArcadeAudio.sfx.blaster();

    const noseDist = 14;
    const noseX = this.ship.x + Math.cos(this.ship.angle) * noseDist;
    const noseY = this.ship.y + Math.sin(this.ship.angle) * noseDist;
    const bulletSpeed = 9.4;

    if (this.ship.tripleShotTimer > 0) {
      for (let offset of [-0.22, 0, 0.22]) {
        const a = this.ship.angle + offset;
        this.bullets.push({
          x: noseX,
          y: noseY,
          vx: Math.cos(a) * bulletSpeed + this.ship.vx * 0.3,
          vy: Math.sin(a) * bulletSpeed + this.ship.vy * 0.3,
          life: 60,
          color: '#ffd700'
        });
      }
    } else {
      this.bullets.push({
        x: noseX,
        y: noseY,
        vx: Math.cos(this.ship.angle) * bulletSpeed + this.ship.vx * 0.3,
        vy: Math.sin(this.ship.angle) * bulletSpeed + this.ship.vy * 0.3,
        life: 60,
        color: '#00f3ff'
      });
    }
  }

  hyperspaceJump() {
    if (!this.isRunning || this.isDying) return;
    if (this.ship.hyperspaceCooldown > 0) {
      this.createFloatingText('WARP CHARGING...', this.ship.x, this.ship.y - 20, '#ff0055');
      return;
    }

    ArcadeAudio.sfx.hyperspace();
    this.shakeIntensity = 8;
    this.createWarpRipple(this.ship.x, this.ship.y);

    this.ship.x = 40 + Math.random() * (this.logicalWidth - 80);
    this.ship.y = 40 + Math.random() * (this.logicalHeight * 0.7);
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.shieldTimer = 90; // Shield on arrival
    this.ship.hyperspaceCooldown = 300; // 5s recharge

    this.createWarpRipple(this.ship.x, this.ship.y);
    this.createFloatingText('HYPERSPACE WARP! 🌀', this.ship.x, this.ship.y - 25, '#00f3ff');
  }

  update() {
    if (this.isDying) {
      this.deathTimer++;
      if (this.deathTimer > 40) {
        if (this.lives > 0) {
          this.isDying = false;
          this.deathTimer = 0;
          this.resetShip(false);
        } else {
          this.finishGameOver();
        }
      }
      this.updateParticles();
      return;
    }

    // 1. Smooth Joystick Knob Spring Interpolation
    this.joystick.knobX += (this.joystick.targetKnobX - this.joystick.knobX) * 0.38;
    this.joystick.knobY += (this.joystick.targetKnobY - this.joystick.knobY) * 0.38;

    // 2. Flight & Steering Inputs (Touch + Keyboard)
    let isThrusting = this.keys.thrust || this.boostBtn.isDown;

    // If using Keyboard Left/Right
    if (this.keys.left) {
      this.ship.angle -= this.ship.rotSpeed;
      this.ship.targetAngle = this.ship.angle;
    } else if (this.keys.right) {
      this.ship.angle += this.ship.rotSpeed;
      this.ship.targetAngle = this.ship.angle;
    } else if (this.joystick.active && this.joystick.dist >= this.joystick.deadzone) {
      // Smoothly steer towards joystick target angle
      let diff = this.joystick.angle - this.ship.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.ship.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.16);

      // Auto-thrust when joystick is pushed outward past 22px
      if (this.joystick.dist > 22) {
        isThrusting = true;
      }
    }

    this.ship.isThrusting = isThrusting;

    // 3. Thrust Acceleration & Jet Particles
    if (isThrusting) {
      this.ship.vx += Math.cos(this.ship.angle) * this.ship.thrustPower;
      this.ship.vy += Math.sin(this.ship.angle) * this.ship.thrustPower;

      const curSpeed = Math.hypot(this.ship.vx, this.ship.vy);
      if (curSpeed > this.ship.maxSpeed) {
        this.ship.vx = (this.ship.vx / curSpeed) * this.ship.maxSpeed;
        this.ship.vy = (this.ship.vy / curSpeed) * this.ship.maxSpeed;
      }

      // Exhaust flame particles
      const tailX = this.ship.x - Math.cos(this.ship.angle) * 10;
      const tailY = this.ship.y - Math.sin(this.ship.angle) * 10;
      const exhaustAngle = this.ship.angle + Math.PI + (Math.random() - 0.5) * 0.45;
      const exhaustSpeed = 2 + Math.random() * 3;

      this.particles.push({
        x: tailX,
        y: tailY,
        vx: Math.cos(exhaustAngle) * exhaustSpeed + this.ship.vx * 0.2,
        vy: Math.sin(exhaustAngle) * exhaustSpeed + this.ship.vy * 0.2,
        size: 2.5,
        alpha: 0.9,
        color: Math.random() < 0.5 ? '#ff9900' : '#ff0055'
      });

      this.thrustAudioTimer++;
      if (this.thrustAudioTimer % 12 === 0) {
        ArcadeAudio.sfx.thrust();
      }
    } else {
      this.thrustAudioTimer = 0;
    }

    // Auto-fire while holding Fire button
    if ((this.fireBtn.isDown || this.keys.fire) && this.fireCooldown <= 0) {
      this.fireBullet();
    }

    // Velocity & Space Friction
    this.ship.vx *= this.ship.friction;
    this.ship.vy *= this.ship.friction;
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;

    // Screen Wraparound
    this.ship.x = this.wrapCoordinate(this.ship.x, this.logicalWidth);
    this.ship.y = this.wrapCoordinate(this.ship.y, this.logicalHeight);

    // Timers
    if (this.ship.shieldTimer > 0) this.ship.shieldTimer--;
    if (this.ship.tripleShotTimer > 0) this.ship.tripleShotTimer--;
    if (this.ship.hyperspaceCooldown > 0) this.ship.hyperspaceCooldown--;
    if (this.fireCooldown > 0) this.fireCooldown--;

    // 4. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.x = this.wrapCoordinate(b.x, this.logicalWidth);
      b.y = this.wrapCoordinate(b.y, this.logicalHeight);
      b.life--;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with Asteroids
      let bulletHit = false;
      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const ast = this.asteroids[aIdx];
        if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.radius + 3) {
          bulletHit = true;
          this.destroyAsteroid(ast, aIdx);
          break;
        }
      }

      // Check collision with UFO
      if (!bulletHit && this.ufo) {
        if (Math.hypot(b.x - this.ufo.x, b.y - this.ufo.y) < this.ufo.radius + 4) {
          bulletHit = true;
          this.destroyUfo();
        }
      }

      if (bulletHit) {
        this.bullets.splice(i, 1);
      }
    }

    // 5. Update Asteroids
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.angle += ast.vRot;
      ast.x = this.wrapCoordinate(ast.x, this.logicalWidth);
      ast.y = this.wrapCoordinate(ast.y, this.logicalHeight);

      // Ship vs Asteroid Collision
      if (!this.isDying && this.ship.shieldTimer <= 0) {
        if (Math.hypot(this.ship.x - ast.x, this.ship.y - ast.y) < ast.radius + this.ship.radius - 2) {
          this.destroyShip();
          break;
        }
      }
    }

    // 6. Update UFO
    this.updateUfo();

    // 7. Check Wave Clear
    if (this.asteroids.length === 0 && !this.ufo) {
      this.waveTransitionTimer++;
      if (this.waveTransitionTimer === 1) {
        const bonusPts = 500 * this.wave;
        this.score += bonusPts;
        this.onScoreUpdate(this.score);
        ArcadeAudio.sfx.star(this.wave);
        this.createFloatingText(`SECTOR CLEARED! +${bonusPts}`, this.logicalWidth / 2, this.logicalHeight * 0.35, '#00ff88');
      } else if (this.waveTransitionTimer > 65) {
        this.waveTransitionTimer = 0;
        this.initWave(this.wave + 1);
      }
    }

    // 8. Update Particles & Visuals
    this.updateParticles();

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }
  }

  updateUfo() {
    if (!this.ufo) {
      this.ufoSpawnTimer--;
      if (this.ufoSpawnTimer <= 0) {
        this.spawnUfo();
      }
      return;
    }

    this.ufo.x += this.ufo.vx;
    this.ufo.phase += 0.04;
    this.ufo.y = this.ufo.baseY + Math.sin(this.ufo.phase) * 24;

    this.ufo.shootTimer--;
    if (this.ufo.shootTimer <= 0) {
      this.ufo.shootTimer = 110;
      const angle = Math.atan2(this.ship.y - this.ufo.y, this.ship.x - this.ufo.x) + (Math.random() - 0.5) * 0.35;
      const ufoSpeed = 3.6;
      this.ufoBullets.push({
        x: this.ufo.x,
        y: this.ufo.y,
        vx: Math.cos(angle) * ufoSpeed,
        vy: Math.sin(angle) * ufoSpeed,
        life: 90
      });
      ArcadeAudio.sfx.laser();
    }

    if (this.ufo.vx > 0 && this.ufo.x > this.logicalWidth + 30) {
      this.ufo = null;
      this.ufoSpawnTimer = 850;
    } else if (this.ufo.vx < 0 && this.ufo.x < -30) {
      this.ufo = null;
      this.ufoSpawnTimer = 850;
    }

    for (let i = this.ufoBullets.length - 1; i >= 0; i--) {
      const ub = this.ufoBullets[i];
      ub.x += ub.vx;
      ub.y += ub.vy;
      ub.life--;

      if (ub.life <= 0) {
        this.ufoBullets.splice(i, 1);
        continue;
      }

      if (!this.isDying && this.ship.shieldTimer <= 0) {
        if (Math.hypot(this.ship.x - ub.x, this.ship.y - ub.y) < this.ship.radius + 4) {
          this.ufoBullets.splice(i, 1);
          this.destroyShip();
          break;
        }
      }
    }
  }

  spawnUfo() {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -20 : this.logicalWidth + 20;
    const speed = fromLeft ? 1.5 : -1.5;

    this.ufo = {
      x: startX,
      y: 80 + Math.random() * (this.logicalHeight * 0.45),
      baseY: 80 + Math.random() * (this.logicalHeight * 0.45),
      vx: speed,
      phase: 0,
      radius: 14,
      shootTimer: 60
    };

    ArcadeAudio.sfx.buzz();
    this.createFloatingText('⚠️ ALIEN SCOUT INCOMING! ⚠️', this.logicalWidth / 2, 45, '#ff0055');
  }

  destroyUfo() {
    ArcadeAudio.sfx.explosion();
    this.shakeIntensity = 10;
    this.createExplosion(this.ufo.x, this.ufo.y, '#ff0055', 18);

    const pts = 1000;
    this.score += pts;
    this.onScoreUpdate(this.score);
    this.createFloatingText(`UFO DESTROYED! +${pts}`, this.ufo.x, this.ufo.y, '#ff0055');

    this.ufo = null;
    this.ufoSpawnTimer = 1100;
  }

  destroyAsteroid(ast, index) {
    this.asteroids.splice(index, 1);
    ArcadeAudio.sfx.rockHit(ast.size);
    this.shakeIntensity = Math.max(this.shakeIntensity, ast.size === 3 ? 5 : ast.size === 2 ? 3 : 1.5);

    const basePts = ast.size === 3 ? 100 : ast.size === 2 ? 200 : 350;
    const pts = ast.isBonus ? basePts * 2 : basePts;
    this.score += pts;
    this.onScoreUpdate(this.score);

    this.createFloatingText(`+${pts}`, ast.x, ast.y, ast.color);
    this.createExplosion(ast.x, ast.y, ast.color, ast.size === 3 ? 14 : ast.size === 2 ? 9 : 5);

    if (ast.size > 1) {
      const nextSize = ast.size - 1;
      const speedMult = 1.35;

      for (let dir of [-0.65, 0.65]) {
        const angle = Math.atan2(ast.vy, ast.vx) + dir + (Math.random() - 0.5) * 0.3;
        const speed = Math.hypot(ast.vx, ast.vy) * speedMult + 0.3;
        this.asteroids.push(this.createAsteroid(
          ast.x,
          ast.y,
          nextSize,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          ast.isBonus
        ));
      }
    }

    if (ast.isBonus && ast.size === 1) {
      ArcadeAudio.sfx.star(3);
      this.ship.tripleShotTimer = 480;
      this.createFloatingText('★ TRIPLE SHOT UNLOCKED! ★', this.ship.x, this.ship.y - 30, '#ffd700');
    }
  }

  destroyShip() {
    this.isDying = true;
    this.deathTimer = 0;
    this.lives--;
    this.shakeIntensity = 12;
    ArcadeAudio.sfx.explosion();

    this.createShipDebris(this.ship.x, this.ship.y, this.ship.angle);
    this.createExplosion(this.ship.x, this.ship.y, '#00f3ff', 24);

    if (this.lives > 0) {
      this.createFloatingText(`SHIP LOST! ❤️ ${this.lives} LEFT`, this.logicalWidth / 2, this.logicalHeight * 0.4, '#ff0055');
    } else {
      this.createFloatingText('FLEET DESTROYED!', this.logicalWidth / 2, this.logicalHeight * 0.4, '#ff0055');
    }
  }

  wrapCoordinate(val, max) {
    const margin = 16;
    if (val < -margin) return max + margin;
    if (val > max + margin) return -margin;
    return val;
  }

  createShipDebris(x, y, angle) {
    const lines = [
      { len: 14, angle: angle },
      { len: 12, angle: angle + 2.4 },
      { len: 12, angle: angle - 2.4 },
      { len: 8, angle: angle + Math.PI }
    ];

    lines.forEach(l => {
      const speed = 1.5 + Math.random() * 3.5;
      const driftAngle = Math.random() * Math.PI * 2;
      this.debrisLines.push({
        x: x,
        y: y,
        vx: Math.cos(driftAngle) * speed,
        vy: Math.sin(driftAngle) * speed,
        len: l.len,
        angle: l.angle,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1
      });
    });
  }

  createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        alpha: 1,
        color: color
      });
    }
  }

  createWarpRipple(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        alpha: 1,
        color: '#00f3ff'
      });
    }
  }

  createFloatingText(text, x, y, color = '#00f3ff') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.2,
      alpha: 1,
      color: color
    });
  }

  updateParticles() {
    this.stars.forEach(s => {
      s.alpha += Math.sin(Date.now() * s.blinkSpeed) * 0.01;
      s.alpha = Math.max(0.2, Math.min(0.9, s.alpha));
    });

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.024;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.debrisLines.length - 1; i >= 0; i--) {
      const dl = this.debrisLines[i];
      dl.x += dl.vx;
      dl.y += dl.vy;
      dl.angle += dl.vRot;
      dl.alpha -= 0.02;
      if (dl.alpha <= 0) {
        this.debrisLines.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
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

    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // Deep space black void
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 1. Starfield
    this.renderStars(ctx);

    // 2. Control Zone Boundary Line
    this.renderControlDeckBoundary(ctx);

    // 3. Asteroids
    this.renderAsteroids(ctx);

    // 4. UFO & UFO Bullets
    this.renderUfo(ctx);

    // 5. Bullets
    this.renderBullets(ctx);

    // 6. Particles & Ship Debris
    this.renderParticles(ctx);

    // 7. Vector Ship
    if (!this.isDying) {
      this.renderShip(ctx);
    }

    // 8. On-Screen Touch Controls (Virtual Joystick + Boost + Fire + Warp)
    this.renderTouchControls(ctx);

    // 9. HUD & Sector Badge
    this.renderHUD(ctx);

    // 10. Floating Score Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  renderControlDeckBoundary(ctx) {
    ctx.save();
    const deckY = this.logicalHeight - 120;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, deckY);
    ctx.lineTo(this.logicalWidth, deckY);
    ctx.stroke();

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('FLIGHT DECK', 12, deckY - 6);
    ctx.restore();
  }

  renderStars(ctx) {
    ctx.save();
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.restore();
  }

  renderAsteroids(ctx) {
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.angle);

      ctx.strokeStyle = ast.color;
      ctx.shadowColor = ast.color;
      ctx.shadowBlur = ast.isBonus ? 12 : 6;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      for (let p = 0; p < ast.points.length; p++) {
        const pt = ast.points[p];
        if (p === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();

      if (ast.isBonus) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);
      }

      ctx.restore();
    }
  }

  renderShip(ctx) {
    const s = this.ship;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);

    // Shield Force Field Bubble
    if (s.shieldTimer > 0) {
      const shieldAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.35;
      ctx.strokeStyle = `rgba(0, 243, 255, ${shieldAlpha})`;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Thruster Jet Flame
    if (s.isThrusting) {
      const flameLen = 8 + Math.random() * 8;
      ctx.strokeStyle = '#ff9900';
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff5500';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-6 - flameLen, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Ship Body (Atari Delta Fighter)
    const shipColor = s.tripleShotTimer > 0 ? '#ffd700' : '#00f3ff';
    ctx.strokeStyle = shipColor;
    ctx.shadowColor = shipColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(14, 0); // Nose tip
    ctx.lineTo(-10, -9); // Left fin
    ctx.lineTo(-6, 0); // Tail indent
    ctx.lineTo(-10, 9); // Right fin
    ctx.closePath();
    ctx.stroke();

    // Cockpit core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -1, 4, 2);

    ctx.restore();
  }

  renderBullets(ctx) {
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderUfo(ctx) {
    if (this.ufo) {
      ctx.save();
      ctx.translate(this.ufo.x, this.ufo.y);

      ctx.strokeStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, -4, 6, Math.PI, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-4, 4, 8, 2);

      ctx.restore();
    }

    for (let i = 0; i < this.ufoBullets.length; i++) {
      const ub = this.ufoBullets[i];
      ctx.save();
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ub.x, ub.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderParticles(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    for (let i = 0; i < this.debrisLines.length; i++) {
      const dl = this.debrisLines[i];
      ctx.save();
      ctx.translate(dl.x, dl.y);
      ctx.rotate(dl.angle);
      ctx.strokeStyle = '#00f3ff';
      ctx.globalAlpha = dl.alpha;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-dl.len / 2, 0);
      ctx.lineTo(dl.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderTouchControls(ctx) {
    ctx.save();

    // 1. Virtual Flight Thumbstick
    const joy = this.joystick;
    const isJoyActive = joy.active;

    // Joystick Base Outer Ring
    ctx.strokeStyle = isJoyActive ? 'rgba(0, 243, 255, 0.7)' : 'rgba(0, 243, 255, 0.3)';
    ctx.fillStyle = isJoyActive ? 'rgba(0, 243, 255, 0.08)' : 'rgba(0, 243, 255, 0.03)';
    ctx.lineWidth = isJoyActive ? 2.5 : 1.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = isJoyActive ? 10 : 4;

    ctx.beginPath();
    ctx.arc(joy.baseX, joy.baseY, joy.baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crosshair guide lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(joy.baseX - joy.baseRadius + 6, joy.baseY);
    ctx.lineTo(joy.baseX + joy.baseRadius - 6, joy.baseY);
    ctx.moveTo(joy.baseX, joy.baseY - joy.baseRadius + 6);
    ctx.lineTo(joy.baseX, joy.baseY + joy.baseRadius - 6);
    ctx.stroke();

    // Joystick Floating Knob
    const knobColor = isJoyActive ? '#00f3ff' : 'rgba(0, 243, 255, 0.55)';
    ctx.strokeStyle = knobColor;
    ctx.fillStyle = isJoyActive ? 'rgba(0, 243, 255, 0.4)' : 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = isJoyActive ? 2.5 : 1.5;
    ctx.shadowBlur = isJoyActive ? 14 : 6;

    ctx.beginPath();
    ctx.arc(joy.knobX, joy.knobY, joy.knobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knob Center Delta Indicator
    ctx.save();
    ctx.translate(joy.knobX, joy.knobY);
    ctx.rotate(this.ship.angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Label under joystick
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('STEER', joy.baseX, joy.baseY + joy.baseRadius + 14);

    // 2. Boost Button
    const bb = this.boostBtn;
    ctx.strokeStyle = bb.isDown ? '#ff9900' : 'rgba(255, 153, 0, 0.45)';
    ctx.fillStyle = bb.isDown ? 'rgba(255, 153, 0, 0.25)' : 'rgba(255, 153, 0, 0.06)';
    ctx.lineWidth = bb.isDown ? 2.5 : 1.5;
    ctx.shadowColor = '#ff9900';
    ctx.shadowBlur = bb.isDown ? 12 : 5;

    ctx.beginPath();
    ctx.arc(bb.x, bb.y, bb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', bb.x, bb.y);

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255, 153, 0, 0.7)';
    ctx.fillText('BOOST', bb.x, bb.y + bb.radius + 14);

    // 3. Hyperspace Warp Button
    const wb = this.warpBtn;
    const isWarpReady = this.ship.hyperspaceCooldown <= 0;
    const warpColor = isWarpReady ? '#bf55ec' : '#555577';

    ctx.strokeStyle = wb.isDown ? '#ffffff' : warpColor;
    ctx.fillStyle = wb.isDown ? 'rgba(191, 85, 236, 0.35)' : 'rgba(191, 85, 236, 0.08)';
    ctx.lineWidth = wb.isDown ? 2.5 : 1.5;
    ctx.shadowColor = warpColor;
    ctx.shadowBlur = isWarpReady ? 8 : 2;

    ctx.beginPath();
    ctx.arc(wb.x, wb.y, wb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isWarpReady ? '#ffffff' : '#888888';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌀', wb.x, wb.y);

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = warpColor;
    ctx.fillText('WARP', wb.x, wb.y + wb.radius + 14);

    // 4. Large Fire Button
    const fb = this.fireBtn;
    ctx.strokeStyle = fb.isDown ? '#ffffff' : '#ff0055';
    ctx.fillStyle = fb.isDown ? 'rgba(255, 0, 85, 0.45)' : 'rgba(255, 0, 85, 0.12)';
    ctx.lineWidth = fb.isDown ? 3 : 2;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = fb.isDown ? 16 : 8;

    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', fb.x, fb.y - 2);

    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff0055';
    ctx.fillText('FIRE', fb.x, fb.y + fb.radius + 14);

    ctx.restore();
  }

  renderHUD(ctx) {
    ctx.save();

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    let hearts = '';
    for (let i = 0; i < this.lives; i++) hearts += '❤️';
    ctx.fillText(hearts || '💀', 16, 24);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.fillText(`SECTOR ${this.wave}`, this.logicalWidth / 2, 24);

    ctx.textAlign = 'right';
    if (this.ship.hyperspaceCooldown > 0) {
      const pct = Math.floor((1 - this.ship.hyperspaceCooldown / 300) * 100);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`WARP ${pct}%`, this.logicalWidth - 16, 24);
    } else {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText('WARP OK', this.logicalWidth - 16, 24);
    }

    if (this.ship.tripleShotTimer > 0) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('★ TRIPLE BLASTER ★', this.logicalWidth / 2, 42);
    }

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

window.MiniAsteroidsGame = MiniAsteroidsGame;
window.MicroAsteroidsGame = MiniAsteroidsGame;
