/**
 * Clark's Casino - Blackjack (21)
 * Authentic Vegas rules: Dealer stands on 17+, Blackjack pays 3:2, Double Down, Split.
 */

class BlackjackGame {
  constructor() {
    this.container = null;
    this.deck = [];
    this.currentBet = 50;
    this.playerHands = [{ cards: [], bet: 0, status: 'playing' }];
    this.activeHandIndex = 0;
    this.dealerCards = [];
    this.gameState = 'betting'; // 'betting', 'player-turn', 'dealer-turn', 'ended'
    this.selectedChip = 50;
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

  createDeck() {
    const suits = [
      { name: 'spades', sym: '♠', color: '#1a1a1a' },
      { name: 'hearts', sym: '♥', color: '#d32f2f' },
      { name: 'diamonds', sym: '♦', color: '#d32f2f' },
      { name: 'clubs', sym: '♣', color: '#1a1a1a' }
    ];
    const ranks = [
      { r: '2', val: 2 }, { r: '3', val: 3 }, { r: '4', val: 4 }, { r: '5', val: 5 },
      { r: '6', val: 6 }, { r: '7', val: 7 }, { r: '8', val: 8 }, { r: '9', val: 9 },
      { r: '10', val: 10 }, { r: 'J', val: 10 }, { r: 'Q', val: 10 }, { r: 'K', val: 10 },
      { r: 'A', val: 11 }
    ];

    const deck = [];
    // 4 standard casino decks for realistic shoe
    for (let d = 0; d < 4; d++) {
      for (const s of suits) {
        for (const r of ranks) {
          deck.push({ ...r, suit: s.name, sym: s.sym, color: s.color });
        }
      }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.deck = deck;
  }

  drawCard() {
    if (this.deck.length < 20) {
      this.createDeck();
    }
    return this.deck.pop();
  }

  calculateHand(cards) {
    let score = 0;
    let aces = 0;
    for (const c of cards) {
      if (c.r === 'A') aces++;
      score += c.val;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    const isSoft = aces > 0;
    return { score, isSoft, isBust: score > 21, isBlackjack: cards.length === 2 && score === 21 };
  }

  render() {
    this.container.innerHTML = `
      <div class="casino-game-table blackjack-table">
        <!-- Felt Decal & Rules Arch -->
        <div class="table-felt-banner">
          <div class="felt-title">BLACKJACK PAYS 3 TO 2</div>
          <div class="felt-sub">Dealer Must Stand on 17 and Must Draw to 16 · Insurance Pays 2 to 1</div>
        </div>

        <!-- Dealer Section -->
        <div class="table-area dealer-area">
          <div class="area-header">
            <span class="dealer-label">DEALER</span>
            <span class="hand-score" id="bj-dealer-score">--</span>
          </div>
          <div class="cards-layout" id="bj-dealer-cards"></div>
        </div>

        <!-- Notification Banner -->
        <div class="game-status-banner" id="bj-status-banner">Place your bet and press Deal</div>

        <!-- Player Section -->
        <div class="table-area player-area">
          <div class="area-header">
            <span class="player-label">PLAYER</span>
            <span class="hand-score" id="bj-player-score">--</span>
          </div>
          <div class="cards-layout" id="bj-player-cards"></div>
          
          <div class="bet-spot-wrapper">
            <div class="bet-spot" id="bj-bet-spot" title="Click or Drag Chips Here to Bet!">
              <div class="bet-spot-inner" id="bj-bet-spot-inner">
                <span class="bet-label">DROP OR CLICK TO BET</span>
                <span class="bet-val" id="bj-bet-display">🪙 50</span>
              </div>
            </div>
            <div class="bet-hint-tag">Tap circle or chips to add to bet</div>
          </div>
        </div>

        <!-- Action & Chips Bar -->
        <div class="table-controls">
          <div class="chips-selector" id="bj-chips">
            <div class="chip-tray-label">CHIPS (Drag or Click):</div>
            <button class="chip-btn chip-5" data-val="5" draggable="true" title="Drag or click to bet 5">5</button>
            <button class="chip-btn chip-25" data-val="25" draggable="true" title="Drag or click to bet 25">25</button>
            <button class="chip-btn chip-50 active" data-val="50" draggable="true" title="Drag or click to bet 50">50</button>
            <button class="chip-btn chip-100" data-val="100" draggable="true" title="Drag or click to bet 100">100</button>
            <button class="chip-btn chip-500" data-val="500" draggable="true" title="Drag or click to bet 500">500</button>
            <button class="chip-btn chip-1000" data-val="1000" draggable="true" title="Drag or click to bet 1K">1K</button>
          </div>

          <div class="game-action-buttons">
            <!-- Betting phase buttons -->
            <div class="btn-group betting-btns" id="bj-betting-controls">
              <button class="casino-btn btn-secondary" id="bj-clear-bet">Clear</button>
              <button class="casino-btn btn-secondary" id="bj-add-25">+ 25</button>
              <button class="casino-btn btn-secondary" id="bj-add-100">+ 100</button>
              <button class="casino-btn btn-secondary" id="bj-double-bet">2x Bet</button>
              <button class="casino-btn btn-secondary" id="bj-allin-bet">All-In</button>
              <button class="casino-btn btn-gold btn-large" id="bj-deal-btn">DEAL</button>
            </div>

            <!-- In-game action buttons -->
            <div class="btn-group play-btns hidden" id="bj-play-controls">
              <button class="casino-btn btn-hit" id="bj-hit-btn">HIT</button>
              <button class="casino-btn btn-stand" id="bj-stand-btn">STAND</button>
              <button class="casino-btn btn-double" id="bj-doubledown-btn">DOUBLE</button>
              <button class="casino-btn btn-secondary hidden" id="bj-split-btn">SPLIT</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const betSpot = this.container.querySelector('#bj-bet-spot');

    // Click on Bet Spot adds selected chip
    betSpot?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.addBet(this.selectedChip);
    });

    // Drag and drop handlers for Bet Spot
    betSpot?.addEventListener('dragover', (e) => {
      if (this.gameState !== 'betting') return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      betSpot.classList.add('drag-hover');
    });

    betSpot?.addEventListener('dragleave', () => {
      betSpot.classList.remove('drag-hover');
    });

    betSpot?.addEventListener('drop', (e) => {
      if (this.gameState !== 'betting') return;
      e.preventDefault();
      betSpot.classList.remove('drag-hover');
      const val = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(val) && val > 0) {
        this.selectedChip = val;
        this.highlightActiveChip(val);
        this.addBet(val);
      }
    });

    // Chip selection & dragstart
    this.container.querySelectorAll('#bj-chips .chip-btn').forEach(btn => {
      btn.addEventListener('dragstart', (e) => {
        const val = btn.dataset.val;
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'copy';
        this.selectedChip = parseInt(val, 10);
        this.highlightActiveChip(this.selectedChip);
      });

      btn.addEventListener('click', () => {
        if (this.gameState !== 'betting') return;
        const val = parseInt(btn.dataset.val, 10);
        this.selectedChip = val;
        this.highlightActiveChip(val);
        this.addBet(val);
      });
    });

    // Clear bet
    this.container.querySelector('#bj-clear-bet')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.currentBet = 0;
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // Quick add buttons
    this.container.querySelector('#bj-add-25')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.addBet(25);
    });
    this.container.querySelector('#bj-add-100')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      this.addBet(100);
    });

    // Double bet
    this.container.querySelector('#bj-double-bet')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      if (this.currentBet === 0) {
        this.addBet(this.selectedChip);
        return;
      }
      const next = this.currentBet * 2;
      const bal = window.casinoEconomy.getBalance();
      this.currentBet = Math.min(next, bal);
      window.casinoAudio?.playChip();
      this.updateUI();
    });

    // All-In bet
    this.container.querySelector('#bj-allin-bet')?.addEventListener('click', () => {
      if (this.gameState !== 'betting') return;
      const bal = window.casinoEconomy.getBalance();
      if (bal > 0) {
        this.currentBet = bal;
        window.casinoAudio?.playChip();
        this.updateUI();
      } else {
        this.setStatus('You have 0 Clark Coins! Claim free 1,000 CC above.');
      }
    });

    // Deal
    this.container.querySelector('#bj-deal-btn')?.addEventListener('click', () => {
      this.startRound();
    });

    // Hit
    this.container.querySelector('#bj-hit-btn')?.addEventListener('click', () => {
      this.hit();
    });

    // Stand
    this.container.querySelector('#bj-stand-btn')?.addEventListener('click', () => {
      this.stand();
    });

    // Double Down
    this.container.querySelector('#bj-doubledown-btn')?.addEventListener('click', () => {
      this.doubleDown();
    });
  }

  highlightActiveChip(val) {
    this.container.querySelectorAll('#bj-chips .chip-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val, 10) === val);
    });
  }

  addBet(amount) {
    if (this.gameState !== 'betting') return;
    const bal = window.casinoEconomy.getBalance();
    if (bal <= 0) {
      this.setStatus('Out of Clark Coins! Tap "+ 🪙 1,000 Free" at the top.');
      return;
    }
    if (this.currentBet + amount > bal) {
      this.currentBet = bal;
      this.setStatus(`Bet capped at your available balance: 🪙 ${bal} CC`);
    } else {
      this.currentBet += amount;
    }
    window.casinoAudio?.playChip();
    this.updateUI();
  }

  onBalanceUpdated(balance) {
    if (this.currentBet === 0 && balance >= 50) {
      this.currentBet = 50;
    }
    this.updateUI();
  }

  updateUI() {
    const spotInner = this.container.querySelector('#bj-bet-spot-inner');
    const betSpot = this.container.querySelector('#bj-bet-spot');

    if (spotInner) {
      spotInner.innerHTML = this.renderChipStackHTML(this.currentBet);
    }
    if (betSpot) {
      betSpot.classList.toggle('has-bet', this.currentBet > 0);
    }
  }

  renderChipStackHTML(amount) {
    if (amount <= 0) {
      return `
        <span class="bet-label">DROP OR CLICK CHIPS HERE</span>
        <span class="bet-val">🪙 0</span>
      `;
    }

    // Determine visual chip breakdown
    const denoms = [1000, 500, 100, 50, 25, 5];
    let rem = amount;
    const chips = [];
    for (const d of denoms) {
      const count = Math.min(Math.floor(rem / d), 3);
      for (let i = 0; i < count; i++) {
        chips.push(d);
      }
      rem = rem % d;
      if (chips.length >= 6) break;
    }

    const stackHtml = chips.map((val, idx) => `
      <div class="stacked-chip chip-${val}" style="bottom: ${idx * 5}px; transform: rotate(${(idx * 19) % 360}deg);">
        <span>${val >= 1000 ? '1K' : val}</span>
      </div>
    `).join('');

    return `
      <div class="felt-chip-stack-visual">${stackHtml}</div>
      <span class="bet-val">🪙 ${window.casinoEconomy.formatCoins(amount)}</span>
    `;
  }

  startRound() {
    if (this.gameState !== 'betting') return;
    if (this.currentBet <= 0) {
      this.setStatus('Please select a bet amount.');
      return;
    }
    if (!window.casinoEconomy.placeBet(this.currentBet)) {
      this.setStatus('Insufficient Clark Coins! Claim free stash above.');
      return;
    }

    if (!this.deck || this.deck.length < 20) {
      this.createDeck();
    }

    this.gameState = 'player-turn';
    this.playerHands = [{ cards: [], bet: this.currentBet, status: 'playing' }];
    this.activeHandIndex = 0;
    this.dealerCards = [];

    // Deal cards with realistic timing
    this.container.querySelector('#bj-betting-controls').classList.add('hidden');
    this.container.querySelector('#bj-play-controls').classList.remove('hidden');

    this.container.querySelector('#bj-doubledown-btn').disabled = 
      !window.casinoEconomy.hasFunds(this.currentBet);

    // Initial 2 cards each
    setTimeout(() => {
      this.playerHands[0].cards.push(this.drawCard());
      window.casinoAudio?.playCard();
      this.renderPlayerCards();
      setTimeout(() => {
        this.dealerCards.push(this.drawCard());
        window.casinoAudio?.playCard();
        this.renderDealerCards(true);
        setTimeout(() => {
          this.playerHands[0].cards.push(this.drawCard());
          window.casinoAudio?.playCard();
          this.renderPlayerCards();
          setTimeout(() => {
            this.dealerCards.push(this.drawCard());
            window.casinoAudio?.playCard();
            this.renderDealerCards(true);
            this.checkInitialHands();
          }, 250);
        }, 250);
      }, 250);
    }, 200);
  }

  checkInitialHands() {
    const pCalc = this.calculateHand(this.playerHands[0].cards);
    const dCalc = this.calculateHand(this.dealerCards);

    if (pCalc.isBlackjack) {
      this.renderDealerCards(false);
      if (dCalc.isBlackjack) {
        this.endRound('push', 'Both have Blackjack! Push - bet returned.');
      } else {
        const win = Math.floor(this.currentBet * 2.5); // 3:2 payout plus returned stake
        this.endRound('blackjack', `BLACKJACK! 3:2 Payout! You won 🪙 ${win} CC!`, win);
      }
    } else {
      this.setStatus('Hit, Stand, or Double Down?');
    }
  }

  hit() {
    if (this.gameState !== 'player-turn') return;
    const hand = this.playerHands[this.activeHandIndex];
    hand.cards.push(this.drawCard());
    window.casinoAudio?.playCard();
    this.renderPlayerCards();

    // Disable double down after hitting
    this.container.querySelector('#bj-doubledown-btn').disabled = true;

    const calc = this.calculateHand(hand.cards);
    if (calc.isBust) {
      hand.status = 'bust';
      this.renderDealerCards(false);
      this.endRound('bust', `Bust with ${calc.score}! Dealer wins.`);
    } else if (calc.score === 21) {
      this.stand();
    }
  }

  doubleDown() {
    if (this.gameState !== 'player-turn') return;
    const hand = this.playerHands[this.activeHandIndex];
    if (!window.casinoEconomy.placeBet(hand.bet)) {
      this.setStatus('Not enough Clark Coins to Double Down!');
      return;
    }
    hand.bet *= 2;
    this.currentBet = hand.bet;
    this.updateUI();

    hand.cards.push(this.drawCard());
    window.casinoAudio?.playCard();
    this.renderPlayerCards();

    const calc = this.calculateHand(hand.cards);
    if (calc.isBust) {
      hand.status = 'bust';
      this.renderDealerCards(false);
      this.endRound('bust', `Bust with ${calc.score} on Double Down! Dealer wins.`);
    } else {
      this.stand();
    }
  }

  stand() {
    if (this.gameState !== 'player-turn') return;
    this.gameState = 'dealer-turn';
    this.setStatus('Dealer playing...');
    this.renderDealerCards(false);
    this.playDealerTurn();
  }

  playDealerTurn() {
    const runDealer = () => {
      const dCalc = this.calculateHand(this.dealerCards);
      if (dCalc.score < 17) {
        setTimeout(() => {
          this.dealerCards.push(this.drawCard());
          window.casinoAudio?.playCard();
          this.renderDealerCards(false);
          runDealer();
        }, 500);
      } else {
        this.evaluateFinalWinner();
      }
    };
    setTimeout(runDealer, 400);
  }

  evaluateFinalWinner() {
    const dCalc = this.calculateHand(this.dealerCards);
    const hand = this.playerHands[0];
    const pCalc = this.calculateHand(hand.cards);

    if (dCalc.isBust) {
      const win = hand.bet * 2;
      this.endRound('win', `Dealer busts with ${dCalc.score}! You win 🪙 ${win} CC!`, win);
    } else if (pCalc.score > dCalc.score) {
      const win = hand.bet * 2;
      this.endRound('win', `You beat the Dealer! (${pCalc.score} vs ${dCalc.score}) Won 🪙 ${win} CC!`, win);
    } else if (pCalc.score < dCalc.score) {
      this.endRound('lose', `Dealer wins with ${dCalc.score} against your ${pCalc.score}.`);
    } else {
      this.endRound('push', `Push on ${pCalc.score}! Bet of 🪙 ${hand.bet} CC returned.`);
    }
  }

  endRound(result, message, winAmount = 0) {
    this.gameState = 'ended';
    this.setStatus(message);

    if (result === 'win' || result === 'blackjack') {
      window.casinoEconomy.creditWin(winAmount, result === 'blackjack');
      this.spawnFeltConfetti();
    } else if (result === 'push') {
      window.casinoEconomy.creditPush(this.playerHands[0].bet);
    } else {
      window.casinoEconomy.recordLoss();
    }

    // Reset buttons after small pause
    setTimeout(() => {
      this.gameState = 'betting';
      this.container.querySelector('#bj-play-controls').classList.add('hidden');
      this.container.querySelector('#bj-betting-controls').classList.remove('hidden');
      // Ensure bet doesn't exceed current balance
      if (this.currentBet > window.casinoEconomy.getBalance()) {
        this.currentBet = Math.max(5, Math.min(50, window.casinoEconomy.getBalance()));
        this.updateUI();
      }
    }, 1800);
  }

  setStatus(msg) {
    const banner = this.container.querySelector('#bj-status-banner');
    if (banner) banner.textContent = msg;
  }

  renderPlayerCards() {
    const target = this.container.querySelector('#bj-player-cards');
    const scoreDisplay = this.container.querySelector('#bj-player-score');
    if (!target) return;

    target.innerHTML = this.playerHands[0].cards
      .map(c => this.cardHTML(c))
      .join('');

    const calc = this.calculateHand(this.playerHands[0].cards);
    scoreDisplay.textContent = calc.score > 0 ? (calc.isSoft ? `${calc.score} / Soft` : calc.score) : '--';
    if (calc.isBust) scoreDisplay.textContent = `${calc.score} (Bust)`;
  }

  renderDealerCards(hideHole = false) {
    const target = this.container.querySelector('#bj-dealer-cards');
    const scoreDisplay = this.container.querySelector('#bj-dealer-score');
    if (!target) return;

    if (hideHole && this.dealerCards.length >= 2) {
      const upCard = this.dealerCards[0];
      target.innerHTML = `
        ${this.cardHTML(upCard)}
        <div class="playing-card card-back">
          <div class="card-inner-pattern">⚜️</div>
        </div>
      `;
      scoreDisplay.textContent = `${upCard.val} + ?`;
    } else {
      target.innerHTML = this.dealerCards.map(c => this.cardHTML(c)).join('');
      const calc = this.calculateHand(this.dealerCards);
      scoreDisplay.textContent = calc.score > 0 ? calc.score : '--';
    }
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

  spawnFeltConfetti() {
    const table = this.container.querySelector('.blackjack-table');
    if (!table) return;
    for (let i = 0; i < 24; i++) {
      const spark = document.createElement('div');
      spark.className = 'gold-sparkle';
      spark.style.left = `${20 + Math.random() * 60}%`;
      spark.style.top = `${20 + Math.random() * 60}%`;
      spark.style.setProperty('--tx', `${(Math.random() - 0.5) * 120}px`);
      spark.style.setProperty('--ty', `${(Math.random() - 0.5) * 120}px`);
      table.appendChild(spark);
      setTimeout(() => spark.remove(), 1000);
    }
  }
}

window.BlackjackGame = BlackjackGame;
