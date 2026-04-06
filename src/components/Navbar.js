// ═══════════════════════════════════════════════════════
// Navbar Component
// ═══════════════════════════════════════════════════════

import { getItineraryCount } from './ItineraryStore.js';

export function initNavbar(state) {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Theme toggle
  const themeBtn = navbar.querySelector('.navbar__theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wanderlust-theme', next);
      themeBtn.innerHTML = next === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    });
  }

  // Mobile menu toggle
  const mobileBtn = navbar.querySelector('.navbar__mobile-toggle');
  const links = navbar.querySelector('.navbar__links');
  if (mobileBtn && links) {
    mobileBtn.addEventListener('click', () => {
      links.classList.toggle('open');
    });
    links.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // Active state
  const currentRoute = state.currentRoute;
  navbar.querySelectorAll('.navbar__link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (
      (currentRoute === 'home' && (href === '#home' || href === '#')) ||
      (currentRoute === 'itinerary' && href === '#itinerary')
    ) {
      link.classList.add('active');
    }
  });

  updateNavBadge();
}

export function updateNavBadge() {
  const badge = document.querySelector('.navbar__itin-count');
  const count = getItineraryCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

export function createNavbarHTML() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const count = getItineraryCount();

  return `
    <nav class="navbar">
      <div class="navbar__inner">
        <a class="navbar__logo" href="#home">
          <i class="fas fa-compass"></i>
          Wanderlust
        </a>
        <div class="navbar__links">
          <a class="navbar__link" href="#home">
            <i class="fas fa-home"></i> Explore
          </a>
          <a class="navbar__link" href="#itinerary">
            <i class="fas fa-route"></i> My Itinerary
            <span class="navbar__itin-count" style="
              display: ${count > 0 ? 'inline-flex' : 'none'};
              align-items: center;
              justify-content: center;
              width: 20px; height: 20px;
              background: var(--color-accent);
              color: white;
              font-size: 11px;
              font-weight: 700;
              border-radius: 50%;
              margin-left: 4px;
            ">${count}</span>
          </a>
          <button class="navbar__theme-toggle" aria-label="Toggle theme">
            <i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>
          </button>
        </div>
        <button class="navbar__mobile-toggle" aria-label="Menu">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </nav>
  `;
}
