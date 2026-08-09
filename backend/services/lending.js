// Block F — Lending & banking products (SQB Layer-2 catalogue).
// M-F1 Credit Risk Score · M-F2 Loan Sizing Recommender · M-F3 DTI Predictor
// M-F4 NPL Early Warning · M-F5 Bank Product Recommender

const PRODUCT_LIBRARY = [
  { id: 'msb-credit', name: 'SME credit line', minScore: 70, fitFor: ['working_capital'] },
  { id: 'msb-leasing', name: 'Equipment leasing', minScore: 55, fitFor: ['capex'] },
  { id: 'bank-guarantee', name: 'Bank guarantee', minScore: 60, fitFor: ['contracts'] },
  { id: 'merchant-loan', name: 'Merchant cash advance', minScore: 45, fitFor: ['short_term'] },
];

function buildBlockF(rand, { blocks }) {
  const { market, demand, location, financials, risk } = blocks;

  // M-F1 — Credit risk as a triple: client × location × niche
  const clientScore = clamp(Math.round(55 + rand() * 35));
  const locationScore = location.locationScore;
  const nicheScore = clamp(Math.round(market.nicheOpportunityScore * 0.7 + (100 - risk.closureProbability) * 0.3));
  const creditRiskScore = Math.round(clientScore * 0.45 + locationScore * 0.30 + nicheScore * 0.25);
  const creditGrade =
    creditRiskScore >= 85 ? 'A'  :
    creditRiskScore >= 75 ? 'A-' :
    creditRiskScore >= 65 ? 'B+' :
    creditRiskScore >= 55 ? 'B'  :
    creditRiskScore >= 45 ? 'C'  : 'D';

  // M-F2 — Loan Sizing Recommender (anchored on cash-flow capacity)
  const monthlyCashFlow = (demand.annualRevenue / 12) * (financials.netMarginPct / 100);
  const safeMonthlyDebtService = Math.max(0, monthlyCashFlow * 0.40);
  // Reverse the standard amortization formula at 24% APR / 36 mo to get principal
  const r = 0.24 / 12;
  const n = 36;
  const factor = Math.pow(1 + r, n);
  const recommendedLoanAmount = Math.max(
    0,
    Math.round((safeMonthlyDebtService * (factor - 1)) / (r * factor))
  );

  // M-F3 — DTI Predictor at 6 / 12 / 24 months
  const baseDti = 0.30 + rand() * 0.20;
  const dti = {
    sixMonth:    round2(baseDti),
    twelveMonth: round2(baseDti * (0.92 + rand() * 0.08)),
    twentyFour:  round2(baseDti * (0.78 + rand() * 0.10)),
  };

  // M-F4 — NPL Early Warning (anomaly signals → traffic light)
  const anomalyScore = clamp(Math.round(
    risk.closureProbability * 0.6 +
    (100 - creditRiskScore) * 0.3 +
    rand() * 20
  ));
  const nplStatus =
    anomalyScore < 30 ? 'green' :
    anomalyScore < 55 ? 'amber' : 'red';
  const defaultProb12mPct = round1(anomalyScore * 0.35 + rand() * 4);

  // M-F5 — Bank Product Recommender
  const eligibleProducts = PRODUCT_LIBRARY.filter((p) => creditRiskScore >= p.minScore);
  const recommendedProduct = (eligibleProducts[0] || PRODUCT_LIBRARY[PRODUCT_LIBRARY.length - 1]).name;
  const productReason = creditRiskScore >= 70
    ? 'Strong credit profile qualifies for a standard SME credit line at base rate.'
    : creditRiskScore >= 55
    ? 'Marginal score steers toward leasing or guarantee — collateral-backed instruments reduce bank exposure.'
    : 'Low score limits options to short-term advances or working-capital lines tied to receivables.';

  return {
    creditRiskScore,
    creditGrade,
    creditRiskTriple: { client: clientScore, location: locationScore, niche: nicheScore },
    recommendedLoanAmount,
    dti,
    nplEarlyWarning: { status: nplStatus, anomalyScore, defaultProb12mPct },
    productRecommendation: { name: recommendedProduct, reason: productReason, eligibleProducts: eligibleProducts.map((p) => p.name) },
  };
}

function clamp(v) { return Math.max(0, Math.min(100, v)); }
function round1(v) { return Math.round(v * 10) / 10; }
function round2(v) { return Math.round(v * 100) / 100; }

module.exports = { buildBlockF };
