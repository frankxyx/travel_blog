// ═══════════════════════════════════════════════════════
// WANDERLUST — Main Application Entry
// ═══════════════════════════════════════════════════════

import 'leaflet/dist/leaflet.css';
import './styles/base.css';
import './styles/components.css';

import tripsData from './data/trips.json';
import { renderHome } from './components/HomePage.js';
import { renderTripDetail } from './components/TripDetail.js';
import { renderItineraryPage } from './components/ItineraryPage.js';
import { initNavbar } from './components/Navbar.js';
import { getItinerary } from './components/ItineraryStore.js';

// ── State ──────────────────────────────────────────
const state = {
    trips: tripsData,
    activeFilters: [],
    currentRoute: 'home',
    currentTripId: null,
};

// ── Router ─────────────────────────────────────────
function parseRoute() {
    const hash = window.location.hash.slice(1) || 'home';

    if (hash.startsWith('trip/')) {
        return { route: 'trip', tripId: hash.split('/')[1] };
    }
    if (hash === 'itinerary') {
        return { route: 'itinerary' };
    }
    return { route: 'home' };
}

function navigate(hash) {
    window.location.hash = hash;
}

function renderApp() {
    const { route, tripId } = parseRoute();
    state.currentRoute = route;
    state.currentTripId = tripId;

    const app = document.getElementById('app');

    // Clean up previous Leaflet maps
    const existingMaps = app.querySelectorAll('.leaflet-container');
    existingMaps.forEach(el => {
        if (el._leaflet_map) {
            el._leaflet_map.remove();
        }
    });

    switch (route) {
        case 'trip':
            const trip = state.trips.find(t => t.id === tripId);
            if (trip) {
                renderTripDetail(app, trip, state);
            } else {
                navigate('home');
            }
            break;
        case 'itinerary':
            renderItineraryPage(app, state);
            break;
        default:
            renderHome(app, state);
    }

    initNavbar(state);
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ── Init ───────────────────────────────────────────
window.addEventListener('hashchange', renderApp);
window.addEventListener('DOMContentLoaded', () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('wanderlust-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    renderApp();
});

// Export for use in components
export { state, navigate, renderApp };
