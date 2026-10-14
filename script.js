// Custom cursor
const cursor = document.getElementById('cursor');
addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  if (e.target.closest('a, .card, button, [role="button"], .web-tab, .modal-pill, .web-modal-nav, .web-modal-close, .web-preview-btn')) {
    cursor.classList.add('big');
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('a, .card, button, [role="button"], .web-tab, .modal-pill, .web-modal-nav, .web-modal-close, .web-preview-btn')) {
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

// Websites Thumbnail & Lightbox Showcase
const webProjects = [
  {
    name: "LGR Fitness",
    tag: "Hypertrophy Training Tracker",
    chip: "Fitness App",
    url: "www.lgrfitness.uk",
    link: "https://www.lgrfitness.uk",
    img: "projects/lgr-fitness.png",
    desc: "Complete gym tracker engineered for progressive overload and hypertrophy. Covers dumbbells, machines, and cables with 10-week periodized plans and real-time visual progress analytics."
  },
  {
    name: "Apex Practice",
    tag: "Dental Clinical Software",
    chip: "Healthcare SaaS",
    url: "apex-practice-muo3.vercel.app",
    link: "https://apex-practice-muo3.vercel.app",
    img: "projects/apex-practice.png",
    desc: "Specialized clinical software for dental practitioners. Includes an interactive six-point periodontal pocket chart, appointment logs, patient consultation workflows, and treatment planning."
  },
  {
    name: "Clueless Closet",
    tag: "90s Interactive Wardrobe",
    chip: "Interactive UI",
    url: "clueless-ruddy.vercel.app",
    link: "https://clueless-ruddy.vercel.app",
    img: "projects/clueless-closet.png",
    desc: "A faithful, modern interactive remake of Cher Horowitz's iconic 1995 wardrobe computer system, complete with retro Mac OS window chrome, beveled buttons, outfit mixer, and fall fashion catalogs."
  }
];

let curWebIdx = 0;
const webSlides = [...document.querySelectorAll('#web-screen .web-slide')];
const webTabs = [...document.querySelectorAll('#web-nav-tabs .web-tab')];
const webUrlPill = document.getElementById('web-url-pill');
const webTagChip = document.getElementById('web-tag-chip');
const webCardTitle = document.getElementById('web-card-title');
let webAutoTimer = null;

function setWebProject(idx) {
  curWebIdx = (idx + webProjects.length) % webProjects.length;
  const p = webProjects[curWebIdx];

  webSlides.forEach((s, i) => s.classList.toggle('active', i === curWebIdx));
  webTabs.forEach((t, i) => t.classList.toggle('active', i === curWebIdx));

  if (webUrlPill) {
    webUrlPill.textContent = p.url + ' ↗';
    webUrlPill.href = p.link;
  }
  if (webTagChip) webTagChip.textContent = p.chip;
}

webTabs.forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    setWebProject(+btn.dataset.tab);
  });
});

function startWebTimer() {
  if (webAutoTimer) clearInterval(webAutoTimer);
  webAutoTimer = setInterval(() => {
    setWebProject(curWebIdx + 1);
  }, 4200);
}
function stopWebTimer() {
  if (webAutoTimer) {
    clearInterval(webAutoTimer);
    webAutoTimer = null;
  }
}

const cardWeb = document.getElementById('card-websites');
if (cardWeb) {
  cardWeb.addEventListener('mouseenter', stopWebTimer);
  cardWeb.addEventListener('mouseleave', startWebTimer);
  startWebTimer();
}

// Lightbox Modal
const webModal = document.getElementById('web-modal');
const modalImg = document.getElementById('web-modal-img');
const modalUrl = document.getElementById('web-modal-url');
const modalCounter = document.getElementById('web-modal-counter');
const modalChip = document.getElementById('web-modal-chip');
const modalTag = document.getElementById('web-modal-tag');
const modalTitle = document.getElementById('web-modal-title');
const modalDesc = document.getElementById('web-modal-desc');
const modalPills = [...document.querySelectorAll('.modal-pill')];
const prevBtn = document.getElementById('web-modal-prev');
const nextBtn = document.getElementById('web-modal-next');
const closeBtn = document.getElementById('web-modal-close');
const backdrop = document.getElementById('web-modal-backdrop');
const previewBtn = document.getElementById('web-preview-btn');
const webScreen = document.getElementById('web-screen');

let modalIdx = 0;

function updateModal(idx) {
  modalIdx = (idx + webProjects.length) % webProjects.length;
  const p = webProjects[modalIdx];
  if (modalImg) {
    modalImg.src = p.img;
    modalImg.alt = p.name;
  }
  if (modalUrl) {
    modalUrl.textContent = p.url + ' ↗';
    modalUrl.href = p.link;
  }
  const modalVisitBtn = document.getElementById('modal-visit-btn');
  if (modalVisitBtn) {
    modalVisitBtn.href = p.link;
  }
  if (modalCounter) modalCounter.textContent = `0${modalIdx + 1} / 0${webProjects.length}`;
  if (modalChip) modalChip.textContent = p.chip;
  if (modalTag) modalTag.textContent = p.tag;
  if (modalTitle) modalTitle.textContent = p.name;
  if (modalDesc) modalDesc.textContent = p.desc;
  modalPills.forEach((pill, i) => pill.classList.toggle('active', i === modalIdx));
  setWebProject(modalIdx);
}

function openModal(idx) {
  updateModal(typeof idx === 'number' ? idx : curWebIdx);
  webModal.classList.add('open');
  webModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  webModal.classList.remove('open');
  webModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  cursor.classList.remove('big');
}

if (previewBtn) previewBtn.addEventListener('click', () => openModal(curWebIdx));
if (webScreen) {
  webScreen.style.cursor = 'pointer';
  webScreen.addEventListener('click', () => openModal(curWebIdx));
}
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (backdrop) backdrop.addEventListener('click', closeModal);
if (prevBtn) prevBtn.addEventListener('click', () => updateModal(modalIdx - 1));
if (nextBtn) nextBtn.addEventListener('click', () => updateModal(modalIdx + 1));

modalPills.forEach(pill => {
  pill.addEventListener('click', () => updateModal(+pill.dataset.modalIdx));
});

window.addEventListener('keydown', e => {
  if (!webModal.classList.contains('open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') updateModal(modalIdx - 1);
  if (e.key === 'ArrowRight') updateModal(modalIdx + 1);
});

// D&D Lore Modal - The Crimson Sacrament
const dndModal = document.getElementById('dnd-modal');
const dndCloseBtn = document.getElementById('dnd-modal-close');
const dndBackdrop = document.getElementById('dnd-modal-backdrop');
const dndLoreBtn = document.getElementById('dnd-lore-btn');
const dndCard = document.getElementById('card-dnd');

function openDndModal() {
  if (!dndModal) return;
  dndModal.classList.add('open');
  dndModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDndModal() {
  if (!dndModal) return;
  dndModal.classList.remove('open');
  dndModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  cursor.classList.remove('big');
}

if (dndLoreBtn) dndLoreBtn.addEventListener('click', e => {
  e.stopPropagation();
  openDndModal();
});
if (dndCard) {
  const dndThumb = dndCard.querySelector('.dnd-thumb');
  if (dndThumb) {
    dndThumb.style.cursor = 'pointer';
    dndThumb.addEventListener('click', openDndModal);
  }
}
if (dndCloseBtn) dndCloseBtn.addEventListener('click', closeDndModal);
if (dndBackdrop) dndBackdrop.addEventListener('click', closeDndModal);

window.addEventListener('keydown', e => {
  if (dndModal && dndModal.classList.contains('open') && e.key === 'Escape') {
    closeDndModal();
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

  const cardLang = document.getElementById('card-languages');
  if (cardLang) {
    cardLang.addEventListener('click', () => {
      window.location.href = 'japanese.html';
    });
  }

  const cardArcade = document.getElementById('card-arcade');
  if (cardArcade) {
    cardArcade.addEventListener('click', e => {
      if (e.target.closest('.arcade-play-btn')) return;
      window.location.href = 'arcade-minigames/';
    });
  }

  const cardFlags = document.getElementById('card-flags');
  if (cardFlags) {
    cardFlags.addEventListener('click', e => {
      if (e.target.closest('.flags-play-btn')) return;
      window.location.href = 'fun-with-flags/dist/index.html';
    });
  }

  const cardCasino = document.getElementById('card-casino');
  if (cardCasino) {
    cardCasino.addEventListener('click', e => {
      if (e.target.closest('.casino-play-btn')) return;
      window.location.href = 'casino/index.html';
    });
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

  function open() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; document.getElementById('cursor').classList.remove('big'); }
  document.getElementById('phil-btn').addEventListener('click', e => { e.stopPropagation(); open(); });
  document.getElementById('phil-thumb').addEventListener('click', open);
  document.getElementById('phil-modal-close').addEventListener('click', close);
  document.getElementById('phil-modal-backdrop').addEventListener('click', close);
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
