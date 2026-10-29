/* Featured Projects: entrance, sticky index and before/after compare. */
(function () {
  const root = document.getElementById('showcase');
  if (!root || !root.classList.contains('fp')) return;
  // phones skip the entrance and cover effects: everything is simply shown
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 650px)').matches;

  // entrance — each block rises once, media settles from a slight zoom
  const targets = root.querySelectorAll('.fp-rise, .fp-tile, .fp-sticker');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(el => io.observe(el));
  }

  // sticky index — the pill follows whichever case holds the middle of the screen
  const track = root.querySelector('.fp-index-track');
  const pill = root.querySelector('.fp-index-pill');
  const links = [...root.querySelectorAll('.fp-index a')];
  const cases = links.map(a => document.getElementById(a.hash.slice(1)));
  let active = null;

  function setActive(link) {
    if (link === active) return;
    active = link;
    links.forEach(a => a.classList.toggle('is-active', a === link));
    if (!link) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';
    pill.style.width = link.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    if (track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: link.offsetLeft - (track.clientWidth - link.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  let queued = false;
  function update() {
    queued = false;
    const mid = window.innerHeight * 0.45;
    let current = null;
    cases.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) current = links[i];
    });
    setActive(current);
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', () => { const a = active; active = null; setActive(a); queue(); }, { passive: true });
  update();

  // case covers — open from an inset card to full-bleed as they scroll in
  const covers = [...root.querySelectorAll('[data-cover]')];
  function openCovers() {
    const vh = window.innerHeight;
    covers.forEach(c => {
      const top = c.getBoundingClientRect().top;
      const p = reduced ? 1 : Math.max(0, Math.min(1, (vh - top) / (vh * 0.7)));
      c.style.setProperty('--p', p.toFixed(3));
    });
  }
  let coverQueued = false;
  window.addEventListener('scroll', () => {
    if (coverQueued) return;
    coverQueued = true;
    requestAnimationFrame(() => { coverQueued = false; openCovers(); });
  }, { passive: true });
  window.addEventListener('resize', openCovers, { passive: true });
  openCovers();

  // catalogue reader — tabs, arrows and progress follow the spread in view
  root.querySelectorAll('[data-book]').forEach(book => {
    const track = book.querySelector('.fp-book-track');
    const spreads = [...track.children];
    const tabs = [...book.querySelectorAll('[data-go]')];
    const prev = book.querySelector('[data-step="-1"]');
    const next = book.querySelector('[data-step="1"]');
    const bar = book.querySelector('.fp-book-progress i');
    let index = 0;

    bar.style.width = (100 / spreads.length) + '%';
    const go = i => {
      i = Math.max(0, Math.min(spreads.length - 1, i));
      track.scrollTo({ left: spreads[i].offsetLeft - track.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    };
    const mark = i => {
      index = i;
      spreads.forEach((s, n) => s.classList.toggle('is-current', n === i));
      tabs.forEach((t, n) => { t.classList.toggle('is-active', n === i); t.setAttribute('aria-selected', n === i); });
      prev.disabled = i === 0;
      next.disabled = i === spreads.length - 1;
      bar.style.transform = 'translateX(' + (i * 100) + '%)';
    };

    tabs.forEach((t, n) => t.addEventListener('click', () => go(n)));
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => mark(Math.round(track.scrollLeft / (spreads[1] ? spreads[1].offsetLeft - spreads[0].offsetLeft : 1))));
    }, { passive: true });
    mark(0);
  });
})();
