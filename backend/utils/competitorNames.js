// Shared competitor-name dictionary, used by both the per-site analyzer and
// the city-wide hotspot scan so they stay visually consistent.

const COMPETITOR_NAMES = {
  cafe: [
    'Bean Theory', 'Aurora Coffee', 'Nimbus Cafe', 'Velvet Roastery',
    'Latte Atelier', 'Espresso Loop', 'Caffè Olla', 'Mocha Den',
    'Steam & Sip', 'Brew Quarter', 'Cardamom House', 'Daybreak Coffee',
  ],
  restaurant: [
    'Saffron House', 'Charcoal & Vine', 'Blue Plate', 'Plov Republic',
    'Grill Row', 'The Pomegranate', 'Tandoor Lane', 'River & Wheat',
    'Olive & Stone', 'Spice Junction', 'Lagman Kitchen', 'Samsa & Co.',
  ],
  gym: [
    'IronCore', 'Pulse Athletic', 'Forge Fitness', 'Vortex Gym',
    'PrimeBody', 'Apex Studio', 'Reps & Reps', 'Kinetic Lab',
    'Steel Yard', 'Strata Fit',
  ],
  retail: [
    'North Market', 'Halo Shop', 'Quartz Store', 'Lumen Goods',
    'Atlas Retail', 'Orbit & Co.', 'Pivot Shop', 'Echo Outlet',
  ],
  default: Array.from({ length: 25 }, (_, i) => `Competitor ${String.fromCharCode(65 + i)}`),
};

function pickCompetitorPool(businessType) {
  const t = (businessType || '').toLowerCase();
  if (/(cafe|coffee|bakery)/.test(t)) return COMPETITOR_NAMES.cafe;
  if (/(restaurant|burger|pizza|sushi|bar|grill|fast\s*food|kitchen)/.test(t))
    return COMPETITOR_NAMES.restaurant;
  if (/(gym|fitness|yoga|crossfit|pilates)/.test(t)) return COMPETITOR_NAMES.gym;
  if (/(shop|store|retail|boutique|market)/.test(t)) return COMPETITOR_NAMES.retail;
  return COMPETITOR_NAMES.default;
}

module.exports = { COMPETITOR_NAMES, pickCompetitorPool };
