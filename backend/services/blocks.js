// Generates blocks A–E of the SQB Layer-2 model catalogue.
// Every model from the spec produces a deterministic mocked output via the
// shared seeded RNG so identical inputs return identical outputs (live demo).

const { pickCompetitorPool } = require('../utils/competitorNames');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Seasonal multipliers for Uzbekistan retail. Ramadan in 2026 ≈ Feb 18 – Mar 19,
// Navro'z = March 21, so Feb–Mar carry the strongest spike.
const SEASONAL_MULTIPLIER = [
  1.00, 1.25, 1.40, 1.10, 1.00, 0.95,
  0.90, 0.95, 1.05, 1.10, 1.15, 1.20,
];

// Normative outlets per 10,000 residents per business category.
// Used by M-A2 GAP analysis.
const NORMATIVE_PER_10K = {
  cafe: 4.5, restaurant: 3.0, bakery: 1.8, gym: 1.2,
  pharmacy: 2.4, retail: 6.0, default: 3.0,
};

function profileKey(businessType) {
  const t = (businessType || '').toLowerCase();
  if (/(cafe|coffee|bakery)/.test(t)) return 'cafe';
  if (/(restaurant|burger|pizza|sushi|bar|grill|kitchen)/.test(t)) return 'restaurant';
  if (/(gym|fitness|yoga|crossfit)/.test(t)) return 'gym';
  if (/(pharmacy|drug)/.test(t)) return 'pharmacy';
  if (/(shop|store|retail|boutique|market)/.test(t)) return 'retail';
  return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Block A — Market sizing & capacity
// M-A1 Market Sizing · M-A2 GAP Analysis · M-A3 Saturation Index
// M-A4 Wallet Share Estimator · M-A5 Niche Opportunity Score
// M-A6 Cross-Niche Cannibalization
// ─────────────────────────────────────────────────────────────────────────────
function buildBlockA(rand, businessType) {
  // M-A1 — TAM/SAM/SOM ($M)
  const tam = round1(30 + rand() * 70);
  const sam = round1(tam * (0.20 + rand() * 0.30));
  const som = Math.round(sam * (0.05 + rand() * 0.15) * 100) / 100;

  // M-A2 — GAP analysis: normative vs actual outlet count for this niche
  const populationServed = 12000 + Math.floor(rand() * 18000);
  const norm = NORMATIVE_PER_10K[profileKey(businessType)];
  const normativeCount = Math.round((populationServed / 10000) * norm);
  const actualCount = Math.max(0, Math.round(normativeCount * (0.6 + rand() * 0.9)));
  const gapPercent = normativeCount === 0
    ? 0
    : Math.round(((actualCount - normativeCount) / normativeCount) * 100);
  const gapVerdict = gapPercent < -10 ? 'underserved' : gapPercent > 10 ? 'oversaturated' : 'balanced';

  // M-A3 — Saturation Index 0..100 (0 empty, 100 overheated)
  const saturationIndex = clamp(
    Math.round((actualCount / Math.max(1, normativeCount)) * 60 + rand() * 30)
  );

  // M-A4 — Wallet Share: % of household monthly spend in this MCC category
  const walletSharePct = round1(1.5 + rand() * 6.5);
  const walletShareTrend = pick(rand, ['rising', 'stable', 'declining']);

  // M-A5 — Niche Opportunity Score = potential × (1 − saturation)
  const nicheOpportunityScore = clamp(
    Math.round((40 + rand() * 60) * (1 - saturationIndex / 200) * 1.4)
  );

  // M-A6 — Cross-Niche Cannibalization (% revenue stolen from adjacent niches)
  const cannibalizationPct = round1(5 + rand() * 25);
  const cannibalizedNiches = pickAdjacentNiches(businessType, rand);

  return {
    // M-A1
    tam, sam, som,
    // M-A2
    gapAnalysis: { normativeCount, actualCount, gapPercent, gapVerdict, populationServed },
    // M-A3
    saturationIndex,
    // M-A4
    walletShare: { sharePct: walletSharePct, trend: walletShareTrend },
    // M-A5
    nicheOpportunityScore,
    // M-A6
    cannibalization: { overlapPct: cannibalizationPct, niches: cannibalizedNiches },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block B — Forecasting & demand
// M-B1 Demand Forecasting · M-B2 Seasonality · M-B3 Population Dynamics
// M-B4 Income Trend · M-B5 MCC Trend Detector · M-B6 Business Registration Forecast
// ─────────────────────────────────────────────────────────────────────────────
function buildBlockB(rand) {
  const base = 8000 + Math.floor(rand() * 12000);
  const monthlyTrend = 1 + rand() * 0.04;

  // M-B1 — 36-month forecast with confidence interval
  const forecast = [];
  for (let i = 0; i < 36; i++) {
    const monthIdx = i % 12;
    const yearIdx = Math.floor(i / 12);
    const noise = 0.92 + rand() * 0.16;
    const expected = Math.round(
      base * Math.pow(monthlyTrend, i) * SEASONAL_MULTIPLIER[monthIdx] * noise
    );
    // Widening confidence band — uncertainty grows over time
    const ciSpread = 0.10 + (i / 36) * 0.20;
    forecast.push({
      month: MONTHS[monthIdx],
      yearOffset: yearIdx,
      revenue: expected,
      ciLow: Math.round(expected * (1 - ciSpread)),
      ciHigh: Math.round(expected * (1 + ciSpread)),
      isSeasonalSpike: SEASONAL_MULTIPLIER[monthIdx] >= 1.15,
    });
  }
  const forecast12m = forecast.slice(0, 12);
  const forecast24m = forecast.slice(0, 24);
  const annualRevenue = forecast12m.reduce((s, f) => s + f.revenue, 0);
  const peak = Math.max(...forecast12m.map((f) => f.revenue));
  const trough = Math.min(...forecast12m.map((f) => f.revenue));
  const stability = 100 - Math.round(((peak - trough) / peak) * 100);
  const demandScore = clamp(
    Math.round(40 + (annualRevenue / 200000) * 40 + stability * 0.1)
  );

  // M-B2 — Seasonality model (monthly index, 100 = avg, with named drivers)
  const seasonalityIndex = SEASONAL_MULTIPLIER.map((m, i) => ({
    month: MONTHS[i],
    index: Math.round(m * 100),
    driver: i === 1 || i === 2 ? 'Ramadan / Navro\'z' :
            i === 11           ? 'New Year' :
            i === 6  || i === 7 ? 'Summer dip' : null,
  }));

  // M-B3 — Population Dynamics (5-year forecast)
  const populationDynamics = {
    growth5yPct: round1(1.5 + rand() * 4.5),
    targetAudienceGrowthPct: round1(2 + rand() * 6),
    medianAgeShift: round1(rand() * 2 - 0.5),
  };

  // M-B4 — Income Trend Forecast (1y / 3y / 5y)
  const incomeTrend = {
    oneYearPct: round1(2 + rand() * 6),
    threeYearPct: round1(8 + rand() * 12),
    fiveYearPct: round1(15 + rand() * 22),
    purchasingPowerIndex: clamp(Math.round(60 + rand() * 35)),
  };

  // M-B5 — MCC Trend Detector
  const trendDir = rand();
  const mccTrend = {
    direction: trendDir > 0.6 ? 'rising' : trendDir > 0.3 ? 'stable' : 'declining',
    strength: clamp(Math.round(40 + rand() * 60)),
    changepointDetected: rand() > 0.65,
    signal: trendDir > 0.6 ? 'Enter — category accelerating'
          : trendDir > 0.3 ? 'Hold — category stable'
          : 'Exit — category contracting',
  };

  // M-B6 — Business Registration Forecast (new competitors expected)
  const expectedNewCompetitors12m = Math.round(2 + rand() * 8);
  const expectedNewCompetitors24m = expectedNewCompetitors12m * 2 + Math.round(rand() * 4);

  return {
    // M-B1
    forecast: forecast12m,
    forecast24m,
    forecast36m: forecast,
    annualRevenue, peak, trough, demandScore,
    // M-B2
    seasonalityIndex,
    // M-B3
    populationDynamics,
    // M-B4
    incomeTrend,
    // M-B5
    mccTrend,
    // M-B6
    competitorRegistrationForecast: { next12m: expectedNewCompetitors12m, next24m: expectedNewCompetitors24m },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block C — Location & traffic
// M-C1 Location Score · M-C2 Traffic Scoring · M-C3 Isochrone Demand
// M-C4 Street Vitality · M-C5 Anchor Effect · M-C6 Visibility Score
// ─────────────────────────────────────────────────────────────────────────────
function buildBlockC(rand) {
  // M-C2 — Traffic by hour for a typical weekday
  const trafficByHour = [];
  for (let h = 6; h <= 23; h++) {
    // Rush mornings (8–10), lunch (12–14), evening (18–21)
    const base = 30
      + (h >= 8  && h <= 10 ? 35 : 0)
      + (h >= 12 && h <= 14 ? 30 : 0)
      + (h >= 18 && h <= 21 ? 45 : 0);
    trafficByHour.push({ hour: h, score: clamp(Math.round(base + (rand() - 0.5) * 20)) });
  }
  const peakHourEntry = trafficByHour.reduce((a, b) => (b.score > a.score ? b : a));
  const pedestrianTrafficScore = clamp(
    Math.round(trafficByHour.reduce((s, x) => s + x.score, 0) / trafficByHour.length + 5)
  );
  const carTrafficScore = clamp(Math.round(40 + rand() * 50));

  // M-C5 — Anchor effect
  const nearbyAnchors = Math.floor(rand() * 6);
  const anchorScore = clamp(nearbyAnchors * 18 + Math.round(rand() * 10));
  const anchorRating = anchorScore >= 65 ? 'Strong' : anchorScore >= 35 ? 'Moderate' : 'Weak';

  // M-C3 — Isochrone demand (people reachable in 5/10 min walk)
  const isochrone = {
    fiveMinPopulation: Math.round(800 + rand() * 4500),
    tenMinPopulation: Math.round(2500 + rand() * 12000),
    fiveMinPois: Math.round(15 + rand() * 60),
    tenMinPois: Math.round(60 + rand() * 200),
  };

  // M-C4 — Street Vitality Index (% active storefronts)
  const streetVitalityIndex = clamp(Math.round(40 + rand() * 55));

  // M-C6 — Visibility (% of approach lines that see the storefront)
  const visibilityScore = clamp(Math.round(35 + rand() * 60));

  // M-C1 — Composite location score (8 sub-factors, weighted)
  const locationScore = clamp(Math.round(
    pedestrianTrafficScore * 0.30 +
    carTrafficScore        * 0.10 +
    anchorScore            * 0.20 +
    (isochrone.fiveMinPopulation / 5300 * 100) * 0.15 +
    streetVitalityIndex    * 0.15 +
    visibilityScore        * 0.10
  ));

  return {
    // M-C1
    locationScore,
    // M-C2
    pedestrianTrafficScore,
    carTrafficScore,
    trafficByHour,
    peakHour: peakHourEntry.hour,
    // M-C3
    isochrone,
    // M-C4
    streetVitalityIndex,
    // M-C5
    anchorEffect: { rating: anchorRating, score: anchorScore, nearbyAnchors },
    // M-C6
    visibilityScore,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block D — Financial viability
// M-D1 Viability · M-D2 Unit Economics · M-D3 ROI/NPV
// M-D4 Rental Burden · M-D5 Cash Flow Simulator · M-D6 COGS & Margin
// ─────────────────────────────────────────────────────────────────────────────
function buildBlockD(rand, businessType, blockB) {
  const breakEvenMonths = round1(6 + rand() * 18);
  const roiEstimate = round1(15 + rand() * 60);

  // M-D1 — Viability (runway + survival probability)
  const runwayMonths = round1(8 + rand() * 16);
  const survival2yProb = round1(45 + rand() * 45);

  // M-D6 — COGS & Margin
  const cogsPct = round1(28 + rand() * 22);
  const grossMarginPct = round1(100 - cogsPct);
  const netMarginPct = round1(grossMarginPct - 40 - rand() * 10);

  // M-D2 — Unit Economics
  const ltvUSD = Math.round(180 + rand() * 720);
  const cacUSD = Math.round(15 + rand() * 60);
  const paybackPeriodMonths = round1(2 + rand() * 6);
  const ltvCacRatio = round1(ltvUSD / cacUSD);

  // M-D3 — NPV / IRR (10% discount rate, 24-month horizon)
  const monthlyCashFlow = (blockB.annualRevenue / 12) * (netMarginPct / 100);
  const discountMonthly = 0.10 / 12;
  let npv = -10000 - rand() * 30000; // initial investment
  for (let i = 1; i <= 24; i++) {
    npv += monthlyCashFlow / Math.pow(1 + discountMonthly, i);
  }
  const npvUSD = Math.round(npv);
  const irrPct = round1(roiEstimate * 0.6 + rand() * 8);

  // M-D4 — Rental Burden (% of revenue spent on rent)
  const currentRentPct = round1(8 + rand() * 22);
  const safeRentPct = 15;
  const rentalBurdenZone = currentRentPct <= 12 ? 'green'
                         : currentRentPct <= 20 ? 'yellow' : 'red';
  const recommendedMaxRent = Math.round((blockB.annualRevenue / 12) * (safeRentPct / 100));

  // M-D5 — Cash flow simulator (24 mo, flag cash-gap months)
  const cashFlow = [];
  let cumulative = -15000 - rand() * 25000; // starting capital deficit
  for (let i = 0; i < 24; i++) {
    const monthIdx = i % 12;
    const monthly = monthlyCashFlow * SEASONAL_MULTIPLIER[monthIdx] * (0.85 + rand() * 0.30);
    cumulative += monthly;
    cashFlow.push({
      month: MONTHS[monthIdx],
      yearOffset: Math.floor(i / 12),
      monthly: Math.round(monthly),
      cumulative: Math.round(cumulative),
      cashGap: cumulative < 0,
    });
  }
  const cashGapMonths = cashFlow.filter((c) => c.cashGap).length;

  // Composite financial score
  const beScore = Math.max(0, 100 - (breakEvenMonths - 6) * 5);
  const roiScore = Math.min(100, roiEstimate * 1.5);
  const financialScore = Math.round((beScore + roiScore) / 2);

  return {
    // M-D1
    breakEvenMonths,
    runwayMonths,
    survival2yProb,
    // M-D3
    roiEstimate,
    npvUSD,
    irrPct,
    // M-D6
    cogsPct,
    grossMarginPct,
    netMarginPct,
    // M-D2
    unitEconomics: { ltvUSD, cacUSD, paybackPeriodMonths, ltvCacRatio },
    // M-D4
    rentalBurden: { currentRentPct, safeRentPct, zone: rentalBurdenZone, recommendedMaxRent },
    // M-D5
    cashFlow,
    cashGapMonths,
    // composite
    financialScore,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block E — Competition & risk
// M-E1 Competitor Intelligence (300m/1km, ratings, prices)
// M-E2 Churn (closure prob + top-3 factors)
// M-E3 Regulatory Risk · M-E4 Entry Barriers · M-E5 Price Pressure
// ─────────────────────────────────────────────────────────────────────────────
function buildBlockE(rand, lat, lng, businessType) {
  const competitorsWithin1km = Math.floor(rand() * 25);
  const competitionDensity = round1(competitorsWithin1km / Math.PI);
  const closureProbability = round1(10 + rand() * 50);
  const competitionScore = Math.max(0, 100 - competitorsWithin1km * 4);
  const competitors = generateCompetitors(rand, lat, lng, competitorsWithin1km, businessType);

  // M-E1 — split by ring + average rating/price across the set
  const competitorsWithin300m = competitors.filter((c) => c.distanceKm <= 0.3).length;
  const avgRating = competitors.length
    ? round1(competitors.reduce((s, c) => s + c.rating, 0) / competitors.length)
    : 0;
  const avgPriceUSD = competitors.length
    ? Math.round(competitors.reduce((s, c) => s + c.avgPriceUSD, 0) / competitors.length)
    : 0;

  // M-E2 — Top-3 churn factors driving the closure probability
  const allFactors = [
    { factor: 'High competition density', weight: competitorsWithin1km * 2 },
    { factor: 'Sub-target rent burden', weight: 30 + rand() * 40 },
    { factor: 'Below-norm foot traffic', weight: 30 + rand() * 30 },
    { factor: 'Weak anchor effect', weight: 20 + rand() * 50 },
    { factor: 'Volatile seasonal demand', weight: 20 + rand() * 40 },
    { factor: 'Customer churn / poor retention', weight: 15 + rand() * 35 },
  ];
  const closureRiskFactors = allFactors
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((f) => ({ factor: f.factor, contributionPct: Math.round(f.weight) }));

  // M-E3 — Regulatory risk (inspections, fines)
  const regulatoryRiskScore = clamp(Math.round(20 + rand() * 50));
  const expectedInspectionsYear = Math.round(1 + rand() * 4);
  const avgFineUSD = Math.round(150 + rand() * 850);

  // M-E4 — Market Entry Barrier Index (financial + regulatory + competitive)
  const finBarrier  = clamp(Math.round(30 + rand() * 50));
  const regBarrier  = clamp(Math.round(20 + rand() * 50));
  const compBarrier = clamp(Math.round(competitorsWithin1km * 3 + rand() * 30));
  const entryBarrierIndex = Math.round((finBarrier + regBarrier + compBarrier) / 3);

  // M-E5 — Price Pressure & optimal price band (per-unit USD)
  const pricePressureScore = clamp(Math.round(competitorsWithin1km * 2.5 + rand() * 30));
  const optimalPriceMin = Math.round(2 + rand() * 6);
  const optimalPriceMax = optimalPriceMin + Math.round(2 + rand() * 5);

  return {
    // M-E1
    competitorsWithin1km,
    competitorsWithin300m,
    competitionDensity,
    avgCompetitorRating: avgRating,
    avgCompetitorPriceUSD: avgPriceUSD,
    competitors,
    // M-E2
    closureProbability,
    closureRiskFactors,
    // M-E3
    regulatoryRisk: { score: regulatoryRiskScore, expectedInspectionsYear, avgFineUSD },
    // M-E4
    entryBarriers: { index: entryBarrierIndex, financial: finBarrier, regulatory: regBarrier, competitive: compBarrier },
    // M-E5
    pricePressure: { score: pricePressureScore, optimalPriceUSD: { min: optimalPriceMin, max: optimalPriceMax } },
    // composite
    competitionScore,
  };
}

// Pick adjacent niches that the business cannibalizes (M-A6).
function pickAdjacentNiches(businessType, rand) {
  const t = (businessType || '').toLowerCase();
  const all = {
    cafe:       ['Bakery', 'Tea house', 'Juice bar'],
    restaurant: ['Cafe', 'Fast food', 'Catering'],
    bakery:     ['Cafe', 'Confectionery'],
    gym:        ['Yoga studio', 'CrossFit box', 'Personal trainer'],
    pharmacy:   ['Optical store', 'Medical supplies'],
    retail:     ['Department store', 'Boutique', 'Online marketplace'],
    default:    ['Adjacent niche A', 'Adjacent niche B'],
  };
  const list = all[profileKey(businessType)];
  return list.slice(0, 2 + Math.floor(rand() * Math.min(2, list.length - 2)));
}

// Scatter `count` competitors uniformly within 1 km of (lat, lng).
function generateCompetitors(rand, lat, lng, count, businessType) {
  const names = pickCompetitorPool(businessType);
  const latRad = (lat * Math.PI) / 180;
  const lngScale = Math.max(0.05, Math.cos(latRad));
  const out = [];

  for (let i = 0; i < count; i++) {
    const angle = rand() * 2 * Math.PI;
    const distKm = Math.sqrt(rand()) * 1.0;
    const dLat = (distKm / 111) * Math.sin(angle);
    const dLng = (distKm / (111 * lngScale)) * Math.cos(angle);

    out.push({
      id: i + 1,
      name: names[i % names.length],
      lat: Math.round((lat + dLat) * 1e6) / 1e6,
      lng: Math.round((lng + dLng) * 1e6) / 1e6,
      distanceKm: Math.round(distKm * 100) / 100,
      // M-E1 enrichment — rating and average ticket price
      rating: round1(3.2 + rand() * 1.7),
      avgPriceUSD: Math.round(3 + rand() * 12),
    });
  }
  return out;
}

// helpers
function clamp(v) { return Math.max(0, Math.min(100, v)); }
function round1(v) { return Math.round(v * 10) / 10; }
function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }

module.exports = { buildBlockA, buildBlockB, buildBlockC, buildBlockD, buildBlockE };
