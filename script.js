// Scroll-spy: highlight active section in left timeline nav
(function () {
  const links = document.querySelectorAll('.timeline-list a');
  const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href')));

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(a => {
            a.classList.toggle('active', a.dataset.section === id);
          });
        }
      });
    },
    {
      rootMargin: '-30% 0px -55% 0px',
      threshold: 0,
    }
  );

  sections.forEach(s => s && observer.observe(s));
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
    'openai-2022':    { unattributed: 0.416, total: 0.416, estimated: true,  source: 'fortune.com' },
    'anthropic-2023': { unattributed: 0.285, total: 0.285, estimated: true,  source: 'theinformation.com' },
    'openai-2024':    { rd: 4.0, inference: 1.8, total: 5.8,  estimated: true,  source: 'theinformation.com' },
    'openai-2025':    { rd: 8.3, inference: 8.0, total: 16.3, estimated: false, source: 'theinformation.com' },
    'anthropic-2024': { rd: 1.5, inference: 1.0, total: 2.5,  estimated: true,  source: 'theinformation.com' },
    'anthropic-2025': { rd: 4.1, inference: 2.7, total: 6.8,  estimated: false, source: 'theinformation.com' }
  };
  const COMPANY = { openai: 'OpenAI', anthropic: 'Anthropic' };
  const fmt = v => v < 1 ? '$' + Math.round(v * 1000) + 'M' : '$' + v.toFixed(1) + 'B';

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
        '<span class="tt-value">' + year + '</span></div>' +
      '<div class="tt-row tt-summary"><span class="tt-label">Source</span>' +
        '<span class="tt-source-text">' + d.source + '</span></div>';

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

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => showFor(seg));
    seg.addEventListener('mouseleave', hide);
    seg.addEventListener('focus', () => showFor(seg));
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

  document.addEventListener('click', e => {
    if (!chart.contains(e.target)) hide();
  });
})();
