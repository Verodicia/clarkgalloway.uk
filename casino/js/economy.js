/**
 * Clark's Casino - Economy & Bankroll Engine
 * Manages Clark Coins (CC), transactions, stats, and VIP tiers.
 */

class ClarkCasinoEconomy {
  constructor() {
    this.DEFAULT_BALANCE = 2500;
    this.STORAGE_KEY = 'clark_casino_bankroll_v1';
    this.STATS_KEY = 'clark_casino_stats_v1';
    this.FAUCET_KEY = 'clark_casino_faucet_claim_v1';
    this.FAUCET_REWARD = 1000;

    this.balance = this.loadBalance();
    this.stats = this.loadStats();
    this.subscribers = [];
  }

  loadBalance() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
    this.saveBalance(this.DEFAULT_BALANCE);
    return this.DEFAULT_BALANCE;
  }

  saveBalance(amt) {
    this.balance = Math.max(0, Math.floor(amt));
    localStorage.setItem(this.STORAGE_KEY, this.balance);
    this.notifySubscribers();
  }

  loadStats() {
    const saved = localStorage.getItem(this.STATS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse stats:', e);
      }
    }
    const initialStats = {
      gamesPlayed: 0,
      totalWon: 0,
      totalWagered: 0,
      biggestWin: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    this.saveStats(initialStats);
    return initialStats;
  }

  saveStats(statsObj) {
    this.stats = statsObj;
    localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.balance, this.getVipTier());
  }

  notifySubscribers() {
    const vip = this.getVipTier();
    this.subscribers.forEach(cb => {
      try {
        cb(this.balance, vip);
      } catch (err) {
        console.error(err);
      }
    });
  }

  getBalance() {
    return this.balance;
  }

  hasFunds(amount) {
    return this.balance >= amount && amount > 0;
  }

  placeBet(amount) {
    if (!this.hasFunds(amount)) return false;
    this.balance -= amount;
    this.stats.totalWagered += amount;
    this.stats.gamesPlayed++;
    this.saveBalance(this.balance);
    this.saveStats(this.stats);
    return true;
  }

  creditWin(amount, isJackpot = false) {
    if (amount <= 0) return;
    this.balance += amount;
    this.stats.totalWon += amount;
    if (amount > this.stats.biggestWin) {
      this.stats.biggestWin = amount;
    }
    this.stats.currentStreak++;
    if (this.stats.currentStreak > this.stats.bestStreak) {
      this.stats.bestStreak = this.stats.currentStreak;
    }
    this.saveBalance(this.balance);
    this.saveStats(this.stats);

    if (isJackpot) {
      window.casinoAudio?.playJackpot();
    } else {
      window.casinoAudio?.playWin();
    }
  }

  creditPush(originalBet) {
    this.balance += originalBet;
    this.saveBalance(this.balance);
  }

  recordLoss() {
    this.stats.currentStreak = 0;
    this.saveStats(this.stats);
    window.casinoAudio?.playLose();
  }

  claimFaucet() {
    this.balance += this.FAUCET_REWARD;
    this.saveBalance(this.balance);
    localStorage.setItem(this.FAUCET_KEY, Date.now());

    try {
      window.casinoAudio?.playWin();
    } catch (e) {
      console.warn('Audio play error:', e);
    }

    // Direct DOM sync guarantee
    const balEl = document.getElementById('hud-balance-amt');
    if (balEl) {
      balEl.textContent = `🪙 ${this.formatCoins(this.balance)} CC`;
      balEl.classList.remove('pulse');
      void balEl.offsetWidth; // force reflow
      balEl.classList.add('pulse');
      setTimeout(() => balEl.classList.remove('pulse'), 500);
    }

    const vip = this.getVipTier();
    const vipEl = document.getElementById('hud-vip-badge');
    if (vipEl) {
      vipEl.innerHTML = `${vip.icon} ${vip.title}`;
      vipEl.style.color = vip.color;
      vipEl.style.borderColor = vip.color;
    }

    const lowWarning = document.getElementById('low-balance-alert');
    if (lowWarning && this.balance >= 25) {
      lowWarning.classList.remove('visible');
    }

    if (window.clarkCasino) {
      window.clarkCasino.showToast?.(`🪙 1,000 Free Clark Coins added! Bankroll: 🪙 ${this.formatCoins(this.balance)} CC`);
      window.clarkCasino.spawnCoinBursts?.();
      if (window.clarkCasino.currentGameInstance?.onBalanceUpdated) {
        window.clarkCasino.currentGameInstance.onBalanceUpdated(this.balance);
      }
    }

    return this.balance;
  }

  resetBankroll(amount = this.DEFAULT_BALANCE) {
    this.saveBalance(amount);
  }

  getVipTier() {
    const b = this.balance;
    if (b >= 100000) return { title: 'Monte Carlo Legend', icon: '👑', color: '#ffd700', min: 100000 };
    if (b >= 25000) return { title: 'Diamond VIP', icon: '💎', color: '#b9f2ff', min: 25000 };
    if (b >= 10000) return { title: 'Emerald High Roller', icon: '🌟', color: '#50c878', min: 10000 };
    if (b >= 5000) return { title: 'Gold Card Shark', icon: '⚜️', color: '#f3c649', min: 5000 };
    if (b >= 2500) return { title: 'Silver Stacker', icon: '🥈', color: '#e0e0e0', min: 2500 };
    return { title: 'Curious Tourist', icon: '🎲', color: '#a0aab2', min: 0 };
  }

  getStats() {
    return {
      ...this.stats,
      balance: this.balance,
      vip: this.getVipTier()
    };
  }

  formatCoins(amt) {
    return Number(amt).toLocaleString('en-US');
  }
}

window.casinoEconomy = new ClarkCasinoEconomy();
