// Reverse-search "Opportunity Finder".
// Scans a 10x10 grid over a city bounding box, scores each cell for the
// given business type, and returns the top N candidates.
//
// All values are mocked but driven by a deterministic seed so identical
// inputs always return the same hotspot map (great for live demos).

const { hashString, seededRandom } = require('../utils/random');
const { pickCompetitorPool } = require('../utils/competitorNames');

// Tashkent bounding box (~22 km x 22 km).
const TASHKENT = {
  city: 'Tashkent',
  minLat: 41.20,
  maxLat: 41.40,
  minLng: 69.15,
  maxLng: 69.40,
  centerLat: 41.30,
  centerLng: 69.24,
};

// Type-specific weights. Cafes & restaurants weight competition heavier
// (they're saturated in busy zones); gyms & retail prize foot traffic.
const TYPE_PROFILES = {
  cafe:       { demand: 0.35, traffic: 0.30, competition: 0.35, compCap: 12, density: 1.1 },
  restaurant: { demand: 0.30, traffic: 0.30, competition: 0.40, compCap: 10, density: 1.2 },
  gym:        { demand: 0.40, traffic: 0.35, competition: 0.25, compCap: 6,  density: 0.7 },
  retail:     { demand: 0.30, traffic: 0.45, competition: 0.25, compCap: 8,  density: 1.0 },
  default:    { demand: 0.35, traffic: 0.35, competition: 0.30, compCap: 8,  density: 1.0 },
};

function profileFor(businessType) {
  const t = (businessType || '').toLowerCase();
  if (/(cafe|coffee|bakery)/.test(t)) return { ...TYPE_PROFILES.cafe, key: 'cafe' };
  if (/(restaurant|burger|pizza|sushi|bar|grill|fast\s*food|kitchen)/.test(t))
    return { ...TYPE_PROFILES.restaurant, key: 'restaurant' };
  if (/(gym|fitness|yoga|crossfit|pilates)/.test(t))
    return { ...TYPE_PROFILES.gym, key: 'gym' };
  if (/(shop|store|retail|boutique|market)/.test(t))
    return { ...TYPE_PROFILES.retail, key: 'retail' };
  return { ...TYPE_PROFILES.default, key: 'default' };
}

function distanceKm(latA, lngA, latB, lngB) {
  const dLat = (latA - latB) * 111;
  const dLng = (lngA - lngB) * 111 * Math.cos((latB * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// Build the "why" string from the cell's metrics so each hotspot has a
// human-readable rationale.
function buildReason(cell, profile) {
  const parts = [];
  if (cell.competitorsWithin500m === 0) parts.push('zero competitors within 500m');
  else if (cell.competitorsWithin500m <= 2) parts.push(`only ${cell.competitorsWithin500m} competitors within 500m`);

  if (cell.footTrafficScore >= 75) parts.push('high foot traffic');
  else if (cell.footTrafficScore >= 60) parts.push('steady foot traffic');

  if (cell.demandScore >= 75) parts.push('strong local demand');
  else if (cell.demandScore >= 60) parts.push('healthy demand');

  if (cell.distanceFromCenterKm >= 6 && cell.demandScore >= 65) {
    parts.push('underserved residential cluster');
  }

  if (parts.length === 0) parts.push('balanced fundamentals across all signals');
  const reason = parts[0].charAt(0).toUpperCase() + parts.slice(0).join(', ').slice(1);
  return `${reason}.`;
}

function evaluateCell({ lat, lng, rand, profile, bbox }) {
  // Distance from city center drives baseline demand AND competition.
  // Most desirable spots tend to sit just off the dead-center.
  const distanceFromCenterKm = distanceKm(lat, lng, bbox.centerLat, bbox.centerLng);

  // Demand: peaks at center, decays with distance.
  const demandBase = Math.max(20, 95 - distanceFromCenterKm * 6);
  const demandScore = clamp(demandBase + (rand() - 0.5) * 25);

  // Foot traffic: similar shape but noisier.
  const trafficBase = Math.max(15, 90 - distanceFromCenterKm * 5.5);
  const footTrafficScore = clamp(trafficBase + (rand() - 0.5) * 30);

  // Competition density: also peaks at center but scaled by type density.
  const compRaw = Math.max(0, (10 - distanceFromCenterKm) * profile.density + rand() * 4);
  const competitorsWithin500m = Math.min(profile.compCap, Math.round(compRaw));
  // Convert to a 0-100 "competition score" where higher = better (less competitors).
  const competitionScore = clamp(100 - (competitorsWithin500m / profile.compCap) * 100);

  // Suitability — weighted blend with competition heavily favored when low.
  const suitabilityScore = Math.round(
    demandScore * profile.demand +
      footTrafficScore * profile.traffic +
      competitionScore * profile.competition
  );

  return {
    lat: round(lat, 5),
    lng: round(lng, 5),
    suitabilityScore,
    demandScore: Math.round(demandScore),
    footTrafficScore: Math.round(footTrafficScore),
    competitionScore: Math.round(competitionScore),
    competitorsWithin500m,
    distanceFromCenterKm: round(distanceFromCenterKm, 2),
  };
}

function clamp(v) {
  return Math.max(0, Math.min(100, v));
}
function round(v, digits) {
  const m = Math.pow(10, digits);
  return Math.round(v * m) / m;
}

// Convert the per-cell competitor counts into actual map pins so the find
// tab can render the existing competition landscape. Cells closer to the
// city center already produce more `competitorsWithin500m`, so the natural
// distribution lands more pins in the busy core — exactly what we want.
function generateScanCompetitors(cells, businessType, rand, scope) {
  const names = pickCompetitorPool(businessType);
  const cap = scope === 'local' ? 25 : 60;
  const maxPerCell = scope === 'local' ? 2 : 1;

  const all = [];
  for (const cell of cells) {
    const n = Math.min(cell.competitorsWithin500m, maxPerCell);
    for (let k = 0; k < n; k++) {
      const angle = rand() * 2 * Math.PI;
      const distKm = Math.sqrt(rand()) * 0.4; // jitter up to ~400 m
      const latRad = (cell.lat * Math.PI) / 180;
      const dLat = (distKm / 111) * Math.sin(angle);
      const dLng = (distKm / (111 * Math.max(0.05, Math.cos(latRad)))) * Math.cos(angle);
      all.push({
        name: names[all.length % names.length],
        lat: Math.round((cell.lat + dLat) * 1e6) / 1e6,
        lng: Math.round((cell.lng + dLng) * 1e6) / 1e6,
      });
    }
  }

  // Cap via partial Fisher–Yates so we keep an even spatial spread instead
  // of clipping the tail of the array (which would always favor one corner
  // of the bbox).
  if (all.length > cap) {
    for (let i = all.length - 1; i > 0 && all.length - i <= cap; i--) {
      const j = Math.floor(rand() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(all.length - cap).map((c, i) => ({ id: i + 1, ...c }));
  }
  return all.map((c, i) => ({ id: i + 1, ...c }));
}

// Two scan profiles:
//  - "city"  : full Tashkent bbox, 12x12 grid, top 15 hotspots, 2.5 km spacing
//  - "local" : 5 km x 5 km bbox around user-provided point, 8x8 grid, top 5
//              hotspots, 0.7 km spacing
const SCAN_PROFILES = {
  city:  { gridSize: 12, top: 15, dedupeKm: 2.5 },
  local: { gridSize: 8,  top: 5,  dedupeKm: 0.7 },
};

function buildLocalBbox(lat, lng) {
  // ~5 km x 5 km box around the user-supplied point (lng padding scaled by
  // cos(lat) so the box stays roughly square in real distance).
  const dLat = 0.025;
  const dLng = 0.025 / Math.max(0.05, Math.cos((lat * Math.PI) / 180));
  return {
    city: 'Selected area',
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
    // Demand model is still anchored on the actual city center, so peripheral
    // local searches honestly score lower than central ones.
    centerLat: TASHKENT.centerLat,
    centerLng: TASHKENT.centerLng,
  };
}

function findHotspots({ businessType, lat, lng, scope }) {
  const profile = profileFor(businessType);

  // Decide scope: explicit override > implicit (lat+lng given) > city.
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  const effectiveScope = scope === 'local' || (scope == null && hasPoint)
    ? 'local'
    : 'city';

  const bbox = effectiveScope === 'local' && hasPoint
    ? buildLocalBbox(lat, lng)
    : TASHKENT;

  const cfg = SCAN_PROFILES[effectiveScope];

  // Deterministic per (businessType, scope, bbox).
  const seed = hashString(
    `hotspots|${profile.key}|${businessType.toLowerCase()}|${effectiveScope}|` +
      `${bbox.minLat.toFixed(3)}|${bbox.minLng.toFixed(3)}`
  );
  const rand = seededRandom(seed);

  const stepLat = (bbox.maxLat - bbox.minLat) / (cfg.gridSize - 1);
  const stepLng = (bbox.maxLng - bbox.minLng) / (cfg.gridSize - 1);

  const cells = [];
  for (let i = 0; i < cfg.gridSize; i++) {
    for (let j = 0; j < cfg.gridSize; j++) {
      const cellLat = bbox.minLat + i * stepLat;
      const cellLng = bbox.minLng + j * stepLng;
      cells.push(evaluateCell({ lat: cellLat, lng: cellLng, rand, profile, bbox }));
    }
  }

  // Suppress geographically clustered candidates so the top-N spreads out.
  cells.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  const picked = [];
  for (const cell of cells) {
    const farEnough = picked.every(
      (p) => distanceKm(p.lat, p.lng, cell.lat, cell.lng) >= cfg.dedupeKm
    );
    if (farEnough) picked.push(cell);
    if (picked.length >= cfg.top) break;
  }

  const hotspots = picked.map((cell, i) => ({
    rank: i + 1,
    ...cell,
    reason: buildReason(cell, profile),
  }));

  const competitors = generateScanCompetitors(cells, businessType, rand, effectiveScope);

  return {
    businessType,
    scope: effectiveScope,
    city: bbox.city,
    profile: profile.key,
    center: hasPoint && effectiveScope === 'local' ? { lat, lng } : null,
    boundingBox: {
      minLat: bbox.minLat,
      maxLat: bbox.maxLat,
      minLng: bbox.minLng,
      maxLng: bbox.maxLng,
    },
    gridSize: cfg.gridSize,
    totalEvaluated: cfg.gridSize * cfg.gridSize,
    hotspots,
    competitors,
    grid: cells.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      score: c.suitabilityScore,
    })),
  };
}

module.exports = { findHotspots };
