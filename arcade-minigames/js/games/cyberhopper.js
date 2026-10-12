/**
 * Cyber Hopper - Vertical Infinite Ascending Platformer.
 * Features auto-bounce physics, scrolling camera elevation,
 * moving/crumbling platforms, spring pads, jetpack surges, and high-DPI touch support.
 */
class CyberHopperGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.isRunning = false;
    this.score = 0;
    this.maxAltitude = 0;

    // Viewport dimensions
    this.logicalWidth = 360;
    this.logicalHeight = 540;

    // Player (Hopper Bot)
    this.player = {
      x: 180,
      y: 350,
      width: 26,
      height: 26,
      vx: 0,
      vy: 0,
      gravity: 0.38,
      jumpForce: -10.5,
      springForce: -17.5,
      facing: 1, // 1: right, -1: left
      jetpackTimer: 0
    };

    // Camera
    this.cameraY = 0;

    // Platforms & Pickups
    this.platforms = [];
    this.platformWidth = 56;
    this.platformHeight = 12;
    this.springs = [];
    this.jetpacks = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stars = [];
    this.shakeIntensity = 0;

    // Input state
    this.keys = { left: false, right: false };
    this.pointerX = null;
    this.isPointerDown = false;

    // Bound listeners
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
    this.maxAltitude = 0;
    this.cameraY = 0;
    this.shakeIntensity = 0;

    this.player.x = this.logicalWidth / 2;
    this.player.y = this.logicalHeight - 120;
    this.player.vx = 0;
    this.player.vy = this.player.jumpForce;
    this.player.jetpackTimer = 0;

    this.platforms = [];
    this.springs = [];
    this.jetpacks = [];
    this.particles = [];
    this.floatingTexts = [];

    this.initStars();
    this.initPlatforms();

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

  initStars() {
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  initPlatforms() {
    // Base platform directly beneath player
    this.platforms.push({
      x: this.logicalWidth / 2 - this.platformWidth / 2,
      y: this.logicalHeight - 60,
      width: this.platformWidth + 20,
      height: this.platformHeight,
      type: 'normal',
      broken: false,
      vx: 0
    });

    // Generate ladder of platforms up into the sky
    let currentY = this.logicalHeight - 120;
    while (currentY > -400) {
      this.spawnPlatform(currentY);
      currentY -= Math.floor(Math.random() * 45 + 50);
    }
  }

  spawnPlatform(y) {
    const minX = 14;
    const maxX = this.logicalWidth - this.platformWidth - 14;
    const x = Math.random() * (maxX - minX) + minX;

    // Platform variety based on height
    const rand = Math.random();
    let type = 'normal';
    let vx = 0;

    if (rand < 0.22) {
      type = 'moving';
      vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.2 + 0.8);
    } else if (rand < 0.38) {
      type = 'crumbling';
    }

    const plat = {
      x,
      y,
      width: this.platformWidth,
      height: this.platformHeight,
      type,
      broken: false,
      vx
    };
    this.platforms.push(plat);

    // Chance for spring on solid platform
    if (type === 'normal' && Math.random() < 0.16) {
      this.springs.push({
        x: x + this.platformWidth / 2 - 8,
        y: y - 8,
        width: 16,
        height: 8,
        platRef: plat
      });
    } else if (type === 'normal' && Math.random() < 0.05) {
      // Rare Jetpack
      this.jetpacks.push({
        x: x + this.platformWidth / 2 - 7,
        y: y - 16,
        width: 14,
        height: 14,
        platRef: plat
      });
    }
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
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
  }

  handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
  }

  handlePointerDown(e) {
    this.isPointerDown = true;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
  }

  handlePointerMove(e) {
    if (!this.isPointerDown) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - rect.left;
  }

  handlePointerUp() {
    this.isPointerDown = false;
    this.pointerX = null;
  }

  update() {
    if (!this.isRunning) return;

    const p = this.player;

    // Horizontal control
    const moveSpeed = 4.4;
    if (this.keys.left) {
      p.vx = -moveSpeed;
      p.facing = -1;
    } else if (this.keys.right) {
      p.vx = moveSpeed;
      p.facing = 1;
    } else if (this.isPointerDown && this.pointerX !== null) {
      const dx = this.pointerX - p.x;
      if (Math.abs(dx) > 10) {
        p.vx = Math.sign(dx) * Math.min(moveSpeed, Math.abs(dx) * 0.2);
        p.facing = Math.sign(dx);
      } else {
        p.vx = 0;
      }
    } else {
      p.vx *= 0.82;
    }

    p.x += p.vx;

    // Wrap around screen edges
    if (p.x < -p.width / 2) {
      p.x = this.logicalWidth + p.width / 2;
    } else if (p.x > this.logicalWidth + p.width / 2) {
      p.x = -p.width / 2;
    }

    // Jetpack flight or regular gravity
    if (p.jetpackTimer > 0) {
      p.jetpackTimer--;
      p.vy = -12.5;

      // Jetpack sparks
      if (Math.random() < 0.6) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 8,
          y: p.y + p.height / 2,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 4 + 3,
          life: 1.0,
          decay: 0.06,
          size: Math.random() * 3 + 2,
          color: '#ffd200'
        });
      }
    } else {
      p.vy += p.gravity;
    }

    p.y += p.vy;

    // Camera scrolling when player rises above middle of screen
    const thresholdY = this.logicalHeight * 0.44;
    if (p.y < thresholdY) {
      const scrollDiff = thresholdY - p.y;
      p.y = thresholdY;
      this.cameraY += scrollDiff;

      // Altitude score tracking
      const currentAlt = Math.floor(this.cameraY);
      if (currentAlt > this.maxAltitude) {
        const diffAlt = currentAlt - this.maxAltitude;
        this.maxAltitude = currentAlt;
        this.score += diffAlt;
        this.onScoreUpdate(this.score);
      }

      // Move platforms down with scroll
      this.platforms.forEach(plat => {
        plat.y += scrollDiff;
      });
      this.springs.forEach(sp => {
        sp.y += scrollDiff;
      });
      this.jetpacks.forEach(jp => {
        jp.y += scrollDiff;
      });
      this.particles.forEach(pt => {
        pt.y += scrollDiff;
      });
      this.floatingTexts.forEach(ft => {
        ft.y += scrollDiff;
      });
    }

    // Move oscillating platforms
    this.platforms.forEach(plat => {
      if (plat.type === 'moving') {
        plat.x += plat.vx;
        if (plat.x < 10) {
          plat.x = 10;
          plat.vx *= -1;
        } else if (plat.x + plat.width > this.logicalWidth - 10) {
          plat.x = this.logicalWidth - 10 - plat.width;
          plat.vx *= -1;
        }
      }
    });

    // Keep springs synced with moving platforms
    this.springs.forEach(sp => {
      if (sp.platRef) {
        sp.x = sp.platRef.x + sp.platRef.width / 2 - 8;
        sp.y = sp.platRef.y - 8;
      }
    });
    this.jetpacks.forEach(jp => {
      if (jp.platRef) {
        jp.x = jp.platRef.x + jp.platRef.width / 2 - 7;
        jp.y = jp.platRef.y - 16;
      }
    });

    // Check platform bounce collisions ONLY while falling downward
    if (p.vy > 0 && p.jetpackTimer <= 0) {
      const footY = p.y + p.height / 2;
      const footX = p.x;

      for (let i = 0; i < this.platforms.length; i++) {
        const plat = this.platforms[i];
        if (plat.broken) continue;

        const isHorizontalMatch = footX >= plat.x - 8 && footX <= plat.x + plat.width + 8;
        const isVerticalMatch = footY >= plat.y && footY <= plat.y + 14;

        if (isHorizontalMatch && isVerticalMatch) {
          if (plat.type === 'crumbling') {
            plat.broken = true;
            this.addFloatingText('CRUMBLE!', plat.x + plat.width / 2, plat.y - 10, '#ff5500');

            if (typeof ArcadeAudio !== 'undefined') {
              ArcadeAudio.sfx.brickHit(1);
            }

            // Shatter debris particles
            for (let k = 0; k < 10; k++) {
              this.particles.push({
                x: plat.x + Math.random() * plat.width,
                y: plat.y,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                life: 1.0,
                decay: 0.05,
                size: 2.5,
                color: '#ff5500'
              });
            }
          }

          // Bounce!
          p.vy = p.jumpForce;
          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.hop();
          }

          // Bounce puff
          for (let k = 0; k < 6; k++) {
            this.particles.push({
              x: footX,
              y: plat.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 2,
              life: 1.0,
              decay: 0.08,
              size: 2,
              color: '#00ff88'
            });
          }
          break;
        }
      }

      // Check spring booster collisions
      for (let i = this.springs.length - 1; i >= 0; i--) {
        const sp = this.springs[i];
        if (Math.abs(p.x - (sp.x + sp.width / 2)) < 16 &&
            footY >= sp.y && footY <= sp.y + 14) {
          p.vy = p.springForce;
          this.addFloatingText('SUPER BOUNCE! ⚡', sp.x + 8, sp.y - 12, '#ffd200');

          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.springBounce();
          }

          this.springs.splice(i, 1);
          break;
        }
      }

      // Check Jetpack pickups
      for (let i = this.jetpacks.length - 1; i >= 0; i--) {
        const jp = this.jetpacks[i];
        if (Math.hypot(p.x - (jp.x + jp.width / 2), p.y - (jp.y + jp.height / 2)) < 20) {
          p.jetpackTimer = 180; // 3 seconds of supersonic boost
          this.addFloatingText('JETPACK ACTIVE! 🚀', p.x, p.y - 16, '#00f3ff');

          if (typeof ArcadeAudio !== 'undefined') {
            ArcadeAudio.sfx.jetpack();
          }

          this.jetpacks.splice(i, 1);
          break;
        }
      }
    }

    // Prune platforms below screen bottom & spawn new ones up top
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      if (this.platforms[i].y > this.logicalHeight + 40) {
        this.platforms.splice(i, 1);
      }
    }

    // Topmost platform position
    let highestY = this.logicalHeight;
    this.platforms.forEach(plat => {
      if (plat.y < highestY) highestY = plat.y;
    });

    while (highestY > -100) {
      highestY -= Math.floor(Math.random() * 45 + 50);
      this.spawnPlatform(highestY);
    }

    // Game Over check: fall below screen bottom
    if (p.y > this.logicalHeight + 40) {
      this.handleGameOver();
      return;
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

  handleGameOver() {
    this.isRunning = false;
    this.shakeIntensity = 15;

    if (typeof ArcadeAudio !== 'undefined') {
      ArcadeAudio.sfx.gameover();
    }

    setTimeout(() => {
      this.onGameOver(this.score);
    }, 700);
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

    // Cyber Altitude Backdrop Gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    bgGrad.addColorStop(0, '#040612');
    bgGrad.addColorStop(1, '#0e122b');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Starfield
    this.stars.forEach(s => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw Platforms
    this.platforms.forEach(plat => {
      if (plat.broken) return;

      this.ctx.save();
      let color = '#00ff88';
      let border = 'rgba(0, 255, 136, 0.4)';

      if (plat.type === 'moving') {
        color = '#00f3ff';
        border = 'rgba(0, 243, 255, 0.5)';
      } else if (plat.type === 'crumbling') {
        color = '#ff5500';
        border = 'rgba(255, 85, 0, 0.5)';
      }

      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Neon Top Bevel
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(plat.x + 2, plat.y, plat.width - 4, 2);

      this.ctx.restore();
    });

    // Draw Springs
    this.springs.forEach(sp => {
      this.ctx.save();
      this.ctx.shadowColor = '#ffd200';
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = '#ffd200';
      this.ctx.fillRect(sp.x, sp.y, sp.width, sp.height);
      this.ctx.restore();
    });

    // Draw Jetpacks
    this.jetpacks.forEach(jp => {
      this.ctx.save();
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = '#0a1d37';
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(jp.x, jp.y, jp.width, jp.height);

      this.ctx.fillStyle = '#ff0077';
      this.ctx.beginPath();
      this.ctx.arc(jp.x + jp.width / 2, jp.y + jp.height / 2, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw Player: Hopper Bot
    if (this.isRunning) {
      const p = this.player;
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.scale(p.facing, 1);

      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 10;

      // Chassis
      this.ctx.fillStyle = '#0a1d37';
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, -3, 11, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Cyber Visor Eye
      this.ctx.fillStyle = '#ffd200';
      this.ctx.fillRect(2, -6, 7, 5);

      // Spring Landing Gear Legs
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-4, 7);
      this.ctx.lineTo(-4, 13);
      this.ctx.moveTo(4, 7);
      this.ctx.lineTo(4, 13);
      this.ctx.stroke();

      // Jetpack Thruster if active
      if (p.jetpackTimer > 0) {
        this.ctx.fillStyle = '#ff0055';
        this.ctx.fillRect(-13, -7, 5, 12);
      }

      this.ctx.restore();
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

    // Top Altitude Indicator
    this.ctx.fillStyle = '#8292ab';
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`ALTITUDE: ${this.maxAltitude}m`, 16, 20);

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
