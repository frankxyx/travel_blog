// ═══════════════════════════════════════════════════════
// TripCard Component
// ═══════════════════════════════════════════════════════

export function createTripCardHTML(trip) {
  const dateStr = new Date(trip.dates.start).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });

  const totalActivities = trip.stops.reduce((sum, s) => sum + (s.activities?.length || 0), 0);

  return `
    <article class="trip-card" data-trip-id="${trip.id}">
      <div class="trip-card__image-wrapper">
        <img
          class="trip-card__image"
          src="./assets/images/${trip.imagePrefix}1.jpg"
          alt="${trip.title}"
          loading="lazy"
        />
        <span class="trip-card__badge">${trip.durationDays} days</span>
      </div>
      <div class="trip-card__body">
        <div class="trip-card__country">${trip.country}</div>
        <h3 class="trip-card__title">${trip.title}</h3>
        <div class="trip-card__route">
          <i class="fas fa-route"></i>
          ${trip.route}
        </div>
        <div class="trip-card__meta">
          <span class="trip-card__meta-item">
            <i class="fas fa-calendar-alt"></i> ${dateStr}
          </span>
          <span class="trip-card__meta-item difficulty--${trip.difficulty}">
            <i class="fas fa-signal"></i> ${capitalize(trip.difficulty)}
          </span>
          <span class="trip-card__meta-item">
            <i class="fas fa-city"></i> ${trip.stops.length} ${trip.stops.length === 1 ? 'city' : 'cities'}
          </span>
          <span class="trip-card__meta-item">
            <i class="fas fa-compass"></i> ${totalActivities} activities
          </span>
        </div>
        <div class="trip-card__tags">
          ${trip.tags.map(tag => `<span class="trip-card__tag">${formatTag(tag)}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

export function initTripCards() {
  document.querySelectorAll('.trip-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const tripId = card.dataset.tripId;
      window.location.hash = `trip/${tripId}`;
    });
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTag(tag) {
  return tag.split('-').map(capitalize).join(' ');
}
