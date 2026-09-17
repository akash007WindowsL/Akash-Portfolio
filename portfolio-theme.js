/* Set the palette before rendering; storage may be unavailable for local files. */
(function () {
  let theme = 'light';
  try { const saved = localStorage.getItem('portfolio-theme'); if (saved === 'dark' || saved === 'light') theme = saved; } catch (_) {}
  document.documentElement.dataset.theme = theme;
  document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    function sync() {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', String(dark));
    }
    button.addEventListener('click', function () {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('portfolio-theme', next); } catch (_) {}
      sync();
    });
    sync();
  });
})();

/* Refined, one-time scroll reveals across the page. */
(function () {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;
  if (!reduceMotion && supportsObserver) document.documentElement.classList.add('js-motion');

  document.addEventListener('DOMContentLoaded', function () {
    const selectors = [
      '.events .section-label', '.events .h-display', '.events .slider',
      '.showcase .section-label', '.showcase .h-display', '.show-panel',
      '.cap-section .section-label', '.cap-section .h-display', '.cap-card', '.cap-tools',
      '.chapter-title', '.gal > .frame',
      '.about .section-label', '.about .h-display', '.about-photo', '.about-quote',
      '.clients .section-label', '.clients .h-display', '.client-cell',
      '.cta h2', '.cta-btn', '.contact-form',
      'footer .foot-grid > *', 'footer .foot-bottom > *'
    ];

    const targets = Array.from(new Set(document.querySelectorAll(selectors.join(','))));
    const staggerGroups = document.querySelectorAll('.cap-grid, .gal, .client-grid, .foot-grid, .foot-bottom, .cat-rail-inner');

    targets.forEach(function (element) {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', '0ms');
    });

    staggerGroups.forEach(function (group) {
      Array.from(group.children).forEach(function (element, index) {
        if (!element.classList.contains('scroll-reveal')) return;
        element.style.setProperty('--reveal-delay', Math.min(index, 4) * 45 + 'ms');
      });
    });

    if (reduceMotion || !supportsObserver) {
      targets.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

    targets.forEach(function (element) { observer.observe(element); });
  });
})();

/* Reference sequence: rise as a compact stack, pause, then fan outward. */
document.addEventListener('DOMContentLoaded', function () {
  const showcase = document.getElementById('whats-inside');
  if (!showcase) return;
  const deck = showcase.querySelector('.inside-deck');
  const cards = Array.from(deck.querySelectorAll('.inside-card'));
  const mobile = window.matchMedia('(max-width: 650px)');
  let scrollFrame = 0;
  function updateMobileActive() {
    scrollFrame = 0;
    if (!mobile.matches) {
      cards.forEach(function (card) { card.classList.remove('is-mobile-active'); });
      return;
    }
    const center = deck.scrollTop + deck.clientHeight / 2;
    let nearest = cards[0];
    let distance = Infinity;
    cards.forEach(function (card) {
      const cardCenter = card.offsetTop + card.offsetHeight / 2;
      const nextDistance = Math.abs(cardCenter - center);
      if (nextDistance < distance) { distance = nextDistance; nearest = card; }
    });
    cards.forEach(function (card) { card.classList.toggle('is-mobile-active', card === nearest); });
  }
  function queueMobileActive() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateMobileActive);
  }
  function setupMobileList() {
    if (mobile.matches) {
      const initial = cards[Math.floor(cards.length / 2)];
      deck.scrollTop = initial.offsetTop + initial.offsetHeight / 2 - deck.clientHeight / 2;
    } else {
      deck.scrollTop = 0;
    }
    updateMobileActive();
  }
  deck.addEventListener('scroll', queueMobileActive, { passive: true });
  mobile.addEventListener('change', setupMobileList);
  setupMobileList();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  showcase.classList.add('inside-ready');
  let inView = false;
  function start() {
    if (!inView || document.body.classList.contains('meadow-open')) return;
    showcase.classList.add('inside-playing');
    observer.disconnect();
    meadowObserver.disconnect();
  }
  const observer = new IntersectionObserver(function (entries) {
    inView = entries[0].isIntersecting;
    start();
  }, { threshold: .3 });
  const meadowObserver = new MutationObserver(start);
  meadowObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  observer.observe(showcase);
  showcase.addEventListener('focusin', function () {
    showcase.classList.remove('inside-ready');
    observer.disconnect();
    meadowObserver.disconnect();
  });
  reduced.addEventListener('change', function (event) {
    if (event.matches) showcase.classList.remove('inside-ready');
  });
});
