// Custom cursor
const cursor = document.getElementById('cursor');
addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  if (e.target.closest('a, .card, button, [role="button"], .web-launch-btn, .web-url-pill')) {
    cursor.classList.add('big');
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('a, .card, button, [role="button"], .web-launch-btn, .web-url-pill')) {
    cursor.classList.remove('big');
  }
});

// Scroll reveal (staggered for cards)
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      const i = [...document.querySelectorAll('.card')].indexOf(en.target);
      en.target.style.transitionDelay = i >= 0 ? (i % 3) * 120 + 'ms' : '';
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// 3D tilt + spotlight on cards
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.transition = 'transform .1s linear';
    card.style.transform = `perspective(900px) rotateY(${(x - .5) * 12}deg) rotateX(${(.5 - y) * 12}deg) scale(1.03)`;
    card.style.setProperty('--mx', x * 100 + '%');
    card.style.setProperty('--my', y * 100 + '%');
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = '';
    card.style.transform = '';
  });
});

// Magnetic link
const mag = document.querySelector('.magnetic');
mag.addEventListener('mousemove', e => {
  const r = mag.getBoundingClientRect();
  mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
});
mag.addEventListener('mouseleave', () => mag.style.transform = '');

// Running card stat counters
const runCard = document.getElementById('card-running');
new IntersectionObserver((es, ob) => {
  if (!es[0].isIntersecting) return;
  runCard.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, dec = +el.dataset.dec, t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 2200, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
  ob.disconnect();
}, { threshold: 0.4 }).observe(runCard);

// Photography slideshow
const slides = [...document.querySelectorAll('.photo-thumb .slide')];
const counter = document.getElementById('photo-count');
let cur = 0;
setInterval(() => {
  slides[cur].classList.remove('on');
  cur = (cur + 1) % slides.length;
  slides[cur].classList.add('on');
  counter.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
}, 3500);

// Universal Project Showcase Modal System (Crimson Sacrament Architecture)
const projectModal = document.getElementById('project-modal');
const projectModalClose = document.getElementById('project-modal-close');
const projectModalBackdrop = document.getElementById('project-modal-backdrop');
const modalArtImg = document.getElementById('modal-art-img');
const modalChip = document.getElementById('modal-chip');
const modalTag = document.getElementById('modal-tag');
const modalTitle = document.getElementById('modal-title');
const modalQuote = document.getElementById('modal-quote');
const modalDesc = document.getElementById('modal-desc');
const modalMetaGrid = document.getElementById('modal-meta-grid');
const modalLaunchBtn = document.getElementById('modal-launch-btn');
const modalLaunchText = document.getElementById('modal-launch-text');

const projectsData = {
  vexillum: {
    title: 'Vexillum',
    image: 'projects/Vexillum.jpg',
    chip: 'Vexillology Portal',
    tag: '500+ Flags · 8 Game Modes',
    quote: '"Test your knowledge of every sovereign flag, banner, and emblem on Earth."',
    desc: 'An expansive, feature-packed flag quiz and vexillology companion built with React, Vite, and Lucide icons. Features 8 game modes including Classic Quiz, 60-Second Blitz, Memory Match, Detective Zoom, Survival Streak, and Flag Painter, backed by a comprehensive vector flag encyclopedia and study center.',
    meta: [
      { label: 'TECH STACK', value: 'React · Vite · TypeScript' },
      { label: 'GAME MODES', value: '8 Modes · 500+ Vector Flags' },
      { label: 'FEATURES', value: 'Sound FX · Audio · High Scores' }
    ],
    btnText: 'Play Vexillum ↗',
    btnUrl: 'vexillum/',
    target: '_self',
    theme: {
      backdrop: '#0f0a06ed',
      border: 'rgba(245, 158, 11, 0.35)',
      glow: 'rgba(245, 158, 11, 0.25)',
      windowBg: '#140e08',
      detailsBg: 'radial-gradient(circle at 100% 0%, #291809, #140e08 70%)',
      chipBg: 'rgba(245, 158, 11, 0.18)',
      chipColor: '#fbbf24',
      chipBorder: 'rgba(245, 158, 11, 0.45)',
      quote: '#fcd34d',
      titleGlow: 'rgba(245, 158, 11, 0.4)',
      btnBg: 'linear-gradient(135deg, #d97706, #ea580c)',
      btnBorder: 'rgba(251, 191, 36, 0.4)',
      btnShadow: 'rgba(217, 119, 6, 0.4)',
      btnGlow: 'rgba(245, 158, 11, 0.6)',
      close: '#fbbf24'
    }
  },
  arcade: {
    title: 'Arcade Minigames',
    image: 'projects/arcade-minigames.jpg',
    chip: 'Retro Arcade',
    tag: '22 Mini-Games · Web Audio',
    quote: '"Classic pocket arcade thrills with authentic CRT aesthetics and chiptune sound."',
    desc: 'A curated collection of 22 fast-paced retro games packed into a nostalgic arcade cabinet interface. Complete with dynamic CRT scanlines, arcade bezel glass reflections, Web Audio synthesizer effects, particle physics, local high-score tracking, and instant keyboard or touch controls.',
    meta: [
      { label: 'COLLECTION', value: '22 Retro Mini-Games' },
      { label: 'ENGINE', value: 'Vanilla JS · HTML5 Canvas' },
      { label: 'AUDIO', value: 'Web Audio API Chiptunes' }
    ],
    btnText: 'Play Arcade ↗',
    btnUrl: 'arcade-minigames/',
    target: '_self',
    theme: {
      backdrop: '#04090ded',
      border: 'rgba(6, 182, 212, 0.35)',
      glow: 'rgba(6, 182, 212, 0.25)',
      windowBg: '#081018',
      detailsBg: 'radial-gradient(circle at 100% 0%, #0d2230, #081018 70%)',
      chipBg: 'rgba(6, 182, 212, 0.18)',
      chipColor: '#67e8f9',
      chipBorder: 'rgba(6, 182, 212, 0.45)',
      quote: '#a5f3fc',
      titleGlow: 'rgba(6, 182, 212, 0.4)',
      btnBg: 'linear-gradient(135deg, #0891b2, #7c3aed)',
      btnBorder: 'rgba(103, 232, 249, 0.4)',
      btnShadow: 'rgba(6, 182, 212, 0.4)',
      btnGlow: 'rgba(6, 182, 212, 0.6)',
      close: '#67e8f9'
    }
  },
  casino: {
    title: "Clark's Casino",
    image: 'projects/clark-casino.jpg',
    chip: 'Casino Royale',
    tag: '7 Classic Games · Clark Coins',
    quote: '"High stakes, velvet tables, and Vegas lights — strictly for fun, zero real money."',
    desc: 'An authentic, immersive virtual casino experience featuring Blackjack, European Roulette, Vegas 777 Slots, Video Poker, Craps, Baccarat, and Fortune Wheel. Features authentic dealer voiceovers, felt lighting effects, chip stacks, daily bonus spins, and persistent Clark Coins bankrolls.',
    meta: [
      { label: 'GAMES', value: 'Blackjack, Roulette, Slots & More' },
      { label: 'CURRENCY', value: 'Clark Coins (Free Daily)' },
      { label: 'SAFETY', value: '100% Free · No Real Gambling' }
    ],
    btnText: 'Play Casino ↗',
    btnUrl: 'casino/index.html',
    target: '_self',
    theme: {
      backdrop: '#0c0a05ed',
      border: 'rgba(234, 179, 8, 0.35)',
      glow: 'rgba(234, 179, 8, 0.25)',
      windowBg: '#131008',
      detailsBg: 'radial-gradient(circle at 100% 0%, #241d08, #131008 70%)',
      chipBg: 'rgba(234, 179, 8, 0.18)',
      chipColor: '#fde047',
      chipBorder: 'rgba(234, 179, 8, 0.45)',
      quote: '#fef08a',
      titleGlow: 'rgba(234, 179, 8, 0.4)',
      btnBg: 'linear-gradient(135deg, #ca8a04, #dc2626)',
      btnBorder: 'rgba(253, 224, 71, 0.4)',
      btnShadow: 'rgba(202, 138, 4, 0.4)',
      btnGlow: 'rgba(234, 179, 8, 0.6)',
      close: '#fde047'
    }
  },
  fitness: {
    title: 'LG Fitness',
    image: 'projects/lgr-fitness.png',
    chip: 'Workout SaaS',
    tag: 'Hypertrophy · Progressive Overload',
    quote: '"Data-driven hypertrophy tracking engineered for serious strength progression."',
    desc: 'A dedicated training and progressive overload web application designed for lifters who prioritize precision. Features periodized split templates, set-by-set RPE logging, rest timers, volume distribution graphs, and historical PR tracking to guarantee consistent muscular adaptation.',
    meta: [
      { label: 'ROLE', value: 'Full-Stack Developer & Designer' },
      { label: 'CORE FOCUS', value: 'Progressive Overload Tracking' },
      { label: 'PLATFORM', value: 'Responsive Web App (SaaS)' }
    ],
    btnText: 'Visit www.lgrfitness.uk ↗',
    btnUrl: 'https://www.lgrfitness.uk',
    target: '_blank',
    theme: {
      backdrop: '#040e0aed',
      border: 'rgba(16, 185, 129, 0.35)',
      glow: 'rgba(16, 185, 129, 0.25)',
      windowBg: '#071510',
      detailsBg: 'radial-gradient(circle at 100% 0%, #0c2b1f, #071510 70%)',
      chipBg: 'rgba(16, 185, 129, 0.18)',
      chipColor: '#6ee7b7',
      chipBorder: 'rgba(16, 185, 129, 0.45)',
      quote: '#a7f3d0',
      titleGlow: 'rgba(16, 185, 129, 0.4)',
      btnBg: 'linear-gradient(135deg, #059669, #0d9488)',
      btnBorder: 'rgba(110, 231, 183, 0.4)',
      btnShadow: 'rgba(16, 185, 129, 0.4)',
      btnGlow: 'rgba(16, 185, 129, 0.6)',
      close: '#6ee7b7'
    }
  },
  apex: {
    title: 'Apex Practice',
    image: 'projects/apex-practice.png',
    chip: 'Healthcare Tech',
    tag: 'Clinical Dental Software',
    quote: '"Modern clinical workflows and periodontal charting for dental healthcare professionals."',
    desc: 'A sophisticated dental practice management platform featuring full graphical odontogram charting, interactive 6-point periodontal probing, appointment scheduling, patient clinical history, and treatment planning in an intuitive, ergonomic digital interface.',
    meta: [
      { label: 'SPECIALTY', value: 'Periodontal & Dental Charting' },
      { label: 'ARCHITECTURE', value: 'Modern Clinical UI Suite' },
      { label: 'DEPLOYMENT', value: 'Vercel Cloud Platform' }
    ],
    btnText: 'Launch Apex Practice ↗',
    btnUrl: 'https://apex-practice-muo3.vercel.app',
    target: '_blank',
    theme: {
      backdrop: '#040912ed',
      border: 'rgba(59, 130, 246, 0.35)',
      glow: 'rgba(59, 130, 246, 0.25)',
      windowBg: '#08101c',
      detailsBg: 'radial-gradient(circle at 100% 0%, #0e2038, #08101c 70%)',
      chipBg: 'rgba(59, 130, 246, 0.18)',
      chipColor: '#93c5fd',
      chipBorder: 'rgba(59, 130, 246, 0.45)',
      quote: '#bfdbfe',
      titleGlow: 'rgba(59, 130, 246, 0.4)',
      btnBg: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
      btnBorder: 'rgba(147, 197, 253, 0.4)',
      btnShadow: 'rgba(59, 130, 246, 0.4)',
      btnGlow: 'rgba(59, 130, 246, 0.6)',
      close: '#93c5fd'
    }
  },
  running: {
    title: 'Running',
    image: 'projects/portrait-bg.jpg',
    chip: 'Endurance',
    tag: '5K · 10K · Half Marathon',
    quote: '"Pounding pavement around Strathclyde Park, chasing personal bests one kilometre at a time."',
    desc: 'Documenting my endurance running journey, training regimes, and race milestones. From freezing morning interval sessions around Strathclyde Country Park to race day PBs (3:44 1K, 20:57 5K, 46:01 10K) and long-distance aerobic conditioning.',
    meta: [
      { label: '1K PB', value: '3:44' },
      { label: '5K PB', value: '20:57' },
      { label: '10K PB', value: '46:01' }
    ],
    btnText: 'View on Strava ↗',
    btnUrl: 'https://strava.app.link/JdmjD6Vc86b',
    target: '_blank',
    theme: {
      backdrop: '#0f0704ed',
      border: 'rgba(255, 106, 26, 0.35)',
      glow: 'rgba(255, 106, 26, 0.25)',
      windowBg: '#160b06',
      detailsBg: 'radial-gradient(circle at 100% 0%, #2b1408, #160b06 70%)',
      chipBg: 'rgba(255, 106, 26, 0.18)',
      chipColor: '#fdba74',
      chipBorder: 'rgba(255, 106, 26, 0.45)',
      quote: '#fed7aa',
      titleGlow: 'rgba(255, 106, 26, 0.4)',
      btnBg: 'linear-gradient(135deg, #fc4c02, #ea580c)',
      btnBorder: 'rgba(253, 186, 116, 0.4)',
      btnShadow: 'rgba(252, 76, 2, 0.4)',
      btnGlow: 'rgba(255, 106, 26, 0.6)',
      close: '#fdba74'
    }
  },
  photography: {
    title: 'Photography',
    image: 'photographs/web/IMG_4996.jpg',
    chip: 'Visual Arts',
    tag: 'Street & Landscape Photography',
    quote: '"Chasing fleeting light, architectural geometry, and raw atmospheric moments."',
    desc: 'A curated visual journal capturing natural landscapes, moody urban geometry, and quiet human moments. Focused on natural light contrast, high dynamic range composition, and evocative color grading across Scotland, Europe, and travels abroad.',
    meta: [
      { label: 'MEDIUM', value: 'Digital & 35mm Photography' },
      { label: 'SUBJECTS', value: 'Architecture, Street & Coast' },
      { label: 'GALLERY', value: 'Curated Instagram Portfolio' }
    ],
    btnText: 'Explore on Instagram @clarkconcarne ↗',
    btnUrl: 'https://www.instagram.com/clarkconcarne',
    target: '_blank',
    theme: {
      backdrop: '#0e0409ed',
      border: 'rgba(244, 63, 94, 0.35)',
      glow: 'rgba(244, 63, 94, 0.25)',
      windowBg: '#16080f',
      detailsBg: 'radial-gradient(circle at 100% 0%, #2c0e1e, #16080f 70%)',
      chipBg: 'rgba(244, 63, 94, 0.18)',
      chipColor: '#f472b6',
      chipBorder: 'rgba(244, 63, 94, 0.45)',
      quote: '#fbcfe8',
      titleGlow: 'rgba(244, 63, 94, 0.4)',
      btnBg: 'linear-gradient(135deg, #e11d48, #833ab4)',
      btnBorder: 'rgba(244, 114, 182, 0.4)',
      btnShadow: 'rgba(244, 63, 94, 0.4)',
      btnGlow: 'rgba(244, 63, 94, 0.6)',
      close: '#f472b6'
    }
  },
  crimson: {
    title: 'The Crimson Sacrament',
    image: 'projects/crimsonsac.jpg',
    chip: 'D&D Campaign',
    tag: 'Dark Fantasy / Gothic Mystery',
    quote: '"Blood remembers what the stones have forgotten."',
    desc: 'An original dark fantasy Dungeons & Dragons campaign exploring ancient covenants, blood rites, and long-buried heresies. The narrative follows the rediscovery of the ceremonial obsidian and crimson-glass blade, pulling investigators into an occult conspiracy across desolate stone sanctums.',
    meta: [
      { label: 'ROLE', value: 'Dungeon Master & Writer' },
      { label: 'SETTING', value: 'Homebrew Dark Fantasy' },
      { label: 'GENRE', value: 'Gothic Mystery & Horror' }
    ],
    btnText: 'Enter World Compendium & Character Forge ↗',
    btnUrl: 'crimson-sacrament.html',
    target: '_self',
    theme: {
      backdrop: '#080204ed',
      border: '#dc262644',
      glow: '#991b1b33',
      windowBg: '#110508',
      detailsBg: 'radial-gradient(circle at 100% 0%, #20040a, #110508 70%)',
      chipBg: '#991b1b33',
      chipColor: '#fca5a5',
      chipBorder: '#ef444466',
      quote: '#f87171',
      titleGlow: '#dc262655',
      btnBg: 'linear-gradient(135deg, #c81e3a 0%, #8b1828 100%)',
      btnBorder: 'rgba(255, 100, 120, 0.4)',
      btnShadow: 'rgba(200, 30, 58, 0.35)',
      btnGlow: 'rgba(200, 30, 58, 0.55)',
      close: '#fca5a5'
    }
  },
  philosophy: {
    title: 'Philosophy',
    image: 'photographs/web/IMG_1077.jpg',
    chip: 'Intellectual Inquiry',
    tag: 'Stoicism to Modern Thought',
    quote: '"We suffer more often in imagination than in reality." — Seneca',
    desc: 'An exploration of seven pivotal thinkers across two millennia: Seneca, Marcus Aurelius, Thomas Hobbes, Immanuel Kant, Adam Smith, Jean-Paul Sartre, and Thomas Sowell. Examining stoic resilience, social contracts, moral duty, free market coordination, and existential accountability.',
    meta: [
      { label: 'SPAN', value: '4 BC — Present Day' },
      { label: 'CANON', value: '7 Key Thinkers & Maxims' },
      { label: 'THEMES', value: 'Stoicism, Ethics, Freedom' }
    ],
    btnText: 'Meet the Thinkers ↗',
    btnAction: 'openPhilModal',
    target: '_self',
    theme: {
      backdrop: '#040e0ded',
      border: 'rgba(20, 184, 166, 0.35)',
      glow: 'rgba(20, 184, 166, 0.25)',
      windowBg: '#071514',
      detailsBg: 'radial-gradient(circle at 100% 0%, #0d2826, #071514 70%)',
      chipBg: 'rgba(20, 184, 166, 0.18)',
      chipColor: '#5eead4',
      chipBorder: 'rgba(20, 184, 166, 0.45)',
      quote: '#99f6e4',
      titleGlow: 'rgba(20, 184, 166, 0.4)',
      btnBg: 'linear-gradient(135deg, #0d9488, #0284c7)',
      btnBorder: 'rgba(94, 234, 212, 0.4)',
      btnShadow: 'rgba(20, 184, 166, 0.4)',
      btnGlow: 'rgba(20, 184, 166, 0.6)',
      close: '#5eead4'
    }
  },
  languages: {
    title: 'Languages',
    image: 'projects/portrait-bg.jpg',
    chip: 'Linguistics',
    tag: '日本語 · Japanese Language Study',
    quote: '"一期一会 — Treasure every unrepeatable encounter in life."',
    desc: 'Deep dive into the Japanese language, writing systems (Hiragana, Katakana, and Kanji), and conversational grammar. Features an interactive reinforcement learning portal with 28 bite-sized lessons, spaced repetition, audio synthesis, XP progression, and daily streaks.',
    meta: [
      { label: 'LANGUAGE', value: 'Japanese (日本語)' },
      { label: 'SCRIPTS', value: 'Kanji · Hiragana · Katakana' },
      { label: 'HUB', value: 'Interactive Study Portal' }
    ],
    btnText: 'Enter Japanese Study Hub ↗',
    btnUrl: 'japanese.html',
    target: '_self',
    theme: {
      backdrop: '#0c0512ed',
      border: 'rgba(168, 85, 247, 0.35)',
      glow: 'rgba(168, 85, 247, 0.25)',
      windowBg: '#110817',
      detailsBg: 'radial-gradient(circle at 100% 0%, #230d30, #110817 70%)',
      chipBg: 'rgba(168, 85, 247, 0.18)',
      chipColor: '#d8b4fe',
      chipBorder: 'rgba(168, 85, 247, 0.45)',
      quote: '#e9d5ff',
      titleGlow: 'rgba(168, 85, 247, 0.4)',
      btnBg: 'linear-gradient(135deg, #9333ea, #db2777)',
      btnBorder: 'rgba(216, 180, 254, 0.4)',
      btnShadow: 'rgba(168, 85, 247, 0.4)',
      btnGlow: 'rgba(168, 85, 247, 0.6)',
      close: '#d8b4fe'
    }
  }
};

function openProjectModal(key) {
  const p = projectsData[key];
  if (!p || !projectModal) return;

  if (modalArtImg) {
    modalArtImg.src = p.image;
    modalArtImg.alt = p.title;
  }
  if (modalChip) modalChip.textContent = p.chip;
  if (modalTag) modalTag.textContent = p.tag;
  if (modalTitle) modalTitle.textContent = p.title;
  if (modalQuote) modalQuote.textContent = p.quote;
  if (modalDesc) modalDesc.textContent = p.desc;

  if (modalMetaGrid) {
    modalMetaGrid.innerHTML = '';
    p.meta.forEach(m => {
      const col = document.createElement('div');
      col.innerHTML = `<small>${m.label}</small><b>${m.value}</b>`;
      modalMetaGrid.appendChild(col);
    });
  }

  if (modalLaunchBtn) {
    modalLaunchText.textContent = p.btnText;
    if (p.btnAction === 'openPhilModal') {
      modalLaunchBtn.href = '#';
      modalLaunchBtn.target = '_self';
      modalLaunchBtn.onclick = e => {
        e.preventDefault();
        closeProjectModal();
        if (typeof window.openPhilModal === 'function') {
          window.openPhilModal();
        }
      };
    } else {
      modalLaunchBtn.href = p.btnUrl;
      modalLaunchBtn.target = p.target || '_self';
      modalLaunchBtn.onclick = null;
      if (p.target === '_blank') {
        modalLaunchBtn.rel = 'noopener noreferrer';
      } else {
        modalLaunchBtn.removeAttribute('rel');
      }
    }
  }

  const t = p.theme;
  if (t) {
    projectModal.style.setProperty('--pm-backdrop', t.backdrop);
    projectModal.style.setProperty('--pm-border', t.border);
    projectModal.style.setProperty('--pm-glow', t.glow);
    projectModal.style.setProperty('--pm-window-bg', t.windowBg);
    projectModal.style.setProperty('--pm-details-bg', t.detailsBg);
    projectModal.style.setProperty('--pm-chip-bg', t.chipBg);
    projectModal.style.setProperty('--pm-chip-color', t.chipColor);
    projectModal.style.setProperty('--pm-chip-border', t.chipBorder);
    projectModal.style.setProperty('--pm-quote', t.quote);
    projectModal.style.setProperty('--pm-title-glow', t.titleGlow);
    projectModal.style.setProperty('--pm-btn-bg', t.btnBg);
    projectModal.style.setProperty('--pm-btn-border', t.btnBorder);
    projectModal.style.setProperty('--pm-btn-shadow', t.btnShadow);
    projectModal.style.setProperty('--pm-btn-glow', t.btnGlow);
    projectModal.style.setProperty('--pm-close', t.close);
  }

  projectModal.classList.add('open');
  projectModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.remove('open');
  projectModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (cursor) cursor.classList.remove('big');
}

// Wire all cards to open the universal project modal
document.querySelectorAll('.card[data-project]').forEach(card => {
  card.addEventListener('click', e => {
    const key = card.getAttribute('data-project');
    if (key) {
      openProjectModal(key);
    }
  });
});

if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && projectModal && projectModal.classList.contains('open')) {
    closeProjectModal();
  }
});

// Languages card - Japanese phrase cycler + falling kana
(function () {
  const phrases = [...document.querySelectorAll('#lang-stage .lang-phrase')];
  const dotsEl = document.getElementById('lang-dots');
  const rain = document.getElementById('lang-rain');
  if (!phrases.length) return;

  phrases.forEach((_, i) => dotsEl.appendChild(document.createElement('i')));
  const dots = [...dotsEl.children];
  let idx = 0;
  function show(n) {
    idx = (n + phrases.length) % phrases.length;
    phrases.forEach((p, i) => p.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  show(0);
  setInterval(() => show(idx + 1), 3200);

  const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん日本語学桜';
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.textContent = chars[Math.floor(Math.random() * chars.length)];
    s.style.left = Math.random() * 95 + '%';
    s.style.fontSize = 14 + Math.random() * 22 + 'px';
    s.style.animationDuration = 9 + Math.random() * 10 + 's';
    s.style.animationDelay = -Math.random() * 16 + 's';
    rain.appendChild(s);
  }

})();

// Philosophy card + modal
(function () {
  const thinkers = [
    { name: "Seneca", era: "c. 4 BC – 65 AD", school: "Stoicism · Rome", quote: "We suffer more often in imagination than in reality.", work: "Letters to Lucilius" },
    { name: "Marcus Aurelius", era: "121 – 180", school: "Stoicism · Rome", quote: "The impediment to action advances action. What stands in the way becomes the way.", work: "Meditations" },
    { name: "Thomas Hobbes", era: "1588 – 1679", school: "Social contract · England", quote: "The life of man, solitary, poor, nasty, brutish, and short.", work: "Leviathan" },
    { name: "Immanuel Kant", era: "1724 – 1804", school: "Enlightenment · Prussia", quote: "Dare to know! Have courage to use your own understanding.", work: "What Is Enlightenment?" },
    { name: "Adam Smith", era: "1723 – 1790", school: "Moral philosophy & economics · Scotland", quote: "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest.", work: "The Wealth of Nations" },
    { name: "Jean-Paul Sartre", era: "1905 – 1980", school: "Existentialism · France", quote: "Man is condemned to be free.", work: "Existentialism Is a Humanism" },
    { name: "Thomas Sowell", era: "b. 1930", school: "Economics & social theory · USA", quote: "There are no solutions. There are only trade-offs.", work: "Often cited from his interviews" }
  ];

  const stage = document.getElementById('phil-stage');
  const tl = document.getElementById('phil-timeline');
  const cardsEl = document.getElementById('phil-cards');
  const modal = document.getElementById('phil-modal');
  if (!stage) return;

  const short = ['Seneca', 'Marcus Aurelius', 'Hobbes', 'Kant', 'Smith', 'Sartre', 'Sowell'];
  const quotes = thinkers.map((t, i) => {
    const d = document.createElement('div');
    d.className = 'phil-quote';
    d.innerHTML = '<q></q><b></b><small></small>';
    d.querySelector('q').textContent = t.quote;
    d.querySelector('b').textContent = t.name;
    d.querySelector('small').textContent = t.era;
    stage.appendChild(d);
    return d;
  });
  const dots = thinkers.map((_, i) => {
    const dot = document.createElement('i');
    dot.style.left = (i / (thinkers.length - 1)) * 100 + '%';
    tl.appendChild(dot);
    return dot;
  });

  let cur = 0;
  function show(n) {
    cur = (n + thinkers.length) % thinkers.length;
    quotes.forEach((q, i) => q.classList.toggle('active', i === cur));
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
  }
  show(0);
  setInterval(() => show(cur + 1), 4800);

  thinkers.forEach((t, i) => {
    const c = document.createElement('article');
    c.className = 'phil-card';
    c.style.setProperty('--i', i);
    c.innerHTML = '<span class="phil-idx"></span><div class="phil-card-top"><div class="phil-mono"></div><div><h3></h3><div class="phil-era"></div></div></div><div class="phil-school"></div><blockquote></blockquote><div class="phil-work"></div>';
    c.querySelector('.phil-idx').textContent = String(i + 1).padStart(2, '0');
    c.querySelector('.phil-mono').textContent = t.name.replace('Jean-Paul', 'JP').split(' ').map(w => w[0]).slice(0, 2).join('');
    c.querySelector('h3').textContent = t.name;
    c.querySelector('.phil-era').textContent = t.era;
    c.querySelector('.phil-school').textContent = t.school;
    c.querySelector('blockquote').textContent = '“' + t.quote + '”';
    c.querySelector('.phil-work').textContent = t.work;
    cardsEl.appendChild(c);
  });

  function open() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const cur = document.getElementById('cursor');
    if (cur) cur.classList.remove('big');
  }

  window.openPhilModal = open;
  window.closePhilModal = close;

  const philClose = document.getElementById('phil-modal-close');
  if (philClose) philClose.addEventListener('click', close);
  const philBackdrop = document.getElementById('phil-modal-backdrop');
  if (philBackdrop) philBackdrop.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
})();

// Apple Spatial Photo 3D Depth Engine (Multi-plane Parallax & Optics)
(function () {
  const portraitWin = document.getElementById('portrait-window');
  const mirrorFrame = document.getElementById('mirror-frame');
  const spatialBg = document.getElementById('spatial-bg');
  const spatialShadow = document.getElementById('spatial-shadow');
  const spatialSubject = document.getElementById('spatial-subject');
  const windowAtmosphere = document.querySelector('.window-atmosphere');
  const glassGlare = document.getElementById('glass-glare');

  if (!portraitWin || !mirrorFrame || !spatialBg || !spatialSubject || !glassGlare) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHovered = false;
  let rafId = null;

  function render() {
    // Smooth lerp interpolation for Apple-grade fluid physical motion
    const ease = isHovered ? 0.08 : 0.05;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    // 1. Architectural Window Frame 3D Perspective Tilt
    const rotY = currentX * 7.5;
    const rotX = -currentY * 7.5;
    mirrorFrame.style.transform = `perspective(1100px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;

    // 2. Distant Harbor & Horizon (Deepest layer inside portal, moving with deep counter-parallax)
    const bgX = -currentX * 22;
    const bgY = -currentY * 15;
    spatialBg.style.transform = `scale(1.24) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px)`;

    // 3. Dynamic Ambient Shadow behind Clark
    if (spatialShadow) {
      const shX = -currentX * 15;
      const shY = -currentY * 11;
      spatialShadow.style.transform = `translate(${shX.toFixed(2)}px, ${shY.toFixed(2)}px)`;
    }

    // 4. Clark (Recessed inside the portal room - seated deep behind the window glass)
    const subX = -currentX * 10;
    const subY = -currentY * 7.5;
    spatialSubject.style.transform = `scale(1.0) translate(${subX.toFixed(2)}px, ${subY.toFixed(2)}px)`;

    // 5. Atmospheric Sunlight Bloom inside the portal
    if (windowAtmosphere) {
      const atmX = -currentX * 14;
      const atmY = -currentY * 10;
      windowAtmosphere.style.transform = `translate(${atmX.toFixed(2)}px, ${atmY.toFixed(2)}px)`;
    }

    // 6. Surface Glass Glare (Glides across front glass pane between user and window)
    const glareX = currentX * 45;
    const glareY = currentY * 45;
    glassGlare.style.transform = `translate(${glareX.toFixed(2)}px, ${glareY.toFixed(2)}px)`;

    if (isHovered) {
      const dist = Math.hypot(currentX, currentY);
      glassGlare.style.opacity = (0.35 + dist * 0.35).toFixed(2);
    } else {
      glassGlare.style.opacity = '';
    }

    // Keep loop active while animating or hovering
    if (isHovered || Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      rafId = requestAnimationFrame(render);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  portraitWin.addEventListener('mousemove', e => {
    isHovered = true;
    const r = portraitWin.getBoundingClientRect();
    // Normalized coordinates from -1 (left/top) to +1 (right/bottom)
    targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    startLoop();
  });

  portraitWin.addEventListener('mouseleave', () => {
    isHovered = false;
    targetX = 0;
    targetY = 0;
    startLoop();
  });

  // Mobile Device Tilt Support (iOS / Android Gyroscope)
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => {
      if (e.gamma === null || e.beta === null) return;
      // Clamp tilt to reasonable range
      const gamma = Math.max(-30, Math.min(30, e.gamma)); // left-to-right (-30 to 30)
      const beta = Math.max(15, Math.min(75, e.beta)) - 45; // front-to-back centered at 45deg
      targetX = gamma / 30;
      targetY = beta / 30;
      startLoop();
    }, { passive: true });
  }
})();
