/**
 * Clark's Casino - Baccarat (Punto Banco)
 * Authentic Macau/Vegas rules: Player (1:1), Banker (0.95:1), Tie (8:1), 3rd card tableau.
 */

class BaccaratGame {
  constructor() {
    this.container = null;
    this.selectedChip = 50;
    this.bets = { player: 0, banker: 0, tie: 0 };
    this.playerCards = [];
    this.bankerCards = [];
    this.isDealing = false;
    this.deck = [];
    this.betHistory = [];
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

  createShoe() {
    const suits = [
      { sym: '♠', color: '#1a1a1a' },
      { sym: '♥', color: '#d32f2f' },
      { sym: '♦', color: '#d32f2f' },
      { sym: '♣', color: '#1a1a1a' }
    ];
    const ranks = [
      { r: 'A', v: 1 }, { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 },
      { r: '5', v: 5 }, { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 },
      { r: '9', v: 9 }, { r: '10', v: 0 }, { r: 'J', v: 0 }, { r: 'Q', v: 0 },
      { r: 'K', v: 0 }
    ];

    const shoe = [];
    for (let d = 0; d < 6; d++) {
      for (const s of suits) {
        for (const r of ranks) {
          shoe.push({ ...r, sym: s.sym, color: s.color });
        }
      }
    }
    for (let i = shoe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }
    this.deck = shoe;
  }

  drawCard() {
    if (!this.deck || this.deck.length < 20) this.createShoe();
    return this.deck.pop();
  }

  calcHand(cards) {
    const sum = cards.reduce((acc, c) => acc + c.v, 0);
    return sum % 10;
  }

  render() {
    this.container.innerHTML = `
      <div class="casino-game-table baccarat-table">
        <div class="table-felt-banner">
          <div class="felt-title">BACCARAT · PUNTO BANCO</div>
          <div class="felt-sub">Player Pays 1:1 · Banker Pays 0.95:1 · Tie Pays 8:1</div>
        </div>

        <!-- Baccarat Stage: Player vs Banker Hands -->
        <div class="baccarat-cards-stage">
          <div class="bac-side bac-player-side">
            <div class="bac-side-header">
              <span class="bac-side-title">PLAYER (PUNTO)</span>
              <span class="hand-score" id="bac-player-score">--</span>
            </div>
            <div class="cards-layout" id="bac-player-cards"></div>
          </div>

          <div class="bac-divider">VS</div>

          <div class="bac-side bac-banker-side">
            <div class="bac-side-header">
              <span class="bac-side-title">BANKER (BANCO)</span>
              <span class="hand-score" id="bac-banker-score">--</span>
            </div>
            <div class="cards-layout" id="bac-banker-cards"></div>
          </div>
        </div>

        <!-- Notification Banner -->
        <div class="game-status-banner" id="bac-banner">Place your bets on Player, Banker, or Tie</div>

        <!-- Baccarat Betting Spots -->
        <div class="baccarat-betting-spots">
          <div class="bac-spot bac-spot-player" data-bet="player">
            <span class="spot-title">PLAYER</span>
            <span class="spot-payout">1 : 1</span>
            <div class="chip-stack" id="bac-chip-player"></div>
          </div>

          <div class="bac-spot bac-spot-tie" data-bet="tie">
            <span class="spot-title">TIE</span>
            <span class="spot-payout">8 : 1</span>
            <div class="chip-stack" id="bac-chip-tie"></div>
          </div>

          <div class="bac-spot bac-spot-banker" data-bet="banker">
            <span class="spot-title">BANKER</span>
            <span class="spot-payout">0.95 : 1 (5% Comm)</span>
            <div class="chip-stack" id="bac-chip-banker"></div>
          </div>
        </div>

        <!-- Chips & Controls -->
        <div class="table-controls">
          <div class="chips-selector" id="bac-chips">
            <div class="chip-tray-label">CHIPS (Drag or Click):</div>
            <button class="chip-btn chip-5" data-val="5" draggable="true" title="Drag or click to bet 5">5</button>
            <button class="chip-btn chip-25" data-val="25" draggable="true" title="Drag or click to bet 25">25</button>
            <button class="chip-btn chip-50 active" data-val="50" draggable="true" title="Drag or click to bet 50">50</button>
            <button class="chip-btn chip-100" data-val="100" draggable="true" title="Drag or click to bet 100">100</button>
            <button class="chip-btn chip-500" data-val="500" draggable="true" title="Drag or click to bet 500">500</button>
            <button class="chip-btn chip-1000" data-val="1000" draggable="true" title="Drag or click to bet 1K">1K</button>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-secondary" id="bac-clear-btn">Clear Bets</button>
            <button class="casino-btn btn-secondary" id="bac-undo-btn">Undo</button>
            <button class="casino-btn btn-secondary" id="bac-double-btn">2x Bets</button>
            <button class="casino-btn btn-gold btn-large" id="bac-deal-btn">DEAL HAND</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.querySelectorAll('#bac-chips .chip-btn').forEach(btn => {
      btn.addEventListener('dragstart', (e) => {
        const val = btn.dataset.val;
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'copy';
        this.selectedChip = parseInt(val, 10);
        this.container.querySelectorAll('#bac-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      btn.addEventListener('click', () => {
        this.selectedChip = parseInt(btn.dataset.val, 10);
        this.container.querySelectorAll('#bac-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.casinoAudio?.playChip();
      });
    });

    this.container.querySelectorAll('.bac-spot').forEach(spot => {
      spot.addEventListener('click', () => {
        if (this.isDealing) return;
        const betKey = spot.dataset.bet;
        this.placeBet(betKey, this.selectedChip);
      });

      // Right-click reduces bet
      spot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (this.isDealing) return;
        const betKey = spot.dataset.bet;
        if (!betKey || !this.bets[betKey]) return;
        this.removeBet(betKey, this.selectedChip);
      });

      spot.addEventListener('dragover', (e) => {
        if (this.isDealing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        spot.classList.add('drag-hover');
      });

      spot.addEventListener('dragleave', () => {
        spot.classList.remove('drag-hover');
      });

      spot.addEventListener('drop', (e) => {
        if (this.isDealing) return;
        e.preventDefault();
        spot.classList.remove('drag-hover');
        const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const betKey = spot.dataset.bet;
        if (betKey && !isNaN(val) && val > 0) {
          this.placeBet(betKey, val);
        }
      });
    });

    this.container.querySelector('#bac-clear-btn')?.addEventListener('click', () => {
      if (this.isDealing) return;
      this.bets = { player: 0, banker: 0, tie: 0 };
      this.betHistory = [];
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    this.container.querySelector('#bac-undo-btn')?.addEventListener('click', () => {
      this.undoLastBet();
    });

    this.container.querySelector('#bac-double-btn')?.addEventListener('click', () => {
      if (this.isDealing) return;
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

    this.container.querySelector('#bac-deal-btn')?.addEventListener('click', () => {
      this.startDeal();
    });
  }

  getTotalBet() {
    return this.bets.player + this.bets.banker + this.bets.tie;
  }

  placeBet(betKey, chipAmt = this.selectedChip) {
    const totalCurrent = this.getTotalBet();
    if (!window.casinoEconomy.hasFunds(totalCurrent + chipAmt)) {
      this.setStatus('Insufficient Clark Coins for this bet! Claim free coins above.');
      return;
    }
    this.bets[betKey] += chipAmt;
    this.betHistory.push({ key: betKey, amount: chipAmt });
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  removeBet(betKey, chipAmt = this.selectedChip) {
    if (!this.bets[betKey]) return;
    this.bets[betKey] = Math.max(0, this.bets[betKey] - chipAmt);
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  undoLastBet() {
    if (this.isDealing || this.betHistory.length === 0) return;
    const last = this.betHistory.pop();
    if (last && this.bets[last.key]) {
      this.bets[last.key] = Math.max(0, this.bets[last.key] - last.amount);
      window.casinoAudio?.playChip();
      this.updateUI();
    }
  }

  updateUI() {
    ['player', 'tie', 'banker'].forEach(key => {
      const spot = this.container.querySelector(`.bac-spot-${key}`);
      const stack = this.container.querySelector(`#bac-chip-${key}`);
      const amt = this.bets[key];
      if (stack) {
        if (amt > 0) {
          stack.innerHTML = `<span class="board-chip">🪙 ${amt}</span>`;
          spot.classList.add('active-bet');
        } else {
          stack.innerHTML = '';
          spot.classList.remove('active-bet');
        }
      }
    });
  }

  setStatus(msg) {
    const el = this.container.querySelector('#bac-banner');
    if (el) el.textContent = msg;
  }

  startDeal() {
    if (this.isDealing) return;
    const totalBet = this.getTotalBet();
    if (totalBet <= 0) {
      this.setStatus('Please place a bet on Player, Banker, or Tie!');
      return;
    }
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Grab free stash above.');
      return;
    }

    this.isDealing = true;
    this.container.querySelector('#bac-deal-btn').disabled = true;
    this.playerCards = [];
    this.bankerCards = [];
    this.renderCards();

    this.setStatus('Dealing Baccarat hand...');

    // Deal: P1, B1, P2, B2
    setTimeout(() => {
      this.playerCards.push(this.drawCard());
      window.casinoAudio?.playCard();
      this.renderCards();
      setTimeout(() => {
        this.bankerCards.push(this.drawCard());
        window.casinoAudio?.playCard();
        this.renderCards();
        setTimeout(() => {
          this.playerCards.push(this.drawCard());
          window.casinoAudio?.playCard();
          this.renderCards();
          setTimeout(() => {
            this.bankerCards.push(this.drawCard());
            window.casinoAudio?.playCard();
            this.renderCards();
            this.evaluateTableau();
          }, 300);
        }, 300);
      }, 300);
    }, 300);
  }

  evaluateTableau() {
    const pScore = this.calcHand(this.playerCards);
    const bScore = this.calcHand(this.bankerCards);

    // Natural 8 or 9
    if (pScore >= 8 || bScore >= 8) {
      this.finishBaccarat('Natural Hand!');
      return;
    }

    // Player Rule: draws on 0-5, stands on 6-7
    let pDraw = null;
    if (pScore <= 5) {
      pDraw = this.drawCard();
      this.playerCards.push(pDraw);
      setTimeout(() => {
        window.casinoAudio?.playCard();
        this.renderCards();
      }, 350);
    }

    // Banker Rule: depends on Player draw
    setTimeout(() => {
      const bCur = this.calcHand(this.bankerCards);
      let bShouldDraw = false;

      if (pDraw === null) {
        // Player stood on 6-7, Banker draws on 0-5, stands on 6-7
        if (bCur <= 5) bShouldDraw = true;
      } else {
        const p3 = pDraw.v;
        if (bCur <= 2) bShouldDraw = true;
        else if (bCur === 3 && p3 !== 8) bShouldDraw = true;
        else if (bCur === 4 && [2, 3, 4, 5, 6, 7].includes(p3)) bShouldDraw = true;
        else if (bCur === 5 && [4, 5, 6, 7].includes(p3)) bShouldDraw = true;
        else if (bCur === 6 && [6, 7].includes(p3)) bShouldDraw = true;
      }

      if (bShouldDraw) {
        this.bankerCards.push(this.drawCard());
        setTimeout(() => {
          window.casinoAudio?.playCard();
          this.renderCards();
          setTimeout(() => this.finishBaccarat(), 400);
        }, 350);
      } else {
        this.finishBaccarat();
      }
    }, pDraw ? 600 : 300);
  }

  finishBaccarat(extraNote = '') {
    this.isDealing = false;
    this.container.querySelector('#bac-deal-btn').disabled = false;

    const pFinal = this.calcHand(this.playerCards);
    const bFinal = this.calcHand(this.bankerCards);

    let winner = 'tie';
    if (pFinal > bFinal) winner = 'player';
    else if (bFinal > pFinal) winner = 'banker';

    let totalWon = 0;
    let pushBets = 0;

    if (winner === 'player') {
      if (this.bets.player > 0) totalWon += this.bets.player * 2;
    } else if (winner === 'banker') {
      if (this.bets.banker > 0) totalWon += Math.floor(this.bets.banker * 1.95);
    } else {
      // Tie
      if (this.bets.tie > 0) totalWon += this.bets.tie * 9; // 8:1 + return
      // Player and Banker bets push on Tie in standard Baccarat!
      pushBets += this.bets.player + this.bets.banker;
    }

    if (pushBets > 0) {
      window.casinoEconomy.creditPush(pushBets);
    }

    const winLabel = winner.toUpperCase();
    if (totalWon > 0) {
      window.casinoEconomy.creditWin(totalWon);
      this.setStatus(`${extraNote} ${winLabel} WINS! (${pFinal} vs ${bFinal}). You Won 🪙 ${window.casinoEconomy.formatCoins(totalWon)} CC!`);
    } else {
      if (pushBets > 0) {
        this.setStatus(`TIE on ${pFinal}! Player & Banker bets returned.`);
      } else {
        window.casinoEconomy.recordLoss();
        this.setStatus(`${extraNote} ${winLabel} wins (${pFinal} vs ${bFinal}). House wins.`);
      }
    }

    // Clear bets
    this.bets = { player: 0, banker: 0, tie: 0 };
    this.updateUI();
  }

  renderCards() {
    const pEl = this.container.querySelector('#bac-player-cards');
    const bEl = this.container.querySelector('#bac-banker-cards');
    const pScoreEl = this.container.querySelector('#bac-player-score');
    const bScoreEl = this.container.querySelector('#bac-banker-score');

    if (pEl) pEl.innerHTML = this.playerCards.map(c => this.cardHTML(c)).join('');
    if (bEl) bEl.innerHTML = this.bankerCards.map(c => this.cardHTML(c)).join('');

    if (pScoreEl) pScoreEl.textContent = this.playerCards.length > 0 ? this.calcHand(this.playerCards) : '--';
    if (bScoreEl) bScoreEl.textContent = this.bankerCards.length > 0 ? this.calcHand(this.bankerCards) : '--';
  }

  cardHTML(card) {
    return `
      <div class="playing-card ${card.color === '#d32f2f' ? 'red' : 'black'}">
        <div class="card-top">
          <span class="card-rank">${card.r}</span>
          <span class="card-suit">${card.sym}</span>
        </div>
        <div class="card-center">${card.sym}</div>
        <div class="card-bottom">
          <span class="card-rank">${card.r}</span>
          <span class="card-suit">${card.sym}</span>
        </div>
      </div>
    `;
  }
}

window.BaccaratGame = BaccaratGame;
