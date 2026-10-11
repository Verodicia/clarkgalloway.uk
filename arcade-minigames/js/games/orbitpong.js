/**
 * Orbit Pong - 360-degree circular arcade deflection game.
 * Touch drag around the perimeter or use Left/Right keys to rotate your paddle shield.
 */
class OrbitPongGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.volleys = 0;

    // Arena geometry
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 140;

    // Paddle properties
    this.paddleAngle = -Math.PI / 2; // Top center default
    this.paddleTargetAngle = this.paddleAngle;
    this.paddleArc = 1.15; // Generous ~66 degrees starting arc
    this.paddleThickness = 12;
    this.rotSpeed = 0.08;

    // Ball properties
    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 6.5,
      speed: 2.0, // Friendly, slow starting speed
      trail: []
    };

    // Serve delay countdown (in frames, ~1.2s at 60fps)
    this.serveTimer = 75;
    this.launchAngle = -Math.PI / 2;

    // Bonus orbs inside arena
    this.bonusOrbs = [];
    this.orbSpawnTimer = 180;

    // Visual polish
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.arenaHue = 190;

    // Input state
    this.keys = { left: false, right: false };
    this.isPointerDown = false;

    // Animation loop tracker
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Cleanly abort any existing animation frame and detach old listeners
    this.resize();
    this.score = 0;
    this.volleys = 0;
    this.paddleAngle = -Math.PI / 2;
    this.paddleTargetAngle = this.paddleAngle;
    this.paddleArc = 1.15;
    this.shakeIntensity = 0;
    this.arenaHue = 190;

    this.particles = [];
    this.floatingTexts = [];
    this.bonusOrbs = [];
    this.orbSpawnTimer = 180;

    // Reset ball to center and prepare serve countdown
    this.resetBall();

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

    this.centerX = this.logicalWidth / 2;
    this.centerY = this.logicalHeight / 2;
    // Scale radius nicely for mobile vs tablet/desktop
    this.radius = Math.min(this.logicalWidth, this.logicalHeight) * 0.40;
  }

  resetBall() {
    this.ball.x = this.centerX;
    this.ball.y = this.centerY;
    this.ball.speed = 2.0; // Slow, accessible starting speed
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.trail = [];

    // Aim serve directly towards paddle arc so first hit is easy to align
    this.launchAngle = this.paddleAngle + (Math.random() - 0.5) * 0.35;
    this.serveTimer = 75; // ~1.2 second grace period before launch
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  handleKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = true;
    }
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.keys.right = false;
    }
  }

  getPointerAngle(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return Math.atan2(py - this.centerY, px - this.centerX);
  }

  handlePointerDown(e) {
    e.preventDefault();
    this.isPointerDown = true;
    this.paddleTargetAngle = this.getPointerAngle(e);
  }

  handlePointerMove(e) {
    if (this.isPointerDown) {
      e.preventDefault();
      this.paddleTargetAngle = this.getPointerAngle(e);
    }
  }

  handlePointerUp() {
    this.isPointerDown = false;
  }

  spawnBonusOrb() {
    // Spawn at random angle within 35% - 65% of arena radius
    const angle = Math.random() * Math.PI * 2;
    const dist = this.radius * (0.35 + Math.random() * 0.3);
    this.bonusOrbs.push({
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      radius: 9,
      pulse: 0
    });
  }

  createSparks(x, y, hue = 180, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        hue: hue,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  createFloatingText(text, x, y, color = '#ffd700') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.2,
      alpha: 1,
      color: color
    });
  }

  // Shortest angular difference helper
  normalizeAngle(ang) {
    while (ang <= -Math.PI) ang += Math.PI * 2;
    while (ang > Math.PI) ang -= Math.PI * 2;
    return ang;
  }

  update() {
    if (!this.isRunning) return;

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Keyboard paddle rotation
    if (this.keys.left) {
      this.paddleTargetAngle -= this.rotSpeed;
    }
    if (this.keys.right) {
      this.paddleTargetAngle += this.rotSpeed;
    }

    // Normalize paddle angles
    this.paddleTargetAngle = this.normalizeAngle(this.paddleTargetAngle);
    let angleDiff = this.normalizeAngle(this.paddleTargetAngle - this.paddleAngle);
    this.paddleAngle = this.normalizeAngle(this.paddleAngle + angleDiff * 0.35);

    // Serve delay: give player time to position paddle before ball launches
    if (this.serveTimer > 0) {
      this.serveTimer--;
      // During countdown, auto-align launch angle to paddle direction
      this.launchAngle = this.paddleAngle;
      if (this.serveTimer === 0) {
        this.ball.vx = Math.cos(this.launchAngle) * this.ball.speed;
        this.ball.vy = Math.sin(this.launchAngle) * this.ball.speed;
        ArcadeAudio.sfx.drop();
      }
      return; // Hold ball until countdown expires
    }

    // Ball trail update
    this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ball.trail.length > 8) {
      this.ball.trail.shift();
    }

    // Ball movement
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Distance of ball from center
    const dx = this.ball.x - this.centerX;
    const dy = this.ball.y - this.centerY;
    const dist = Math.hypot(dx, dy);

    // Collision with Outer Perimeter
    if (dist + this.ball.radius >= this.radius) {
      const ballAngle = Math.atan2(dy, dx);
      const hitDiff = Math.abs(this.normalizeAngle(ballAngle - this.paddleAngle));

      // Check if ball struck the paddle arc
      if (hitDiff <= this.paddleArc / 2 + 0.10) {
        // Successful Deflection!
        this.volleys++;
        // Score scaled by 7x
        this.score += (10 + Math.floor(this.volleys * 1.5)) * 7;
        this.onScoreUpdate(this.score);

        // Increase ball speed gradually (gentle ramp, capped at 7.5 max)
        this.ball.speed = Math.min(7.5, this.ball.speed + 0.09);

        // Narrow paddle slightly as score increases (down to ~0.65 rad)
        this.paddleArc = Math.max(0.65, 1.15 - (this.volleys * 0.005));

        // Normal unit vector from center
        const nx = dx / dist;
        const ny = dy / dist;

        // Radial reflection: v' = v - 2*(v·n)*n
        const dot = this.ball.vx * nx + this.ball.vy * ny;
        let rx = this.ball.vx - 2 * dot * nx;
        let ry = this.ball.vy - 2 * dot * ny;

        // Add deflection spin based on how off-center the paddle hit was
        const hitOffset = this.normalizeAngle(ballAngle - this.paddleAngle) / (this.paddleArc / 2);
        // Tangent vector
        const tx = -ny;
        const ty = nx;
        rx += tx * hitOffset * 1.5;
        ry += ty * hitOffset * 1.5;

        // Re-normalize to target speed
        const newSpeed = Math.hypot(rx, ry);
        this.ball.vx = (rx / newSpeed) * this.ball.speed;
        this.ball.vy = (ry / newSpeed) * this.ball.speed;

        // Push ball just inside the perimeter
        this.ball.x = this.centerX + nx * (this.radius - this.ball.radius - 2);
        this.ball.y = this.centerY + ny * (this.radius - this.ball.radius - 2);

        // Visual & audio juice
        this.shakeIntensity = 4;
        this.arenaHue = (this.volleys * 18 + 190) % 360;
        this.createSparks(this.ball.x, this.ball.y, this.arenaHue, 16);
        ArcadeAudio.sfx.pongBounce(this.volleys);
      } else {
        // Miss! Ball breached the perimeter
        if (dist >= this.radius + 24) {
          this.createSparks(this.ball.x, this.ball.y, 350, 30);
          this.shakeIntensity = 10;
          ArcadeAudio.sfx.explosion();
          this.gameOver();
          return;
        }
      }
    }

    // Bonus Orbs interaction
    this.orbSpawnTimer--;
    if (this.orbSpawnTimer <= 0) {
      if (this.bonusOrbs.length < 2) {
        this.spawnBonusOrb();
      }
      this.orbSpawnTimer = 220 + Math.floor(Math.random() * 120);
    }

    for (let i = this.bonusOrbs.length - 1; i >= 0; i--) {
      const orb = this.bonusOrbs[i];
      orb.pulse += 0.06;

      const dOrb = Math.hypot(this.ball.x - orb.x, this.ball.y - orb.y);
      if (dOrb < this.ball.radius + orb.radius) {
        // Ball collected the bonus orb! (7x scaled: 50 * 7 = 350)
        const bonus = 350;
        this.score += bonus;
        this.onScoreUpdate(this.score);

        ArcadeAudio.sfx.star(3);
        this.createFloatingText(`+${bonus}`, orb.x, orb.y);
        this.createSparks(orb.x, orb.y, 50, 20); // Gold sparks
        this.shakeIntensity = 3;

        this.bonusOrbs.splice(i, 1);
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
      ft.alpha -= 0.025;
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

    // Outer Circular Boundary Arena
    ctx.save();
    ctx.strokeStyle = `hsl(${this.arenaHue}, 80%, 45%)`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = `hsl(${this.arenaHue}, 100%, 55%)`;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle inner concentric ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Center pivot crosshair
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(this.centerX - 12, this.centerY);
    ctx.lineTo(this.centerX + 12, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - 12);
    ctx.lineTo(this.centerX, this.centerY + 12);
    ctx.stroke();
    ctx.restore();

    // Draw Bonus Orbs
    for (const orb of this.bonusOrbs) {
      ctx.save();
      const glow = Math.sin(orb.pulse) * 4;
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12 + glow;

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius + glow * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Core sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Paddle Arc
    ctx.save();
    const halfArc = this.paddleArc / 2;
    const startAngle = this.paddleAngle - halfArc;
    const endAngle = this.paddleAngle + halfArc;

    ctx.strokeStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 14;
    ctx.lineWidth = this.paddleThickness;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();

    // Draw Ball Trail
    for (let i = 0; i < this.ball.trail.length; i++) {
      const t = this.ball.trail[i];
      const prog = (i + 1) / this.ball.trail.length;
      ctx.fillStyle = `hsla(${this.arenaHue}, 100%, 65%, ${prog * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.ball.radius * prog, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Ball
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = `hsl(${this.arenaHue}, 100%, 70%)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Sparks
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw Floating Texts
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

    // Volleys Counter in center
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.volleys} VOLLEYS`, this.centerX, this.centerY + 40);
    ctx.restore();

    // Serve Countdown & Aim Indicator
    if (this.serveTimer > 0) {
      ctx.save();
      // Dashed aim guide line to paddle
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      const targetX = this.centerX + Math.cos(this.launchAngle) * (this.radius - this.paddleThickness);
      const targetY = this.centerY + Math.sin(this.launchAngle) * (this.radius - this.paddleThickness);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated "GET READY!" prompt
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      const pulseAlpha = 0.6 + Math.sin(Date.now() * 0.012) * 0.4;
      ctx.globalAlpha = pulseAlpha;
      ctx.fillText('GET READY!', this.centerX, this.centerY - 26);
      ctx.restore();
    }

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
window.OrbitPongGame = OrbitPongGame;
