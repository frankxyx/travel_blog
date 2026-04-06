// ═══════════════════════════════════════════════════════
// TripDetail Component — City-level itinerary builder
// ═══════════════════════════════════════════════════════

import { createNavbarHTML, updateNavBadge } from './Navbar.js';
import { createMap, addStopMarkers, drawRoute } from './MapView.js';
import { isCityInItinerary, addCityToItinerary, removeCityFromItinerary } from './ItineraryStore.js';
import { showToast } from './Toast.js';

const ACTIVITY_ICONS = {
  hiking: 'fa-person-hiking',
  outdoor: 'fa-mountain-sun',
  culture: 'fa-masks-theater',
  history: 'fa-landmark',
  'local-food': 'fa-utensils',
};

export function renderTripDetail(app, trip, state) {
  const dateRange = formatDateRange(trip.dates.start, trip.dates.end);

  app.innerHTML = `
    ${createNavbarHTML()}

    <div class="trip-detail page-enter">
      <div class="trip-detail__hero">
        <img
          class="trip-detail__hero-img"
          src="./assets/images/${trip.imagePrefix}1.jpg"
          alt="${trip.title}"
        />
        <div class="trip-detail__hero-overlay">
          <a class="trip-detail__back" href="#home">
            <i class="fas fa-arrow-left"></i> Back to Explore
          </a>
          <div class="trip-detail__hero-content">
            <span class="trip-detail__country-badge">${trip.country}</span>
            <h1 class="trip-detail__title">${trip.title}</h1>
            <div class="trip-detail__route">
              <i class="fas fa-route"></i> ${trip.route}
            </div>
          </div>
        </div>
      </div>

      <div class="trip-detail__content">
        <div class="trip-detail__main">
          <div class="trip-detail__description">
            ${trip.description.split('\n\n').map(p => `<p>${p}</p>`).join('')}
          </div>

          <div class="trip-detail__map" id="detailMap"></div>

          <!-- City-by-city breakdown -->
          <div class="city-breakdown">
            <h2 class="city-breakdown__title">
              <i class="fas fa-city" style="color: var(--color-accent);"></i>
              City Guide
            </h2>
            <p class="city-breakdown__subtitle">
              Add individual cities to your itinerary and see what to do in each.
            </p>

            ${trip.stops.map((stop, idx) => renderCityCard(trip, stop, idx)).join('')}

            ${trip.transit && trip.transit.length > 0 ? `
              <div class="transit-overview">
                <h3 class="transit-overview__title">
                  <i class="fas fa-train" style="color: var(--color-ocean);"></i>
                  Getting Around
                </h3>
                ${trip.transit.map(t => renderTransitCard(t)).join('')}
              </div>
            ` : ''}
          </div>

          <div class="gallery">
            <h2 class="gallery__title">
              <i class="fas fa-images" style="color: var(--color-accent);"></i>
              Photo Gallery
            </h2>
            <div class="gallery__grid" id="galleryGrid">
              ${Array.from({ length: trip.imageCount }, (_, i) => `
                <div class="gallery__item" data-index="${i}">
                  <img
                    src="./assets/images/${trip.imagePrefix}${i + 1}.jpg"
                    alt="${trip.title} – Photo ${i + 1}"
                    loading="lazy"
                  />
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="trip-detail__sidebar">
          <div class="info-card">
            <div class="info-card__title">
              <i class="fas fa-info-circle"></i> Trip Details
            </div>
            <div class="info-card__row">
              <span class="info-card__label">Duration</span>
              <span class="info-card__value">${trip.durationDays} days</span>
            </div>
            <div class="info-card__row">
              <span class="info-card__label">Dates</span>
              <span class="info-card__value">${dateRange}</span>
            </div>
            <div class="info-card__row">
              <span class="info-card__label">Best Season</span>
              <span class="info-card__value">${capitalize(trip.bestSeason)}</span>
            </div>
            <div class="info-card__row">
              <span class="info-card__label">Difficulty</span>
              <span class="info-card__value difficulty--${trip.difficulty}">${capitalize(trip.difficulty)}</span>
            </div>
            <div class="info-card__row">
              <span class="info-card__label">Budget</span>
              <span class="info-card__value budget--${trip.budgetLevel}">${capitalize(trip.budgetLevel)}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card__title">
              <i class="fas fa-map-marker-alt"></i> Stops — Click to add
            </div>
            <ul class="stops-list">
              ${trip.stops.map((stop, idx) => {
    const inItin = isCityInItinerary(trip.id, idx);
    return `
                <li class="stop-item stop-item--clickable" data-trip-id="${trip.id}" data-stop-index="${idx}">
                  <div class="stop-item__marker">${idx + 1}</div>
                  <div class="stop-item__info">
                    <div class="stop-item__name">${stop.name}</div>
                    <div class="stop-item__meta-line">
                      <i class="fas fa-calendar-day"></i> ${stop.suggestedDays} day${stop.suggestedDays > 1 ? 's' : ''}
                      · ${stop.activities ? stop.activities.length : 0} activities
                    </div>
                  </div>
                  <button
                    class="stop-item__add-btn ${inItin ? 'added' : ''}"
                    data-action="toggle-city"
                    data-trip-id="${trip.id}"
                    data-stop-index="${idx}"
                    data-stop-name="${stop.name}"
                    title="${inItin ? 'Remove from itinerary' : 'Add to itinerary'}"
                  >
                    <i class="fas fa-${inItin ? 'check' : 'plus'}"></i>
                  </button>
                </li>
              `}).join('')}
            </ul>
          </div>

          ${trip.transit && trip.transit.length > 0 ? `
            <div class="info-card">
              <div class="info-card__title">
                <i class="fas fa-directions"></i> Transit
              </div>
              ${trip.transit.map(t => `
                <div class="info-card__row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                  <span class="info-card__value" style="font-size: var(--text-sm);">
                    ${t.from} → ${t.to}
                  </span>
                  <span class="info-card__label" style="font-size: var(--text-xs);">
                    <i class="fas fa-${getTransitIcon(t.mode)}"></i>
                    ${t.mode} · ${t.duration} · ${t.cost}
                  </span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="info-card" style="padding: var(--space-4);">
            <div class="trip-card__tags" style="border: none; padding: 0; margin: 0;">
              ${trip.tags.map(tag => `
                <span class="trip-card__tag" style="padding: 4px 10px; font-size: 12px;">
                  ${formatTag(tag)}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__brand">
            <i class="fas fa-compass"></i> Wanderlust
          </div>
          <p>Built with ❤️ by Frank Mayfield</p>
        </div>
      </footer>
    </div>

    <!-- Lightbox -->
    <div class="lightbox" id="lightbox">
      <button class="lightbox__close" id="lightboxClose">
        <i class="fas fa-times"></i>
      </button>
      <button class="lightbox__nav lightbox__nav--prev" id="lightboxPrev">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="lightbox__nav lightbox__nav--next" id="lightboxNext">
        <i class="fas fa-chevron-right"></i>
      </button>
      <img class="lightbox__img" id="lightboxImg" src="" alt="" />
    </div>
  `;

  // ── Init Map ──
  setTimeout(() => {
    const mapEl = document.getElementById('detailMap');
    if (mapEl) {
      const map = createMap(mapEl, trip.mapCenter, trip.mapZoom);
      addStopMarkers(map, trip.stops);
      if (trip.stops.length > 1) {
        drawRoute(map, trip.stops);
      }
    }
  }, 100);

  // ── Lightbox ──
  initLightbox(trip);

  // ── City toggle buttons (sidebar + city cards) ──
  document.querySelectorAll('[data-action="toggle-city"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tripId = btn.dataset.tripId;
      const stopIndex = parseInt(btn.dataset.stopIndex);
      const stopName = btn.dataset.stopName;

      if (isCityInItinerary(tripId, stopIndex)) {
        removeCityFromItinerary(tripId, stopIndex);
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        btn.title = 'Add to itinerary';
        // If it's a full-width button, also update text
        const label = btn.querySelector('.btn-label');
        if (label) label.textContent = `Add ${stopName} to Itinerary`;
        showToast(`${stopName} removed from itinerary`);
      } else {
        addCityToItinerary(tripId, stopIndex, stopName);
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.title = 'Remove from itinerary';
        const label = btn.querySelector('.btn-label');
        if (label) label.textContent = `${stopName} in Itinerary`;
        showToast(`${stopName} added to itinerary! 📍`);
      }

      // Sync all buttons for the same city
      syncCityButtons(tripId, stopIndex);
      updateNavBadge();
    });
  });

  // Full-width city card buttons
  document.querySelectorAll('[data-action="toggle-city-full"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tripId = btn.dataset.tripId;
      const stopIndex = parseInt(btn.dataset.stopIndex);
      const stopName = btn.dataset.stopName;
      const labelEl = btn.querySelector('.btn-label');

      if (isCityInItinerary(tripId, stopIndex)) {
        removeCityFromItinerary(tripId, stopIndex);
        btn.classList.remove('btn--outline');
        btn.classList.add('btn--accent');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-plus';
        if (labelEl) labelEl.textContent = `Add ${stopName} to Itinerary`;
        showToast(`${stopName} removed from itinerary`);
      } else {
        addCityToItinerary(tripId, stopIndex, stopName);
        btn.classList.remove('btn--accent');
        btn.classList.add('btn--outline');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-check';
        if (labelEl) labelEl.textContent = `${stopName} in Itinerary`;
        showToast(`${stopName} added to itinerary! 📍`);
      }

      syncCityButtons(tripId, stopIndex);
      updateNavBadge();
    });
  });
}

function syncCityButtons(tripId, stopIndex) {
  const inItin = isCityInItinerary(tripId, stopIndex);
  // Sync small sidebar buttons
  document.querySelectorAll(`[data-action="toggle-city"][data-trip-id="${tripId}"][data-stop-index="${stopIndex}"]`).forEach(b => {
    b.classList.toggle('added', inItin);
    b.innerHTML = `<i class="fas fa-${inItin ? 'check' : 'plus'}"></i>`;
  });
}

function renderCityCard(trip, stop, idx) {
  const inItin = isCityInItinerary(trip.id, idx);
  const transitTo = trip.transit?.find(t => t.to === stop.name);
  const transitToNext = trip.transit?.find(t => t.from === stop.name);

  return `
    ${transitTo ? renderTransitBanner(transitTo) : ''}

    <div class="city-card" id="city-${trip.id}-${idx}">
      <div class="city-card__header">
        <div class="city-card__number">${idx + 1}</div>
        <div class="city-card__title-block">
          <h3 class="city-card__name">${stop.name}</h3>
          <div class="city-card__meta">
            <span><i class="fas fa-calendar-day"></i> ${stop.suggestedDays} day${stop.suggestedDays > 1 ? 's' : ''} suggested</span>
            <span><i class="fas fa-list"></i> ${stop.activities ? stop.activities.length : 0} activities</span>
          </div>
        </div>
        <button
          class="btn ${inItin ? 'btn--outline' : 'btn--accent'} city-card__add-btn"
          data-action="toggle-city-full"
          data-trip-id="${trip.id}"
          data-stop-index="${idx}"
          data-stop-name="${stop.name}"
        >
          <i class="fas fa-${inItin ? 'check' : 'plus'}"></i>
          <span class="btn-label">${inItin ? `${stop.name} in Itinerary` : `Add ${stop.name} to Itinerary`}</span>
        </button>
      </div>

      ${stop.description ? `
        <p class="city-card__description">${stop.description}</p>
      ` : ''}

      ${stop.activities && stop.activities.length > 0 ? `
        <div class="city-card__activities">
          <h4 class="city-card__section-title">
            <i class="fas fa-compass"></i> Things to Do
          </h4>
          <div class="activity-list">
            ${stop.activities.map(act => `
              <div class="activity-item">
                <div class="activity-item__icon">
                  <i class="fas ${ACTIVITY_ICONS[act.type] || 'fa-star'}"></i>
                </div>
                <div class="activity-item__info">
                  <div class="activity-item__name">${act.name}</div>
                  <div class="activity-item__description">${act.description}</div>
                  <div class="activity-item__meta">
                    <span class="activity-item__tag">${formatTag(act.type)}</span>
                    <span class="activity-item__duration"><i class="fas fa-clock"></i> ${act.duration}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTransitBanner(transit) {
  return `
    <div class="transit-banner">
      <div class="transit-banner__line"></div>
      <div class="transit-banner__content">
        <i class="fas fa-${getTransitIcon(transit.mode)}"></i>
        <div class="transit-banner__info">
          <strong>${transit.from} → ${transit.to}</strong>
          <span>${transit.mode} · ${transit.duration} · ${transit.cost}</span>
        </div>
      </div>
      <div class="transit-banner__line"></div>
    </div>
  `;
}

function renderTransitCard(transit) {
  return `
    <div class="transit-card">
      <div class="transit-card__route">
        <span class="transit-card__city">${transit.from}</span>
        <i class="fas fa-arrow-right" style="color: var(--color-text-light); font-size: var(--text-xs);"></i>
        <span class="transit-card__city">${transit.to}</span>
      </div>
      <div class="transit-card__details">
        <div class="transit-card__mode">
          <i class="fas fa-${getTransitIcon(transit.mode)}"></i>
          <strong>${transit.mode}</strong>
        </div>
        <div class="transit-card__meta">
          <span><i class="fas fa-clock"></i> ${transit.duration}</span>
          <span><i class="fas fa-tag"></i> ${transit.cost}</span>
        </div>
        <p class="transit-card__description">${transit.details}</p>
      </div>
    </div>
  `;
}

function getTransitIcon(mode) {
  const m = mode.toLowerCase();
  if (m.includes('train') || m.includes('rail')) return 'fa-train';
  if (m.includes('bus')) return 'fa-bus';
  if (m.includes('car')) return 'fa-car';
  if (m.includes('walk')) return 'fa-walking';
  if (m.includes('ferry') || m.includes('boat')) return 'fa-ship';
  if (m.includes('4wd') || m.includes('vehicle')) return 'fa-truck-pickup';
  if (m.includes('coach')) return 'fa-bus';
  return 'fa-route';
}

function initLightbox(trip) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  let currentIndex = 0;

  const gallery = document.getElementById('galleryGrid');
  if (gallery) {
    gallery.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery__item');
      if (!item) return;
      currentIndex = parseInt(item.dataset.index);
      openLightbox(trip, currentIndex);
    });
  }

  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev')?.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + trip.imageCount) % trip.imageCount;
    showImage(trip, currentIndex);
  });
  document.getElementById('lightboxNext')?.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % trip.imageCount;
    showImage(trip, currentIndex);
  });

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + trip.imageCount) % trip.imageCount;
      showImage(trip, currentIndex);
    }
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % trip.imageCount;
      showImage(trip, currentIndex);
    }
  });

  function openLightbox(trip, index) {
    showImage(trip, index);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function showImage(trip, index) {
    lightboxImg.src = `./assets/images/${trip.imagePrefix}${index + 1}.jpg`;
    lightboxImg.alt = `${trip.title} – Photo ${index + 1}`;
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function formatDateRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: 'short', year: 'numeric' };
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', ...opts })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', ...opts })}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTag(tag) {
  return tag.split('-').map(capitalize).join(' ');
}
