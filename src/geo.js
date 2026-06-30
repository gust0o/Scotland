// Travel engine — estimates how you move between two consecutive points in a
// day: the time, a sensible transport mode, AND a rough cost (GBP).
//
// Design note ("salviamo tutte le combinazioni"): we do NOT store an N×N matrix
// of every pair. We store one coordinate per place (O(N) data) and derive every
// pairwise leg on demand from it — so all combinations are always available,
// nothing goes stale, and adding a venue costs one line. travelLeg() turns a
// pair of coordinates into the set of realistic options and a recommended pick;
// the UI then chooses dynamically based on which two places are adjacent.
//
// All numbers are clearly-labelled ESTIMATES (straight-line distance × a detour
// factor, average speeds, published Edinburgh fares) — never a substitute for a
// live timetable or a real Uber quote. Coordinates are public information.

export const HUB = { name: "Edimburgo", coord: [55.9521, -3.1903] }; // Waverley
export const CITY_DEFAULT = [55.9496, -3.19]; // central Old/New Town fallback
export const LONDON_DEFAULT = [51.523, -0.072]; // Brick Lane / Shoreditch

// Distance (km) above which a leg is treated as inter-town: no walking, public
// transport is the default, and an Uber is offered only when it stays cheap.
const CITY_KM = 12;
const UBER_CAP = 20; // £ — above this per leg, don't suggest Uber

// Edinburgh single fares / car pricing used for the estimates (2025, approx).
const TRANSIT_CITY_FARE = 2.0; // Lothian bus/tram single, flat
const UBER_BASE = 2.5, UBER_PER_MI = 1.3, UBER_PER_MIN = 0.16, UBER_MIN = 6.5;

// Day-trip destinations (town centre / main station).
export const TRIP_COORDS = {
  "dt-glasgow": [55.8585, -4.2576], "dt-stirling": [56.1197, -3.9369],
  "dt-standrews": [56.3398, -2.7967], "dt-lochlomond": [56.0021, -4.58],
  "dt-musselburgh": [55.943, -3.07], "dt-nberwick": [56.0586, -2.716],
  "dt-falkirk": [56.0197, -3.756], "dt-queensferry": [55.99, -3.4],
  "dt-linlithgow": [55.978, -3.601], "dt-dunfermline": [56.0719, -3.452],
  "dt-rosslynchapel": [55.8553, -3.16], "dt-dunbar": [56.004, -2.516],
  "dt-peebles": [55.652, -3.188], "dt-culross": [56.056, -3.63],
  "dt-anstruthereast": [56.222, -2.7],
};

// Every schedulable city venue, pinned. Out-of-centre spots (Leith, Stockbridge,
// Morningside, Tollcross, Duddingston, Arthur's Seat) are what make the mode
// choice meaningful — a walk in the Old Town vs a bus out to The Shore.
export const VENUE_COORDS = {
  // Edinburgh — sights
  "es-castle": [55.9486, -3.1999], "es-royalmile": [55.95, -3.186],
  "es-victoria": [55.9478, -3.1953], "es-dean": [55.9512, -3.2165],
  "es-holyrood": [55.9527, -3.1722], "es-arthurs": [55.944, -3.1618],
  "es-calton": [55.955, -3.1826], "es-maryking": [55.9497, -3.1907],
  "es-greyfriars": [55.9468, -3.1923], "es-camera": [55.9486, -3.1947],
  "es-dynamic": [55.9519, -3.1741], "es-natmuseum": [55.9469, -3.1896],
  "es-natgallery": [55.951, -3.1956], "es-britannia": [55.9819, -3.1764],
  "es-johnnie": [55.9519, -3.1986], "es-scottmonument": [55.9521, -3.1934],
  "es-gilescathedral": [55.9496, -3.1905], "es-scotchwhisky": [55.9485, -3.1958],
  "es-scottishnational": [55.9542, -3.1933], "es-scottishnational2": [55.9527, -3.2228],
  "es-surgeonshall": [55.9458, -3.1839], "es-writersmuseum": [55.9497, -3.1928],
  "es-nelsonmonument": [55.9549, -3.1822], "es-museummound": [55.9505, -3.1947],
  "es-drneils": [55.9412, -3.1455], "es-gladstonesland": [55.9496, -3.1937],
  // Edinburgh — eats / pubs
  "ea-oink": [55.9489, -3.1872], "ea-makars": [55.9492, -3.1949],
  "ea-witchery": [55.9486, -3.1962], "ea-ondine": [55.9492, -3.1949],
  "ea-angels": [55.9497, -3.1907], "ea-marymilk": [55.9472, -3.1957],
  "ea-lovecrumbs": [55.9461, -3.2014], "ea-fishers": [55.9759, -3.1709],
  "ea-sandybells": [55.9466, -3.1906], "ea-sheepheid": [55.943, -3.1428],
  "ea-cannyman": [55.93, -3.2049], "ea-timberyard": [55.9459, -3.202],
  "ea-littlechartroom": [55.9699, -3.1729], "ea-noto": [55.9538, -3.1965],
  "ea-scranscallie": [55.9588, -3.2199], "ea-dishoomedinburgh": [55.9543, -3.1922],
  "ea-bowbar": [55.9479, -3.1953], "ea-devilsadvocate": [55.9497, -3.1915],
  "ea-bennetsbar": [55.943, -3.2055], "ea-caferoyal": [55.9535, -3.1907],
  "ea-pandasons": [55.954, -3.1985], "ea-lannanbakery": [55.959, -3.2078],
  "ea-alandasgelato": [55.9466, -3.1903], "ea-cairngormcoffee": [55.9525, -3.1981],
};

// Resolve the coordinate of a scheduled event from its catalog entry.
export function coordForEvent(catalogEntry) {
  if (!catalogEntry) return CITY_DEFAULT;
  const { id, kind, trip, pool } = catalogEntry;
  if (kind === "trip") return TRIP_COORDS[id] || HUB.coord;
  if (kind === "tvenue") return TRIP_COORDS[trip] || HUB.coord;
  if (pool === "lon" || kind === "london") return LONDON_DEFAULT;
  return VENUE_COORDS[id] || CITY_DEFAULT;
}

// Parse a coordinate the user dropped into reserved JSON: "55.93,-3.12", an
// object {lat,lng}, or a Google Maps URL containing @lat,lng or q=lat,lng.
// Returns [lat,lng] or null. Lets the hotel (private) become a real origin.
export function parseCoord(v) {
  if (!v) return null;
  if (Array.isArray(v) && v.length === 2) return [Number(v[0]), Number(v[1])];
  if (typeof v === "object" && v.lat != null && (v.lng != null || v.lon != null))
    return [Number(v.lat), Number(v.lng != null ? v.lng : v.lon)];
  if (typeof v === "string") {
    const m = v.match(/(-?\d{1,2}\.\d{2,})[,\s]+(-?\d{1,3}\.\d{2,})/);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng];
    }
  }
  return null;
}

// Great-circle distance in km.
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Uber/UberX rough quote → a £ range string (kept honest: surge varies).
function uberRange(roadKm, min) {
  const miles = roadKm / 1.609;
  const c = Math.max(UBER_MIN, UBER_BASE + miles * UBER_PER_MI + min * UBER_PER_MIN);
  const lo = Math.max(5, Math.round(c * 0.85)), hi = Math.round(c * 1.18);
  return { mid: c, label: lo === hi ? "~£" + lo : "£" + lo + "–" + hi };
}

// Build every realistic option for a leg + a recommended pick.
// Each option: { mode, icon, min, cost (number|null), costLabel }.
// pick = options[0]; the rest are alternatives the UI can show.
export function travelLeg(from, to) {
  const km = haversineKm(from, to);
  if (km == null) return null;
  const road = km * 1.3;
  const walkMin = Math.max(3, Math.round(((km * 1.2) / 4.8) * 60)); // 4.8 km/h
  const opts = [];

  if (km <= CITY_KM) {
    // In/around the city: walk (free) when reasonable, Lothian bus/tram (£2),
    // and Uber for door-to-door speed. Pick the cheapest sensible one; offer a
    // faster paid alternative — the user's "molto vicini → mezzo più rapido".
    const uMin = Math.round((road / 22) * 60) + 4; // ~22 km/h incl. pickup
    const uber = uberRange(road, uMin);
    const uberOpt = { mode: "Uber", icon: "🚕", min: uMin, cost: uber.mid, costLabel: uber.label };
    const transitMin = Math.round((road / 16) * 60) + 10; // incl. wait
    const transit = { mode: "Bus/Tram", icon: "🚌", min: transitMin, cost: TRANSIT_CITY_FARE, costLabel: "£2" };
    const walk = { mode: "A piedi", icon: "🚶", min: walkMin, cost: 0, costLabel: "gratis" };
    if (km < 1.5) { opts.push(walk, uberOpt); }
    else if (km < 3.5) { opts.push(walk, uberOpt, transit); }
    else { opts.push(transit, uberOpt, walk); }
  } else {
    // Between towns: no walking. Public transport is the default; Uber only if
    // it stays under the cap (so only the nearest towns ever show it).
    const transitMin = Math.round((road / (km < 28 ? 45 : 68)) * 60) + (km < 28 ? 12 : 15);
    opts.push({ mode: km < 60 ? "Treno/Bus" : "Treno", icon: "🚆", min: transitMin, cost: null, costLabel: "tariffa var." });
    const uMin = Math.round((road / 70) * 60) + 6;
    const uber = uberRange(road, uMin);
    if (uber.mid <= UBER_CAP) opts.push({ mode: "Uber", icon: "🚕", min: uMin, cost: uber.mid, costLabel: uber.label });
  }

  return { km, road, options: opts, pick: opts[0] };
}
