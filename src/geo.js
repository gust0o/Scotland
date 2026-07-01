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

// Sub-venues INSIDE each gita, pinned individually so a move within a day trip
// (Seabird Centre → Tantallon, Old Course → Cathedral, Balloch → Luss…) gets a
// real distance/mode/cost instead of collapsing onto the town centre. Anything
// not listed falls back to its trip's town. Keyed by the "tv-<trip>-<i>" id.
export const TVENUE_COORDS = {
  // Glasgow
  "tv-dt-glasgow-0": [55.8686, -4.2906], "tv-dt-glasgow-1": [55.8654, -4.3066],
  "tv-dt-glasgow-2": [55.8627, -4.2349], "tv-dt-glasgow-3": [55.8656, -4.2647],
  "tv-dt-glasgow-4": [55.8745, -4.2925], "tv-dt-glasgow-5": [55.8744, -4.2926],
  "tv-dt-glasgow-6": [55.8745, -4.2861],
  // Stirling
  "tv-dt-stirling-0": [56.124, -3.9477], "tv-dt-stirling-1": [56.1387, -3.9189],
  "tv-dt-stirling-2": [56.0905, -3.917], "tv-dt-stirling-3": [56.1235, -3.9466],
  "tv-dt-stirling-4": [56.123, -3.943], "tv-dt-stirling-5": [56.1188, -3.936],
  // St Andrews
  "tv-dt-standrews-0": [56.3433, -2.8025], "tv-dt-standrews-1": [56.3398, -2.7889],
  "tv-dt-standrews-2": [56.3424, -2.7906], "tv-dt-standrews-3": [56.3387, -2.7956],
  "tv-dt-standrews-4": [56.3389, -2.7949], "tv-dt-standrews-5": [56.3399, -2.796],
  "tv-dt-standrews-6": [56.3475, -2.806],
  // Loch Lomond
  "tv-dt-lochlomond-0": [56.0028, -4.5826], "tv-dt-lochlomond-1": [56.0064, -4.576],
  "tv-dt-lochlomond-2": [56.0, -4.581], "tv-dt-lochlomond-3": [56.1006, -4.636],
  "tv-dt-lochlomond-4": [56.1008, -4.6358], "tv-dt-lochlomond-5": [55.9996, -4.5805],
  "tv-dt-lochlomond-6": [56.026, -4.336],
  // Musselburgh
  "tv-dt-musselburgh-0": [55.947, -3.049], "tv-dt-musselburgh-1": [55.9447, -3.066],
  "tv-dt-musselburgh-2": [55.951, -3.033], "tv-dt-musselburgh-3": [55.9418, -3.0556],
  "tv-dt-musselburgh-4": [55.943, -3.061], "tv-dt-musselburgh-5": [55.942, -3.0545],
  // North Berwick
  "tv-dt-nberwick-0": [56.0596, -2.7195], "tv-dt-nberwick-1": [56.056, -2.651],
  "tv-dt-nberwick-2": [56.049, -2.714], "tv-dt-nberwick-3": [56.0578, -2.722],
  "tv-dt-nberwick-4": [56.0598, -2.719], "tv-dt-nberwick-5": [56.0588, -2.717],
  // Falkirk
  "tv-dt-falkirk-0": [56.0017, -3.8407], "tv-dt-falkirk-1": [56.0197, -3.756],
  "tv-dt-falkirk-2": [56.019, -3.759], "tv-dt-falkirk-3": [56.0008, -3.779],
  "tv-dt-falkirk-4": [56.0017, -3.84], "tv-dt-falkirk-5": [56.001, -3.784],
  // South Queensferry
  "tv-dt-queensferry-0": [56.0019, -3.3886], "tv-dt-queensferry-1": [56.0317, -3.3018],
  "tv-dt-queensferry-2": [55.987, -3.353], "tv-dt-queensferry-3": [55.9905, -3.388],
  "tv-dt-queensferry-4": [55.9905, -3.399], "tv-dt-queensferry-5": [55.9905, -3.397],
};

// London spots (Shoreditch / Spitalfields / Brick Lane + a few in the City),
// pinned so intra-London hops are real too (Old Truman Brewery → Beigel Bake…).
export const LONDON_COORDS = {
  "lo-colazione-allpress": [51.5245, -0.0745], "lo-colazione-friends": [51.53, -0.0863],
  "lo-colazione-ozone": [51.525, -0.0836], "lo-beigel": [51.5238, -0.0716],
  "lo-bricklane": [51.5215, -0.0716], "lo-truman": [51.5206, -0.0719],
  "lo-spitalfields": [51.5194, -0.0755], "lo-christ-church": [51.5192, -0.0745],
  "lo-boxpark": [51.5232, -0.0755], "lo-redchurch": [51.524, -0.074],
  "lo-ten-bells": [51.5197, -0.0748], "lo-stpauls": [51.5138, -0.0984],
  "lo-millennium": [51.5095, -0.0985], "lo-tate-modern": [51.5076, -0.0994],
  "lo-dishoomshoreditch": [51.5257, -0.0776], "lo-smokinggoat": [51.524, -0.077],
  "lo-gunpowderspitalfields": [51.5185, -0.076], "lo-tayyabs": [51.5165, -0.0655],
  "lo-sundayupmarket": [51.521, -0.072], "lo-columbiaroad": [51.53, -0.067],
  "lo-queenhoxton": [51.5232, -0.081], "lo-oldblue": [51.5243, -0.0805],
  "lo-skygarden": [51.5113, -0.0837], "lo-leadenhallmarket": [51.5128, -0.0836],
};

// Transport hubs you can drop into a day as places, so the app estimates the
// hop from your last venue to the station/airport (e.g. to the Stansted
// Express). `city` scopes which day offers them ("lon" / "edi").
export const TRANSIT = {
  "tx-liverpoolst": { name: "Liverpool St · Stansted Express", coord: [51.5178, -0.0823], city: "lon", q: "Liverpool Street Station London", hint: "Stansted Express per l'aeroporto" },
  "tx-stansted": { name: "Stansted Airport (STN)", coord: [51.886, 0.2389], city: "lon", q: "London Stansted Airport", hint: "Aeroporto di Londra Stansted" },
  "tx-waverley": { name: "Edinburgh Waverley", coord: [55.9521, -3.1903], city: "edi", q: "Edinburgh Waverley Station", hint: "Treni per le gite" },
  "tx-haymarket": { name: "Haymarket", coord: [55.9457, -3.2185], city: "edi", q: "Haymarket Station Edinburgh", hint: "Stazione ovest · tram per l'aeroporto" },
  "tx-ediairport": { name: "Edinburgh Airport (EDI)", coord: [55.95, -3.3725], city: "edi", q: "Edinburgh Airport", hint: "Aeroporto · tram/bus dal centro" },
};

// Resolve the coordinate of a scheduled event from its catalog entry.
export function coordForEvent(catalogEntry) {
  if (!catalogEntry) return CITY_DEFAULT;
  const { id, kind, trip, pool } = catalogEntry;
  if (kind === "trip") return TRIP_COORDS[id] || HUB.coord;
  if (kind === "tvenue") return TVENUE_COORDS[id] || TRIP_COORDS[trip] || HUB.coord;
  if (pool === "lon" || kind === "london") return LONDON_COORDS[id] || LONDON_DEFAULT;
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
