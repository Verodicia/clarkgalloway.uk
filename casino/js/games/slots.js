/**
 * Clark's Casino - Vegas Neon 777 Slots
 * Authentic mechanical 3-reel slot machine with physical continuous strip physics,
 * motor kickback, momentum deceleration, star wheel overshoot/settle,
 * interactive pull lever, suspense tension mode, and laser paylines.
 */

class SlotsGame {
  constructor() {
    this.container = null;
    this.betPerLine = 10;
    this.activeLines = 5;
    this.isSpinning = false;
    this.activeAnimations = [];
    this.tickInterval = null;

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
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.activeAnimations.forEach(a => {
      try { a.cancel(); } catch (e) {}
    });
    this.activeAnimations = [];
    if (this.container) this.container.innerHTML = '';
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

        <!-- Main Slot Machine Cabinet Housing (Cabinet + Mechanical Arm) -->
        <div class="slot-cabinet-housing">
          <div class="slot-cabinet">
            <!-- Marquee Lights Header -->
            <div class="slot-marquee-header">
              <div class="chase-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <span class="marquee-logo">CLARK'S LUCKY 7s</span>
              <div class="chase-bulbs"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>

            <!-- Reel Window Aperture -->
            <div class="reels-window-frame" id="reels-window-frame">
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

              <!-- Dynamic Laser Payline SVG -->
              <svg class="payline-svg-overlay" id="payline-svg"></svg>
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

          <!-- Interactive Mechanical Pull Lever / Handle -->
          <div class="slot-lever-assembly" id="slot-lever-assembly" title="Pull the slot handle to spin!">
            <div class="slot-lever-base"></div>
            <div class="slot-lever-arm" id="slot-lever-arm">
              <div class="slot-lever-rod"></div>
              <div class="slot-lever-knob"></div>
            </div>
          </div>
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

    // Mechanical slot pull lever
    this.container.querySelector('#slot-lever-assembly')?.addEventListener('click', () => {
      this.pullLeverAndSpin();
    });

    // Spin button
    this.container.querySelector('#slot-spin-btn')?.addEventListener('click', () => {
      this.spin();
    });
  }

  pullLeverAndSpin() {
    if (this.isSpinning) return;
    this.animateLever();
    this.spin();
  }

  animateLever() {
    const arm = this.container.querySelector('#slot-lever-arm');
    if (!arm) return;
    arm.classList.remove('pulling');
    void arm.offsetWidth; // force reflow
    arm.classList.add('pulling');
    window.casinoAudio?.playLeverPull();
    setTimeout(() => arm.classList.remove('pulling'), 700);
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

    // Always animate the mechanical handle if not already pulling
    this.animateLever();

    this.isSpinning = true;
    this.setStatus('Reels rolling... Best of luck!');
    const spinBtn = this.container.querySelector('#slot-spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    // Reset win display and SVG lasers
    const winVal = this.container.querySelector('#slot-win-val');
    if (winVal) winVal.textContent = '🪙 0';

    const svgOverlay = this.container.querySelector('#payline-svg');
    if (svgOverlay) svgOverlay.innerHTML = '';

    // Clear previous line highlights and winning symbols
    this.container.querySelectorAll('.reel-cell').forEach(c => c.classList.remove('win-symbol'));
    this.container.querySelectorAll('.line-tag').forEach(t => t.classList.remove('winner-line'));

    // Pre-determine outcome grid
    const newGrid = [
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
      [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()]
    ];

    // Payline coordinate definitions
    // Row 0 = top, Row 1 = center, Row 2 = bottom
    const lineDefs = [
      { num: 1, coords: [[0, 1], [1, 1], [2, 1]] }, // Center
      { num: 2, coords: [[0, 0], [1, 0], [2, 0]] }, // Top
      { num: 3, coords: [[0, 2], [1, 2], [2, 2]] }, // Bottom
      { num: 4, coords: [[0, 0], [1, 1], [2, 2]] }, // Diagonal ↘
      { num: 5, coords: [[0, 2], [1, 1], [2, 0]] }  // Diagonal ↗
    ];

    // Evaluate if Reel 0 & Reel 1 match high-value symbols on an active line (Suspense trigger!)
    let hasSuspense = false;
    for (let i = 0; i < this.activeLines; i++) {
      const def = lineDefs[i];
      const s0 = newGrid[def.coords[0][0]][def.coords[0][1]];
      const s1 = newGrid[def.coords[1][0]][def.coords[1][1]];
      const isHigh = (id) => id === 'coin' || id === 'seven' || id === 'diamond';
      if ((s0.id === s1.id || s0.id === 'coin' || s1.id === 'coin') && (isHigh(s0.id) || isHigh(s1.id))) {
        hasSuspense = true;
        break;
      }
    }

    const rowH = 80;
    const spinCounts = [
      22, // Reel 0
      34, // Reel 1
      hasSuspense ? 56 : 46 // Reel 2
    ];

    const durations = [
      1200, // Reel 0 duration (ms)
      1800, // Reel 1 duration (ms)
      hasSuspense ? 3200 : 2400 // Reel 2 duration (ms)
    ];

    // Start mechanical ticking cadence
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => {
      if (this.isSpinning) {
        window.casinoAudio?.playTick();
      }
    }, 95);

    // Cancel any previous animations
    this.activeAnimations.forEach(a => {
      try { a.cancel(); } catch (e) {}
    });
    this.activeAnimations = [];

    // Launch each reel on its continuous kinetic path
    const reelPromises = [0, 1, 2].map(idx => {
      return new Promise(resolve => {
        const reelStripEl = this.container.querySelector(`#reel-strip-${idx}`);
        if (!reelStripEl) {
          resolve();
          return;
        }

        const spinCount = spinCounts[idx];
        const duration = durations[idx];

        // Construct continuous strip:
        // [0]: top buffer symbol
        // [1..3]: target outcome (newGrid[idx][0], newGrid[idx][1], newGrid[idx][2])
        // [4 .. 4+spinCount-1]: intermediate spinning symbols
        // [4+spinCount .. 4+spinCount+2]: current starting symbols
        // [4+spinCount+3]: bottom buffer symbol
        const topBuffer = this.getRandomSymbol();
        const bottomBuffer = this.getRandomSymbol();
        const intermediateSymbols = [];
        for (let s = 0; s < spinCount; s++) {
          intermediateSymbols.push(this.getRandomSymbol());
        }

        const symbolList = [
          topBuffer,
          newGrid[idx][0],
          newGrid[idx][1],
          newGrid[idx][2],
          ...intermediateSymbols,
          this.currentGrid[idx][0],
          this.currentGrid[idx][1],
          this.currentGrid[idx][2],
          bottomBuffer
        ];

        reelStripEl.innerHTML = symbolList.map((symObj, sIdx) => {
          return `<div class="reel-cell" data-idx="${sIdx}">${symObj.sym}</div>`;
        }).join('');

        const startIdx = 4 + spinCount;
        const targetIdx = 1;

        const startOffset = - startIdx * rowH;
        const targetOffset = - targetIdx * rowH;

        reelStripEl.style.transform = `translateY(${startOffset}px)`;
        reelStripEl.classList.add('reel-spinning');

        // Physical mechanical keyframes:
        // 1. Motor start kickback (-16px recoil upwards)
        // 2. High-speed blurred downward spin
        // 3. Momentum brake deceleration
        // 4. Solenoid strike & star wheel overshoot (+18px downwards)
        // 5. Spring pawl rebound (-6px upwards)
        // 6. Firm mechanical latch settle (0px)
        const keyframes = [
          { transform: `translateY(${startOffset}px)`, offset: 0 },
          { transform: `translateY(${startOffset - 16}px)`, offset: 0.05, easing: 'ease-out' },
          { transform: `translateY(${startOffset + (targetOffset - startOffset) * 0.42}px)`, offset: 0.38, easing: 'linear' },
          { transform: `translateY(${startOffset + (targetOffset - startOffset) * 0.88}px)`, offset: 0.80, easing: 'ease-out' },
          { transform: `translateY(${targetOffset + 18}px)`, offset: 0.93, easing: 'ease-in-out' },
          { transform: `translateY(${targetOffset - 6}px)`, offset: 0.97, easing: 'ease-out' },
          { transform: `translateY(${targetOffset}px)`, offset: 1.0 }
        ];

        const anim = reelStripEl.animate(keyframes, {
          duration,
          fill: 'forwards'
        });

        this.activeAnimations.push(anim);

        // When Reel 1 stops, if high suspense, initiate suspense mode on Reel 2
        if (idx === 1 && hasSuspense) {
          anim.onfinish = () => {
            this.handleReelStop(idx, newGrid[idx], reelStripEl, anim);
            const cabinet = this.container.querySelector('.slot-cabinet');
            const reel2 = this.container.querySelector('#slot-reel-2');
            if (cabinet) cabinet.classList.add('anticipation-mode');
            if (reel2) reel2.classList.add('reel-suspense');
            this.setStatus('⚡ JACKPOT CHANCE! HOLD YOUR BREATH...');
            window.casinoAudio?.playAnticipation();
            resolve();
          };
        } else {
          anim.onfinish = () => {
            this.handleReelStop(idx, newGrid[idx], reelStripEl, anim);
            resolve();
          };
        }
      });
    });

    Promise.all(reelPromises).then(() => {
      if (this.tickInterval) clearInterval(this.tickInterval);
      const cabinet = this.container.querySelector('.slot-cabinet');
      const reel2 = this.container.querySelector('#slot-reel-2');
      if (cabinet) cabinet.classList.remove('anticipation-mode');
      if (reel2) reel2.classList.remove('reel-suspense');

      this.currentGrid = newGrid;
      this.finishSpin(lineDefs);
    });
  }

  handleReelStop(reelIdx, symbols, reelStripEl, anim) {
    // Crucial: cancel the Web Animation so fill: 'forwards' does not linger at -80px
    if (anim) {
      try { anim.cancel(); } catch (e) {}
    }
    if (reelStripEl.getAnimations) {
      reelStripEl.getAnimations().forEach(a => {
        try { a.cancel(); } catch (e) {}
      });
    }
    reelStripEl.classList.remove('reel-spinning');
    // Lock in exact 3-row layout at rest (Row 0 = Top, Row 1 = Center, Row 2 = Bottom)
    reelStripEl.style.transform = 'translateY(0)';
    reelStripEl.innerHTML = `
      <div class="reel-cell" data-row="0">${symbols[0].sym}</div>
      <div class="reel-cell" data-row="1">${symbols[1].sym}</div>
      <div class="reel-cell" data-row="2">${symbols[2].sym}</div>
    `;
    window.casinoAudio?.playReelStop();
  }

  finishSpin(lineDefs) {
    this.isSpinning = false;
    const spinBtn = this.container.querySelector('#slot-spin-btn');
    if (spinBtn) spinBtn.disabled = false;

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
    const svgOverlay = this.container.querySelector('#payline-svg');

    if (totalWin > 0) {
      // 1. Dynamic roll-up counter for win amount
      const targetWin = totalWin;
      const countDuration = Math.min(1600, Math.max(500, targetWin * 0.7));
      const startTime = performance.now();
      const countUp = (now) => {
        const p = Math.min((now - startTime) / countDuration, 1);
        const cur = Math.floor(targetWin * p);
        if (winVal) winVal.textContent = `🪙 ${window.casinoEconomy.formatCoins(cur)}`;
        if (p < 1) {
          requestAnimationFrame(countUp);
        } else {
          if (winVal) winVal.textContent = `🪙 ${window.casinoEconomy.formatCoins(targetWin)}`;
        }
      };
      requestAnimationFrame(countUp);

      const isJackpot = winningLines.some(w => w.mult >= 500);
      window.casinoEconomy.creditWin(totalWin, isJackpot);

      if (isJackpot) {
        window.casinoAudio?.playJackpot();
        window.clarkCasino?.spawnCoinBursts();
        this.setStatus(`💥 MEGA JACKPOT! 500x! Won 🪙 ${window.casinoEconomy.formatCoins(totalWin)} CC!`);
      } else {
        window.casinoAudio?.playWin();
        this.setStatus(`WINNER! ${winningLines.length} Payline(s) hit for 🪙 ${window.casinoEconomy.formatCoins(totalWin)} CC!`);
      }

      // 2. Draw animated SVG laser paylines and highlight winning symbols
      const colors = ['#f1c40f', '#00ffcc', '#ff3366', '#ff9900', '#a29bfe'];
      const frameRect = svgOverlay?.getBoundingClientRect();

      winningLines.forEach((w, lIdx) => {
        // Highlight payline tags
        this.container.querySelectorAll(`.line-tag[data-line="${w.def.num}"]`).forEach(t => {
          t.classList.add('winner-line');
        });

        const lineColor = colors[(w.def.num - 1) % colors.length];

        // Draw laser path across center of matching cells
        if (svgOverlay && frameRect) {
          const points = w.def.coords.map(([col, row]) => {
            const reelEl = this.container.querySelector(`#slot-reel-${col}`);
            const cell = reelEl?.querySelectorAll('.reel-cell')[row];
            if (cell) {
              const r = cell.getBoundingClientRect();
              const x = r.left + r.width / 2 - frameRect.left;
              const y = r.top + r.height / 2 - frameRect.top;
              return `${x},${y}`;
            }
            return '';
          }).filter(Boolean);

          if (points.length === 3) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const [p1, p2, p3] = points.map(pt => pt.split(','));
            path.setAttribute('d', `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`);
            path.setAttribute('stroke', lineColor);
            path.setAttribute('stroke-width', '4');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('fill', 'none');
            path.setAttribute('class', 'payline-laser');
            path.style.setProperty('--laser-color', lineColor);
            svgOverlay.appendChild(path);
          }
        }

        // Highlight symbol cells
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
      window.casinoAudio?.playLose();
      this.setStatus('No winning paylines this spin. Pull again!');
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
