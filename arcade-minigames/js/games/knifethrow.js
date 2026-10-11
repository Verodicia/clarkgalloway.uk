/**
 * Knife Throw - Cyberpunk rotating pin-wheel blade arcade minigame.
 * Tap or hit Space to shoot knives into a rotating cyber core target.
 * Avoid previously embedded blades, slice bonus cyber apples, and shatter targets!
 */
class KnifeThrowGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.waitingForFirstThrow = true;
    this.score = 0;
    this.stage = 1;
    this.knivesRemaining = 7;
    this.totalKnivesInStage = 7;

    // Target Wheel Properties
    this.target = {
      x: 0,
      y: 0,
      radius: 64,
      angle: 0,
      speed: 0.035,
      targetSpeed: 0.035,
      speedPhase: 0,
      patternType: 'steady', // 'steady', 'reversing', 'pulsing', 'erratic', 'boss'
      patternTimer: 0,
      recoilY: 0
    };

    // Knives & Items on Wheel
    this.stuckKnives = []; // { angle, color }
    this.apples = []; // { angle, sliced }
    this.slicedApples = []; // { x, y, vx, vy, rot, vRot, alpha }

    // Active thrown knife
    this.flyingKnife = null; // { x, y, vy, length, width }
    this.deflectedKnife = null; // { x, y, vx, vy, rot, vRot }

    // Visuals & Effects
    this.particles = [];
    this.shards = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.isClearingStage = false;
    this.clearStageTimer = 0;
    this.isDying = false;
    this.deathDelay = 0;
    this.animId = null;

    // Bound handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.stop(); // Abort previous RAF loops & detach listeners
    this.resize();
    this.score = 0;
    this.stage = 1;
    this.shakeIntensity = 0;
    this.isClearingStage = false;
    this.clearStageTimer = 0;
    this.isDying = false;
    this.deathDelay = 0;
    this.waitingForFirstThrow = true;

    this.flyingKnife = null;
    this.deflectedKnife = null;
    this.particles = [];
    this.shards = [];
    this.floatingTexts = [];
    this.slicedApples = [];

    this.initStage(this.stage);

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

    // Position target disk comfortably in upper half (slightly bigger central target)
    this.target.x = this.logicalWidth / 2;
    this.target.y = Math.max(150, Math.min(230, this.logicalHeight * 0.31));
    this.target.radius = Math.max(72, Math.min(96, this.logicalWidth * 0.22));
  }

  initStage(stageNum) {
    this.stage = stageNum;
    this.target.angle = Math.random() * Math.PI * 2;
    this.target.recoilY = 0;
    this.target.patternTimer = 0;
    this.target.speedPhase = 0;
    this.flyingKnife = null;
    this.deflectedKnife = null;

    // Pattern & Knife Quota Progression
    if (stageNum % 5 === 0) {
      // BOSS / TITAN CORE Stage!
      this.totalKnivesInStage = 9 + Math.min(4, Math.floor(stageNum / 5));
      this.target.patternType = 'boss';
      this.target.targetSpeed = 0.06;
    } else if (stageNum === 1) {
      this.totalKnivesInStage = 7;
      this.target.patternType = 'steady';
      this.target.targetSpeed = 0.034;
    } else if (stageNum === 2) {
      this.totalKnivesInStage = 8;
      this.target.patternType = 'reversing';
      this.target.targetSpeed = 0.038;
    } else if (stageNum === 3) {
      this.totalKnivesInStage = 8;
      this.target.patternType = 'pulsing';
      this.target.targetSpeed = 0.045;
    } else {
      this.totalKnivesInStage = Math.min(12, 7 + (stageNum % 4));
      const patterns = ['reversing', 'pulsing', 'erratic'];
      this.target.patternType = patterns[stageNum % patterns.length];
      this.target.targetSpeed = 0.042 + Math.min(0.025, stageNum * 0.003);
    }

    this.knivesRemaining = this.totalKnivesInStage;
    this.target.speed = this.target.targetSpeed;
    this.stuckKnives = [];
    this.apples = [];

    // Pre-stuck obstacle knives
    const obstacleCount = stageNum === 1 ? 0 : Math.min(4, Math.floor((stageNum + 1) / 2));
    if (obstacleCount > 0) {
      const step = (Math.PI * 2) / obstacleCount;
      const offset = Math.random() * Math.PI * 2;
      for (let i = 0; i < obstacleCount; i++) {
        this.stuckKnives.push({
          angle: this.normalizeAngle(offset + i * step + (Math.random() - 0.5) * 0.3),
          color: '#ff0055' // Red obstacle blade
        });
      }
    }

    // Bonus Cyber Apple (Diamond)
    if (stageNum > 1 && Math.random() < 0.6) {
      const appleAngle = this.normalizeAngle(Math.random() * Math.PI * 2);
      // Ensure not overlapping existing obstacle knives
      const tooClose = this.stuckKnives.some(k => Math.abs(this.angleDifference(k.angle, appleAngle)) < 0.35);
      if (!tooClose) {
        this.apples.push({ angle: appleAngle, sliced: false });
      }
    }
  }

  normalizeAngle(rad) {
    let a = rad % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a;
  }

  angleDifference(a1, a2) {
    let diff = this.normalizeAngle(a1) - this.normalizeAngle(a2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  attachEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  detachEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter' || e.code === 'KeyW') {
      e.preventDefault();
      this.throwKnife();
    }
  }

  handlePointerDown(e) {
    if (!this.isRunning) return;
    e.preventDefault();
    this.throwKnife();
  }

  throwKnife() {
    if (!this.isRunning || this.isClearingStage) return;
    if (this.flyingKnife !== null || this.knivesRemaining <= 0) return;

    if (this.waitingForFirstThrow) {
      this.waitingForFirstThrow = false;
    }

    const startY = this.logicalHeight - 80;
    this.flyingKnife = {
      x: this.target.x,
      y: startY,
      vy: -26,
      length: 50,
      width: 14
    };

    this.knivesRemaining--;
    ArcadeAudio.sfx.knifeThrow();
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
        size: 2.5 + Math.random() * 3,
        hue: hue,
        alpha: 1,
        decay: 0.038
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

  createShatterShards() {
    const shardCount = 20;
    for (let i = 0; i < shardCount; i++) {
      const angle = (Math.PI * 2 / shardCount) * i + (Math.random() - 0.5) * 0.2;
      const speed = 3.5 + Math.random() * 6;
      this.shards.push({
        x: this.target.x,
        y: this.target.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        size: 8 + Math.random() * 14,
        alpha: 1,
        color: i % 2 === 0 ? '#00f3ff' : '#1b2a4a'
      });
    }
  }

  triggerDeath(reason = 'BLADE COLLISION!') {
    this.isRunning = false;
    this.shakeIntensity = 14;
    ArcadeAudio.sfx.buzz();
    this.detachEvents();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.onGameOver(this.score);
  }

  update() {
    if (!this.isRunning) return;

    // If blade clash impact sequence is playing
    if (this.isDying) {
      if (this.deflectedKnife) {
        this.deflectedKnife.x += this.deflectedKnife.vx;
        this.deflectedKnife.y += this.deflectedKnife.vy;
        this.deflectedKnife.vy += 0.8;
        this.deflectedKnife.rot += this.deflectedKnife.vRot;
      }
      this.deathDelay--;
      if (this.deathDelay <= 0) {
        this.triggerDeath('BLADE CLASH!');
      }
      return;
    }

    // Shake dampening
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.86;
      if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
    }

    // Target Recoil dampening
    this.target.recoilY *= 0.82;

    // 1. Update Target Rotation based on Pattern
    this.target.patternTimer += 0.016;
    const t = this.target.patternTimer;

    switch (this.target.patternType) {
      case 'steady':
        this.target.speed = this.target.targetSpeed;
        break;
      case 'reversing': {
        // Full-circle reversing spin:
        // Spans ~1.3 full rotations (475°) in one direction, slows smoothly to a stop, then spins in reverse
        this.target.speedPhase = (this.target.speedPhase || 0) + 0.014;
        const maxSpeed = 0.058;
        this.target.speed = Math.sin(this.target.speedPhase) * maxSpeed;
        break;
      }
      case 'pulsing':
        // Accelerates and slows down cyclically
        this.target.speed = this.target.targetSpeed * (1 + Math.sin(t * 3.5) * 0.75);
        break;
      case 'erratic':
        // Sudden bursts and pauses
        this.target.speed = this.target.targetSpeed * (Math.sin(t * 2.2) > 0.4 ? 1.8 : 0.35);
        break;
      case 'boss': {
        // Dynamic alternating surges with fast direction changes
        this.target.speedPhase = (this.target.speedPhase || 0) + 0.018;
        const baseSpin = Math.sin(this.target.speedPhase);
        this.target.speed = Math.sign(baseSpin) * Math.pow(Math.abs(baseSpin), 0.75) * 0.065;
        break;
      }
    }

    this.target.angle = this.normalizeAngle(this.target.angle + this.target.speed);

    // 2. Update Flying Knife & Collision
    if (this.flyingKnife) {
      this.flyingKnife.y += this.flyingKnife.vy;

      // Trailing exhaust particles
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.flyingKnife.x + (Math.random() - 0.5) * 4,
          y: this.flyingKnife.y + this.flyingKnife.length / 2,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 2 + Math.random() * 2,
          size: 2.5 + Math.random() * 2,
          hue: 190,
          alpha: 0.9,
          decay: 0.06
        });
      }

      // Check impact with Target Wheel
      const impactTargetY = this.target.y + this.target.radius + this.target.recoilY;
      if (this.flyingKnife.y <= impactTargetY) {
        // Knife tip has arrived at bottom edge of disk (angle on circle = PI/2)
        const hitWorldAngle = Math.PI / 2;
        // Relative angle on the rotating disk:
        const hitDiskAngle = this.normalizeAngle(hitWorldAngle - this.target.angle);

        // Check collision against all previously stuck blades
        // Minimum clearance angle ~13 degrees (0.23 rad) for enlarged wheel
        const minClearance = 0.23;
        let clashedBlade = null;

        for (const blade of this.stuckKnives) {
          const diff = Math.abs(this.angleDifference(hitDiskAngle, blade.angle));
          if (diff < minClearance) {
            clashedBlade = blade;
            break;
          }
        }

        if (clashedBlade) {
          // CLASH! Blade hit another blade!
          ArcadeAudio.sfx.knifeClash();
          this.createSparkles(this.target.x, impactTargetY, 45, 28);
          this.shakeIntensity = 12;

          // Blade deflects down violently
          this.deflectedKnife = {
            x: this.target.x,
            y: impactTargetY,
            vx: (Math.random() - 0.5) * 8 + 3,
            vy: 4,
            rot: 0,
            vRot: 0.3
          };
          this.flyingKnife = null;

          // Game over after brief impact visual
          this.isDying = true;
          this.deathDelay = 14;
          return;
        }

        // Check if sliced bonus Apple
        for (let i = this.apples.length - 1; i >= 0; i--) {
          const apple = this.apples[i];
          const diff = Math.abs(this.angleDifference(hitDiskAngle, apple.angle));
          if (diff < 0.32) {
            // Sliced Apple!
            ArcadeAudio.sfx.star(3);
            this.score += 250;
            this.onScoreUpdate(this.score);
            this.createSparkles(this.target.x, impactTargetY, 45, 20);
            this.createFloatingText('+250 💎', this.target.x, impactTargetY - 20, '#ffd700');

            // Two half apples flying off
            const appleX = this.target.x + Math.cos(this.target.angle + apple.angle) * this.target.radius;
            const appleY = this.target.y + Math.sin(this.target.angle + apple.angle) * this.target.radius;
            this.slicedApples.push(
              { x: appleX, y: appleY, vx: -3, vy: -3, rot: 0, vRot: -0.15, alpha: 1 },
              { x: appleX, y: appleY, vx: 3, vy: -3, rot: 0, vRot: 0.15, alpha: 1 }
            );

            this.apples.splice(i, 1);
            break;
          }
        }

        // Clean embed! THUNK!
        this.stuckKnives.push({
          angle: hitDiskAngle,
          color: '#00f3ff'
        });

        this.flyingKnife = null;
        this.target.recoilY = -7;
        this.shakeIntensity = 3;
        this.score += 100;
        this.onScoreUpdate(this.score);

        ArcadeAudio.sfx.knifeHit();
        this.createSparkles(this.target.x, impactTargetY, 190, 14);

        // Check Stage Complete
        if (this.knivesRemaining === 0) {
          this.isClearingStage = true;
          this.clearStageTimer = 40; // ~0.65s transition
          this.createShatterShards();
          ArcadeAudio.sfx.perfect(Math.min(8, this.stage));
          this.score += 500;
          this.onScoreUpdate(this.score);
          this.createFloatingText(`STAGE ${this.stage} CLEAR! +500`, this.target.x, this.target.y, '#00ff88');
          this.shakeIntensity = 8;
        }
      }
    }

    // 3. Update Deflected Knife
    if (this.deflectedKnife) {
      this.deflectedKnife.x += this.deflectedKnife.vx;
      this.deflectedKnife.y += this.deflectedKnife.vy;
      this.deflectedKnife.vy += 0.8; // Gravity
      this.deflectedKnife.rot += this.deflectedKnife.vRot;
    }

    // 4. Update Stage Clear Shards & Transition
    if (this.isClearingStage) {
      this.clearStageTimer--;
      if (this.clearStageTimer <= 0) {
        this.isClearingStage = false;
        this.initStage(this.stage + 1);
      }
    }

    // 5. Update Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.45;
      s.rot += s.vRot;
      s.alpha -= 0.024;
      if (s.alpha <= 0) {
        this.shards.splice(i, 1);
      }
    }

    // 6. Update Sliced Apples
    for (let i = this.slicedApples.length - 1; i >= 0; i--) {
      const a = this.slicedApples[i];
      a.x += a.vx;
      a.y += a.vy;
      a.vy += 0.5;
      a.rot += a.vRot;
      a.alpha -= 0.025;
      if (a.alpha <= 0) {
        this.slicedApples.splice(i, 1);
      }
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.03;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  drawKnife(x, y, angle, color = '#00f3ff') {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const bladeLen = 32;
    const bladeW = 10;
    const handleLen = 16;

    // Blade shadow glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Blade
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -bladeLen); // Tip
    ctx.lineTo(-bladeW / 2, 0); // Left shoulder
    ctx.lineTo(bladeW / 2, 0);  // Right shoulder
    ctx.closePath();
    ctx.fill();

    // Central blade gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -bladeLen + 4);
    ctx.lineTo(-1.5, 0);
    ctx.lineTo(1.5, 0);
    ctx.closePath();
    ctx.fill();

    // Guard bar
    ctx.fillStyle = '#1b2a4a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.fillRect(-bladeW / 2 - 2, 0, bladeW + 4, 3);
    ctx.strokeRect(-bladeW / 2 - 2, 0, bladeW + 4, 3);

    // Handle
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(-3, 3, 6, handleLen);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(-3, 3, 6, handleLen);

    // Pommel ring
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, handleLen + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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

    const targetY = this.target.y + this.target.recoilY;

    // 1. Draw Target Wheel (unless currently shattered in stage transition)
    if (!this.isClearingStage) {
      ctx.save();
      ctx.translate(this.target.x, targetY);

      const isBoss = this.stage % 5 === 0;
      const themeColor = isBoss ? '#ff0055' : '#00f3ff';
      const secondaryColor = isBoss ? '#ff8800' : '#10223d';

      // Outer Glow Aura
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 18;

      // Base Disk Housing
      ctx.beginPath();
      ctx.arc(0, 0, this.target.radius, 0, Math.PI * 2);
      ctx.fillStyle = secondaryColor;
      ctx.fill();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Rotating inner details
      ctx.rotate(this.target.angle);

      // Concentric target rings
      ctx.beginPath();
      ctx.arc(0, 0, this.target.radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, this.target.radius * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 8 Radial Spokes / Circuit tracks
      for (let i = 0; i < 8; i++) {
        const spokeA = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(spokeA) * (this.target.radius * 0.45), Math.sin(spokeA) * (this.target.radius * 0.45));
        ctx.lineTo(Math.cos(spokeA) * (this.target.radius * 0.85), Math.sin(spokeA) * (this.target.radius * 0.85));
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Glowing Center Core
      ctx.beginPath();
      ctx.arc(0, 0, this.target.radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 14;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.target.radius * 0.13, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 2. Draw Stuck Knives on Wheel
      for (const blade of this.stuckKnives) {
        const theta = this.target.angle + blade.angle;
        const bx = this.target.x + Math.cos(theta) * this.target.radius;
        const by = targetY + Math.sin(theta) * this.target.radius;
        // Blade points radially outward from wheel center
        this.drawKnife(bx, by, theta + Math.PI / 2, blade.color);
      }

      // 3. Draw Bonus Cyber Diamonds / Apples on Wheel
      for (const apple of this.apples) {
        const theta = this.target.angle + apple.angle;
        const ax = this.target.x + Math.cos(theta) * (this.target.radius + 6);
        const ay = targetY + Math.sin(theta) * (this.target.radius + 6);

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(theta);

        // Cyber Diamond Shape
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // 4. Draw Shards (Stage Shatter Transition)
    for (const s of this.shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -s.size / 2);
      ctx.lineTo(s.size / 2, s.size / 2);
      ctx.lineTo(-s.size / 2, s.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw Sliced Apples
    for (const a of this.slicedApples) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 6. Draw Active Flying Knife
    if (this.flyingKnife) {
      this.drawKnife(this.flyingKnife.x, this.flyingKnife.y, 0, '#00f3ff');
    }

    // 7. Draw Deflected Clashing Knife
    if (this.deflectedKnife) {
      this.drawKnife(this.deflectedKnife.x, this.deflectedKnife.y, this.deflectedKnife.rot, '#ff0055');
    }

    // 8. Draw Ready Knife (Waiting at bottom launcher)
    if (!this.flyingKnife && this.knivesRemaining > 0 && !this.isClearingStage) {
      const readyY = this.logicalHeight - 80;
      this.drawKnife(this.target.x, readyY, 0, '#00f3ff');
    }

    // 9. Draw Left-Hand Knives Quota Bar (Bottom Left)
    ctx.save();
    const pipStartY = this.logicalHeight - 50;
    for (let i = 0; i < this.totalKnivesInStage; i++) {
      const isAvailable = i < this.knivesRemaining;
      const pipX = 24 + i * 14;
      const pipY = pipStartY;

      ctx.save();
      ctx.translate(pipX, pipY);
      ctx.rotate(-Math.PI / 4); // Angled mini blade icons

      if (isAvailable) {
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(-2, -8, 4, 16);
      ctx.restore();
    }
    ctx.restore();

    // 10. Particles
    for (const p of this.particles) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 11. Floating Texts
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

    // 12. Top Stage Indicator
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    const isBoss = this.stage % 5 === 0;
    ctx.fillStyle = isBoss ? '#ff0055' : '#00f3ff';
    ctx.shadowColor = isBoss ? '#ff0055' : '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillText(`STAGE ${this.stage}${isBoss ? ' [BOSS]' : ''}`, 20, 28);
    ctx.restore();

    // 13. Waiting for First Throw Prompt
    if (this.waitingForFirstThrow && !this.flyingKnife) {
      ctx.save();
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText('TAP TO THROW KNIFE 🗡️', this.logicalWidth / 2, this.logicalHeight - 125);
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

window.KnifeThrowGame = KnifeThrowGame;
