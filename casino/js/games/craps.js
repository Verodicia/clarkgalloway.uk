/**
 * Clark's Casino - Classic Craps
 * Authentic rules: Pass Line, Don't Pass, Field, Any 7, Any Craps, and Point Puck.
 */

class CrapsGame {
  constructor() {
    this.container = null;
    this.point = null; // null or 4, 5, 6, 8, 9, 10
    this.selectedChip = 25;
    this.bets = {}; // 'pass', 'dontpass', 'field', 'any7', 'anycraps'
    this.isRolling = false;
    this.dice = [1, 1];
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
      <div class="casino-game-table craps-table">
        <!-- Craps Puck & Point HUD -->
        <div class="craps-hud-bar">
          <div class="puck-wrapper">
            <div class="craps-puck ${this.point ? 'on' : 'off'}" id="craps-puck">
              ${this.point ? `POINT: ${this.point}` : 'OFF'}
            </div>
            <span class="puck-desc">${this.point ? `Target Point is ${this.point}. Roll ${this.point} before 7!` : 'Come Out Roll. 7 or 11 wins Pass Line!'}</span>
          </div>

          <div class="dice-arena" id="dice-arena">
            <div class="casino-die red-die" id="die-1" data-val="1">
              <span class="pip pip-center"></span>
            </div>
            <div class="casino-die red-die" id="die-2" data-val="1">
              <span class="pip pip-center"></span>
            </div>
          </div>
        </div>

        <!-- Notification Banner -->
        <div class="game-status-banner" id="craps-banner">Place your bets on the Craps layout and roll!</div>

        <!-- Craps Felt Layout -->
        <div class="craps-felt-layout">
          <!-- Top Point Numbers Row -->
          <div class="craps-points-row">
            ${[4, 5, 6, 8, 9, 10].map(pt => `
              <div class="craps-point-box ${this.point === pt ? 'active-point' : ''}" data-pt="${pt}">
                <span class="point-num">${pt}</span>
                <span class="point-sub">${pt === 6 || pt === 8 ? 'BIG' : 'POINT'}</span>
              </div>
            `).join('')}
          </div>

          <!-- Main Betting Areas -->
          <div class="craps-main-areas">
            <!-- Pass Line -->
            <div class="craps-bet-cell bet-pass" data-bet="pass">
              <div class="cell-label">PASS LINE</div>
              <div class="cell-sub">Come out: 7, 11 wins · 2, 3, 12 loses</div>
              <div class="chip-stack" id="craps-chip-pass"></div>
            </div>

            <!-- Don't Pass Bar -->
            <div class="craps-bet-cell bet-dontpass" data-bet="dontpass">
              <div class="cell-label">DON'T PASS BAR 12</div>
              <div class="cell-sub">Come out: 2, 3 wins · 12 push</div>
              <div class="chip-stack" id="craps-chip-dontpass"></div>
            </div>
          </div>

          <!-- Proposition & Field Bets Row -->
          <div class="craps-lower-row">
            <div class="craps-bet-cell bet-field" data-bet="field">
              <div class="cell-label">FIELD BET (2, 3, 4, 9, 10, 11, 12)</div>
              <div class="cell-sub">2 & 12 pay 2:1 · 3,4,9,10,11 pay 1:1</div>
              <div class="chip-stack" id="craps-chip-field"></div>
            </div>

            <div class="craps-props-col">
              <div class="craps-bet-cell bet-prop" data-bet="any7">
                <div class="cell-label">ANY 7 (Pays 4:1)</div>
                <div class="chip-stack" id="craps-chip-any7"></div>
              </div>
              <div class="craps-bet-cell bet-prop" data-bet="anycraps">
                <div class="cell-label">ANY CRAPS (2, 3, 12 - Pays 7:1)</div>
                <div class="chip-stack" id="craps-chip-anycraps"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chips & Controls -->
        <div class="table-controls">
          <div class="chips-selector" id="craps-chips">
            <div class="chip-tray-label">CHIPS (Drag or Click):</div>
            <button class="chip-btn chip-5" data-val="5" draggable="true" title="Drag or click to bet 5">5</button>
            <button class="chip-btn chip-25 active" data-val="25" draggable="true" title="Drag or click to bet 25">25</button>
            <button class="chip-btn chip-50" data-val="50" draggable="true" title="Drag or click to bet 50">50</button>
            <button class="chip-btn chip-100" data-val="100" draggable="true" title="Drag or click to bet 100">100</button>
            <button class="chip-btn chip-500" data-val="500" draggable="true" title="Drag or click to bet 500">500</button>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-secondary" id="craps-clear-btn">Clear Bets</button>
            <button class="casino-btn btn-secondary" id="craps-double-btn">2x Bets</button>
            <button class="casino-btn btn-gold btn-large" id="craps-roll-btn">ROLL DICE</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Chips selector & dragstart
    this.container.querySelectorAll('#craps-chips .chip-btn').forEach(btn => {
      btn.addEventListener('dragstart', (e) => {
        const val = btn.dataset.val;
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'copy';
        this.selectedChip = parseInt(val, 10);
        this.container.querySelectorAll('#craps-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      btn.addEventListener('click', () => {
        this.selectedChip = parseInt(btn.dataset.val, 10);
        this.container.querySelectorAll('#craps-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.casinoAudio?.playChip();
      });
    });

    // Clicking and dragging onto bet spots
    this.container.querySelectorAll('.craps-bet-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (this.isRolling) return;
        const betKey = cell.dataset.bet;
        this.placeCrapsBet(betKey, this.selectedChip);
      });

      cell.addEventListener('dragover', (e) => {
        if (this.isRolling) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        cell.classList.add('drag-hover');
      });

      cell.addEventListener('dragleave', () => {
        cell.classList.remove('drag-hover');
      });

      cell.addEventListener('drop', (e) => {
        if (this.isRolling) return;
        e.preventDefault();
        cell.classList.remove('drag-hover');
        const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const betKey = cell.dataset.bet;
        if (betKey && !isNaN(val) && val > 0) {
          this.placeCrapsBet(betKey, val);
        }
      });
    });

    // Clear bets
    this.container.querySelector('#craps-clear-btn')?.addEventListener('click', () => {
      if (this.isRolling) return;
      this.bets = {};
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Double bets
    this.container.querySelector('#craps-double-btn')?.addEventListener('click', () => {
      if (this.isRolling) return;
      const total = this.getTotalBet();
      if (total === 0) return;
      if (window.casinoEconomy.hasFunds(total)) {
        for (const k in this.bets) this.bets[k] *= 2;
        window.casinoAudio?.playChip();
        this.updateUI();
      } else {
        this.setStatus('Insufficient Clark Coins to double bets!');
      }
    });

    // Roll button
    this.container.querySelector('#craps-roll-btn')?.addEventListener('click', () => {
      this.roll();
    });
  }

  getTotalBet() {
    return Object.values(this.bets).reduce((a, b) => a + b, 0);
  }

  placeCrapsBet(betKey, chipAmt = this.selectedChip) {
    const totalCurrent = this.getTotalBet();
    if (!window.casinoEconomy.hasFunds(totalCurrent + chipAmt)) {
      this.setStatus('Insufficient Clark Coins for this bet! Claim free coins above.');
      return;
    }
    this.bets[betKey] = (this.bets[betKey] || 0) + chipAmt;
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  updateUI() {
    this.container.querySelectorAll('.craps-bet-cell').forEach(cell => {
      const betKey = cell.dataset.bet;
      const stack = cell.querySelector('.chip-stack');
      const amt = this.bets[betKey] || 0;
      if (stack) {
        if (amt > 0) {
          stack.innerHTML = `<span class="board-chip">🪙 ${amt}</span>`;
          cell.classList.add('active-bet');
        } else {
          stack.innerHTML = '';
          cell.classList.remove('active-bet');
        }
      }
    });

    // Update Puck
    const puck = this.container.querySelector('#craps-puck');
    const puckDesc = this.container.querySelector('.puck-desc');
    if (puck) {
      puck.className = `craps-puck ${this.point ? 'on' : 'off'}`;
      puck.textContent = this.point ? `POINT: ${this.point}` : 'OFF';
    }
    if (puckDesc) {
      puckDesc.textContent = this.point
        ? `Target Point is ${this.point}. Roll ${this.point} before 7!`
        : 'Come Out Roll. 7 or 11 wins Pass Line!';
    }

    this.container.querySelectorAll('.craps-point-box').forEach(box => {
      const pt = parseInt(box.dataset.pt, 10);
      box.classList.toggle('active-point', this.point === pt);
    });
  }

  setStatus(msg) {
    const el = this.container.querySelector('#craps-banner');
    if (el) el.textContent = msg;
  }

  roll() {
    if (this.isRolling) return;
    const totalBet = this.getTotalBet();
    if (totalBet <= 0) {
      this.setStatus('Please place a bet on Pass Line, Don’t Pass, or Field first!');
      return;
    }
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Grab free stash above.');
      return;
    }

    this.isRolling = true;
    this.container.querySelector('#craps-roll-btn').disabled = true;

    // Dice rolling animation
    const die1 = this.container.querySelector('#die-1');
    const die2 = this.container.querySelector('#die-2');
    die1.classList.add('rolling');
    die2.classList.add('rolling');

    window.casinoAudio?.playDice();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    this.dice = [d1, d2];
    const sum = d1 + d2;

    setTimeout(() => {
      die1.classList.remove('rolling');
      die2.classList.remove('rolling');
      this.renderDieFace(die1, d1);
      this.renderDieFace(die2, d2);
      this.finishRoll(sum);
    }, 900);
  }

  renderDieFace(el, val) {
    el.dataset.val = val;
    // Pip arrangements: 1 to 6
    let pipsHTML = '';
    if (val === 1) pipsHTML = '<span class="pip pip-center"></span>';
    else if (val === 2) pipsHTML = '<span class="pip pip-tl"></span><span class="pip pip-br"></span>';
    else if (val === 3) pipsHTML = '<span class="pip pip-tl"></span><span class="pip pip-center"></span><span class="pip pip-br"></span>';
    else if (val === 4) pipsHTML = '<span class="pip pip-tl"></span><span class="pip pip-tr"></span><span class="pip pip-bl"></span><span class="pip pip-br"></span>';
    else if (val === 5) pipsHTML = '<span class="pip pip-tl"></span><span class="pip pip-tr"></span><span class="pip pip-center"></span><span class="pip pip-bl"></span><span class="pip pip-br"></span>';
    else if (val === 6) pipsHTML = '<span class="pip pip-tl"></span><span class="pip pip-tr"></span><span class="pip pip-ml"></span><span class="pip pip-mr"></span><span class="pip pip-bl"></span><span class="pip pip-br"></span>';
    el.innerHTML = pipsHTML;
  }

  finishRoll(sum) {
    this.isRolling = false;
    this.container.querySelector('#craps-roll-btn').disabled = false;

    let totalWon = 0;
    let pushPass = false;
    let pushDontPass = false;
    let statusMsg = `Rolled a ${sum} (${this.dice[0]} + ${this.dice[1]}). `;

    // 1. One-roll bets: Field, Any 7, Any Craps
    if (this.bets.field) {
      const fBet = this.bets.field;
      if (sum === 2 || sum === 12) {
        totalWon += fBet * 3; // 2:1 payout plus original bet
        statusMsg += `Field 2:1 win! `;
      } else if ([3, 4, 9, 10, 11].includes(sum)) {
        totalWon += fBet * 2; // 1:1 payout plus original bet
        statusMsg += `Field win! `;
      }
      delete this.bets.field;
    }
    if (this.bets.any7) {
      if (sum === 7) {
        totalWon += this.bets.any7 * 5; // 4:1 payout plus stake
        statusMsg += `Any 7 Win! `;
      }
      delete this.bets.any7;
    }
    if (this.bets.anycraps) {
      if ([2, 3, 12].includes(sum)) {
        totalWon += this.bets.anycraps * 8; // 7:1 payout plus stake
        statusMsg += `Any Craps Win! `;
      }
      delete this.bets.anycraps;
    }

    // 2. Line bets & Point rules
    if (this.point === null) {
      // Come Out roll
      if (sum === 7 || sum === 11) {
        // Pass line wins 1:1
        if (this.bets.pass) totalWon += this.bets.pass * 2;
        statusMsg += `Natural ${sum}! Pass Line wins! `;
      } else if (sum === 2 || sum === 3) {
        // Craps! Don't pass wins 1:1
        if (this.bets.dontpass) totalWon += this.bets.dontpass * 2;
        statusMsg += `Craps ${sum}! Don't Pass wins! `;
      } else if (sum === 12) {
        // Push on Don't Pass Bar 12
        if (this.bets.dontpass) pushDontPass = true;
        statusMsg += `Craps 12! Don't Pass pushes. `;
      } else {
        // Established point: 4, 5, 6, 8, 9, 10
        this.point = sum;
        statusMsg += `Point is now ${sum}! Roll ${sum} before 7.`;
      }
    } else {
      // Point roll
      if (sum === this.point) {
        // Hit point! Pass line wins
        if (this.bets.pass) totalWon += this.bets.pass * 2;
        statusMsg += `HIT THE POINT ${this.point}! Pass Line WINS! `;
        this.point = null; // reset puck
      } else if (sum === 7) {
        // Seven out! Don't pass wins
        if (this.bets.dontpass) totalWon += this.bets.dontpass * 2;
        statusMsg += `Seven Out! Don't Pass wins. `;
        this.point = null; // reset puck
      } else {
        statusMsg += `Waiting for ${this.point} or 7...`;
      }
    }

    // Execute payouts
    if (pushDontPass && this.bets.dontpass) {
      window.casinoEconomy.creditPush(this.bets.dontpass);
    }
    if (totalWon > 0) {
      window.casinoEconomy.creditWin(totalWon);
      this.setStatus(`${statusMsg} Total won: 🪙 ${window.casinoEconomy.formatCoins(totalWon)} CC!`);
    } else {
      if (!pushDontPass && !pushPass && (this.point === null)) {
        window.casinoEconomy.recordLoss();
      }
      this.setStatus(statusMsg);
    }

    // Clear resolved bets if round ended
    if (this.point === null) {
      this.bets = {};
    }

    this.updateUI();
  }
}

window.CrapsGame = CrapsGame;
