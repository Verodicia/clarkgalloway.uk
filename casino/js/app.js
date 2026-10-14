/**
 * Clark's Casino - Main Application Hub
 * Manages game tabs, lobby cards, HUD, modals, and global events.
 */

class ClarkCasinoApp {
  constructor() {
    this.activeGameId = null;
    this.currentGameInstance = null;

    this.games = {
      blackjack: {
        id: 'blackjack',
        title: 'Blackjack (21)',
        badge: 'Classic 3:2 Payout',
        tag: 'Table Card Game',
        icon: '♠️',
        desc: 'Take on the dealer in Las Vegas style 21. Hit, stand, double down, or split pairs.',
        classRef: window.BlackjackGame
      },
      roulette: {
        id: 'roulette',
        title: 'European Roulette',
        badge: '37 Pockets · 35:1 Straight',
        tag: 'Roulette Wheel',
        icon: '🎡',
        desc: 'Place inside and outside bets on the green felt, then watch the ivory ball drop.',
        classRef: window.RouletteGame
      },
      slots: {
        id: 'slots',
        title: 'Vegas Neon 777 Slots',
        badge: '500x Mega Jackpot',
        tag: 'Mechanical 3-Reel',
        icon: '🎰',
        desc: 'Classic mechanical 3-reel slot machine with 5 paylines, wild Clark Coins, and bells.',
        classRef: window.SlotsGame
      },
      videopoker: {
        id: 'videopoker',
        title: 'Video Poker',
        badge: 'Jacks or Better 9/6',
        tag: '5-Card Draw',
        icon: '🃏',
        desc: 'Hold cards, draw replacements, and aim for the 4,000 CC Royal Flush jackpot.',
        classRef: window.VideoPokerGame
      },
      craps: {
        id: 'craps',
        title: 'Vegas Craps',
        badge: 'Dice Action & Points',
        tag: 'Casino Dice Table',
        icon: '🎲',
        desc: 'Roll the red dice on the green baize. Pass line, Field, and Point puck rules.',
        classRef: window.CrapsGame
      },
      baccarat: {
        id: 'baccarat',
        title: 'Baccarat (Punto Banco)',
        badge: 'Macau & Monaco VIP',
        tag: 'High Roller Table',
        icon: '⚜️',
        desc: 'Bet on Player, Banker, or Tie with authentic international drawing tableau rules.',
        classRef: window.BaccaratGame
      },
      wheel: {
        id: 'wheel',
        title: 'Wheel of Fortune',
        badge: 'Up to 100x Multipliers',
        tag: 'Carnival Prize Wheel',
        icon: '🌟',
        desc: 'A massive 24-wedge multiplier wheel with bouncing flapper and thrilling high payouts.',
        classRef: window.WheelGame
      }
    };
  }

  init() {
    this.renderLobby();
    this.bindHUD();
    this.bindModals();
    this.createAmbientGlow();

    // Subscribe to bankroll updates
    window.casinoEconomy.subscribe((balance, vip) => {
      this.updateHUD(balance, vip);
    });

    // Check URL params (e.g. ?game=blackjack)
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam && this.games[gameParam]) {
      this.launchGame(gameParam);
    }
  }

  renderLobby() {
    const grid = document.getElementById('casino-games-grid');
    if (!grid) return;

    grid.innerHTML = Object.values(this.games).map(game => `
      <article class="casino-card" data-game-id="${game.id}">
        <div class="card-glow-edge"></div>
        <div class="card-badge-pill">${game.badge}</div>
        <div class="card-icon-banner">${game.icon}</div>
        <div class="card-meta">
          <span class="card-tag">${game.tag}</span>
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.desc}</p>
        </div>
        <div class="card-footer">
          <button class="casino-btn btn-gold btn-play-card" data-launch="${game.id}">
            <span>PLAY TABLE ➔</span>
          </button>
        </div>
      </article>
    `).join('');

    // Click events
    grid.querySelectorAll('.casino-card, .btn-play-card').forEach(el => {
      el.addEventListener('click', (e) => {
        const gameId = el.dataset.gameId || el.dataset.launch || el.closest('.casino-card')?.dataset.gameId;
        if (gameId) {
          window.casinoAudio?.playClick();
          this.launchGame(gameId);
        }
      });
    });
  }

  launchGame(gameId) {
    const gameConfig = this.games[gameId];
    if (!gameConfig) return;

    // Unmount previous
    if (this.currentGameInstance && typeof this.currentGameInstance.unmount === 'function') {
      this.currentGameInstance.unmount();
    }

    this.activeGameId = gameId;

    // Switch view from lobby to game stage
    const lobbyView = document.getElementById('casino-lobby-view');
    const stageView = document.getElementById('casino-stage-view');
    const stageTitle = document.getElementById('stage-game-title');
    const stageIcon = document.getElementById('stage-game-icon');
    const stageMount = document.getElementById('game-mount-point');

    if (lobbyView) lobbyView.classList.add('hidden');
    if (stageView) stageView.classList.remove('hidden');

    if (stageTitle) stageTitle.textContent = gameConfig.title;
    if (stageIcon) stageIcon.textContent = gameConfig.icon;

    // Instantiate and mount game
    const GameClass = gameConfig.classRef;
    if (GameClass) {
      this.currentGameInstance = new GameClass();
      this.currentGameInstance.mount(stageMount);
    }

    // Scroll smoothly to stage
    stageView?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  closeActiveGame() {
    if (this.currentGameInstance && typeof this.currentGameInstance.unmount === 'function') {
      this.currentGameInstance.unmount();
      this.currentGameInstance = null;
    }
    this.activeGameId = null;

    const lobbyView = document.getElementById('casino-lobby-view');
    const stageView = document.getElementById('casino-stage-view');

    if (stageView) stageView.classList.add('hidden');
    if (lobbyView) {
      lobbyView.classList.remove('hidden');
      lobbyView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.casinoAudio?.playClick();
  }

  bindHUD() {
    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      const updateSoundIcon = () => {
        const isMuted = window.casinoAudio.isMuted();
        soundBtn.innerHTML = isMuted ? '🔇 <small>Muted</small>' : '🔊 <small>Sound ON</small>';
        soundBtn.classList.toggle('is-muted', isMuted);
      };
      updateSoundIcon();
      soundBtn.addEventListener('click', () => {
        window.casinoAudio.ensureContext();
        const isMuted = window.casinoAudio.toggleMute();
        updateSoundIcon();
        if (!isMuted) {
          window.casinoAudio.playChip();
        }
      });
    }

    // Return to Lobby button on stage
    document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
      this.closeActiveGame();
    });

    // Marquee Title logo -> Return to Floor Lobby
    document.getElementById('btn-marquee-lobby')?.addEventListener('click', () => {
      this.closeActiveGame();
    });

    // Claim Free Stash button
    const claimBtn = document.getElementById('btn-claim-stash');
    claimBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.claimFaucetDirect();
    });
  }

  claimFaucetDirect() {
    window.casinoEconomy.claimFaucet();
  }

  updateHUD(balance, vip) {
    const balEl = document.getElementById('hud-balance-amt');
    const vipEl = document.getElementById('hud-vip-badge');
    const vaultBalEl = document.getElementById('vault-current-balance');

    if (balEl) {
      balEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(balance)} CC`;
      balEl.classList.add('pulse');
      setTimeout(() => balEl.classList.remove('pulse'), 400);
    }
    if (vaultBalEl) {
      vaultBalEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(balance)} CC`;
    }
    if (vipEl) {
      vipEl.innerHTML = `${vip.icon} ${vip.title}`;
      vipEl.style.color = vip.color;
      vipEl.style.borderColor = vip.color;
    }

    // Low balance notification banner
    const lowWarning = document.getElementById('low-balance-alert');
    if (lowWarning) {
      lowWarning.classList.toggle('visible', balance < 25);
    }
  }

  bindModals() {
    // Add Credits / VIP Vault Modal
    const addCreditsBtn = document.getElementById('btn-open-add-credits');
    const balancePillBtn = document.getElementById('hud-balance-pill');
    const addCreditsModal = document.getElementById('modal-add-credits');
    const addCreditsClose = document.getElementById('btn-close-add-credits');

    const openVaultModal = () => {
      const bal = window.casinoEconomy.getBalance();
      const vaultBalEl = document.getElementById('vault-current-balance');
      if (vaultBalEl) vaultBalEl.textContent = `🪙 ${window.casinoEconomy.formatCoins(bal)} CC`;
      addCreditsModal?.classList.add('open');
      window.casinoAudio?.playClick();
    };

    addCreditsBtn?.addEventListener('click', openVaultModal);
    balancePillBtn?.addEventListener('click', openVaultModal);
    addCreditsClose?.addEventListener('click', () => {
      addCreditsModal?.classList.remove('open');
    });

    // Credit Packages in Vault Modal
    addCreditsModal?.querySelectorAll('.credit-pkg-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.dataset.amount, 10);
        if (!isNaN(amt) && amt > 0) {
          window.casinoEconomy.addCredits(amt);
        }
      });
    });

    // Custom Amount in Vault Modal
    const customInput = document.getElementById('input-custom-credits');
    const submitCustomBtn = document.getElementById('btn-submit-custom-credits');
    const handleCustomAdd = () => {
      if (!customInput) return;
      const amt = parseInt(customInput.value, 10);
      if (isNaN(amt) || amt <= 0) {
        this.showToast('Please enter a valid number of Clark Coins.');
        return;
      }
      window.casinoEconomy.addCredits(amt);
      customInput.value = '';
    };

    submitCustomBtn?.addEventListener('click', handleCustomAdd);
    customInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCustomAdd();
    });

    // Reset Bankroll from Vault Modal
    document.getElementById('btn-reset-bankroll-vault')?.addEventListener('click', () => {
      if (confirm('Reset your bankroll back to the initial 🪙 2,500 Clark Coins?')) {
        window.casinoEconomy.resetBankroll(2500);
        window.casinoAudio?.playWin();
        this.showToast('Bankroll reset to 🪙 2,500 Clark Coins!');
      }
    });

    // Rules Modal
    const rulesBtn = document.getElementById('btn-open-rules');
    const rulesModal = document.getElementById('modal-rules');
    const rulesClose = document.getElementById('btn-close-rules');

    rulesBtn?.addEventListener('click', () => {
      rulesModal?.classList.add('open');
      window.casinoAudio?.playClick();
    });
    rulesClose?.addEventListener('click', () => {
      rulesModal?.classList.remove('open');
    });

    // Stats Modal
    const statsBtn = document.getElementById('btn-open-stats');
    const statsModal = document.getElementById('modal-stats');
    const statsClose = document.getElementById('btn-close-stats');

    statsBtn?.addEventListener('click', () => {
      this.populateStats();
      statsModal?.classList.add('open');
      window.casinoAudio?.playClick();
    });
    statsClose?.addEventListener('click', () => {
      statsModal?.classList.remove('open');
    });

    // Reset Bankroll confirmation in stats modal
    document.getElementById('btn-reset-stats')?.addEventListener('click', () => {
      if (confirm('Reset your bankroll back to the initial 🪙 2,500 Clark Coins?')) {
        window.casinoEconomy.resetBankroll(2500);
        this.populateStats();
        this.showToast('Bankroll reset to 🪙 2,500 Clark Coins!');
      }
    });

    // Backdrop clicks
    document.querySelectorAll('.casino-modal-backdrop').forEach(bd => {
      bd.addEventListener('click', () => {
        document.querySelectorAll('.casino-modal').forEach(m => m.classList.remove('open'));
      });
    });
  }

  populateStats() {
    const data = window.casinoEconomy.getStats();
    document.getElementById('stat-games-played').textContent = data.gamesPlayed;
    document.getElementById('stat-total-wagered').textContent = `🪙 ${window.casinoEconomy.formatCoins(data.totalWagered)}`;
    document.getElementById('stat-total-won').textContent = `🪙 ${window.casinoEconomy.formatCoins(data.totalWon)}`;
    document.getElementById('stat-biggest-win').textContent = `🪙 ${window.casinoEconomy.formatCoins(data.biggestWin)}`;
    document.getElementById('stat-current-streak').textContent = `${data.currentStreak} wins`;
    document.getElementById('stat-best-streak').textContent = `${data.bestStreak} wins`;
    document.getElementById('stat-vip-tier').textContent = `${data.vip.icon} ${data.vip.title}`;
  }

  showToast(msg) {
    const toast = document.getElementById('casino-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  spawnCoinBursts() {
    for (let i = 0; i < 20; i++) {
      const coin = document.createElement('div');
      coin.className = 'burst-coin';
      coin.textContent = '🪙';
      coin.style.left = `${45 + (Math.random() - 0.5) * 30}%`;
      coin.style.top = `${20 + (Math.random() - 0.5) * 20}%`;
      coin.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      coin.style.setProperty('--ty', `${-80 - Math.random() * 120}px`);
      document.body.appendChild(coin);
      setTimeout(() => coin.remove(), 1200);
    }
  }

  createAmbientGlow() {
    // Subtle animated gold particles on page
    const container = document.getElementById('ambient-particles');
    if (!container) return;
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span');
      p.className = 'ambient-dust';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      p.style.animationDuration = `${6 + Math.random() * 8}s`;
      container.appendChild(p);
    }
  }
}

// Boot application when DOM is ready
function bootCasino() {
  if (!window.clarkCasino) {
    window.clarkCasino = new ClarkCasinoApp();
    window.clarkCasino.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCasino);
} else {
  bootCasino();
}
