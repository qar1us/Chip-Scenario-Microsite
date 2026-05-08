// Nav hamburger: expand/collapse panel + body.is-scrolled
(function () {
  const nav    = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const panel  = document.getElementById('nav-panel');
  if (!nav || !toggle || !panel) return;

  const SCROLL_THRESHOLD = 80;

  function openPanel()  { nav.classList.add('is-open');    toggle.setAttribute('aria-expanded', 'true');  }
  function closePanel() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closePanel() : openPanel();
  });

  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closePanel));

  document.addEventListener('click', e => { if (!nav.contains(e.target)) closePanel(); });

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    document.body.classList.toggle('is-scrolled', scrolled);
    if (scrolled && nav.classList.contains('is-open')) closePanel();
  }, { passive: true });
})();

// Scroll-spy: highlight active section + toggle body.in-section
(function () {
  const links    = document.querySelectorAll('.nav-list a');
  const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href')));

  if (!('IntersectionObserver' in window)) return;

  const intersecting = new Set();

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) intersecting.add(entry.target.id);
        else intersecting.delete(entry.target.id);
      });
      const activeId = [...intersecting].pop();
      links.forEach(a => a.classList.toggle('active', a.dataset.section === activeId));
      document.body.classList.toggle('in-section', !!activeId);
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(s => s && observer.observe(s));
})();

// Hero fade: content dissolves as user scrolls into content
(function () {
  const heroInner = document.querySelector('.hero-inner');
  if (!heroInner) return;

  const hero = heroInner.closest('.hero');
  let raf = null;

  function update() {
    const rect = hero.getBoundingClientRect();
    const h    = hero.offsetHeight;
    const raw      = -rect.top / h;
    const progress = Math.max(0, Math.min(1, (raw - 0.35) / 0.40));
    heroInner.style.opacity   = (1 - progress).toFixed(3);
    heroInner.style.transform = `scale(${(1 - progress * 0.04).toFixed(4)})`;
    heroInner.style.transformOrigin = 'center top';
    raf = null;
  }

  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });

  update();
})();

// Section scroll: rise-on-enter + fade-and-lift-on-depart
(function () {
  const allSections = Array.from(document.querySelectorAll('.scenario'));
  if (!allSections.length) return;

  const lastIdx = allSections.length - 1;
  let raf = null;

  function update() {
    const vh = window.innerHeight;

    allSections.forEach((section, i) => {
      const rect  = section.getBoundingClientRect();
      const isLast = i === lastIdx;

      const enterRaw      = (vh - rect.top) / (vh * 0.7);
      const enterProgress = Math.min(1, Math.max(0, enterRaw) * 3.0);
      const enterY        = 100 * (1 - enterProgress);

      const departRaw      = (0.65 - rect.bottom / vh) / 0.40;
      const departProgress = isLast ? 0 : Math.max(0, Math.min(1, departRaw));
      const departY        = -60 * departProgress;
      const opacity        = isLast ? 1 : (1 - departProgress);

      section.style.opacity   = opacity.toFixed(3);
      section.style.transform = `translateY(${(enterY + departY).toFixed(2)}px)`;
    });

    raf = null;
  }

  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });

  update();
})();

// Sidenote toggle for mobile (when sidenotes are collapsed inline)
(function () {
  document.querySelectorAll('.sn-ref').forEach(ref => {
    ref.setAttribute('role', 'button');
    ref.setAttribute('tabindex', '0');
    ref.setAttribute('aria-label', 'Toggle sidenote ' + ref.dataset.sn);

    const toggle = () => {
      const id = ref.dataset.sn;
      const container = ref.closest('li, .sn-host');
      if (!container) return;
      const note = container.querySelector('.sidenote[data-sn="' + id + '"]');
      if (note) note.classList.toggle('is-open');
    };

    ref.addEventListener('click', e => { e.preventDefault(); toggle(); });
    ref.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();

// Compute spend chart: hover/focus tooltip + segment fade
(function () {
  const chart = document.querySelector('.compute-chart');
  if (!chart) return;

  const tooltip = chart.querySelector('.chart-tooltip');
  const stage = chart.querySelector('.chart-stage');
  const segments = chart.querySelectorAll('.bar-group');
  if (!tooltip || !stage || !segments.length) return;

  const data = {
    'openai-2022':    { unattributed: 0.416, total: 0.416, estimated: true,
      source: 'https://fortune.com/longform/chatgpt-openai-sam-altman-microsoft/' },
    'anthropic-2023': { unattributed: 0.285, total: 0.285, estimated: true,
      source: 'https://www.theinformation.com/articles/pro-weekly-ai-pushes-cloud-vendors-to-new-heights' },
    'openai-2024':    { rd: 4.0, inference: 1.8, total: 5.8,  estimated: true,
      source: 'https://www.theinformation.com/articles/openai-projections-imply-losses-tripling-to-14-billion-in-2026' },
    'openai-2025':    { rd: 8.3, inference: 8.0, total: 16.3, estimated: false,
      source: 'https://www.theinformation.com/articles/openai-boost-revenue-forecasts-predicts-112-billion-cash-burn-2030' },
    'anthropic-2024': { rd: 1.5, inference: 1.0, total: 2.5,  estimated: true,
      source: 'https://www.theinformation.com/articles/anthropic-projects-soaring-growth-to-34-5-billion-in-2027-revenue' },
    'anthropic-2025': { rd: 4.1, inference: 2.7, total: 6.8,  estimated: false,
      source: 'https://www.theinformation.com/articles/anthropic-lowers-profit-margin-projection-revenue-skyrockets' }
  };
  const COMPANY = { openai: 'OpenAI', anthropic: 'Anthropic' };
  const fmt = v => v < 1 ? '$' + Math.round(v * 1000) + 'M' : '$' + v.toFixed(1) + 'B';
  const sourceHost = url => {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return url; }
  };

  function showFor(seg) {
    const company = seg.dataset.company;
    const year = seg.dataset.year;
    const metric = seg.dataset.metric;
    const segKey = seg.dataset.segment;
    const d = data[company + '-' + year];
    if (!d) return;

    segments.forEach(s => s.classList.toggle('is-active', s === seg));
    chart.setAttribute('data-active', segKey);

    const isUnattributed = 'unattributed' in d;
    const rowsHTML = isUnattributed
      ? '<div class="tt-row tt-active">' +
          '<span class="tt-swatch swatch-' + company + '-rd"></span>' +
          '<span class="tt-label">Unattributed</span>' +
          '<span class="tt-value">' + fmt(d.unattributed) + '</span>' +
        '</div>'
      : '<div class="tt-row ' + (metric === 'rd' ? 'tt-active' : 'tt-faded') + '">' +
          '<span class="tt-swatch swatch-' + company + '-rd"></span>' +
          '<span class="tt-label">Training and experiments<br><span class="tt-sublabel">(R&amp;D)</span></span>' +
          '<span class="tt-value">' + fmt(d.rd) + '</span>' +
        '</div>' +
        '<div class="tt-row ' + (metric === 'inference' ? 'tt-active' : 'tt-faded') + '">' +
          '<span class="tt-swatch swatch-' + company + '-inf"></span>' +
          '<span class="tt-label">Running the model<br><span class="tt-sublabel">(Inference)</span></span>' +
          '<span class="tt-value">' + fmt(d.inference) + '</span>' +
        '</div>';

    tooltip.innerHTML =
      '<div class="tt-header">' + year + ' &middot; ' + COMPANY[company] + '</div>' +
      rowsHTML +
      '<div class="tt-divider"></div>' +
      '<div class="tt-row tt-summary"><span class="tt-label">Total</span>' +
        '<span class="tt-value">' + fmt(d.total) +
        (d.estimated ? '<span class="tt-est-flag">est.</span>' : '') +
        '</span></div>' +
      '<div class="tt-row tt-summary"><span class="tt-label">Year</span>' +
        '<span class="tt-value">' + year + '</span></div>';

    tooltip.hidden = false;
    positionTooltip(seg);
  }

  function positionTooltip(seg) {
    const stageBox = stage.getBoundingClientRect();
    const segBox = seg.getBoundingClientRect();
    const ttBox = tooltip.getBoundingClientRect();

    let left = (segBox.right - stageBox.left) + 12;
    if (left + ttBox.width > stageBox.width - 8) {
      left = (segBox.left - stageBox.left) - ttBox.width - 12;
    }
    if (left < 8) left = 8;

    let top = (segBox.top - stageBox.top);
    if (top + ttBox.height > stageBox.height - 8) {
      top = stageBox.height - ttBox.height - 8;
    }
    if (top < 8) top = 8;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function hide() {
    tooltip.hidden = true;
    chart.removeAttribute('data-active');
    segments.forEach(s => s.classList.remove('is-active'));
  }

  // Hand-off: the bar's mouseleave fires when the cursor crosses onto the
  // tooltip. Defer the hide so the user can reach the source link.
  let hideTimer = null;
  const queueHide = () => { hideTimer = setTimeout(hide, 200); };
  const cancelHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => { cancelHide(); showFor(seg); });
    seg.addEventListener('mouseleave', queueHide);
    seg.addEventListener('focus', () => { cancelHide(); showFor(seg); });
    seg.addEventListener('blur', hide);
    seg.addEventListener('click', e => {
      e.stopPropagation();
      if (chart.getAttribute('data-active') === seg.dataset.segment) hide();
      else showFor(seg);
    });
    seg.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (chart.getAttribute('data-active') === seg.dataset.segment) hide();
        else showFor(seg);
      } else if (e.key === 'Escape') {
        hide();
        seg.blur();
      }
    });
  });

  tooltip.addEventListener('mouseenter', cancelHide);
  tooltip.addEventListener('mouseleave', hide);

  document.addEventListener('click', e => {
    if (!chart.contains(e.target)) hide();
  });
})();
