/**
 * Clark's Casino - Jacks or Better Video Poker
 * Classic 9/6 paytable, interactive card holding, dealing and rank evaluation.
 */

class VideoPokerGame {
  constructor() {
    this.container = null;
    this.hand = [];
    this.held = [false, false, false, false, false];
    this.gameState = 'betting'; // 'betting' (deal phase) or 'held' (draw phase)
    this.betCoins = 5; // 1 to 5 coins
    this.coinValue = 10; // CC value per coin
    this.deck = [];

    this.paytable = [
      { name: 'Royal Flush', pays: [250, 500, 750, 1000, 4000] },
      { name: 'Straight Flush', pays: [50, 100, 150, 200, 250] },
      { name: 'Four of a Kind', pays: [25, 50, 75, 100, 125] },
      { name: 'Full House', pays: [9, 18, 27, 36, 45] },
      { name: 'Flush', pays: [6, 12, 18, 24, 30] },
      { name: 'Straight', pays: [4, 8, 12, 16, 20] },
      { name: 'Three of a Kind', pays: [3, 6, 9, 12, 15] },
      { name: 'Two Pair', pays: [2, 4, 6, 8, 10] },
      { name: 'Jacks or Better', pays: [1, 2, 3, 4, 5] }
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

  createFreshDeck() {
    const suits = [
      { name: 'spades', sym: '♠', color: '#1a1a1a' },
      { name: 'hearts', sym: '♥', color: '#d32f2f' },
      { name: 'diamonds', sym: '♦', color: '#d32f2f' },
      { name: 'clubs', sym: '♣', color: '#1a1a1a' }
    ];
    const ranks = [
      { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 }, { r: '5', v: 5 },
      { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 }, { r: '9', v: 9 },
      { r: '10', v: 10 }, { r: 'J', v: 11 }, { r: 'Q', v: 12 }, { r: 'K', v: 13 },
      { r: 'A', v: 14 }
    ];
    const deck = [];
    for (const s of suits) {
      for (const r of ranks) {
        deck.push({ ...r, suit: s.name, sym: s.sym, color: s.color });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.deck = deck;
  }

  render() {
    this.container.innerHTML = `
      <div class="casino-game-table videopoker-table">
        <!-- Top Video Poker Glass Paytable -->
        <div class="vp-paytable-wrapper">
          <table class="vp-paytable" id="vp-paytable">
            <thead>
              <tr>
                <th class="th-hand">HAND</th>
                <th class="th-coin ${this.betCoins === 1 ? 'active-col' : ''}">1 COIN</th>
                <th class="th-coin ${this.betCoins === 2 ? 'active-col' : ''}">2 COINS</th>
                <th class="th-coin ${this.betCoins === 3 ? 'active-col' : ''}">3 COINS</th>
                <th class="th-coin ${this.betCoins === 4 ? 'active-col' : ''}">4 COINS</th>
                <th class="th-coin ${this.betCoins === 5 ? 'active-col' : ''}">5 COINS</th>
              </tr>
            </thead>
            <tbody>
              ${this.paytable.map((row, idx) => `
                <tr class="vp-row" data-hand-idx="${idx}">
                  <td class="td-hand">${row.name}</td>
                  ${row.pays.map((p, cIdx) => `
                    <td class="td-pay col-${cIdx + 1} ${this.betCoins === (cIdx + 1) ? 'active-col' : ''}">${p}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Cards Display Area -->
        <div class="vp-cards-stage">
          <div class="game-status-banner" id="vp-banner">Bet coins and press Deal</div>
          <div class="vp-cards-row" id="vp-cards-row">
            ${[0, 1, 2, 3, 4].map(idx => `
              <div class="vp-card-slot" data-index="${idx}">
                <div class="vp-hold-badge">HELD</div>
                <div class="playing-card vp-card card-placeholder">
                  <div class="card-inner-pattern">⚜️</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Meter display -->
        <div class="slot-meter-display vp-meters">
          <div class="meter-col">
            <span class="meter-label">COIN VALUE</span>
            <span class="meter-value" id="vp-coin-val">🪙 10</span>
          </div>
          <div class="meter-col">
            <span class="meter-label">BET COINS</span>
            <span class="meter-value" id="vp-coins-count">5</span>
          </div>
          <div class="meter-col">
            <span class="meter-label">TOTAL WAGER</span>
            <span class="meter-value" id="vp-total-val">🪙 50</span>
          </div>
          <div class="meter-col win-meter">
            <span class="meter-label">WIN PAID</span>
            <span class="meter-value win-val" id="vp-win-val">🪙 0</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="table-controls">
          <div class="vp-bet-controls">
            <button class="casino-btn btn-sm" id="vp-coin-dec">Coin Val -</button>
            <button class="casino-btn btn-sm" id="vp-coin-inc">Coin Val +</button>
            <button class="casino-btn btn-sm btn-secondary" id="vp-bet-one">Bet One</button>
            <button class="casino-btn btn-sm btn-secondary" id="vp-bet-max">Bet Max (5)</button>
          </div>

          <div class="game-action-buttons">
            <button class="casino-btn btn-gold btn-large" id="vp-action-btn">DEAL</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Card click to toggle hold
    this.container.querySelectorAll('.vp-card-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        if (this.gameState !== 'held') return;
        const idx = parseInt(slot.dataset.index, 10);
        this.toggleHold(idx);
      });
    });

    // Coin value steps: 5, 10, 25, 50, 100
    const coinVals = [5, 10, 25, 50, 100];
    this.container.querySelector('#vp-coin-dec')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      const cur = coinVals.indexOf(this.coinValue);
      if (cur > 0) {
        this.coinValue = coinVals[cur - 1];
        window.casinoAudio?.playChip();
        this.updateUI();
      }
    });
    this.container.querySelector('#vp-coin-inc')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      const cur = coinVals.indexOf(this.coinValue);
      if (cur < coinVals.length - 1) {
        this.coinValue = coinVals[cur + 1];
        window.casinoAudio?.playChip();
        this.updateUI();
      }
    });

    // Bet One
    this.container.querySelector('#vp-bet-one')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.betCoins = (this.betCoins % 5) + 1;
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Bet Max
    this.container.querySelector('#vp-bet-max')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.betCoins = 5;
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Action button (DEAL / DRAW)
    this.container.querySelector('#vp-action-btn')?.addEventListener('click', () => {
      if (this.gameState === 'betting') {
        this.deal();
      } else if (this.gameState === 'held') {
        this.draw();
      }
    });
  }

  toggleHold(idx) {
    this.held[idx] = !this.held[idx];
    window.casinoAudio?.playClick();
    const slot = this.container.querySelectorAll('.vp-card-slot')[idx];
    if (slot) {
      slot.classList.toggle('held', this.held[idx]);
    }
  }

  getTotalBet() {
    return this.betCoins * this.coinValue;
  }

  updateUI() {
    const total = this.getTotalBet();
    const coinValEl = this.container.querySelector('#vp-coin-val');
    const coinsCountEl = this.container.querySelector('#vp-coins-count');
    const totalEl = this.container.querySelector('#vp-total-val');

    if (coinValEl) coinValEl.textContent = `🪙 ${this.coinValue}`;
    if (coinsCountEl) coinsCountEl.textContent = this.betCoins;
    if (totalEl) totalEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(total)}`;

    // Update active column in paytable
    this.container.querySelectorAll('.th-coin, .td-pay').forEach(el => {
      el.classList.remove('active-col');
    });
    this.container.querySelectorAll(`.th-coin:nth-child(${this.betCoins + 1})`).forEach(el => el.classList.add('active-col'));
    this.container.querySelectorAll(`.col-${this.betCoins}`).forEach(el => el.classList.add('active-col'));
  }

  setStatus(msg) {
    const el = this.container.querySelector('#vp-banner');
    if (el) el.textContent = msg;
  }

  deal() {
    const totalBet = this.getTotalBet();
    if (!window.casinoEconomy.placeBet(totalBet)) {
      this.setStatus('Insufficient Clark Coins! Grab free stash above.');
      return;
    }

    this.createFreshDeck();
    this.hand = [];
    this.held = [false, false, false, false, false];

    // Reset hold tags
    this.container.querySelectorAll('.vp-card-slot').forEach(s => s.classList.remove('held'));
    this.container.querySelectorAll('.vp-row').forEach(r => r.classList.remove('win-row'));
    const winVal = this.container.querySelector('#vp-win-val');
    if (winVal) winVal.textContent = '🪙 0';

    this.gameState = 'held';
    const actionBtn = this.container.querySelector('#vp-action-btn');
    if (actionBtn) actionBtn.textContent = 'DRAW';

    this.setStatus('Click cards to HOLD, then press DRAW!');

    // Deal 5 cards with timing
    for (let i = 0; i < 5; i++) {
      this.hand.push(this.deck.pop());
      setTimeout(() => {
        this.renderCard(i, this.hand[i]);
        window.casinoAudio?.playCard();
      }, i * 140);
    }
  }

  draw() {
    this.gameState = 'ended';
    const actionBtn = this.container.querySelector('#vp-action-btn');
    if (actionBtn) actionBtn.disabled = true;

    // Replace non-held cards
    let replacedCount = 0;
    for (let i = 0; i < 5; i++) {
      if (!this.held[i]) {
        this.hand[i] = this.deck.pop();
        setTimeout(() => {
          this.renderCard(i, this.hand[i]);
          window.casinoAudio?.playCard();
        }, replacedCount * 140);
        replacedCount++;
      }
    }

    setTimeout(() => {
      this.finishRound();
    }, (replacedCount + 1) * 150);
  }

  finishRound() {
    const result = this.evaluatePokerHand(this.hand);
    const winVal = this.container.querySelector('#vp-win-val');

    if (result.winMultiplier > 0) {
      const payout = result.winMultiplier * this.coinValue;
      if (winVal) winVal.textContent = `🪙 ${window.casinoEconomy.formatCoins(payout)}`;
      const isJackpot = result.name === 'Royal Flush';
      window.casinoEconomy.creditWin(payout, isJackpot);
      this.setStatus(`★ ${result.name.toUpperCase()}! ★ Won 🪙 ${window.casinoEconomy.formatCoins(payout)} CC!`);

      // Highlight row in paytable
      const row = this.container.querySelector(`.vp-row[data-hand-idx="${result.paytableIndex}"]`);
      if (row) row.classList.add('win-row');
    } else {
      window.casinoEconomy.recordLoss();
      this.setStatus('Game Over. No winning combination.');
    }

    // Reset back to betting phase after small delay
    setTimeout(() => {
      this.gameState = 'betting';
      const actionBtn = this.container.querySelector('#vp-action-btn');
      if (actionBtn) {
        actionBtn.textContent = 'DEAL';
        actionBtn.disabled = false;
      }
    }, 1500);
  }

  renderCard(slotIdx, card) {
    const slot = this.container.querySelectorAll('.vp-card-slot')[slotIdx];
    if (!slot) return;
    slot.innerHTML = `
      <div class="vp-hold-badge">HELD</div>
      <div class="playing-card vp-card ${card.color === '#d32f2f' ? 'red' : 'black'}">
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
    if (this.held[slotIdx]) slot.classList.add('held');
  }

  evaluatePokerHand(cards) {
    // Sort cards by rank value
    const sorted = [...cards].sort((a, b) => a.v - b.v);
    const vals = sorted.map(c => c.v);
    const suits = sorted.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);

    // Check straight (including Ace-low straight A, 2, 3, 4, 5)
    let isStraight = false;
    if (vals[4] - vals[0] === 4 && new Set(vals).size === 5) {
      isStraight = true;
    } else if (vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5 && vals[4] === 14) {
      isStraight = true;
    }

    // Counts of ranks
    const counts = {};
    vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const countVals = Object.values(counts).sort((a, b) => b - a);

    // 1. Royal Flush
    if (isFlush && isStraight && vals[4] === 14 && vals[0] === 10) {
      return { name: 'Royal Flush', paytableIndex: 0, winMultiplier: this.paytable[0].pays[this.betCoins - 1] };
    }
    // 2. Straight Flush
    if (isFlush && isStraight) {
      return { name: 'Straight Flush', paytableIndex: 1, winMultiplier: this.paytable[1].pays[this.betCoins - 1] };
    }
    // 3. Four of a Kind
    if (countVals[0] === 4) {
      return { name: 'Four of a Kind', paytableIndex: 2, winMultiplier: this.paytable[2].pays[this.betCoins - 1] };
    }
    // 4. Full House
    if (countVals[0] === 3 && countVals[1] === 2) {
      return { name: 'Full House', paytableIndex: 3, winMultiplier: this.paytable[3].pays[this.betCoins - 1] };
    }
    // 5. Flush
    if (isFlush) {
      return { name: 'Flush', paytableIndex: 4, winMultiplier: this.paytable[4].pays[this.betCoins - 1] };
    }
    // 6. Straight
    if (isStraight) {
      return { name: 'Straight', paytableIndex: 5, winMultiplier: this.paytable[5].pays[this.betCoins - 1] };
    }
    // 7. Three of a Kind
    if (countVals[0] === 3) {
      return { name: 'Three of a Kind', paytableIndex: 6, winMultiplier: this.paytable[6].pays[this.betCoins - 1] };
    }
    // 8. Two Pair
    if (countVals[0] === 2 && countVals[1] === 2) {
      return { name: 'Two Pair', paytableIndex: 7, winMultiplier: this.paytable[7].pays[this.betCoins - 1] };
    }
    // 9. Jacks or Better (Pair of J, Q, K, A)
    if (countVals[0] === 2) {
      for (const [rankVal, count] of Object.entries(counts)) {
        if (count === 2 && parseInt(rankVal, 10) >= 11) {
          return { name: 'Jacks or Better', paytableIndex: 8, winMultiplier: this.paytable[8].pays[this.betCoins - 1] };
        }
      }
    }

    return { name: 'Nothing', paytableIndex: -1, winMultiplier: 0 };
  }
}

window.VideoPokerGame = VideoPokerGame;
