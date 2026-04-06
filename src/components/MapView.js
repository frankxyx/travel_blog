// ═══════════════════════════════════════════════════════
// MapView — Shared Leaflet map utilities
// ═══════════════════════════════════════════════════════

import L from 'leaflet';

// Fix Leaflet default icon paths (broken by bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const JAWG_TOKEN = import.meta.env.VITE_JAWG_TOKEN;

const TILE_URL = JAWG_TOKEN
    ? `https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=${JAWG_TOKEN}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const TILE_ATTR = JAWG_TOKEN
    ? 'Tiles &copy; <a href="https://www.jawg.io/" target="_blank">Jawg</a> – &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Create a Leaflet map in the given container element
 */
export function createMap(container, center, zoom) {
    const map = L.map(container, {
        scrollWheelZoom: true,
        zoomControl: true,
    }).setView(center, zoom);

    L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        minZoom: 0,
        maxZoom: 18,
    }).addTo(map);

    // Store reference for cleanup
    container._leaflet_map = map;

    return map;
}

/**
 * Add markers for trip stops with popups
 */
export function addStopMarkers(map, stops, options = {}) {
    const markers = [];
    stops.forEach((stop, index) => {
        const marker = L.marker(stop.coords).addTo(map);
        const popupContent = `
      <div style="text-align:center; font-family: 'Inter', sans-serif;">
        <strong style="font-size: 14px;">${stop.name}</strong>
        ${stop.highlights ? `<br><small style="color:#666;">${stop.highlights.slice(0, 2).join(', ')}</small>` : ''}
      </div>
    `;
        marker.bindPopup(popupContent);

        if (options.onClick) {
            marker.on('click', () => options.onClick(stop, index));
        }

        markers.push(marker);
    });
    return markers;
}

/**
 * Draw a dashed route polyline between stops
 */
export function drawRoute(map, stops, color = '#c96b4f') {
    const coords = stops.map(s => s.coords);
    return L.polyline(coords, {
        color,
        weight: 3,
        opacity: 0.75,
        dashArray: '8, 8',
    }).addTo(map);
}

/**
 * Create a world map with all trip markers
 */
export function createWorldMap(container, trips, onTripClick) {
    const map = createMap(container, [25, 10], 2);

    trips.forEach(trip => {
        const mainStop = trip.stops[0];
        const marker = L.marker(mainStop.coords).addTo(map);

        const popup = `
      <div style="text-align:center; font-family: 'Inter', sans-serif; min-width: 140px;">
        <strong style="font-size: 14px;">${trip.title}</strong><br>
        <small style="color:#666;">${trip.country}</small><br>
        <a href="#trip/${trip.id}" style="
          display: inline-block;
          margin-top: 6px;
          padding: 4px 12px;
          background: #c96b4f;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        ">View Trip →</a>
      </div>
    `;
        marker.bindPopup(popup);

        if (onTripClick) {
            marker.on('click', () => marker.openPopup());
        }
    });

    return map;
}
