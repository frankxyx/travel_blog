// ═══════════════════════════════════════════════════════
// ItineraryPage — City-level itinerary builder
// ═══════════════════════════════════════════════════════

import { createNavbarHTML, updateNavBadge } from './Navbar.js';
import { getItinerary, saveItinerary, removeCityFromItinerary, clearItinerary } from './ItineraryStore.js';
import { createMap, addStopMarkers, drawRoute } from './MapView.js';
import { showToast } from './Toast.js';
import Sortable from 'sortablejs';
import L from 'leaflet';

const ACTIVITY_ICONS = {
  hiking: 'fa-person-hiking',
  outdoor: 'fa-mountain-sun',
  culture: 'fa-masks-theater',
  history: 'fa-landmark',
  'local-food': 'fa-utensils',
};

export function renderItineraryPage(app, state) {
  const entries = getItinerary();

  // Resolve each entry to its full stop data
  const resolvedEntries = entries.map(entry => {
    const trip = state.trips.find(t => t.id === entry.tripId);
    if (!trip) return null;
    const stop = trip.stops[entry.stopIndex];
    if (!stop) return null;
    return { ...entry, trip, stop };
  }).filter(Boolean);

  // Find transit connections between consecutive cities
  const transitConnections = [];
  for (let i = 0; i < resolvedEntries.length - 1; i++) {
    const curr = resolvedEntries[i];
    const next = resolvedEntries[i + 1];
    // Only look for transit if same trip
    if (curr.trip.id === next.trip.id && curr.trip.transit) {
      const transit = curr.trip.transit.find(
        t => t.from === curr.stop.name && t.to === next.stop.name
      );
      transitConnections.push(transit || null);
    } else {
      transitConnections.push(null);
    }
  }

  const totalDays = resolvedEntries.reduce((sum, e) => sum + (e.stop.suggestedDays || 1), 0);
  const countries = [...new Set(resolvedEntries.map(e => e.trip.country))];
  const allActivities = resolvedEntries.reduce((sum, e) => sum + (e.stop.activities?.length || 0), 0);

  app.innerHTML = `
    ${createNavbarHTML()}

    <section class="hero" style="padding-bottom: var(--space-8);">
      <div class="container">
        <h1 class="hero__title" style="font-size: var(--text-4xl);">
          <i class="fas fa-route" style="color: var(--color-sandstone);"></i>
          My Itinerary
        </h1>
        <p class="hero__subtitle">
          ${resolvedEntries.length > 0
      ? `${resolvedEntries.length} ${resolvedEntries.length === 1 ? 'city' : 'cities'} · ${totalDays} days · ${countries.length} ${countries.length === 1 ? 'country' : 'countries'}. Drag to reorder your route.`
      : 'Start building your dream journey — explore trips and add individual cities to your itinerary.'
    }
        </p>
        ${resolvedEntries.length === 0 ? `
          <a href="#home" class="hero__cta">
            <i class="fas fa-compass"></i> Explore Trips
          </a>
        ` : ''}
      </div>
    </section>

    ${resolvedEntries.length > 0 ? `
      <section class="itinerary-section">
        <div class="itinerary-builder">
          <div class="itinerary-builder__map-col">
            <div class="itinerary-panel">
              <div class="itinerary-panel__header">
                <div class="itinerary-panel__title">
                  <i class="fas fa-map"></i> Route Overview
                </div>
              </div>
              <div class="map-container" id="itineraryMap" style="height: 400px;"></div>
            </div>

            <div class="itinerary-panel" style="margin-top: var(--space-6);">
              <div class="itinerary-panel__header">
                <div class="itinerary-panel__title">
                  <i class="fas fa-chart-bar"></i> Trip Summary
                </div>
              </div>
              <div class="info-card__row">
                <span class="info-card__label">Cities</span>
                <span class="info-card__value">${resolvedEntries.length}</span>
              </div>
              <div class="info-card__row">
                <span class="info-card__label">Total Days</span>
                <span class="info-card__value">${totalDays} days</span>
              </div>
              <div class="info-card__row">
                <span class="info-card__label">Countries</span>
                <span class="info-card__value">${countries.join(', ')}</span>
              </div>
              <div class="info-card__row" style="border-bottom: none;">
                <span class="info-card__label">Activities</span>
                <span class="info-card__value">${allActivities} total</span>
              </div>
            </div>
          </div>

          <div class="itinerary-builder__list-col">
            <div class="itinerary-panel">
              <div class="itinerary-panel__header">
                <div class="itinerary-panel__title">
                  <i class="fas fa-list-check"></i> Your Route
                </div>
                <span class="itinerary-panel__count">${resolvedEntries.length} cities</span>
              </div>

              <div id="itineraryList">
                ${resolvedEntries.map((entry, idx) => `
                  ${idx > 0 ? renderItinTransit(transitConnections[idx - 1]) : ''}
                  ${createCityItineraryItem(entry, idx)}
                `).join('')}
              </div>

              <div class="itinerary-panel__actions">
                <button class="btn btn--outline" id="clearItinBtn" style="flex:1;">
                  <i class="fas fa-trash-alt"></i> Clear All
                </button>
              </div>
            </div>

            <!-- Activities timeline for the full itinerary -->
            <div class="itinerary-panel" style="margin-top: var(--space-6);">
              <div class="itinerary-panel__header">
                <div class="itinerary-panel__title">
                  <i class="fas fa-compass"></i> Activities Overview
                </div>
              </div>
              ${resolvedEntries.map(entry => `
                <div class="itin-city-activities">
                  <div class="itin-city-activities__header">
                    <span class="itin-city-activities__name">
                      <i class="fas fa-map-pin" style="color: var(--color-accent);"></i>
                      ${entry.stop.name}
                    </span>
                    <span class="itin-city-activities__days">
                      ${entry.stop.suggestedDays} day${entry.stop.suggestedDays > 1 ? 's' : ''}
                    </span>
                  </div>
                  ${entry.stop.activities && entry.stop.activities.length > 0 ? `
                    <div class="itin-activity-list">
                      ${entry.stop.activities.map(act => `
                        <div class="itin-activity">
                          <i class="fas ${ACTIVITY_ICONS[act.type] || 'fa-star'}" style="color: var(--color-primary); width: 16px;"></i>
                          <div class="itin-activity__info">
                            <span class="itin-activity__name">${act.name}</span>
                            <span class="itin-activity__duration">${act.duration}</span>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : '<p style="font-size: var(--text-sm); color: var(--color-text-light); padding: var(--space-2) 0;">No activities listed</p>'}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    ` : ''}

    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <i class="fas fa-compass"></i> Wanderlust
        </div>
        <p>Built with ❤️ by Frank Mayfield</p>
      </div>
    </footer>
  `;

  // ── Initialize Map ──
  if (resolvedEntries.length > 0) {
    setTimeout(() => {
      const mapEl = document.getElementById('itineraryMap');
      if (mapEl) {
        const allStops = resolvedEntries.map(e => e.stop);
        const bounds = L.latLngBounds(allStops.map(s => s.coords));
        const map = createMap(mapEl, bounds.getCenter(), 2);
        map.fitBounds(bounds, { padding: [40, 40] });

        // Add numbered markers
        allStops.forEach((stop, i) => {
          const entry = resolvedEntries[i];
          const marker = L.marker(stop.coords).addTo(map);
          marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; text-align: center;">
              <strong>${stop.name}</strong><br>
              <small style="color:#666;">${entry.trip.country} · ${stop.suggestedDays} days</small>
            </div>
          `);
        });

        // Connect consecutive cities with lines
        if (allStops.length > 1) {
          const routeCoords = allStops.map(s => s.coords);
          L.polyline(routeCoords, {
            color: '#c96b4f',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 8',
          }).addTo(map);
        }
      }
    }, 100);

    // ── Sortable (drag-and-drop reorder) ──
    setTimeout(() => {
      const listEl = document.getElementById('itineraryList');
      if (listEl) {
        Sortable.create(listEl, {
          handle: '.itinerary-item__drag',
          animation: 200,
          ghostClass: 'sortable-ghost',
          draggable: '.itinerary-item',
          onEnd: () => {
            const newOrder = Array.from(listEl.querySelectorAll('.itinerary-item'))
              .map(el => ({
                tripId: el.dataset.tripId,
                stopIndex: parseInt(el.dataset.stopIndex),
                stopName: el.dataset.stopName,
              }));
            saveItinerary(newOrder);
            showToast('Route reordered');
            // Re-render to update transit connections
            renderItineraryPage(app, state);
          },
        });
      }
    }, 50);

    // ── Remove buttons ──
    document.querySelectorAll('[data-action="remove-city"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tripId = btn.dataset.tripId;
        const stopIndex = parseInt(btn.dataset.stopIndex);
        const name = btn.dataset.stopName;
        removeCityFromItinerary(tripId, stopIndex);
        showToast(`${name} removed`);
        renderItineraryPage(app, state);
      });
    });

    // ── View trip buttons ──
    document.querySelectorAll('[data-action="view-trip"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = `trip/${btn.dataset.tripId}`;
      });
    });

    // ── Clear all ──
    document.getElementById('clearItinBtn')?.addEventListener('click', () => {
      if (confirm('Clear all cities from your itinerary?')) {
        clearItinerary();
        showToast('Itinerary cleared');
        renderItineraryPage(app, state);
      }
    });
  }
}

function createCityItineraryItem(entry, index) {
  const { trip, stop, tripId, stopIndex, stopName } = entry;
  return `
    <div class="itinerary-item" data-trip-id="${tripId}" data-stop-index="${stopIndex}" data-stop-name="${stopName}">
      <div class="itinerary-item__drag">
        <i class="fas fa-grip-vertical"></i>
      </div>
      <div class="itinerary-item__number">${index + 1}</div>
      <div class="itinerary-item__info">
        <div class="itinerary-item__name">${stop.name}</div>
        <div class="itinerary-item__country">
          ${trip.country} · ${stop.suggestedDays} day${stop.suggestedDays > 1 ? 's' : ''} · ${stop.activities?.length || 0} activities
        </div>
      </div>
      <button
        class="itinerary-item__remove"
        data-action="view-trip"
        data-trip-id="${tripId}"
        title="View trip"
        style="color: var(--color-primary);"
      >
        <i class="fas fa-external-link-alt"></i>
      </button>
      <button
        class="itinerary-item__remove"
        data-action="remove-city"
        data-trip-id="${tripId}"
        data-stop-index="${stopIndex}"
        data-stop-name="${stopName}"
        title="Remove from itinerary"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

function renderItinTransit(transit) {
  if (!transit) {
    return `
      <div class="itin-transit itin-transit--none">
        <div class="itin-transit__line"></div>
        <span class="itin-transit__label">
          <i class="fas fa-ellipsis-h"></i>
        </span>
        <div class="itin-transit__line"></div>
      </div>
    `;
  }
  return `
    <div class="itin-transit">
      <div class="itin-transit__line"></div>
      <span class="itin-transit__label">
        <i class="fas fa-${getTransitIcon(transit.mode)}"></i>
        ${transit.mode} · ${transit.duration} · ${transit.cost}
      </span>
      <div class="itin-transit__line"></div>
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
