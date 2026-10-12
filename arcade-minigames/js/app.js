/**
 * Main Application Orchestrator for Pocket Arcade.
 * Renders games catalog, updates live local high scores, and manages cabinet modal.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Game Definitions
  const GAMES = [
    {
      id: 'stacker',
      title: 'Tower Stacker',
      category: 'timing',
      difficulty: 'Easy',
      icon: '🏗️',
      bgGradient: 'linear-gradient(135deg, #09203f 0%, #537895 100%)',
      desc: 'Drop sliding slabs to build the tallest tower. Overhanging blocks are sliced off!',
      controls: 'Tap / Space to drop',
      quickHint: 'TAP SCREEN OR SPACE TO DROP SLAB 🏗️',
      status: 'playable'
    },
    {
      id: 'raindodger',
      title: 'Meteor Shower',
      category: 'reflex',
      difficulty: 'Easy',
      icon: '☄️',
      bgGradient: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
      desc: 'Evade flaming meteors plummeting from the sky while collecting high-risk golden power stars.',
      controls: 'Drag / Left & Right arrows',
      quickHint: 'DRAG FINGER OR ARROWS TO EVADE METEORS ☄️',
      status: 'playable'
    },
    {
      id: 'orbitpong',
      title: 'Orbit Pong',
      category: 'reflex',
      difficulty: 'Medium',
      icon: '⭕',
      bgGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      desc: 'Rotate your shield around a 360° circular perimeter to keep the ball trapped inside.',
      controls: 'Drag / Left & Right arrows',
      quickHint: 'DRAG SHIELD AROUND CIRCLE OR USE ARROWS ⭕',
      status: 'playable'
    },
    {
      id: 'timberchop',
      title: 'Timber Chop',
      category: 'timing',
      difficulty: 'Hard',
      icon: '🪓',
      bgGradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      desc: 'Chop down the endless pine trunk at lightning speed while dodging descending branches.',
      controls: 'Left/Right to Chop • Down/Center/Space to Duck 🛡️',
      quickHint: 'TAP SIDES TO CHOP • CENTER / DOWN TO DUCK 🛡️',
      status: 'playable'
    },
    {
      id: 'targetpop',
      title: 'Target Pop',
      category: 'reflex',
      difficulty: 'Easy',
      icon: '🎯',
      bgGradient: 'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)',
      desc: 'Rapidly tap shrinking targets before they vanish. Smaller targets reward higher combos.',
      controls: 'Tap / Click targets',
      quickHint: 'POP TARGETS QUICKLY • AVOID RED SKULLS 💀',
      status: 'playable'
    },
    {
      id: 'strooprush',
      title: 'Stroop Rush',
      category: 'brain',
      difficulty: 'Medium',
      icon: '🧠',
      bgGradient: 'linear-gradient(135deg, #1e130c 0%, #9a8478 100%)',
      desc: 'Color vs word brain overload! Determine if the font color matches the word in 1.5 seconds.',
      controls: 'Left = Mismatch ✖ • Right = Match ✔',
      quickHint: 'LEFT = MISMATCH ✖ • RIGHT = MATCH ✔',
      status: 'playable'
    },
    {
      id: 'snake',
      title: 'Endless Snake',
      category: 'retro',
      difficulty: 'Medium',
      icon: '🐍',
      bgGradient: 'linear-gradient(135deg, #051923 0%, #003554 100%)',
      desc: 'Classic neon arcade snake! Eat glowing apples, snatch golden stars, and buffer tight turns.',
      controls: 'Thumb Joystick / Arrows / Swipe',
      quickHint: 'USE THUMB JOYSTICK OR ARROWS TO SLITHER 🐍',
      status: 'playable'
    },
    {
      id: 'cavethruster',
      title: 'Cave Thruster',
      category: 'reflex',
      difficulty: 'Hard',
      icon: '🚀',
      bgGradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
      desc: 'Navigate a rocket through a treacherous jagged cavern using gravity thrust and collect fuel stars.',
      controls: 'Hold Tap / Space to Thrust',
      quickHint: 'HOLD TOUCH OR SPACE TO THRUST ROCKET 🚀',
      status: 'playable'
    },
    {
      id: 'knifethrow',
      title: 'Knife Throw',
      category: 'timing',
      difficulty: 'Medium',
      icon: '🗡️',
      bgGradient: 'linear-gradient(135deg, #1f041b 0%, #3a1c71 50%, #d76d77 100%)',
      desc: 'Embed glowing blades into the rotating cyber core. Avoid previously stuck knives and slice bonus diamonds!',
      controls: 'Tap / Space to Throw',
      quickHint: 'TAP SCREEN OR SPACE TO THROW BLADES 🗡️',
      status: 'playable'
    },
    {
      id: 'rhythmmemory',
      title: 'Rhythm Memory',
      category: 'brain',
      difficulty: 'Medium',
      icon: '🎵',
      bgGradient: 'linear-gradient(135deg, #0b486b 0%, #f56217 100%)',
      desc: 'Repeat the 4-quadrant musical cyber melody as tempo accelerates and patterns expand!',
      controls: 'Tap / 1-4 / WASD / Arrows',
      quickHint: 'LISTEN & REPEAT THE NEON QUADRANT MELODY 🎵',
      status: 'playable'
    },
    {
      id: 'bricksmasher',
      title: 'Brick Smasher: Descent',
      category: 'retro',
      difficulty: 'Medium',
      icon: '🧱',
      bgGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      desc: 'Space Invaders meets Breakout! Smash descending neon bricks, collect power-ups, and defend the danger threshold.',
      controls: 'Drag / Arrows to Move • Tap / Space to Launch & Fire 🚀',
      quickHint: 'DRAG PADDLE • TAP / SPACE TO LAUNCH & FIRE 🧱',
      status: 'playable'
    },
    {
      id: 'asteroids',
      title: 'Mini Asteroids',
      category: 'retro',
      difficulty: 'Medium',
      icon: '🚀',
      bgGradient: 'linear-gradient(135deg, #090a0f 0%, #171822 50%, #2a2b3d 100%)',
      desc: 'Classic vector space combat! Thrust and rotate your delta ship, shatter splitting asteroids, and dodge alien UFOs.',
      controls: 'Arrows / WASD / Touch Buttons • Space / Tap to Fire ⚡',
      quickHint: 'THUMB JOYSTICK TO STEER • ⚡ TO FIRE',
      status: 'playable'
    },
    {
      id: 'neonmazechaser',
      title: 'Neon Maze Chaser',
      category: 'retro',
      difficulty: 'Medium',
      icon: '🛰️',
      bgGradient: 'linear-gradient(135deg, #03001e 0%, #7303c0 50%, #ec38bc 100%)',
      desc: 'Pilot Cyber Probe Delta-7 through a high-voltage cyber labyrinth! Harvest data bits, trigger EMP overloads, and extract hunter drone AI cores.',
      controls: 'Swipe / Arrows / WASD / Touch D-Pad',
      quickHint: 'SWIPE OR USE D-PAD TO STEER PROBE • ⚡ EMP OVERLOAD',
      status: 'playable'
    },
    {
      id: 'cyber2048',
      title: 'Cyber 2048',
      category: 'brain',
      difficulty: 'Medium',
      icon: '🔢',
      bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      desc: 'Cyberpunk slide-and-merge arithmetic puzzle! Merge matching glowing energy cells on a 4x4 matrix and reach 2048.',
      controls: 'Swipe / Arrows / WASD / Touch D-Pad',
      quickHint: 'SWIPE OR USE D-PAD TO MERGE MATCHING CELLS 🔢',
      status: 'playable'
    },
    {
      id: 'spacegalaxian',
      title: 'Space Galaxian',
      category: 'retro',
      difficulty: 'Hard',
      icon: '🛸',
      bgGradient: 'linear-gradient(135deg, #050515 0%, #150935 50%, #40053a 100%)',
      desc: 'Classic dive-bombing squadron warfare! Blast swaying alien formations, dodge kamikaze dives behind energy shields, and snatch power-ups.',
      controls: 'Drag / Arrows to Steer • Tap / Space to Fire ⚡',
      quickHint: 'DRAG SHIP OR ARROWS • TAP / SPACE TO FIRE 🛸',
      status: 'playable'
    },
    {
      id: 'cyberhopper',
      title: 'Cyber Hopper',
      category: 'reflex',
      difficulty: 'Medium',
      icon: '🦘',
      bgGradient: 'linear-gradient(135deg, #051923 0%, #006466 50%, #065a60 100%)',
      desc: 'Infinite vertical ascension! Bounce across neon platforms, hit spring pads, trigger supersonic jetpacks, and climb into orbit.',
      controls: 'Tilt / Drag / Left & Right arrows',
      quickHint: 'DRAG OR ARROWS TO BOUNCE HIGHER ⚡',
      status: 'playable'
    },
    {
      id: 'hexpulse',
      title: 'Hex Pulse',
      category: 'timing',
      difficulty: 'Hard',
      icon: '⬡',
      bgGradient: 'linear-gradient(135deg, #1f041b 0%, #4a0072 50%, #7b1fa2 100%)',
      desc: '360° rotational geometric survival! Orbit a pulsing cyber-core and evade contracting polygonal hazard walls synced to the beat.',
      controls: 'Hold Left / Right • Tap screen sides',
      quickHint: 'HOLD LEFT / RIGHT TO EVADE WALLS ⬡',
      status: 'playable'
    },
    {
      id: 'cybercrosser',
      title: 'Cyber Crosser',
      category: 'retro',
      difficulty: 'Medium',
      icon: '🐸',
      bgGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      desc: 'Retro traffic and stream hopper! Dodge speeding neon hover-cruisers, ride floating data logs, and dock 5 terminal bays.',
      controls: 'Swipe / Arrows / WASD / Touch D-Pad',
      quickHint: 'SWIPE OR USE D-PAD TO HOP TO DOCK 🐸',
      status: 'playable'
    },
    {
      id: 'neonracer',
      title: 'Neon Racer',
      category: 'reflex',
      difficulty: 'Medium',
      icon: '🏎️',
      bgGradient: 'linear-gradient(135deg, #1f0528 0%, #4a0058 50%, #880066 100%)',
      desc: 'OutRun-style pseudo-3D synthwave highway racer! Weave through traffic, blast nitro boost pads, and chain close near-miss passes.',
      controls: 'Left/Right to Steer • Up/Space/Nitro Pedal • Down/Brake',
      quickHint: 'STEER THROUGH TRAFFIC • HIT NITRO PADS FOR SUPERSONIC SPEED 🏎️',
      status: 'playable'
    },
    {
      id: 'cyberfall',
      title: 'Cyber Fall',
      category: 'reflex',
      difficulty: 'Medium',
      icon: '⚡',
      bgGradient: 'linear-gradient(135deg, #100018 0%, #350040 50%, #680066 100%)',
      desc: 'Downwell-style vertical descent survival! Slip through descending platform gaps to outrun the lethal electrified ceiling laser.',
      controls: 'Left/Right arrows / A/D / Tap screen sides',
      quickHint: 'FALL THROUGH GAPS QUICKLY • EVADE TOP LASER CEILING ⚡',
      status: 'playable'
    },
    {
      id: 'circuitconnect',
      title: 'Circuit Connect',
      category: 'brain',
      difficulty: 'Medium',
      icon: '🔌',
      bgGradient: 'linear-gradient(135deg, #06131c 0%, #0d2a3e 50%, #154564 100%)',
      desc: 'Cybernetic logic conduit rotation puzzle! Rotate PCB chip traces to route electrical power from the Reactor Core to the Mainframe CPU.',
      controls: 'Tap / Click conduits to rotate 90°',
      quickHint: 'TAP CONDUITS TO ROTATE & CONNECT POWER TO CPU 🔌',
      status: 'playable'
    },
    {
      id: 'gravitylander',
      title: 'Gravity Lander',
      category: 'timing',
      difficulty: 'Hard',
      icon: '🚀',
      bgGradient: 'linear-gradient(135deg, #05030f 0%, #120e28 50%, #201548 100%)',
      desc: 'Precision vector lunar lander physics! Manage propellant, regulate descent velocity with thruster burns, and touch down safely on jagged canyon pads.',
      controls: 'Up/Space/Thrust • Left/Right RCS to Rotate',
      quickHint: 'REGULATE BURN • TOUCH DOWN AT SAFE SPEED (V-SPEED < 1.6) 🚀',
      status: 'playable'
    }
  ];

  // DOM Elements
  const gamesGrid = document.getElementById('games-grid');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const totalCumScoreEl = document.getElementById('total-cum-score');
  const totalGamesCountEl = document.getElementById('total-games-count');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const crtToggleBtn = document.getElementById('crt-toggle-btn');
  const crtOverlay = document.getElementById('crt-overlay');
  const clearScoresBtn = document.getElementById('clear-scores-btn');

  // Modal Elements
  const gameModal = document.getElementById('game-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const activeGameTitle = document.getElementById('active-game-title');
  const liveScoreEl = document.getElementById('live-score');
  const liveHiscoreEl = document.getElementById('live-hiscore');
  const gameCanvas = document.getElementById('game-canvas');
  const gameOverlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayFinalScore = document.getElementById('overlay-final-score');
  const overlayBestScore = document.getElementById('overlay-best-score');
  const newRecordBadge = document.getElementById('new-record-badge');
  const replayBtn = document.getElementById('replay-btn');
  const quitToHubBtn = document.getElementById('quit-to-hub-btn');

  // Countdown Overlay Elements
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownReadyView = document.getElementById('countdown-ready-view');
  const countdownIcon = document.getElementById('countdown-icon');
  const countdownTitle = document.getElementById('countdown-title');
  const countdownInstructions = document.getElementById('countdown-instructions');
  const countdownNumberView = document.getElementById('countdown-number-view');
  const countdownNumber = document.getElementById('countdown-number');
  const countdownSubtext = document.getElementById('countdown-subtext');

  // Active Game State
  let activeGameInstance = null;
  let activeGameId = null;
  let currentCategory = 'all';
  let savedScrollY = 0;

  // Countdown State
  let countdownTimer = null;
  let countdownState = 'idle'; // 'idle' | 'ready' | '3' | '2' | '1' | 'go'
  let countdownCallback = null;

  // 1. Initial State Setup
  const updateStatsTicker = () => {
    const allIds = GAMES.map(g => g.id);
    totalCumScoreEl.textContent = ArcadeStorage.getCumulativeScore(allIds).toLocaleString();
    totalGamesCountEl.textContent = GAMES.length;
  };

  const updateAudioButton = () => {
    const muted = ArcadeAudio.getMuted();
    audioToggleBtn.innerHTML = muted 
      ? '<span class="btn-icon">🔇</span>' 
      : '<span class="btn-icon">🔊</span>';
  };

  // 2. Render Cards
  const renderCards = () => {
    gamesGrid.innerHTML = '';

    const filtered = currentCategory === 'all' 
      ? GAMES 
      : GAMES.filter(g => g.category === currentCategory);

    filtered.forEach(game => {
      const hiscore = ArcadeStorage.getHighScore(game.id);
      const isPlayable = game.status === 'playable';

      const card = document.createElement('article');
      card.className = `game-card ${isPlayable ? 'playable' : ''}`;
      card.id = `card-${game.id}`;

      card.innerHTML = `
        <div class="card-media">
          <div class="card-media-bg" style="background: ${game.bgGradient}"></div>
          <span class="card-icon">${game.icon}</span>
          <span class="status-tag ${isPlayable ? 'ready' : 'soon'}">
            ${isPlayable ? 'PLAYABLE' : 'NEXT UP'}
          </span>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="badge badge-genre">${game.category.toUpperCase()}</span>
            <span class="badge badge-diff">${game.difficulty}</span>
          </div>
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.desc}</p>
          <div class="card-score-row">
            <span class="card-score-label">HI-SCORE</span>
            <span class="card-score-value" id="card-score-${game.id}">${hiscore > 0 ? hiscore.toLocaleString() : '---'}</span>
          </div>
          <button class="arcade-btn play-btn ${isPlayable ? 'active-play' : 'disabled-btn'}" data-game-id="${game.id}">
            ${isPlayable ? '▶ PLAY NOW' : 'COMING SOON'}
          </button>
        </div>
      `;

      gamesGrid.appendChild(card);
    });

    // Attach card play listeners
    document.querySelectorAll('.active-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-game-id');
        openGameModal(id);
      });
    });
  };

  // Game Factory Map
  const GAME_CONSTRUCTORS = {
    stacker: StackerGame,
    raindodger: RainDodgerGame,
    orbitpong: OrbitPongGame,
    timberchop: TimberChopGame,
    targetpop: TargetPopGame,
    strooprush: StroopRushGame,
    snake: SnakeGame,
    cavethruster: CaveThrusterGame,
    knifethrow: KnifeThrowGame,
    rhythmmemory: RhythmMemoryGame,
    bricksmasher: BrickSmasherGame,
    asteroids: MiniAsteroidsGame,
    neonmazechaser: NeonMazeChaserGame,
    cyber2048: Cyber2048Game,
    spacegalaxian: SpaceGalaxianGame,
    cyberhopper: CyberHopperGame,
    hexpulse: HexPulseGame,
    cybercrosser: CyberCrosserGame,
    neonracer: NeonRacerGame,
    cyberfall: CyberFallGame,
    circuitconnect: CircuitConnectGame,
    gravitylander: GravityLanderGame
  };

  const createGameInstance = (gameId) => {
    const Cls = GAME_CONSTRUCTORS[gameId];
    if (!Cls) return null;
    return new Cls(
      gameCanvas,
      (score) => {
        liveScoreEl.textContent = score.toString();
      },
      (finalScore) => {
        handleGameOver(gameId, finalScore);
      }
    );
  };

  // Universal Countdown State Machine
  const cancelUniversalCountdown = () => {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    countdownState = 'idle';
    countdownCallback = null;
    if (countdownOverlay) {
      countdownOverlay.style.display = 'none';
    }
  };

  const setCountdownNumber = (numText, numClass, subtext) => {
    countdownReadyView.style.display = 'none';
    countdownNumberView.style.display = 'flex';
    countdownNumber.className = `countdown-number num-${numClass}`;
    countdownNumber.textContent = numText;
    countdownSubtext.textContent = subtext;

    // Retrigger pop animation
    countdownNumber.style.animation = 'none';
    void countdownNumber.offsetWidth;
    countdownNumber.style.animation = '';
  };

  const advanceCountdown = () => {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }

    if (countdownState === 'ready') {
      countdownState = '3';
      setCountdownNumber('3', '3', 'READY!');
      ArcadeAudio.sfx.countdownTick(3);
      countdownTimer = setTimeout(advanceCountdown, 650);
    } else if (countdownState === '3') {
      countdownState = '2';
      setCountdownNumber('2', '2', 'SET!');
      ArcadeAudio.sfx.countdownTick(2);
      countdownTimer = setTimeout(advanceCountdown, 650);
    } else if (countdownState === '2') {
      countdownState = '1';
      setCountdownNumber('1', '1', 'FOCUS!');
      ArcadeAudio.sfx.countdownTick(1);
      countdownTimer = setTimeout(advanceCountdown, 650);
    } else if (countdownState === '1') {
      countdownState = 'go';
      setCountdownNumber('GO!', 'go', "LET'S GO!");
      ArcadeAudio.sfx.countdownGo();
      countdownTimer = setTimeout(finishCountdownAndLaunch, 450);
    } else if (countdownState === 'go') {
      finishCountdownAndLaunch();
    }
  };

  const finishCountdownAndLaunch = () => {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    const cb = countdownCallback;
    countdownState = 'idle';
    countdownCallback = null;
    if (countdownOverlay) {
      countdownOverlay.style.display = 'none';
    }
    if (typeof cb === 'function') {
      cb();
    }
  };

  const fastForwardCountdown = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (countdownState === 'idle') return;
    advanceCountdown();
  };

  const startUniversalCountdown = (gameId, onLaunchCallback) => {
    cancelUniversalCountdown();

    const gameData = GAMES.find(g => g.id === gameId);
    if (!gameData) {
      if (onLaunchCallback) onLaunchCallback();
      return;
    }

    countdownCallback = onLaunchCallback;
    countdownState = 'ready';

    // Populate Ready view
    countdownIcon.textContent = gameData.icon || '🕹️';
    countdownTitle.textContent = (gameData.title || '').toUpperCase();
    countdownInstructions.innerHTML = `
      <span style="display: block; font-weight: 700; font-size: 0.78rem; color: var(--accent-gold); line-height: 1.4; margin-bottom: 5px;">${gameData.quickHint || gameData.controls}</span>
      <span style="display: block; font-size: 0.58rem; color: rgba(255, 255, 255, 0.72); letter-spacing: 0.5px;">Controls: ${gameData.controls}</span>
    `;

    // Show ready card, hide number view
    countdownReadyView.style.display = 'flex';
    countdownNumberView.style.display = 'none';
    countdownOverlay.style.display = 'flex';

    // Display instructions for ~1s, then initiate 3-2-1
    countdownTimer = setTimeout(advanceCountdown, 1050);
  };

  // 3. Game Modal & Launch Handling
  const openGameModal = (gameId) => {
    const gameData = GAMES.find(g => g.id === gameId);
    if (!gameData || gameData.status !== 'playable') return;

    ArcadeAudio.sfx.click();
    activeGameId = gameId;
    activeGameTitle.textContent = gameData.title.toUpperCase();

    const currentHigh = ArcadeStorage.getHighScore(gameId);
    liveScoreEl.textContent = '0';
    liveHiscoreEl.textContent = currentHigh.toLocaleString();

    gameOverlay.style.display = 'none';
    newRecordBadge.style.display = 'none';

    // Lock body to prevent iPhone pull-down and scroll bleed
    savedScrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${savedScrollY}px`;

    gameModal.classList.add('open');
    gameModal.setAttribute('aria-hidden', 'false');

    // Create and size game instance before starting
    if (activeGameInstance) {
      activeGameInstance.stop();
      activeGameInstance = null;
    }
    activeGameInstance = createGameInstance(gameId);
    if (activeGameInstance && activeGameInstance.resize) {
      activeGameInstance.resize();
    }

    // Launch with Universal Countdown
    startUniversalCountdown(gameId, () => {
      if (activeGameInstance) {
        activeGameInstance.start();
      }
    });
  };

  const handleGameOver = (gameId, finalScore) => {
    const result = ArcadeStorage.saveScore(gameId, finalScore);
    overlayFinalScore.textContent = finalScore.toLocaleString();
    overlayBestScore.textContent = result.current.toLocaleString();

    if (result.isNewRecord && finalScore > 0) {
      newRecordBadge.style.display = 'inline-block';
      overlayTitle.textContent = '★ NEW RECORD! ★';
      ArcadeAudio.sfx.newRecord();
    } else {
      newRecordBadge.style.display = 'none';
      overlayTitle.textContent = 'GAME OVER';
      ArcadeAudio.sfx.gameover();
    }

    gameOverlay.style.display = 'flex';
  };

  const closeGameModal = () => {
    ArcadeAudio.sfx.click();
    cancelUniversalCountdown();

    if (activeGameInstance) {
      activeGameInstance.stop();
      activeGameInstance = null;
    }
    gameModal.classList.remove('open');
    gameModal.setAttribute('aria-hidden', 'true');
    gameOverlay.style.display = 'none';
    activeGameId = null;

    // Restore body scroll position
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);

    // Refresh display
    updateStatsTicker();
    renderCards();
  };

  // Replay
  replayBtn.addEventListener('click', () => {
    ArcadeAudio.sfx.click();
    gameOverlay.style.display = 'none';
    newRecordBadge.style.display = 'none';
    liveScoreEl.textContent = '0';

    if (activeGameInstance) {
      activeGameInstance.stop();
      activeGameInstance = null;
    }
    activeGameInstance = createGameInstance(activeGameId);
    if (activeGameInstance && activeGameInstance.resize) {
      activeGameInstance.resize();
    }

    startUniversalCountdown(activeGameId, () => {
      if (activeGameInstance) {
        activeGameInstance.start();
      }
    });
  });

  quitToHubBtn.addEventListener('click', closeGameModal);
  closeModalBtn.addEventListener('click', closeGameModal);
  modalBackdrop.addEventListener('click', closeGameModal);

  // Resize canvas when viewport alters
  window.addEventListener('resize', () => {
    if (activeGameInstance && activeGameInstance.resize) {
      activeGameInstance.resize();
    }
  });

  // 4. Filtering Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      ArcadeAudio.sfx.click();
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-category');
      renderCards();
    });
  });

  // 5. Header Controls & Preferences
  audioToggleBtn.addEventListener('click', () => {
    ArcadeAudio.toggleMute();
    updateAudioButton();
  });

  // CRT scanlines toggle
  const isCrtEnabled = ArcadeStorage.getPref('crt', true);
  if (!isCrtEnabled) crtOverlay.classList.add('disabled');

  crtToggleBtn.addEventListener('click', () => {
    ArcadeAudio.sfx.click();
    const isDisabled = crtOverlay.classList.toggle('disabled');
    ArcadeStorage.setPref('crt', !isDisabled);
  });

  // Clear Scores
  clearScoresBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all saved high scores?')) {
      ArcadeAudio.sfx.click();
      ArcadeStorage.clearAllScores(GAMES.map(g => g.id));
      updateStatsTicker();
      renderCards();
    }
  });

  // Listen to cross-module score updates
  window.addEventListener('arcade:score_updated', (e) => {
    const { gameId, score } = e.detail;
    const scoreValEl = document.getElementById(`card-score-${gameId}`);
    if (scoreValEl) {
      scoreValEl.textContent = score.toLocaleString();
    }
    updateStatsTicker();
  });

  // Fast-forward / tap-to-speed-up countdown listeners
  if (countdownOverlay) {
    countdownOverlay.addEventListener('pointerdown', fastForwardCountdown);
  }

  window.addEventListener('keydown', (e) => {
    if (countdownState !== 'idle' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      fastForwardCountdown();
    }
  });

  // -------------------------------------------------------------
  // iOS Safari Touch, Double-Tap & Pull-Down Protection
  // -------------------------------------------------------------
  let lastTouchEndTime = 0;

  // 1. Prevent double-tap to zoom on iOS Safari (which causes the viewport to pull down)
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    const timeSinceLastTouch = now - lastTouchEndTime;

    if (timeSinceLastTouch <= 350) {
      // Prevent double tap zoom anywhere inside modal, on canvas, or interactive areas
      const isGameInteraction = e.target.closest('#game-modal') ||
                                e.target.closest('#game-canvas') ||
                                e.target.closest('.game-viewport') ||
                                !e.target.closest('a, button, input');
      if (isGameInteraction) {
        e.preventDefault();
      }
    }
    lastTouchEndTime = now;
  }, { passive: false });

  // 2. Prevent multi-touch gesture pinch/zoom on iOS
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // 3. Prevent native pull-down / rubber-band scrolling on the game cabinet modal
  if (gameModal) {
    gameModal.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  // 4. Prevent drag scrolling and multi-touch on game canvas
  if (gameCanvas) {
    gameCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    gameCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // 6. Initialize
  updateAudioButton();
  updateStatsTicker();
  renderCards();
});
