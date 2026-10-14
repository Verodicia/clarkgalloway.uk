/**
 * Clark's Casino - Wheel of Fortune
 * Massive 24-wedge multiplier wheel with physics, bouncing flapper, and 100x Jackpot!
 */

class WheelGame {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.selectedChip = 25;
    this.bets = {}; // multiplier target -> amount
    this.isSpinning = false;
    this.currentAngle = 0;
    this.rafId = null;

    // 24 segments around the wheel
    this.segments = [
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 5, label: '5x', color: '#922b21', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 10, label: '10x', color: '#1e8449', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 20, label: '20x', color: '#6c3483', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 5, label: '5x', color: '#922b21', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 40, label: '40x', color: '#b03a2e', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 2, label: '2x', color: '#b9770e', text: '#ffffff' },
      { mult: 5, label: '5x', color: '#922b21', text: '#ffffff' },
      { mult: 1, label: '1x', color: '#1a5276', text: '#ffffff' },
      { mult: 10, label: '10x', color: '#1e8449', text: '#ffffff' },
      { mult: 100, label: '★ 100x ★', color: '#d4af37', text: '#000000', isJackpot: true }
    ];
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();
    this.canvas = this.container.querySelector('#fortune-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.drawWheel(0);
    }
    this.bindEvents();
    this.updateUI();
  }

  unmount() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.container.innerHTML = '';
  }

  render() {
    this.container.innerHTML = `
      <div class="casino-game-table wheel-table">
        <div class="wheel-stage-wrapper">
          <div class="wheel-flapper-pointer" id="wheel-flapper">▼</div>
          <canvas id="fortune-canvas" width="400" height="400"></canvas>
          <div class="fortune-center-logo">🪙</div>
        </div>

        <div class="game-status-banner" id="wheel-banner">Select your multipliers and spin the Fortune Wheel!</div>

        <!-- Multiplier Betting Board -->
        <div class="wheel-betting-board">
          ${[1, 2, 5, 10, 20, 40, 100].map(m => `
            <div class="wheel-bet-cell ${m === 100 ? 'cell-jackpot' : ''}" data-mult="${m}">
              <div class="w-mult-label">${m === 100 ? '★ 100x JACKPOT ★' : `${m}x`}</div>
              <div class="w-mult-payout">Pays ${m + 1} for 1</div>
              <div class="chip-stack" id="wheel-chip-${m}"></div>
            </div>
          `).join('')}
        </div>

        <!-- Chips & Controls -->
        <div class="table-controls">
          <div class="chips-selector" id="wheel-chips">
            <div class="chip-tray-label">CHIPS (Drag or Click):</div>
            <button class="chip-btn chip-5" data-val="5" draggable="true" title="Drag or click to bet 5">5</button>
            <button class="chip-btn chip-25 active" data-val="25" draggable="true" title="Drag or click to bet 25">25</button>
            <button class="chip-btn chip-50" data-val="50" draggable="true" title="Drag or click to bet 50">50</button>
            <button class="chip-btn chip-100" data-val="100" draggable="true" title="Drag or click to bet 100">100</button>
            <button class="chip-btn chip-500" data-val="500" draggable="true" title="Drag or click to bet 500">500</button>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-secondary" id="wheel-clear-btn">Clear Bets</button>
            <button class="casino-btn btn-gold btn-large" id="wheel-spin-btn">SPIN WHEEL</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('#wheel-chips .chip-btn').forEach(btn => {
      btn.addEventListener('dragstart', (e) => {
        const val = btn.dataset.val;
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'copy';
        this.selectedChip = parseInt(val, 10);
        this.container.querySelectorAll('#wheel-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      btn.addEventListener('click', () => {
        this.selectedChip = parseInt(btn.dataset.val, 10);
        this.container.querySelectorAll('#wheel-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.casinoAudio?.playChip();
      });
    });

    this.container.querySelectorAll('.wheel-bet-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (this.isSpinning) return;
        const mult = parseInt(cell.dataset.mult, 10);
        this.placeBet(mult, this.selectedChip);
      });

      cell.addEventListener('dragover', (e) => {
        if (this.isSpinning) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        cell.classList.add('drag-hover');
      });

      cell.addEventListener('dragleave', () => {
        cell.classList.remove('drag-hover');
      });

      cell.addEventListener('drop', (e) => {
        if (this.isSpinning) return;
        e.preventDefault();
        cell.classList.remove('drag-hover');
        const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const mult = parseInt(cell.dataset.mult, 10);
        if (!isNaN(mult) && !isNaN(val) && val > 0) {
          this.placeBet(mult, val);
        }
      });
    });

    this.container.querySelector('#wheel-clear-btn')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      this.bets = {};
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    this.container.querySelector('#wheel-spin-btn')?.addEventListener('click', () => {
      this.spin();
    });
  }

  getTotalBet() {
    return Object.values(this.bets).reduce((a, b) => a + b, 0);
  }

  placeBet(mult, chipAmt = this.selectedChip) {
    const curTotal = this.getTotalBet();
    if (!window.casinoEconomy.hasFunds(curTotal + chipAmt)) {
      this.setStatus('Insufficient Clark Coins for this bet! Claim free coins above.');
      return;
    }
    this.bets[mult] = (this.bets[mult] || 0) + chipAmt;
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  updateUI() {
    [1, 2, 5, 10, 20, 40, 100].forEach(m => {
      const cell = this.container.querySelector(`.wheel-bet-cell[data-mult="${m}"]`);
      const stack = this.container.querySelector(`#wheel-chip-${m}`);
      const amt = this.bets[m] || 0;
      if (stack) {
        if (amt > 0) {
          stack.innerHTML = `<span class="board-chip">🪙 ${amt}</span>`;
          cell?.classList.add('active-bet');
        } else {
          stack.innerHTML = '';
          cell?.classList.remove('active-bet');
        }
      }
    });
  }

  setStatus(msg) {
    const el = this.container.querySelector('#wheel-banner');
    if (el) el.textContent = msg;
  }

  drawWheel(angle = 0) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = cx - 12;
    const numSegments = this.segments.length;
    const arc = (Math.PI * 2) / numSegments;

    ctx.clearRect(0, 0, w, h);

    // 1. Ornate gold frame
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = '#b7950b';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f4d03f';
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < numSegments; i++) {
      const seg = this.segments[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, outerR - 6, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Divider line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startAngle) * (outerR - 6), Math.sin(startAngle) * (outerR - 6));
      ctx.strokeStyle = '#f9e79f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.translate(outerR - 45, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = seg.text;
      ctx.font = seg.isJackpot ? 'bold 12px sans-serif' : 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seg.label, 0, 0);
      ctx.restore();

      // Outer brass peg
      const pegX = Math.cos(startAngle) * (outerR - 6);
      const pegY = Math.sin(startAngle) * (outerR - 6);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4bd';
      ctx.fill();
      ctx.strokeStyle = '#7d6608';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center decorative circle
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
    grad.addColorStop(0, '#f9e79f');
    grad.addColorStop(0.7, '#b7950b');
    grad.addColorStop(1, '#513c06');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#f4d03f';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  spin() {
    if (this.isSpinning) return;
    const totalBet = this.getTotalBet();
    if (totalBet <= 0) {
      this.setStatus('Please place at least one bet on a multiplier!');
      return;
    }
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Grab free stash above.');
      return;
    }

    this.isSpinning = true;
    this.container.querySelector('#wheel-spin-btn').disabled = true;
    this.setStatus('Wheel is spinning! Wishing you high multipliers!');

    // Target segment
    const targetIdx = Math.floor(Math.random() * this.segments.length);
    const targetSeg = this.segments[targetIdx];

    const arc = (Math.PI * 2) / this.segments.length;
    // Pointer is at the top (angle -Math.PI / 2)
    // We want target segment to be at -Math.PI / 2
    const targetAngleAtTop = -Math.PI / 2 - (targetIdx * arc + arc / 2);

    const startA = this.currentAngle % (Math.PI * 2);
    const fullSpins = 6 * Math.PI * 2;
    const finalAngle = startA + fullSpins + ((targetAngleAtTop - startA) % (Math.PI * 2) + Math.PI * 2);

    const duration = 4600;
    const startTime = performance.now();
    let lastFlapperPeg = -1;

    const flapperEl = this.container.querySelector('#wheel-flapper');

    const animate = (now) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);

      this.currentAngle = startA + (finalAngle - startA) * ease;
      this.drawWheel(this.currentAngle);

      // Check peg crossing under pointer for flapper vibration & click sound
      const normalizedA = (this.currentAngle + Math.PI / 2) % (Math.PI * 2);
      const currentPeg = Math.floor((normalizedA >= 0 ? normalizedA : normalizedA + Math.PI * 2) / arc);

      if (currentPeg !== lastFlapperPeg) {
        window.casinoAudio?.playTick();
        if (flapperEl) {
          flapperEl.classList.add('vibrating');
          setTimeout(() => flapperEl.classList.remove('vibrating'), 40);
        }
        lastFlapperPeg = currentPeg;
      }

      if (p < 1) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.finishSpin(targetSeg);
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  finishSpin(seg) {
    this.isSpinning = false;
    this.container.querySelector('#wheel-spin-btn').disabled = false;

    const mult = seg.mult;
    let wonAmt = 0;

    if (this.bets[mult]) {
      wonAmt = this.bets[mult] * (mult + 1); // e.g. 5x pays 6x total (5:1 + bet)
    }

    if (wonAmt > 0) {
      const isJackpot = mult >= 100;
      window.casinoEconomy.creditWin(wonAmt, isJackpot);
      this.setStatus(`★ WHEEL STOPPED ON ${seg.label}! ★ YOU WON 🪙 ${window.casinoEconomy.formatCoins(wonAmt)} CC!`);
    } else {
      window.casinoEconomy.recordLoss();
      this.setStatus(`Wheel landed on ${seg.label}. No bet on that segment this round.`);
    }

    this.bets = {};
    this.updateUI();
  }
}

window.WheelGame = WheelGame;
