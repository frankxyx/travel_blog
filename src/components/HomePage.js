// ═══════════════════════════════════════════════════════
// HomePage Component
// ═══════════════════════════════════════════════════════

import { createNavbarHTML } from './Navbar.js';
import { createFilterBarHTML, initFilterBar, filterTrips } from './FilterBar.js';
import { createTripCardHTML, initTripCards } from './TripCard.js';
import { createWorldMap } from './MapView.js';

export function renderHome(app, state) {
    const filteredTrips = filterTrips(state.trips, state.activeFilters);

    app.innerHTML = `
    ${createNavbarHTML()}

    <section class="hero">
      <div class="container">
        <div class="hero__tagline">
          <i class="fas fa-compass"></i>
          Curated adventures for the curious traveler
        </div>
        <h1 class="hero__title">Discover Your Next Adventure</h1>
        <p class="hero__subtitle">
          Explore hand-picked itineraries for hiking, local food, culture, history,
          and outdoor experiences — then build your own personalized trip.
        </p>
        <a href="#itinerary" class="hero__cta">
          <i class="fas fa-route"></i>
          Build My Itinerary
        </a>
      </div>
    </section>

    <section class="map-section">
      <div class="map-wrapper">
        <div class="section-header">
          <h2 class="section-header__title">Explore the Map</h2>
          <p class="section-header__subtitle">Click any marker to discover a trip</p>
        </div>
        <div class="map-container" id="worldMap"></div>
      </div>
    </section>

    <section class="itinerary-section" style="padding-bottom: 0;">
      <div class="container">
        <div class="section-header">
          <h2 class="section-header__title">Trip Collection</h2>
          <p class="section-header__subtitle">Filter by your interests and find your perfect trip</p>
        </div>
        ${createFilterBarHTML(state.activeFilters)}
        <div class="trips-grid" id="tripsGrid">
          ${filteredTrips.map(trip => createTripCardHTML(trip)).join('')}
        </div>
        ${filteredTrips.length === 0 ? `
          <div style="text-align: center; padding: 60px 20px; color: var(--color-text-muted);">
            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; color: var(--color-gray-300);"></i>
            <p>No trips match your selected filters</p>
          </div>
        ` : ''}
      </div>
    </section>

    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <i class="fas fa-compass"></i> Wanderlust
        </div>
        <p>Built with ❤️ by Frank Mayfield</p>
        <p style="margin-top: 8px;">
          <a href="https://github.com/frankxyx" target="_blank">
            <i class="fab fa-github"></i> GitHub
          </a>
        </p>
      </div>
    </footer>
  `;

    // Initialize interactive components
    initFilterBar(state, (filters) => {
        const filtered = filterTrips(state.trips, filters);
        const grid = document.getElementById('tripsGrid');
        if (grid) {
            grid.innerHTML = filtered.map(t => createTripCardHTML(t)).join('');
            if (filtered.length === 0) {
                grid.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: var(--color-text-muted); grid-column: 1/-1;">
            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; color: var(--color-gray-300);"></i>
            <p>No trips match your selected filters</p>
          </div>
        `;
            }
            initTripCards();
        }

        // Update filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.tag === 'all' && filters.length === 0) {
                chip.classList.add('active');
            } else if (filters.includes(chip.dataset.tag)) {
                chip.classList.add('active');
            }
        });
    });

    initTripCards();

    // Initialize world map
    setTimeout(() => {
        const mapEl = document.getElementById('worldMap');
        if (mapEl) {
            createWorldMap(mapEl, state.trips);
        }
    }, 100);
}
