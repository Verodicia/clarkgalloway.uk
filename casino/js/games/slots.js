/**
 * Clark's Casino - Vegas Neon 777 Slots
 * 3-Reel classic mechanical slot with 5 paylines, wild symbols, and 500x Jackpot.
 */

class SlotsGame {
  constructor() {
    this.container = null;
    this.betPerLine = 10;
    this.activeLines = 5;
    this.isSpinning = false;

    // Symbols configuration: weight determines frequency
    this.symbols = [
      { id: 'cherry', sym: '🍒', name: 'Cherry', weight: 8 },
      { id: 'lemon', sym: '🍋', name: 'Lemon', weight: 7 },
      { id: 'bell', sym: '🔔', name: 'Bell', weight: 5 },
      { id: 'diamond', sym: '💎', name: 'Diamond', weight: 4 },
      { id: 'seven', sym: '7️⃣', name: 'Lucky 7', weight: 3 },
      { id: 'coin', sym: '🪙', name: 'Clark Coin', weight: 1 } // Jackpot / Wild
    ];

    // Build weighted reel strip
    this.reelStrip = [];
    this.symbols.forEach(s => {
      for (let i = 0; i < s.weight; i++) {
        this.reelStrip.push(s);
      }
    });

    // 3 reels x 3 visible rows
    this.currentGrid = [
      [this.symbols[0], this.symbols[1], this.symbols[2]],
      [this.symbols[2], this.symbols[3], this.symbols[4]],
      [this.symbols[4], this.symbols[5], this.symbols[0]]
    ];
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();
    this.bindEvents();
    this.updateUI();
  }

  unmount() {
    this.container.innerHTML = '';
  }

  render() {
    this.container.innerHTML = `
      <div class="casino-game-table slots-table">
        <!-- Top Vegas Glass Paytable -->
        <div class="slots-paytable-glass">
          <div class="glass-title">★ VEGAS NEON 777 JACKPOT PAYTABLE ★</div>
          <div class="paytable-grid">
            <div class="pay-item"><span class="sym">🪙🪙🪙</span> <span class="mult">500x JACKPOT</span></div>
            <div class="pay-item"><span class="sym">7️⃣7️⃣7️⃣</span> <span class="mult">100x</span></div>
            <div class="pay-item"><span class="sym">💎💎💎</span> <span class="mult">50x</span></div>
            <div class="pay-item"><span class="sym">🔔🔔🔔</span> <span class="mult">25x</span></div>
            <div class="pay-item"><span class="sym">🍋🍋🍋</span> <span class="mult">15x</span></div>
            <div class="pay-item"><span class="sym">🍒🍒🍒</span> <span class="mult">10x</span></div>
            <div class="pay-item"><span class="sym">🍒🍒 Any</span> <span class="mult">5x</span></div>
            <div class="pay-item"><span class="sym">🍒 Any Any</span> <span class="mult">2x</span></div>
          </div>
        </div>

        <!-- Main Slot Machine Cabinet Body -->
        <div class="slot-cabinet">
          <!-- Marquee Lights Header -->
          <div class="slot-marquee-header">
            <div class="chase-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <span class="marquee-logo">CLARK'S LUCKY 7s</span>
            <div class="chase-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </div>

          <!-- Reel Window -->
          <div class="reels-window-frame">
            <div class="payline-indicators left-lines">
              <span class="line-tag" data-line="4">4 ↘</span>
              <span class="line-tag" data-line="2">2 ➔</span>
              <span class="line-tag" data-line="1">1 ➔</span>
              <span class="line-tag" data-line="3">3 ➔</span>
              <span class="line-tag" data-line="5">5 ↗</span>
            </div>

            <div class="reels-container" id="reels-container">
              ${this.renderReelHTML(0)}
              ${this.renderReelHTML(1)}
              ${this.renderReelHTML(2)}
            </div>

            <div class="payline-indicators right-lines">
              <span class="line-tag" data-line="5">↖ 5</span>
              <span class="line-tag" data-line="2">➔ 2</span>
              <span class="line-tag" data-line="1">➔ 1</span>
              <span class="line-tag" data-line="3">➔ 3</span>
              <span class="line-tag" data-line="4">↙ 4</span>
            </div>
            
            <div class="reel-glass-reflection"></div>
          </div>

          <!-- Machine Win Meter & Status -->
          <div class="slot-meter-display">
            <div class="meter-col">
              <span class="meter-label">PAYLINES</span>
              <span class="meter-value" id="slot-lines-val">5</span>
            </div>
            <div class="meter-col">
              <span class="meter-label">BET / LINE</span>
              <span class="meter-value" id="slot-bet-val">🪙 10</span>
            </div>
            <div class="meter-col">
              <span class="meter-label">TOTAL WAGER</span>
              <span class="meter-value" id="slot-total-val">🪙 50</span>
            </div>
            <div class="meter-col win-meter">
              <span class="meter-label">WIN PAID</span>
              <span class="meter-value win-val" id="slot-win-val">🪙 0</span>
            </div>
          </div>

          <!-- Message ticker -->
          <div class="slot-banner-ticker" id="slot-banner">Pull the lever or press Spin to play!</div>
        </div>

        <!-- Controls Console -->
        <div class="table-controls">
          <div class="slot-bet-adjusters">
            <div class="ctrl-group">
              <span class="ctrl-label">Lines:</span>
              <button class="casino-btn btn-sm" id="slot-lines-minus">-</button>
              <button class="casino-btn btn-sm" id="slot-lines-plus">+</button>
              <button class="casino-btn btn-sm btn-secondary" id="slot-max-lines">Max Lines (5)</button>
            </div>

            <div class="ctrl-group">
              <span class="ctrl-label">Bet/Line:</span>
              <button class="casino-btn btn-sm" id="slot-bet-minus">-</button>
              <button class="casino-btn btn-sm" id="slot-bet-plus">+</button>
              <button class="casino-btn btn-sm btn-secondary" id="slot-max-bet">Max Bet</button>
            </div>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-gold btn-large slot-spin-button" id="slot-spin-btn">
              <span>🎰 SPIN</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderReelHTML(reelIdx) {
    const col = this.currentGrid[reelIdx];
    return `
      <div class="slot-reel" id="slot-reel-${reelIdx}">
        <div class="reel-strip-viewport">
          <div class="reel-strip" id="reel-strip-${reelIdx}">
            <div class="reel-cell" data-row="0">${col[0].sym}</div>
            <div class="reel-cell" data-row="1">${col[1].sym}</div>
            <div class="reel-cell" data-row="2">${col[2].sym}</div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Payline controls
    this.container.querySelector('#slot-lines-minus')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      if (this.activeLines > 1) {
        this.activeLines--;
        window.casinoAudio?.playClick();
        this.updateUI();
      }
    });
    this.container.querySelector('#slot-lines-plus')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      if (this.activeLines < 5) {
        this.activeLines++;
        window.casinoAudio?.playClick();
        this.updateUI();
      }
    });
    this.container.querySelector('#slot-max-lines')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      this.activeLines = 5;
      window.casinoAudio?.playClick();
      this.updateUI();
    });

    // Bet controls
    const betSteps = [5, 10, 25, 50, 100, 250];
    this.container.querySelector('#slot-bet-minus')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      const curIdx = betSteps.indexOf(this.betPerLine);
      if (curIdx > 0) {
        this.betPerLine = betSteps[curIdx - 1];
        window.casinoAudio?.playChip();
        this.updateUI();
      }
    });
    this.container.querySelector('#slot-bet-plus')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      const curIdx = betSteps.indexOf(this.betPerLine);
      if (curIdx < betSteps.length - 1) {
        this.betPerLine = betSteps[curIdx + 1];
        window.casinoAudio?.playChip();
        this.updateUI();
      }
    });
    this.container.querySelector('#slot-max-bet')?.addEventListener('click', () => {
      if (this.isSpinning) return;
      this.activeLines = 5;
      this.betPerLine = 100;
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Spin button
    this.container.querySelector('#slot-spin-btn')?.addEventListener('click', () => {
      this.spin();
    });
  }

  getTotalBet() {
    return this.activeLines * this.betPerLine;
  }

  updateUI() {
    const total = this.getTotalBet();
    const linesEl = this.container.querySelector('#slot-lines-val');
    const betEl = this.container.querySelector('#slot-bet-val');
    const totEl = this.container.querySelector('#slot-total-val');

    if (linesEl) linesEl.textContent = this.activeLines;
    if (betEl) betEl.textContent = `🪙 ${this.betPerLine}`;
    if (totEl) totEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(total)}`;

    // Update active payline tags
    this.container.querySelectorAll('.line-tag').forEach(tag => {
      const lineNum = parseInt(tag.dataset.line, 10);
      tag.classList.toggle('active', lineNum <= this.activeLines);
    });
  }

  setStatus(msg) {
    const el = this.container.querySelector('#slot-banner');
    if (el) el.textContent = msg;
  }

  getRandomSymbol() {
    const idx = Math.floor(Math.random() * this.reelStrip.length);
    return this.reelStrip[idx];
  }

  spin() {
    if (this.isSpinning) return;
    const totalBet = this.getTotalBet();
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Claim free stash above.');
      return;
    }

    this.isSpinning = true;
    this.setStatus('Reels spinning... Good luck!');
    const spinBtn = this.container.querySelector('#slot-spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    // Reset win display
    const winVal = this.container.querySelector('#slot-win-val');
    if (winVal) winVal.textContent = '🪙 0';

    // Clear previous line highlights
    this.container.querySelectorAll('.reel-cell').forEach(c => c.classList.remove('win-symbol'));

    // Decide outcomes in advance
    const newGrid = [
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()]
    ];

    // Trigger spinning animation per reel with staggered stops
    const reels = [0, 1, 2];
    reels.forEach(idx => {
      const reelEl = this.container.querySelector(`#reel-strip-${idx}`);
      if (reelEl) {
        reelEl.classList.add('reel-spinning');
      }
    });

    // Sound: initial reel clicks
    window.casinoAudio?.playTick();
    const tickInterval = setInterval(() => {
      if (this.isSpinning) window.casinoAudio?.playTick();
    }, 120);

    // Stop reel 1 at 900ms, reel 2 at 1400ms, reel 3 at 1900ms
    setTimeout(() => this.stopReel(0, newGrid[0]), 900);
    setTimeout(() => this.stopReel(1, newGrid[1]), 1400);
    setTimeout(() => {
      clearInterval(tickInterval);
      this.stopReel(2, newGrid[2]);
      this.currentGrid = newGrid;
      this.finishSpin();
    }, 1900);
  }

  stopReel(reelIdx, symbols) {
    const reelEl = this.container.querySelector(`#reel-strip-${reelIdx}`);
    if (!reelEl) return;
    reelEl.classList.remove('reel-spinning');

    // Bounce animation
    reelEl.classList.add('reel-bounce');
    setTimeout(() => reelEl.classList.remove('reel-bounce'), 300);

    reelEl.children[0].textContent = symbols[0].sym;
    reelEl.children[1].textContent = symbols[1].sym;
    reelEl.children[2].textContent = symbols[2].sym;

    window.casinoAudio?.playChip();
  }

  finishSpin() {
    this.isSpinning = false;
    const spinBtn = this.container.querySelector('#slot-spin-btn');
    if (spinBtn) spinBtn.disabled = false;

    // Evaluate 5 paylines
    // Row 0 = top, Row 1 = center, Row 2 = bottom
    // Line 1: [1, 1, 1] (center)
    // Line 2: [0, 0, 0] (top)
    // Line 3: [2, 2, 2] (bottom)
    // Line 4: [0, 1, 2] (top-left to bot-right)
    // Line 5: [2, 1, 0] (bot-left to top-right)
    const lineDefs = [
      { num: 1, coords: [[0, 1], [1, 1], [2, 1]] },
      { num: 2, coords: [[0, 0], [1, 0], [2, 0]] },
      { num: 3, coords: [[0, 2], [1, 2], [2, 2]] },
      { num: 4, coords: [[0, 0], [1, 1], [2, 2]] },
      { num: 5, coords: [[0, 2], [1, 1], [2, 0]] }
    ];

    let totalWin = 0;
    const winningLines = [];

    for (let i = 0; i < this.activeLines; i++) {
      const def = lineDefs[i];
      const s1 = this.currentGrid[def.coords[0][0]][def.coords[0][1]];
      const s2 = this.currentGrid[def.coords[1][0]][def.coords[1][1]];
      const s3 = this.currentGrid[def.coords[2][0]][def.coords[2][1]];

      const payoutMult = this.evaluateThreeSymbols(s1, s2, s3);
      if (payoutMult > 0) {
        const lineWin = payoutMult * this.betPerLine;
        totalWin += lineWin;
        winningLines.push({ def, lineWin, mult: payoutMult });
      }
    }

    const winVal = this.container.querySelector('#slot-win-val');
    if (totalWin > 0) {
      if (winVal) winVal.textContent = `🪙 ${window.casinoEconomy.formatCoins(totalWin)}`;
      const isJackpot = winningLines.some(w => w.mult >= 500);
      window.casinoEconomy.creditWin(totalWin, isJackpot);

      this.setStatus(
        isJackpot
          ? `💥 MEGA JACKPOT! 500x! Won 🪙 ${window.casinoEconomy.formatCoins(totalWin)} CC!`
          : `WINNER! ${winningLines.length} Payline(s) hit for 🪙 ${window.casinoEconomy.formatCoins(totalWin)} CC!`
      );

      // Highlight winning symbols
      winningLines.forEach(w => {
        w.def.coords.forEach(([col, row]) => {
          const reelEl = this.container.querySelector(`#slot-reel-${col}`);
          if (reelEl) {
            const cell = reelEl.querySelectorAll('.reel-cell')[row];
            if (cell) cell.classList.add('win-symbol');
          }
        });
      });
    } else {
      window.casinoEconomy.recordLoss();
      this.setStatus('No winning paylines this spin. Try again!');
    }
  }

  evaluateThreeSymbols(s1, s2, s3) {
    // Clark Coin is Wild
    const ids = [s1.id, s2.id, s3.id];

    // Three Clark Coins = 500x Mega Jackpot
    if (ids.every(id => id === 'coin')) return 500;

    // Helper for matching with wild coin
    const matchesTarget = (targetId) => {
      return ids.every(id => id === targetId || id === 'coin');
    };

    if (matchesTarget('seven')) return 100;
    if (matchesTarget('diamond')) return 50;
    if (matchesTarget('bell')) return 25;
    if (matchesTarget('lemon')) return 15;
    if (matchesTarget('cherry')) return 10;

    // Two cherries on line
    const cherryCount = ids.filter(id => id === 'cherry' || id === 'coin').length;
    if (cherryCount === 2) return 5;
    if (ids[0] === 'cherry' || ids[0] === 'coin') return 2;

    return 0;
  }
}

window.SlotsGame = SlotsGame;
