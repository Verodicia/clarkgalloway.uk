/**
 * Clark's Casino - European Roulette
 * Full 37-pocket wheel with HTML5 canvas physics, betting board, chip placement.
 */

class RouletteGame {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.selectedChip = 25;
    this.bets = {}; // key: betType -> amount
    this.isSpinning = false;
    this.lastWinningNumber = null;
    this.wheelRotation = 0;
    this.ballAngle = 0;
    this.ballRadius = 0;
    this.rafId = null;
    this.betHistory = [];

    // European Roulette Wheel Sequence (37 numbers)
    this.wheelNumbers = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    this.redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  }

  getColor(num) {
    if (num === 0) return 'green';
    return this.redNumbers.has(num) ? 'red' : 'black';
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();
    this.canvas = this.container.querySelector('#roulette-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.drawWheel();
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
      <div class="casino-game-table roulette-table">
        <div class="roulette-top-bar">
          <div class="wheel-stage">
            <canvas id="roulette-canvas" width="380" height="380"></canvas>
            <div class="wheel-center-pip"></div>
          </div>

          <div class="roulette-status-panel">
            <div class="game-status-banner" id="roulette-status">Place your bets on the felt</div>
            <div class="last-numbers-strip" id="roulette-history">
              <span class="hist-label">RECENT:</span>
              <div class="hist-list" id="roulette-history-list"></div>
            </div>
            <div class="roulette-stats-box">
              <div>Total Bet: <b id="roulette-total-bet">🪙 0</b></div>
              <div>Selected Chip: <b id="roulette-current-chip">🪙 25</b></div>
            </div>
          </div>
        </div>

        <!-- Betting Felt Grid -->
        <div class="roulette-board-wrapper">
          <div class="roulette-board" id="roulette-board">
            <!-- Zero cell -->
            <div class="r-cell r-zero" data-bet="num-0">
              <span>0</span>
              <div class="chip-stack" id="chip-num-0"></div>
            </div>

            <!-- Numbers 1-36 grid (3 rows x 12 cols) -->
            <div class="r-numbers-grid">
              ${this.generateNumbersGrid()}
            </div>

            <!-- 2 to 1 Columns -->
            <div class="r-cols-col">
              <div class="r-cell r-col-cell" data-bet="col-3">
                <span>2:1</span>
                <div class="chip-stack" id="chip-col-3"></div>
              </div>
              <div class="r-cell r-col-cell" data-bet="col-2">
                <span>2:1</span>
                <div class="chip-stack" id="chip-col-2"></div>
              </div>
              <div class="r-cell r-col-cell" data-bet="col-1">
                <span>2:1</span>
                <div class="chip-stack" id="chip-col-1"></div>
              </div>
            </div>
          </div>

          <!-- Outside Bets (Dozens & 1:1 bets) -->
          <div class="roulette-outside-bets">
            <div class="r-dozens-row">
              <div class="r-cell r-dozen-cell" data-bet="doz-1">
                <span>1st 12 (1-12)</span>
                <div class="chip-stack" id="chip-doz-1"></div>
              </div>
              <div class="r-cell r-dozen-cell" data-bet="doz-2">
                <span>2nd 12 (13-24)</span>
                <div class="chip-stack" id="chip-doz-2"></div>
              </div>
              <div class="r-cell r-dozen-cell" data-bet="doz-3">
                <span>3rd 12 (25-36)</span>
                <div class="chip-stack" id="chip-doz-3"></div>
              </div>
            </div>

            <div class="r-evens-row">
              <div class="r-cell r-even-cell" data-bet="low">
                <span>1 - 18</span>
                <div class="chip-stack" id="chip-low"></div>
              </div>
              <div class="r-cell r-even-cell" data-bet="even">
                <span>EVEN</span>
                <div class="chip-stack" id="chip-even"></div>
              </div>
              <div class="r-cell r-even-cell r-red-cell" data-bet="red">
                <span class="red-diamond">♦</span> RED
                <div class="chip-stack" id="chip-red"></div>
              </div>
              <div class="r-cell r-even-cell r-black-cell" data-bet="black">
                <span class="black-diamond">♦</span> BLACK
                <div class="chip-stack" id="chip-black"></div>
              </div>
              <div class="r-cell r-even-cell" data-bet="odd">
                <span>ODD</span>
                <div class="chip-stack" id="chip-odd"></div>
              </div>
              <div class="r-cell r-even-cell" data-bet="high">
                <span>19 - 36</span>
                <div class="chip-stack" id="chip-high"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chips & Controls -->
        <div class="table-controls">
          <div class="chips-selector" id="roulette-chips">
            <div class="chip-tray-label">CHIPS (Drag or Click):</div>
            <button class="chip-btn chip-5" data-val="5" draggable="true" title="Drag or click to bet 5">5</button>
            <button class="chip-btn chip-25 active" data-val="25" draggable="true" title="Drag or click to bet 25">25</button>
            <button class="chip-btn chip-50" data-val="50" draggable="true" title="Drag or click to bet 50">50</button>
            <button class="chip-btn chip-100" data-val="100" draggable="true" title="Drag or click to bet 100">100</button>
            <button class="chip-btn chip-500" data-val="500" draggable="true" title="Drag or click to bet 500">500</button>
            <button class="chip-btn chip-1000" data-val="1000" draggable="true" title="Drag or click to bet 1K">1K</button>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-secondary" id="roulette-clear-btn">Clear All</button>
            <button class="casino-btn btn-secondary" id="roulette-undo-btn">Undo</button>
            <button class="casino-btn btn-secondary" id="roulette-double-btn">2x Bets</button>
            <button class="casino-btn btn-gold btn-large" id="roulette-spin-btn">SPIN WHEEL</button>
          </div>
        </div>
      </div>
    `;
  }

  generateNumbersGrid() {
    // 3 rows: row 1 (3, 6, 9..36), row 2 (2, 5, 8..35), row 3 (1, 4, 7..34)
    let html = '';
    for (let r = 3; r >= 1; r--) {
      for (let c = 0; c < 12; c++) {
        const num = c * 3 + r;
        const color = this.getColor(num);
        html += `
          <div class="r-cell r-num-cell r-${color}" data-bet="num-${num}">
            <span>${num}</span>
            <div class="chip-stack" id="chip-num-${num}"></div>
          </div>
        `;
      }
    }
    return html;
  }

  bindEvents() {
    // Chip selection & dragstart
    this.container.querySelectorAll('#roulette-chips .chip-btn').forEach(btn => {
      btn.addEventListener('dragstart', (e) => {
        const val = btn.dataset.val;
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'copy';
        this.selectedChip = parseInt(val, 10);
        this.container.querySelectorAll('#roulette-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      btn.addEventListener('click', () => {
        this.selectedChip = parseInt(btn.dataset.val, 10);
        this.container.querySelectorAll('#roulette-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const curLabel = this.container.querySelector('#roulette-current-chip');
        if (curLabel) curLabel.textContent = `🪙 ${this.selectedChip}`;
        window.casinoAudio?.playChip();
      });
    });

    // Board cell clicking and drag/drop for placing bets
    this.container.querySelectorAll('.r-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (this.isSpinning) return;
        const betKey = cell.dataset.bet;
        if (!betKey) return;
        this.placeFeltBet(betKey, this.selectedChip);
      });

      // Right-click removes/reduces bet from spot
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (this.isSpinning) return;
        const betKey = cell.dataset.bet;
        if (!betKey || !this.bets[betKey]) return;
        this.removeFeltBet(betKey, this.selectedChip);
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
        const betKey = cell.dataset.bet;
        if (betKey && !isNaN(val) && val > 0) {
          this.placeFeltBet(betKey, val);
        }
      });
    });

    // Clear bets
    this.container.querySelector('#roulette-clear-btn')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      this.bets = {};
      this.betHistory = [];
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Undo last bet
    this.container.querySelector('#roulette-undo-btn')?.addEventListener('click', () => {
      this.undoLastBet();
    });

    // Double bets
    this.container.querySelector('#roulette-double-btn')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      const currentTotal = this.getTotalBet();
      if (currentTotal === 0) return;
      if (window.casinoEconomy.hasFunds(currentTotal)) {
        for (const k in this.bets) {
          this.bets[k] *= 2;
        }
        window.casinoAudio?.playChip();
        this.updateUI();
      } else {
        this.setStatus('Insufficient Clark Coins to double bets!');
      }
    });

    // Spin button
    this.container.querySelector('#roulette-spin-btn')?.addEventListener('click', () => {
      this.spin();
    });
  }

  getTotalBet() {
    return Object.values(this.bets).reduce((a, b) => a + b, 0);
  }

  placeFeltBet(betKey, chipAmount = this.selectedChip) {
    const totalCurrent = this.getTotalBet();
    if (!window.casinoEconomy.hasFunds(totalCurrent + chipAmount)) {
      this.setStatus('Insufficient Clark Coins for this bet! Claim free coins above.');
      return;
    }
    this.bets[betKey] = (this.bets[betKey] || 0) + chipAmount;
    this.betHistory.push({ key: betKey, amount: chipAmount });
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  removeFeltBet(betKey, chipAmount = this.selectedChip) {
    if (!this.bets[betKey]) return;
    this.bets[betKey] = Math.max(0, this.bets[betKey] - chipAmount);
    if (this.bets[betKey] === 0) {
      delete this.bets[betKey];
    }
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  undoLastBet() {
    if (this.isSpinning || this.betHistory.length === 0) return;
    const last = this.betHistory.pop();
    if (last && this.bets[last.key]) {
      this.bets[last.key] = Math.max(0, this.bets[last.key] - last.amount);
      if (this.bets[last.key] === 0) {
        delete this.bets[last.key];
      }
      window.casinoAudio?.playChip();
      this.updateUI();
    }
  }

  updateUI() {
    const total = this.getTotalBet();
    const totEl = this.container.querySelector('#roulette-total-bet');
    if (totEl) totEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(total)}`;

    // Render chip stacks on cells
    this.container.querySelectorAll('.r-cell').forEach(cell => {
      const betKey = cell.dataset.bet;
      const stack = cell.querySelector('.chip-stack');
      if (!stack) return;
      const amt = this.bets[betKey] || 0;
      if (amt > 0) {
        stack.innerHTML = `<span class="board-chip">${amt >= 1000 ? `${(amt/1000).toFixed(1)}k` : amt}</span>`;
        cell.classList.add('active-bet');
      } else {
        stack.innerHTML = '';
        cell.classList.remove('active-bet');
      }
    });
  }

  setStatus(msg) {
    const el = this.container.querySelector('#roulette-status');
    if (el) el.textContent = msg;
  }

  drawWheel(wheelAngle = this.wheelRotation, ballA = this.ballAngle, ballR = this.ballRadius) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = cx - 10;
    const pocketR = outerR - 35;
    const innerR = pocketR - 55;
    const totalPockets = this.wheelNumbers.length;
    const pocketAngle = (Math.PI * 2) / totalPockets;

    ctx.clearRect(0, 0, w, h);

    // 1. Mahogany outer rim with gold trim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    const rimGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    rimGrad.addColorStop(0, '#2d150b');
    rimGrad.addColorStop(0.7, '#4a2512');
    rimGrad.addColorStop(0.95, '#1e0d07');
    rimGrad.addColorStop(1, '#d4af37');
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f1c40f';
    ctx.stroke();

    // 2. Brass ball track rim
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // 3. Pockets & Numbers
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelAngle);

    for (let i = 0; i < totalPockets; i++) {
      const num = this.wheelNumbers[i];
      const color = this.getColor(num);
      const midA = i * pocketAngle - Math.PI / 2;
      const startA = midA - pocketAngle / 2;
      const endA = midA + pocketAngle / 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, pocketR, startA, endA);
      ctx.closePath();

      if (color === 'green') {
        ctx.fillStyle = '#0f8a44';
      } else if (color === 'red') {
        ctx.fillStyle = '#c0292b';
      } else {
        ctx.fillStyle = '#1c1c1c';
      }
      ctx.fill();

      // Divider fret line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startA) * pocketR, Math.sin(startA) * pocketR);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Number text centered in pocket wedge
      ctx.save();
      ctx.rotate(midA);
      ctx.translate(pocketR - 16, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 0, 0);
      ctx.restore();
    }

    // 4. Inner brass hub
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR);
    hubGrad.addColorStop(0, '#f9e79f');
    hubGrad.addColorStop(0.6, '#b7950b');
    hubGrad.addColorStop(1, '#7d6608');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4-arm brass turret handles
    for (let a = 0; a < 4; a++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * a);
      ctx.beginPath();
      ctx.moveTo(0, -innerR + 8);
      ctx.lineTo(0, 0);
      ctx.strokeStyle = '#f4d03f';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -innerR + 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f9e79f';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 5. Ivory Ball
    if (ballR > 0) {
      const bx = cx + Math.cos(ballA) * ballR;
      const by = cy + Math.sin(ballA) * ballR;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      const bGrad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 1, bx, by, 5.5);
      bGrad.addColorStop(0, '#ffffff');
      bGrad.addColorStop(0.8, '#f5f5f5');
      bGrad.addColorStop(1, '#a6a6a6');
      ctx.fillStyle = bGrad;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }
  }

  spin() {
    if (this.isSpinning) return;
    const totalBet = this.getTotalBet();
    if (totalBet <= 0) {
      this.setStatus('Please place at least one bet on the felt!');
      return;
    }
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Refill your stash.');
      return;
    }

    this.isSpinning = true;
    this.setStatus('No more bets! Wheel is spinning...');
    this.container.querySelector('#roulette-spin-btn').disabled = true;

    // Pick target winning number
    const winIndex = Math.floor(Math.random() * this.wheelNumbers.length);
    const winNumber = this.wheelNumbers[winIndex];

    const pocketAngle = (Math.PI * 2) / this.wheelNumbers.length;

    // Desired wheel resting rotation so pocket winIndex aligns with 12 o'clock (-Math.PI / 2)
    // Pocket winIndex's world angle is: wheelRotation + winIndex * pocketAngle - Math.PI / 2
    // We want worldAngle === -Math.PI / 2, so wheelRotation === -winIndex * pocketAngle (mod 2*PI)
    const desiredWheelMod = (Math.PI * 2 - ((winIndex * pocketAngle) % (Math.PI * 2))) % (Math.PI * 2);
    const curWheelMod = ((this.wheelRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let wheelDelta = desiredWheelMod - curWheelMod;
    if (wheelDelta <= 0) wheelDelta += Math.PI * 2;
    const extraWheelSpins = 4 * Math.PI * 2;
    const startRot = this.wheelRotation;
    const finalWheelRot = this.wheelRotation + extraWheelSpins + wheelDelta;

    // Ball spins counter-clockwise (negative angle) and stops at 12 o'clock (-Math.PI / 2)
    const targetBallMod = ((-Math.PI / 2 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const curBallMod = ((this.ballAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let ballDiff = targetBallMod - curBallMod;
    if (ballDiff >= 0) ballDiff -= Math.PI * 2;
    const ballExtraSpins = -6 * Math.PI * 2;
    const startBallA = this.ballAngle;
    const finalBallA = this.ballAngle + ballExtraSpins + ballDiff;

    const outerTrackR = this.canvas.width / 2 - 20;
    const pocketRestingR = outerTrackR - 45;

    const duration = 4800; // ms
    const startTime = performance.now();
    let lastTickTime = 0;

    const animate = (now) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      // Quintic ease out
      const ease = 1 - Math.pow(1 - p, 4);

      this.wheelRotation = startRot + (finalWheelRot - startRot) * ease;
      this.ballAngle = startBallA + (finalBallA - startBallA) * ease;

      // Ball drops from outer track into pocket towards end
      if (p < 0.6) {
        this.ballRadius = outerTrackR;
      } else {
        const dropP = (p - 0.6) / 0.4;
        const dropEase = Math.sin(dropP * Math.PI / 2);
        this.ballRadius = outerTrackR - (outerTrackR - pocketRestingR) * dropEase;
      }

      // Audio tick frequency slows down
      if (now - lastTickTime > 120 + p * 350) {
        window.casinoAudio?.playTick();
        lastTickTime = now;
      }

      this.drawWheel(this.wheelRotation, this.ballAngle, this.ballRadius);

      if (p < 1) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.finishSpin(winNumber);
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  finishSpin(winNum) {
    this.isSpinning = false;
    this.lastWinningNumber = winNum;
    this.container.querySelector('#roulette-spin-btn').disabled = false;

    const color = this.getColor(winNum);
    const colorLabel = color.toUpperCase();

    // Add to history strip
    this.addToHistory(winNum, color);

    // Calculate payouts
    let totalWon = 0;
    for (const [betKey, betAmt] of Object.entries(this.bets)) {
      if (betAmt <= 0) continue;
      const payout = this.evaluateBet(betKey, betAmt, winNum, color);
      totalWon += payout;
    }

    if (totalWon > 0) {
      window.casinoEconomy.creditWin(totalWon);
      this.setStatus(`Winning Number: ${winNum} ${colorLabel}! You Won 🪙 ${window.casinoEconomy.formatCoins(totalWon)} CC!`);
      this.highlightWinningNumber(winNum);
    } else {
      window.casinoEconomy.recordLoss();
      this.setStatus(`Winning Number: ${winNum} ${colorLabel}. House wins this spin.`);
    }

    // Keep bets on table for rebetting or clear option
  }

  evaluateBet(betKey, betAmt, winNum, color) {
    // Straight up number
    if (betKey.startsWith('num-')) {
      const num = parseInt(betKey.replace('num-', ''), 10);
      if (num === winNum) return betAmt * 36; // 35:1 plus bet back
      return 0;
    }
    // Zero
    if (winNum === 0) return 0; // standard outside bets lose on zero

    // Red / Black (1:1)
    if (betKey === 'red' && color === 'red') return betAmt * 2;
    if (betKey === 'black' && color === 'black') return betAmt * 2;

    // Even / Odd (1:1)
    if (betKey === 'even' && winNum % 2 === 0) return betAmt * 2;
    if (betKey === 'odd' && winNum % 2 !== 0) return betAmt * 2;

    // Low / High (1:1)
    if (betKey === 'low' && winNum >= 1 && winNum <= 18) return betAmt * 2;
    if (betKey === 'high' && winNum >= 19 && winNum <= 36) return betAmt * 2;

    // Dozens (2:1)
    if (betKey === 'doz-1' && winNum >= 1 && winNum <= 12) return betAmt * 3;
    if (betKey === 'doz-2' && winNum >= 13 && winNum <= 24) return betAmt * 3;
    if (betKey === 'doz-3' && winNum >= 25 && winNum <= 36) return betAmt * 3;

    // Columns (2:1)
    if (betKey === 'col-1' && winNum % 3 === 1) return betAmt * 3;
    if (betKey === 'col-2' && winNum % 3 === 2) return betAmt * 3;
    if (betKey === 'col-3' && winNum % 3 === 0) return betAmt * 3;

    return 0;
  }

  addToHistory(num, color) {
    const list = this.container.querySelector('#roulette-history-list');
    if (!list) return;
    const pill = document.createElement('span');
    pill.className = `hist-pill hist-${color}`;
    pill.textContent = num;
    list.prepend(pill);
    while (list.children.length > 8) {
      list.lastChild.remove();
    }
  }

  highlightWinningNumber(winNum) {
    const cell = this.container.querySelector(`.r-cell[data-bet="num-${winNum}"]`);
    if (cell) {
      cell.classList.add('winner-flash');
      setTimeout(() => cell.classList.remove('winner-flash'), 3000);
    }
  }
}

window.RouletteGame = RouletteGame;
