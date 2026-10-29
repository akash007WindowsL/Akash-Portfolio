/* Set the palette before rendering; storage may be unavailable for local files. */
(function () {
  let theme = 'dark';
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
  const phone = window.matchMedia && window.matchMedia('(max-width: 650px)').matches;
  if (!reduceMotion && !phone && supportsObserver) document.documentElement.classList.add('js-motion');

  document.addEventListener('DOMContentLoaded', function () {
    const selectors = [
      '.events .section-label', '.events .h-display', '.events .slider',
      '.showcase .section-label', '.showcase .h-display', '.show-panel',
      '.cap-section .section-label', '.cap-section .h-display', '.cap-card', '.cap-tools',
      '.chapter-title', '.gal > .frame', '#print-media .brochure-card',
      '.about .section-label', '.about .h-display', '.about-photo', '.about-quote',
      '.clients .section-label', '.clients .h-display', '.client-cell',
      '.cta h2', '.cta-btn', '.contact-form',
      'footer .foot-grid > *', 'footer .foot-bottom > *'
    ];

    const targets = Array.from(new Set(document.querySelectorAll(selectors.join(','))));
    const staggerGroups = document.querySelectorAll('.cap-grid, .gal, .brochure-stack, .client-grid, .foot-grid, .foot-bottom, .cat-rail-inner');

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

    if (reduceMotion || phone || !supportsObserver) {
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

/* Reversible logo rail: direct scroll mapping prevents stale state and ghosted wraparound. */
document.addEventListener('DOMContentLoaded', function () {
  const chapter = document.getElementById('logo-design');
  if (!chapter) return;

  const stage = chapter.querySelector('.logo-scroll-stage');
  const pane = chapter.querySelector('.logo-pinned-pane');
  const slides = Array.from(chapter.querySelectorAll('.logo-slide:not(.logo-slide-loop)'));
  const loopSlide = chapter.querySelector('.logo-slide-loop');
  const nextSection = document.getElementById('social-campaigns');
  // matches the CSS that turns the rail into a still grid
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 650px), (max-height: 520px)');
  let frame = 0;
  let handoffLocked = false;

  if (nextSection) nextSection.classList.add('logo-handoff-target');

  function render(progress) {
    const width = slides[0].offsetWidth;
    const gap = Math.max(18, Math.min(34, width * .08));
    const step = width + gap;

    function place(slide, relative) {
      const distance = Math.abs(relative);
      const colorStrength = Math.max(0, 1 - distance);
      const edgeStrength = Math.max(0, Math.min(1, (1.62 - distance) / .42));
      slide.style.setProperty('--logo-shift', (relative * step) + 'px');
      slide.style.setProperty('--logo-gray', String(1 - colorStrength));
      slide.style.setProperty('--logo-opacity', String((.36 + colorStrength * .64) * edgeStrength));
      slide.style.zIndex = String(20 - Math.round(distance * 10));
    }

    slides.forEach(function (slide, index) {
      place(slide, index - progress);
    });

    if (loopSlide) place(loopSlide, slides.length - progress);

  }

  function update() {
    frame = 0;
    if (reduced.matches) {
      chapter.classList.remove('logo-handoff-active');
      if (nextSection) nextSection.classList.remove('logo-handoff-locked', 'logo-handoff-entering');
      handoffLocked = false;
      return;
    }
    const stickyTop = parseFloat(window.getComputedStyle(pane).top) || 0;
    const travel = Math.max(1, stage.offsetHeight - pane.offsetHeight);
    const distance = stickyTop - stage.getBoundingClientRect().top;
    const consumed = Math.max(0, Math.min(travel, distance));
    render(consumed / travel * (slides.length - 1));
    if (nextSection) {
      const reveal = Math.max(0, Math.min(1, (distance - travel) / 180));

      // Keep the actual next chapter on a fixed compositor layer while the
      // logo rail is pinned. Reserving its height prevents downstream reflow,
      // and releasing it at the pin boundary is position-continuous.
      const shouldLock = distance >= 0 && distance <= travel;
      if (shouldLock && !handoffLocked) {
        const sectionRect = nextSection.getBoundingClientRect();
        chapter.style.setProperty('--social-reserve-height', nextSection.offsetHeight + 'px');
        nextSection.style.setProperty('--social-lock-left', Math.round(sectionRect.left) + 'px');
        nextSection.style.setProperty('--social-lock-width', Math.round(sectionRect.width) + 'px');
        chapter.classList.add('logo-handoff-active');
        nextSection.classList.add('logo-handoff-locked', 'logo-handoff-entering');
        handoffLocked = true;
      } else if (!shouldLock && handoffLocked) {
        chapter.classList.remove('logo-handoff-active');
        nextSection.classList.remove('logo-handoff-locked', 'logo-handoff-entering');
        handoffLocked = false;
      }
      if (shouldLock) {
        const gap = parseFloat(window.getComputedStyle(chapter).getPropertyValue('--logo-gap')) || 0;
        nextSection.style.setProperty('--social-lock-top', Math.round(pane.getBoundingClientRect().bottom + gap) + 'px');
      }
      nextSection.style.setProperty('--social-handoff-opacity', String(.10 + reveal * .90));
      nextSection.style.setProperty('--social-handoff-blur', (5 * (1 - reveal)) + 'px');
      nextSection.style.setProperty('--social-handoff-rise', (14 * (1 - reveal)) + 'px');
    }
  }

  function queueUpdate() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  window.addEventListener('load', queueUpdate);
  if (document.fonts) document.fonts.ready.then(queueUpdate);
  if ('ResizeObserver' in window) {
    const layoutObserver = new ResizeObserver(queueUpdate);
    layoutObserver.observe(stage);
    layoutObserver.observe(pane);
    if (nextSection) layoutObserver.observe(nextSection);
  }
  reduced.addEventListener('change', update);
  requestAnimationFrame(function () { render(0); update(); });
});

document.addEventListener('DOMContentLoaded', function () {
  const showcase = document.getElementById('whats-inside');
  if (!showcase) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phone = window.matchMedia('(max-width: 650px)');
  if (reduced.matches || phone.matches || !('IntersectionObserver' in window)) return;
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

/* Show the category rail only after the index has been passed. When the
   Meadow jumps directly to a chapter, wait for the visitor's first scroll. */
document.addEventListener('DOMContentLoaded', function () {
  const rail = document.getElementById('catRail');
  const inside = document.getElementById('whats-inside');
  if (!rail || !inside) return;

  let entered = document.body.classList.contains('portfolio-entered');
  let entryGate = entered;
  let entryY = window.scrollY;
  let frame = 0;

  function updateRail() {
    frame = 0;
    if (entryGate && Math.abs(window.scrollY - entryY) > 3) entryGate = false;
    const navClearance = window.innerWidth <= 900 ? 96 : 104;
    const insideEnd = inside.offsetTop + inside.offsetHeight;
    const pastInside = window.scrollY + navClearance >= insideEnd;
    const visible = !document.body.classList.contains('meadow-open') && pastInside && !entryGate;
    rail.classList.toggle('rail-visible', visible);
    rail.setAttribute('aria-hidden', String(!visible));
  }

  function queueRailUpdate() {
    if (!frame) frame = requestAnimationFrame(updateRail);
  }

  const bodyObserver = new MutationObserver(function () {
    const isEntered = document.body.classList.contains('portfolio-entered');
    if (isEntered && !entered) {
      entryGate = true;
      entryY = window.scrollY;
    }
    entered = isEntered;
    queueRailUpdate();
  });

  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('scroll', queueRailUpdate, { passive: true });
  window.addEventListener('resize', queueRailUpdate, { passive: true });
  updateRail();
});

/* Mark the brochure spread currently at the front of the sticky stack. */
document.addEventListener('DOMContentLoaded', function () {
  const stack = document.querySelector('#print-media .brochure-stack');
  if (!stack) return;

  const chapter = stack.closest('#print-media');
  const heading = chapter.querySelector('.chapter-head');
  const cards = Array.from(stack.querySelectorAll('.brochure-card'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 650px), (max-height: 520px)');
  let frame = 0;
  let activeIndex = -1;
  let headingShift = 0;

  function updateStack() {
    frame = 0;
    if (reduced.matches) {
      cards.forEach(function (card) { card.classList.remove('is-active', 'is-past'); });
      heading.style.removeProperty('--brochure-heading-shift');
      headingShift = 0;
      activeIndex = -1;
      return;
    }

    let nextIndex = 0;
    cards.forEach(function (card, index) {
      const stickyTop = parseFloat(window.getComputedStyle(card).top) || 0;
      if (card.getBoundingClientRect().top <= stickyTop + 2) nextIndex = index;
    });

    // Earlier cards leave their sticky positions before the last card does.
    // Keep the heading above the highest card throughout that entire exit.
    const firstCardTop = Math.min(...cards.map(function (card) {
      return card.getBoundingClientRect().top;
    }));
    const unshiftedHeadingBottom = heading.getBoundingClientRect().bottom - headingShift;
    headingShift = Math.min(0, firstCardTop - unshiftedHeadingBottom - 28);
    heading.style.setProperty('--brochure-heading-shift', headingShift + 'px');

    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    cards.forEach(function (card, index) {
      card.classList.toggle('is-active', index === activeIndex);
      card.classList.toggle('is-past', index < activeIndex);
    });
  }

  function queueStackUpdate() {
    if (!frame) frame = requestAnimationFrame(updateStack);
  }

  window.addEventListener('scroll', queueStackUpdate, { passive: true });
  window.addEventListener('resize', queueStackUpdate, { passive: true });
  reduced.addEventListener('change', updateStack);
  updateStack();
});

/* Outdoor Media 3D street — scroll position becomes a camera dolly down the
   road; the camera also sways toward whichever side the next board stands on. */
document.addEventListener('DOMContentLoaded', function () {
  const stage = document.querySelector('[data-billboards]');
  if (!stage) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // phones and short screens show the plain gallery instead (see the CSS)
  const flat = window.matchMedia('(max-width: 650px), (max-height: 520px)');
  const sticky = stage.querySelector('.ob-sticky');
  const world = stage.querySelector('.ob-world');
  const boards = Array.from(stage.querySelectorAll('.ob-board'));
  const count = stage.querySelector('.ob-count');
  const title = stage.querySelector('.ob-title');
  const sub = stage.querySelector('.ob-sub');
  const last = boards.length - 1;
  let frame = 0, shown = -1;

  function px(name) {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.width = 'var(' + name + ')';
    stage.appendChild(probe);
    const v = probe.getBoundingClientRect().width;
    probe.remove();
    return v;
  }
  let gap = 900, sideX = 0;
  function measure() { gap = px('--gap'); sideX = px('--board-x'); }

  function update() {
    frame = 0;
    if (flat.matches) return;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    const travel = Math.max(1, stage.offsetHeight - sticky.offsetHeight);
    const p = Math.max(0, Math.min(1, (top - stage.getBoundingClientRect().top) / travel));
    const t = p * last;
    const focus = gap * 0.55;
    const i0 = Math.floor(t), f = t - i0;
    const side = n => (n % 2 === 0 ? -1 : 1);
    const ease = f * f * (3 - 2 * f);
    const swayTo = i0 >= last ? side(last) : side(i0) * (1 - ease) + side(i0 + 1) * ease;
    world.style.setProperty('--cam-z', (t * gap - focus) + 'px');
    world.style.setProperty('--cam-x', (-swayTo * sideX * 0.55) + 'px');

    boards.forEach(function (b, i) {
      const ahead = i * gap - (t * gap - focus);          // distance in front of the camera
      const passed = ahead < 120 ? Math.max(0, Math.min(1, ahead / 120)) : 1;
      const fog = Math.max(.15, Math.min(1, 1 - (ahead - focus) / (gap * 3)));
      b.style.setProperty('--o', String(Math.min(passed, fog)));
      b.style.setProperty('--lit', String(Math.abs(i - t) < .5 ? 1 : .7));
    });

    const now = Math.min(last, Math.round(t));
    if (now !== shown) {
      shown = now;
      const b = boards[now];
      count.textContent = String(now + 1).padStart(2, '0') + ' / ' + String(boards.length).padStart(2, '0');
      title.textContent = b.dataset.title;
      sub.textContent = b.dataset.sub;
    }
  }
  const queue = function () { if (!frame) frame = requestAnimationFrame(update); };
  measure();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { measure(); queue(); }, { passive: true });
  flat.addEventListener('change', function () { measure(); queue(); });
  update();
});
