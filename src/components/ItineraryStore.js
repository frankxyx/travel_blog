// ═══════════════════════════════════════════════════════
// Itinerary Store — City-level localStorage persistence
// ═══════════════════════════════════════════════════════
//
// Stores an array of city entries:
//   { tripId: "croatia", stopIndex: 0, stopName: "Split" }
//

const STORAGE_KEY = 'wanderlust-itinerary';

export function getItinerary() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        // Migration: if old format (array of strings), clear it
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            saveItinerary([]);
            return [];
        }
        return data || [];
    } catch {
        return [];
    }
}

export function saveItinerary(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('itinerary-changed'));
}

export function addCityToItinerary(tripId, stopIndex, stopName) {
    const entries = getItinerary();
    const exists = entries.some(
        e => e.tripId === tripId && e.stopIndex === stopIndex
    );
    if (!exists) {
        entries.push({ tripId, stopIndex, stopName });
        saveItinerary(entries);
        return true;
    }
    return false;
}

export function removeCityFromItinerary(tripId, stopIndex) {
    const entries = getItinerary().filter(
        e => !(e.tripId === tripId && e.stopIndex === stopIndex)
    );
    saveItinerary(entries);
}

export function isCityInItinerary(tripId, stopIndex) {
    return getItinerary().some(
        e => e.tripId === tripId && e.stopIndex === stopIndex
    );
}

export function clearItinerary() {
    saveItinerary([]);
}

export function getItineraryCount() {
    return getItinerary().length;
}
