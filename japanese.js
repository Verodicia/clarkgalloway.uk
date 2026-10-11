// Japanese Reinforcement Learning Portal Engine for Clark Galloway
(function () {
  'use strict';

  // 1. Audio Engine (Web Audio API & Speech Synthesis)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0, gainVal = 0.15) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  function playSuccessChime() {
    playTone(523.25, 'sine', 0.2, 0, 0.18);     // C5
    playTone(659.25, 'sine', 0.25, 0.08, 0.18);  // E5
    playTone(783.99, 'sine', 0.45, 0.16, 0.22);  // G5
  }

  function playWrongTone() {
    playTone(220, 'triangle', 0.2, 0, 0.15);
    playTone(196, 'triangle', 0.35, 0.12, 0.15);
  }

  function playLevelUpFanfare() {
    playTone(523.25, 'sine', 0.18, 0, 0.2);     // C5
    playTone(659.25, 'sine', 0.18, 0.12, 0.2);  // E5
    playTone(783.99, 'sine', 0.18, 0.24, 0.2);  // G5
    playTone(1046.50, 'sine', 0.6, 0.38, 0.28); // C6
  }

  function speakJapanese(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  // 2. State & Progression Management (localStorage)
  const STORAGE_KEY = 'cg_japanese_progress_v1';
  const defaultState = {
    xp: 0,
    level: 1,
    streak: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    completedLessons: [],
    unlockedBadges: [],
    soundEnabled: true
  };

  let state = loadState();

  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        if (parsed.lastStudyDate) {
          const last = new Date(parsed.lastStudyDate);
          const curr = new Date(today);
          const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            parsed.streak = (parsed.streak || 1) + 1;
            parsed.lastStudyDate = today;
          } else if (diffDays > 1) {
            parsed.streak = 1;
            parsed.lastStudyDate = today;
          }
        }
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state', e);
    }
    return { ...defaultState };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state', e);
    }
  }

  const LEVELS = [
    { level: 1, title: '見習い', rank: 'Apprentice', minXp: 0, maxXp: 200 },
    { level: 2, title: '初級者', rank: 'Beginner', minXp: 200, maxXp: 600 },
    { level: 3, title: '旅人', rank: 'Traveler', minXp: 600, maxXp: 1300 },
    { level: 4, title: '会話上手', rank: 'Conversationalist', minXp: 1300, maxXp: 2400 },
    { level: 5, title: '達人', rank: 'Master', minXp: 2400, maxXp: 99999 }
  ];

  function getCurrentLevel(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) return LEVELS[i];
    }
    return LEVELS[0];
  }

  function addXP(amount, reason = '') {
    const oldLevel = getCurrentLevel(state.xp).level;
    state.xp += amount;
    const newLevelObj = getCurrentLevel(state.xp);
    if (newLevelObj.level > oldLevel) {
      state.level = newLevelObj.level;
      playLevelUpFanfare();
      fireConfetti();
      showToast(`🎉 LEVEL UP! You reached Level ${newLevelObj.level}: ${newLevelObj.title} (${newLevelObj.rank})!`);
    } else if (reason) {
      showToast(`+${amount} XP · ${reason}`);
    }
    saveState();
    updateHUD();
    checkBadges();
  }

  // 3. Badges & Milestones Definition
  const BADGES = [
    { id: 'first_step', icon: '🎌', title: 'First Step (最初の一歩)', desc: 'Complete Lesson 1', check: () => state.completedLessons.includes(1) },
    { id: 'polite', icon: '🍵', title: 'Polite Speaker', desc: 'Complete Greetings (Lessons 1-3)', check: () => [1,2,3].every(id => state.completedLessons.includes(id)) },
    { id: 'navigator', icon: '📍', title: 'Tokyo Navigator', desc: 'Complete Shinjuku & Directions (Lesson 4)', check: () => state.completedLessons.includes(4) },
    { id: 'izakaya', icon: '🍶', title: 'Izakaya Regular', desc: 'Complete Dining & Drink Lessons (5-8)', check: () => [5,6,7,8].every(id => state.completedLessons.includes(id)) },
    { id: 'time_money', icon: '💴', title: 'Time & Currency Master', desc: 'Complete Lessons 9-14', check: () => [9,10,11,12,13,14].every(id => state.completedLessons.includes(id)) },
    { id: 'family', icon: '👨‍👩‍👧', title: 'People & Family', desc: 'Master counters for people (Lessons 19-21)', check: () => [19,20,21].every(id => state.completedLessons.includes(id)) },
    { id: 'shinkansen', icon: '🚄', title: 'Shinkansen Master', desc: 'Complete all 28 Lessons!', check: () => state.completedLessons.length >= 28 },
    { id: 'streak_3', icon: '🔥', title: 'Consistency Champ', desc: 'Maintain a 3-day study streak', check: () => state.streak >= 3 },
    { id: 'xp_500', icon: '⚡', title: 'Power Learner', desc: 'Earn 500 total XP', check: () => state.xp >= 500 }
  ];

  function checkBadges() {
    let newlyUnlocked = false;
    BADGES.forEach(b => {
      if (!state.unlockedBadges.includes(b.id) && b.check()) {
        state.unlockedBadges.push(b.id);
        newlyUnlocked = true;
        showToast(`🏆 Milestone Unlocked: ${b.title}!`);
        playSuccessChime();
        fireConfetti();
      }
    });
    if (newlyUnlocked) {
      saveState();
      renderBadges();
    }
  }

  // 4. UI Rendering & HUD
  function updateHUD() {
    const streakEl = document.getElementById('hud-streak');
    const xpEl = document.getElementById('hud-xp');
    const levelPillEl = document.getElementById('hud-level-pill');
    const heroTitleLevel = document.getElementById('hero-level-title');
    const heroRank = document.getElementById('hero-rank');
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const statsCompleted = document.getElementById('stat-completed');
    const statsXP = document.getElementById('stat-xp');
    const statsBadges = document.getElementById('stat-badges');

    const curLvl = getCurrentLevel(state.xp);
    if (streakEl) streakEl.textContent = `${state.streak} Days`;
    if (xpEl) xpEl.textContent = `${state.xp} XP`;
    if (levelPillEl) levelPillEl.textContent = `Lv.${curLvl.level} ${curLvl.title}`;

    if (heroTitleLevel) heroTitleLevel.textContent = `Level ${curLvl.level}: ${curLvl.title}`;
    if (heroRank) heroRank.textContent = curLvl.rank;

    const range = curLvl.maxXp - curLvl.minXp;
    const progress = Math.min(100, Math.max(0, ((state.xp - curLvl.minXp) / range) * 100));
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${state.xp} / ${curLvl.maxXp} XP`;

    if (statsCompleted) statsCompleted.textContent = `${state.completedLessons.length} / 28`;
    if (statsXP) statsXP.textContent = state.xp;
    if (statsBadges) statsBadges.textContent = `${state.unlockedBadges.length} / ${BADGES.length}`;
  }

  // 5. Render Roadmap (28 Lessons in 4 Stages)
  const STAGES = [
    { stage: 1, title: 'Stage 1: Foundations & Daily Politeness', ja: '基礎・日常会話', lessons: [1, 2, 3, 4, 5, 6, 7] },
    { stage: 2, title: 'Stage 2: Dining, Time, Yen & Counters', ja: '時間・お金・食事', lessons: [8, 9, 10, 11, 12, 13, 14] },
    { stage: 3, title: 'Stage 3: Socializing, Family & Shopping', ja: '買い物・家族・友達', lessons: [15, 16, 17, 18, 19, 20, 21] },
    { stage: 4, title: 'Stage 4: Travel, Directions & Complex Dialogues', ja: '旅行・道案内・表現', lessons: [22, 23, 24, 25, 26, 27, 28] }
  ];

  function renderRoadmap() {
    const container = document.getElementById('roadmap-container');
    if (!container || !window.JAPANESE_LESSONS) return;

    container.innerHTML = '';
    const lessonsMap = {};
    window.JAPANESE_LESSONS.forEach(l => { lessonsMap[l.id] = l; });

    STAGES.forEach(st => {
      const stageSec = document.createElement('div');
      stageSec.className = 'stage-section';

      const header = document.createElement('div');
      header.className = 'stage-header';
      header.innerHTML = `
        <div>
          <h3 class="stage-title">${st.title}</h3>
          <p class="stage-desc">${st.ja}</p>
        </div>
        <span class="stage-pill">Stage ${st.stage}</span>
      `;
      stageSec.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'lessons-grid';

      st.lessons.forEach(lId => {
        const lesson = lessonsMap[lId];
        if (!lesson) return;

        const isCompleted = state.completedLessons.includes(lId);
        const card = document.createElement('div');
        card.className = `lesson-card ${isCompleted ? 'completed' : ''}`;
        card.dataset.lessonId = lId;

        card.innerHTML = `
          <div>
            <div class="lesson-card-top">
              <span class="lesson-num">Lesson ${String(lId).padStart(2, '0')} · ${lesson.kanjiNumber}</span>
              <span class="lesson-badge-status ${isCompleted ? 'status-completed' : 'status-ready'}">
                ${isCompleted ? '★ Mastered' : '○ Available'}
              </span>
            </div>
            <div class="lesson-title-area">
              <h4 class="lesson-kanji-title">${lesson.subtitle}</h4>
              <p class="lesson-eng-title">${lesson.title}</p>
            </div>
          </div>
          <div class="lesson-footer">
            <span class="lesson-cat">${lesson.category}</span>
            <span class="lesson-xp">+100 XP</span>
          </div>
        `;

        card.addEventListener('click', () => openLessonModal(lId));
        grid.appendChild(card);
      });

      stageSec.appendChild(grid);
      container.appendChild(stageSec);
    });
  }

  // 6. Interactive Lesson Player Modal
  let currentActiveLesson = null;
  let currentQuizStep = 0;
  let quizScore = 0;

  function openLessonModal(lessonId) {
    const lesson = window.JAPANESE_LESSONS.find(l => l.id === lessonId);
    if (!lesson) return;
    currentActiveLesson = lesson;
    currentQuizStep = 0;
    quizScore = 0;

    const modal = document.getElementById('lesson-modal-overlay');
    const modalTitle = document.getElementById('modal-lesson-title');
    const modalSub = document.getElementById('modal-lesson-sub');

    if (modalTitle) modalTitle.textContent = `Lesson ${lesson.id}: ${lesson.title}`;
    if (modalSub) modalSub.textContent = `レッスン ${lesson.kanjiNumber} · ${lesson.subtitle}`;

    switchModalTab('phrases');
    renderModalPhrases(lesson);
    renderModalCapsule(lesson);
    initModalQuiz(lesson);

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLessonModal() {
    const modal = document.getElementById('lesson-modal-overlay');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function switchModalTab(tabId) {
    document.querySelectorAll('.step-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.step === tabId);
    });
    document.querySelectorAll('.modal-step-pane').forEach(p => {
      p.style.display = p.id === `step-${tabId}` ? 'block' : 'none';
    });
  }

  function renderModalPhrases(lesson) {
    const list = document.getElementById('phrases-list');
    if (!list) return;
    list.innerHTML = '';

    lesson.phrases.forEach(p => {
      const card = document.createElement('div');
      card.className = 'phrase-card';
      card.innerHTML = `
        <div>
          <div class="phrase-ja">${p.ja}</div>
          <div class="phrase-romaji">${p.romaji}</div>
          <div class="phrase-en">${p.en}</div>
        </div>
        <button class="speak-btn" aria-label="Listen pronunciation" title="Listen">
          🔊
        </button>
      `;

      card.querySelector('.speak-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        speakJapanese(p.ja);
      });
      list.appendChild(card);
    });
  }

  function renderModalCapsule(lesson) {
    const gText = document.getElementById('capsule-grammar-text');
    const cText = document.getElementById('capsule-culture-text');
    if (gText) gText.textContent = lesson.grammar;
    if (cText) cText.textContent = lesson.culture;
  }

  function initModalQuiz(lesson) {
    currentQuizStep = 0;
    quizScore = 0;
    renderQuizQuestion(lesson, 0);
  }

  function renderQuizQuestion(lesson, qIndex) {
    const qCount = document.getElementById('quiz-counter');
    const qBox = document.getElementById('quiz-q-text');
    const optsContainer = document.getElementById('quiz-options-container');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (!lesson.quiz || qIndex >= lesson.quiz.length) {
      // Quiz Completed!
      showQuizCompletion(lesson);
      return;
    }

    const q = lesson.quiz[qIndex];
    if (qCount) qCount.textContent = `Question ${qIndex + 1} of ${lesson.quiz.length}`;
    if (qBox) qBox.textContent = q.question;
    if (feedbackBox) {
      feedbackBox.className = 'quiz-feedback';
      feedbackBox.textContent = '';
    }
    if (nextBtn) nextBtn.style.display = 'none';

    if (optsContainer) {
      optsContainer.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt;

        btn.addEventListener('click', () => {
          // Disable all buttons
          const allBtns = optsContainer.querySelectorAll('.quiz-opt-btn');
          allBtns.forEach(b => b.disabled = true);

          if (idx === q.answer) {
            btn.classList.add('correct');
            feedbackBox.className = 'quiz-feedback show success';
            feedbackBox.innerHTML = `<strong>正解! Correct!</strong> ${q.explanation}`;
            quizScore++;
            playSuccessChime();
          } else {
            btn.classList.add('wrong');
            allBtns[q.answer].classList.add('correct');
            feedbackBox.className = 'quiz-feedback show failure';
            feedbackBox.innerHTML = `<strong>惜しい! Not quite.</strong> ${q.explanation}`;
            playWrongTone();
          }

          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.textContent = (qIndex + 1 < lesson.quiz.length) ? 'Next Question →' : 'Complete Drill ➔';
          }
        });

        optsContainer.appendChild(btn);
      });
    }
  }

  function showQuizCompletion(lesson) {
    const qCount = document.getElementById('quiz-counter');
    const qBox = document.getElementById('quiz-q-text');
    const optsContainer = document.getElementById('quiz-options-container');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (qCount) qCount.textContent = 'Drill Complete!';
    if (qBox) qBox.textContent = `素晴らしい! Excellent Work, Clark!`;
    if (optsContainer) {
      optsContainer.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 2rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
          <h3 style="font-size: 1.5rem; color: #fff; margin-bottom: 0.5rem;">Lesson ${lesson.id} Mastered!</h3>
          <p style="color: #a7f3d0; margin-bottom: 1rem;">Score: ${quizScore} / ${lesson.quiz.length} Correct</p>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--ac-gold);">+100 XP Earned!</div>
        </div>
      `;
    }

    if (feedbackBox) feedbackBox.className = 'quiz-feedback';

    // Award XP and complete lesson
    if (!state.completedLessons.includes(lesson.id)) {
      state.completedLessons.push(lesson.id);
      addXP(100, `Completed Lesson ${lesson.id}`);
      playLevelUpFanfare();
      fireConfetti();
    } else {
      addXP(25, `Reviewed Lesson ${lesson.id}`);
      playSuccessChime();
    }

    renderRoadmap();
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.textContent = 'Back to Roadmap';
      nextBtn.onclick = () => {
        closeLessonModal();
      };
    }
  }

  // 7. Spaced Repetition Flashcards Deck
  let flashcardIndex = 0;
  let flashcardsDeck = [];

  function buildFlashcardsDeck() {
    if (!window.JAPANESE_LESSONS) return;
    flashcardsDeck = [];
    window.JAPANESE_LESSONS.forEach(l => {
      l.phrases.slice(0, 2).forEach(p => {
        flashcardsDeck.push({
          ja: p.ja,
          romaji: p.romaji,
          en: p.en,
          lesson: l.id
        });
      });
    });
    // Shuffle slightly
    flashcardsDeck.sort(() => Math.random() - 0.5);
  }

  function renderFlashcard() {
    const cardEl = document.getElementById('study-flashcard');
    const jaEl = document.getElementById('fc-ja');
    const romajiEl = document.getElementById('fc-romaji');
    const enEl = document.getElementById('fc-en');
    const counterEl = document.getElementById('fc-counter');

    if (!flashcardsDeck.length) buildFlashcardsDeck();
    if (!flashcardsDeck.length) return;

    if (cardEl) cardEl.classList.remove('flipped');

    const card = flashcardsDeck[flashcardIndex % flashcardsDeck.length];
    if (jaEl) jaEl.textContent = card.ja;
    if (romajiEl) romajiEl.textContent = card.romaji;
    if (enEl) enEl.textContent = card.en;
    if (counterEl) counterEl.textContent = `Card ${flashcardIndex + 1} of ${flashcardsDeck.length}`;
  }

  // 8. Badges Grid Rendering
  function renderBadges() {
    const grid = document.getElementById('badges-grid');
    if (!grid) return;
    grid.innerHTML = '';

    BADGES.forEach(b => {
      const isUnlocked = state.unlockedBadges.includes(b.id);
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="badge-icon">${b.icon}</div>
        <div>
          <div class="badge-title">${b.title}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // 9. Toast Notification System
  function showToast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // 10. Canvas Confetti Particle Fireworks
  function fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ffffff'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 20,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        life: 1
      });
    }

    let animId = null;
    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // gravity
        p.rotation += p.vRot;
        p.life -= 0.015;

        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animId = requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animId);
      }
    }
    renderFrame();
  }

  // 11. Event Listeners Setup
  function init() {
    updateHUD();
    renderRoadmap();
    renderBadges();
    buildFlashcardsDeck();
    renderFlashcard();
    checkBadges();

    // Tab switching: Roadmap vs Flashcards vs Badges
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.target);
        if (target) target.classList.add('active');
      });
    });

    // Start Daily Review Button
    const startReviewBtn = document.getElementById('btn-start-review');
    if (startReviewBtn) {
      startReviewBtn.addEventListener('click', () => {
        const fcTab = document.querySelector('[data-target="tab-flashcards"]');
        if (fcTab) fcTab.click();
      });
    }

    // Modal tabs
    document.querySelectorAll('.step-tab').forEach(t => {
      t.addEventListener('click', () => {
        switchModalTab(t.dataset.step);
      });
    });

    // Modal Close
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeLessonModal);

    const overlay = document.getElementById('lesson-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeLessonModal();
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLessonModal();
    });

    // Quiz next button
    const quizNextBtn = document.getElementById('quiz-next-btn');
    if (quizNextBtn) {
      quizNextBtn.addEventListener('click', () => {
        if (currentActiveLesson) {
          currentQuizStep++;
          renderQuizQuestion(currentActiveLesson, currentQuizStep);
        }
      });
    }

    // Flashcard Flip
    const fc = document.getElementById('study-flashcard');
    if (fc) {
      fc.addEventListener('click', () => {
        fc.classList.toggle('flipped');
      });
    }

    // Flashcard Speak
    const fcSpeak = document.getElementById('fc-speak-btn');
    if (fcSpeak) {
      fcSpeak.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = flashcardsDeck[flashcardIndex % flashcardsDeck.length];
        if (card) speakJapanese(card.ja);
      });
    }

    // Flashcard "Got It!" vs "Review Soon"
    const fcGotIt = document.getElementById('fc-btn-got-it');
    if (fcGotIt) {
      fcGotIt.addEventListener('click', () => {
        addXP(15, 'Flashcard Recall');
        playSuccessChime();
        flashcardIndex++;
        renderFlashcard();
      });
    }

    const fcReview = document.getElementById('fc-btn-review');
    if (fcReview) {
      fcReview.addEventListener('click', () => {
        flashcardIndex++;
        renderFlashcard();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global exports for inline triggers if needed
  window.openLessonModal = openLessonModal;
  window.speakJapanese = speakJapanese;
})();
