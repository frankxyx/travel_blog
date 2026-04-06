// ═══════════════════════════════════════════════════════
// FilterBar Component
// ═══════════════════════════════════════════════════════

const TAG_CONFIG = {
    hiking: { icon: 'fa-person-hiking', label: 'Hiking' },
    outdoor: { icon: 'fa-mountain-sun', label: 'Outdoor' },
    culture: { icon: 'fa-masks-theater', label: 'Culture' },
    history: { icon: 'fa-landmark', label: 'History' },
    'local-food': { icon: 'fa-utensils', label: 'Local Food' },
};

export function createFilterBarHTML(activeFilters) {
    const tags = Object.entries(TAG_CONFIG);

    return `
    <div class="filter-bar" id="filterBar">
      <button class="filter-chip ${activeFilters.length === 0 ? 'active' : ''}" data-tag="all">
        <i class="fas fa-globe"></i> All Trips
      </button>
      ${tags.map(([tag, config]) => `
        <button class="filter-chip ${activeFilters.includes(tag) ? 'active' : ''}" data-tag="${tag}">
          <i class="fas ${config.icon}"></i> ${config.label}
        </button>
      `).join('')}
    </div>
  `;
}

export function initFilterBar(state, onFilterChange) {
    const bar = document.getElementById('filterBar');
    if (!bar) return;

    bar.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        const tag = chip.dataset.tag;

        if (tag === 'all') {
            state.activeFilters = [];
        } else {
            const idx = state.activeFilters.indexOf(tag);
            if (idx > -1) {
                state.activeFilters.splice(idx, 1);
            } else {
                state.activeFilters.push(tag);
            }
        }

        onFilterChange(state.activeFilters);
    });
}

export function filterTrips(trips, activeFilters) {
    if (activeFilters.length === 0) return trips;
    return trips.filter(trip =>
        activeFilters.some(f => trip.tags.includes(f))
    );
}

export { TAG_CONFIG };
