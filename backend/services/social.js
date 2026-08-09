// Block G — Social profile & target audience (SQB Layer-2 catalogue).
// M-G1 Customer Segment Profiler · M-G2 Day Population Estimator
// M-G3 Consumer Behavior Classifier · M-G4 Brand Affinity
// M-G5 Spending Power Index

const SEGMENT_TEMPLATES = [
  { name: 'Young professionals',     ageRange: '25–34', incomeBand: 'mid',   topMcc: ['Cafes','Apparel','Streaming'] },
  { name: 'Families with kids',      ageRange: '30–45', incomeBand: 'mid',   topMcc: ['Groceries','Pharmacy','Education'] },
  { name: 'University students',     ageRange: '18–24', incomeBand: 'low',   topMcc: ['Fast food','Apparel','Mobility'] },
  { name: 'Affluent households',     ageRange: '35–55', incomeBand: 'high',  topMcc: ['Restaurants','Travel','Fitness'] },
  { name: 'Retirees',                ageRange: '60+',   incomeBand: 'low',   topMcc: ['Pharmacy','Groceries','Utilities'] },
];

const BEHAVIOR_TYPES = [
  { key: 'morning',  description: 'Morning rush — coffee, breakfast, fast turnaround.' },
  { key: 'premium',  description: 'Premium spenders — high ticket, brand-loyal.' },
  { key: 'bargain',  description: 'Bargain hunters — promo-driven, price-elastic.' },
  { key: 'social',   description: 'Social diners — group ticket, evenings & weekends.' },
  { key: 'utility',  description: 'Utility shoppers — frequent, low-ticket basket.' },
];

function buildBlockG(rand) {
  // M-G1 — Customer Segment Profiler (top 3 segments with shares)
  const shuffled = [...SEGMENT_TEMPLATES].sort(() => rand() - 0.5);
  const picks = shuffled.slice(0, 3);
  let remaining = 100;
  const segments = picks.map((s, i) => {
    const share = i === picks.length - 1
      ? remaining
      : Math.round(20 + rand() * 35);
    remaining -= share;
    return { ...s, sharePct: Math.max(0, share) };
  });

  // M-G2 — Day Population Estimator
  const residents = Math.round(2500 + rand() * 6000);
  const visitors = Math.round(1500 + rand() * 5000);
  const transit = Math.round(800 + rand() * 4000);
  const dayPopulationByHour = [];
  for (let h = 6; h <= 23; h++) {
    const factor =
      (h >= 8  && h <= 10 ? 1.5 : 1) *
      (h >= 12 && h <= 14 ? 1.4 : 1) *
      (h >= 18 && h <= 21 ? 1.6 : 1) *
      (h >= 22 ? 0.5 : 1);
    dayPopulationByHour.push({
      hour: h,
      headcount: Math.round((residents * 0.4 + visitors * 0.7 + transit * 0.5) * factor * (0.85 + rand() * 0.30) / 5),
    });
  }
  const dayPopulation = {
    residents, visitors, transit,
    total: residents + visitors + transit,
    byHour: dayPopulationByHour,
    peakHour: dayPopulationByHour.reduce((a, b) => (b.headcount > a.headcount ? b : a)).hour,
  };

  // M-G3 — Consumer Behavior Classifier
  const dominant = BEHAVIOR_TYPES[Math.floor(rand() * BEHAVIOR_TYPES.length)];
  const behaviorMix = BEHAVIOR_TYPES.map((b) => ({
    type: b.key,
    sharePct: 0,
  }));
  // distribute 100% with bias toward the dominant
  let left = 100;
  behaviorMix.forEach((b, i) => {
    const isDominant = b.type === dominant.key;
    const share = i === behaviorMix.length - 1
      ? left
      : isDominant ? Math.round(35 + rand() * 20) : Math.round(8 + rand() * 18);
    b.sharePct = Math.max(0, Math.min(left, share));
    left -= b.sharePct;
  });

  // M-G4 — Brand Affinity (chains vs independents)
  const chainAffinityPct = Math.round(35 + rand() * 50);
  const independentAffinityPct = 100 - chainAffinityPct;

  // M-G5 — Spending Power Index 0–100 + categorical band
  const spendingPowerIndex = clamp(Math.round(40 + rand() * 55));
  const spendingBand =
    spendingPowerIndex >= 75 ? 'High' :
    spendingPowerIndex >= 50 ? 'Mid'  : 'Low';

  return {
    segments,
    dayPopulation,
    consumerBehavior: { dominant: dominant.key, dominantDescription: dominant.description, mix: behaviorMix },
    brandAffinity: { chainPct: chainAffinityPct, independentPct: independentAffinityPct },
    spendingPower: { index: spendingPowerIndex, band: spendingBand },
  };
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }

module.exports = { buildBlockG };
