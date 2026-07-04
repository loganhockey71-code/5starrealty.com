/* ================================
   5 STAR REALTY — main.js
   Lean: theme, menu, FAQ, form, and
   two restrained motion patterns only.
   ================================ */

// === THEME TOGGLE (light by default) ===
(function () {
  const KEY = 'theme';
  const root = document.documentElement;

  function updateToggleUI(theme) {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (sun) sun.classList.toggle('hidden', theme === 'light');
      if (moon) moon.classList.toggle('hidden', theme === 'dark');
    });
  }

  updateToggleUI(root.getAttribute('data-theme') || 'light');

  window.toggleTheme = function () {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(KEY, next);
    updateToggleUI(next);
  };
})();

// === MOBILE MENU ===
window.toggleMobileMenu = function () {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
};

// === FAQ ACCORDION (contact page) ===
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q').forEach(b => b.setAttribute('aria-expanded', 'false'));
    btn.setAttribute('aria-expanded', String(!expanded));
  });
});

// === LISTING FILTER TABS (listings page) ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.listing-card').forEach(card => {
      const cat = card.dataset.category || '';
      card.style.display = (filter === 'all' || cat.includes(filter)) ? '' : 'none';
    });
  });
});

// === CONTACT FORM (mailto, no backend) ===
window.handleFormSubmit = function (e) {
  e.preventDefault();
  const f = e.target;
  const subject = `5 Star Realty inquiry: ${f.interest ? f.interest.value : 'General'}`;
  const body =
    `Name: ${f.name.value}%0D%0APhone: ${f.phone ? f.phone.value : ''}%0D%0AEmail: ${f.email.value}` +
    `%0D%0A%0D%0A${encodeURIComponent(f.message ? f.message.value : '')}`;
  window.location.href = `mailto:batelb55@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  const btn = f.querySelector('.form-submit');
  if (btn) { const t = btn.textContent; btn.textContent = 'Opening your email…'; setTimeout(() => { btn.textContent = t; f.reset(); }, 2500); }
};

// === HERO SLIDESHOW ===
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;
  let current = 0;
  setInterval(function () {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
})();

// === MOTION — two patterns only ===
// 1) Hero entrance on load   2) One scroll-reveal (fade + rise) reused everywhere
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  const ease = 'power2.out';

  // 1. Hero entrance
  const heroBits = [
    '.hero-eyebrow', '.hero .hero-headline', '.hero .hero-sub',
    '.hero .hero-cta-group', '.hero-proof', '.page-title', '.page-subtitle'
  ].map(s => document.querySelector(s)).filter(Boolean);

  if (heroBits.length) {
    gsap.from(heroBits, { y: 22, opacity: 0, duration: 0.7, stagger: 0.08, ease });
  }
  const heroPhoto = document.querySelector('.hero-photo');
  if (heroPhoto) gsap.from(heroPhoto, { opacity: 0, scale: 0.98, duration: 0.9, ease });

  // 2. Single scroll-reveal pattern, reused across every page
  const revealSelectors = [
    '.intro-lead', '.intro-body', '.service-row', '.listing', '.meet-photo',
    '.meet-copy', '.review', '.cta-inner', '.listings-head', '.reviews-head',
    '.services-head',
    /* shared / inner pages */
    '.story-image-wrap', '.story-content', '.brokerage-card', '.value-card',
    '.mission-statement', '.team-card', '.roster-card', '.tv-card', '.voice-card',
    '.founder-image-wrap', '.founder-content', '.listing-card', '.service-deep-card',
    '.contact-method', '.contact-form-wrap', '.faq-item', '.cta-strip-inner',
    '.team-hero-stats', '.join-card', '.section-header'
  ];
  const revealEls = gsap.utils.toArray(revealSelectors.join(','));
  revealEls.forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      y: 24, opacity: 0, duration: 0.6, ease
    });
  });

  // Nav: solid background after scrolling past the top
  const nav = document.getElementById('main-nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -40',
      onUpdate: self => nav.classList.toggle('scrolled', self.progress > 0)
    });
  }
}
