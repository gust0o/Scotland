// Travel-time engine — estimates how long it takes to move between two
// consecutive activities in a day, and suggests a sensible transport mode.
//
// Why this exists: every "gita" (day trip) used to draw a *symmetric* round
// trip to Edinburgh (Andata + Ritorno). Two trips in one day therefore counted
// two full round trips, even though in reality you hop straight from the first
// town to the second. Here we model the day as a chain of legs so the origin of
// each leg is the *previous* place, not always Edinburgh.
//
// Everything below is public information (town centres, station locations) and
// the times are clearly-labelled ESTIMATES — never a substitute for the real
// train/bus timetable. Coordinates are approximate; for in-town hops precision
// barely matters (they all bucket to "a piedi"), while the trip towns are
// distinct enough that the straight-line distance gives a fair estimate.

// Edinburgh hub used as origin of the first trip and destination of the last:
// Waverley station, the practical start/end of any day trip.
export const HUB = { name: "Edimburgo", coord: [55.9521, -3.1903] };

// Fallbacks for venues we don't pin individually (central Old/New Town is all
// walkable, so the city default keeps intra-city legs a short walk).
export const CITY_DEFAULT = [55.9496, -3.19]; // Royal Mile / Old Town
export const LONDON_DEFAULT = [51.523, -0.072]; // Brick Lane area

// Day-trip destinations (town centre / main station).
export const TRIP_COORDS = {
  "dt-glasgow": [55.8585, -4.2576], // Glasgow Central
  "dt-stirling": [56.1197, -3.9369], // Stirling station/centre
  "dt-standrews": [56.3398, -2.7967], // St Andrews
  "dt-lochlomond": [56.0021, -4.58], // Balloch / Loch Lomond
  "dt-musselburgh": [55.943, -3.07], // Fisherrow / Musselburgh
  "dt-nberwick": [56.0586, -2.716], // North Berwick
  "dt-falkirk": [56.0197, -3.756], // The Kelpies / Falkirk
  "dt-queensferry": [55.99, -3.4], // South Queensferry
  "dt-linlithgow": [55.978, -3.601], // Linlithgow
  "dt-dunfermline": [56.0719, -3.452], // Dunfermline
  "dt-rosslynchapel": [55.8553, -3.16], // Roslin
  "dt-dunbar": [56.004, -2.516], // Dunbar
  "dt-peebles": [55.652, -3.188], // Peebles
  "dt-culross": [56.056, -3.63], // Culross
  "dt-anstruthereast": [56.222, -2.7], // Anstruther / East Neuk
};

// City venues that sit away from the central core (Leith, Stockbridge,
// Duddingston, Morningside, …) — pinned so a leg there is correctly a bus/tram
// rather than a stroll. Anything not listed falls back to CITY_DEFAULT.
export const VENUE_COORDS = {
  // Edinburgh sights
  "es-castle": [55.9486, -3.2], "es-royalmile": [55.9496, -3.1869],
  "es-victoria": [55.9479, -3.1955], "es-dean": [55.951, -3.216],
  "es-holyrood": [55.9527, -3.1722], "es-arthurs": [55.944, -3.1619],
  "es-calton": [55.955, -3.1828], "es-britannia": [55.982, -3.176],
  "es-dynamic": [55.952, -3.174], "es-scottishnational2": [55.953, -3.223],
  "es-drneils": [55.9412, -3.1455], "es-nelsonmonument": [55.9549, -3.1822],
  // Edinburgh eats / pubs
  "ea-fishers": [55.976, -3.171], "ea-sheepheid": [55.943, -3.143],
  "ea-cannyman": [55.93, -3.205], "ea-littlechartroom": [55.97, -3.173],
  "ea-scranscallie": [55.959, -3.22], "ea-bennetsbar": [55.943, -3.205],
  "ea-lannanbakery": [55.959, -3.208],
};

// Resolve the coordinate of a scheduled event from its catalog entry.
// trip → its town; tvenue → the town of its parent trip; everything else →
// its pinned coord, or the city/London default.
export function coordForEvent(catalogEntry) {
  if (!catalogEntry) return CITY_DEFAULT;
  const { id, kind, trip, pool } = catalogEntry;
  if (kind === "trip") return TRIP_COORDS[id] || HUB.coord;
  if (kind === "tvenue") return TRIP_COORDS[trip] || HUB.coord;
  if (pool === "lon" || kind === "london") return LONDON_DEFAULT;
  return VENUE_COORDS[id] || CITY_DEFAULT;
}

// Great-circle distance in km between [lat,lng] pairs.
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Estimate a single leg between two coordinates. Picks the mode by distance —
// short = walk (free), a few km = bus/tram with a faster taxi alternative,
// longer = train/bus — and returns rounded minutes plus a clean label.
// `min` always accounts for a road/rail detour factor and access overhead.
export function travelLeg(from, to) {
  const km = haversineKm(from, to);
  if (km == null) return null;
  const walkMin = Math.max(3, Math.round(((km * 1.2) / 4.8) * 60)); // ~4.8 km/h
  const taxiMin = Math.round(((km * 1.3) / 26) * 60) + 4;

  // Very close: just walk (cheapest, no waiting).
  if (km < 1.5) {
    return { km, min: walkMin, mode: "A piedi", icon: "🚶", hint: "vicino", est: true };
  }
  // Still walkable, but close enough that a taxi is the faster option if you're
  // short on time (this is the user's "molto vicini → mezzo più rapido").
  if (km < 3.5) {
    return {
      km, min: walkMin, mode: "A piedi", icon: "🚶", hint: "a piedi o taxi",
      alt: { mode: "Taxi", icon: "🚕", min: taxiMin }, est: true,
    };
  }
  // A few km across town: bus/tram is the sensible (cheap) choice, taxi faster.
  if (km < 7) {
    const bus = Math.round(((km * 1.3) / 16) * 60) + 10; // incl. wait
    return {
      km, min: bus, mode: "Bus/Tram", icon: "🚌", hint: "in città",
      alt: { mode: "Taxi", icon: "🚕", min: taxiMin }, est: true,
    };
  }
  // Medium hop between towns: train or bus (the cheap public option).
  if (km < 28) {
    const min = Math.round(((km * 1.3) / 45) * 60) + 12;
    return { km, min, mode: "Treno/Bus", icon: "🚆", hint: "mezzi pubblici", est: true };
  }
  // Longer haul: train.
  const min = Math.round(((km * 1.3) / 68) * 60) + 15;
  return { km, min, mode: "Treno", icon: "🚆", hint: "tratta lunga", est: true };
}
