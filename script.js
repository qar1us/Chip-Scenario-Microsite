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
      // Find the matching sidenote within the same containing element (li or p)
      const container = ref.closest('li, p');
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
