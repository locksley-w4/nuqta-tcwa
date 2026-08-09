// Financial Viability & Bank Readiness analyzer.
// Calculates the standard banking metrics a Uzbek commercial lender uses to
// decide whether to fund a small-business loan, and turns them into a
// human-readable "AI Bank Feedback" report.

// Standard rate assumption — typical Uzbek commercial loan in 2026.
const ANNUAL_RATE = 0.24;
const MONTHLY_RATE = ANNUAL_RATE / 12;

// Bank-policy thresholds.
const TARGET_DSCR = 1.2;       // debt service coverage ratio
const TARGET_COVERAGE = 1.25;  // collateral / loan amount

// Standard amortization formula: PMT = P · r · (1+r)^n / ((1+r)^n − 1).
// r = 0 short-circuits to a flat principal/term split.
function monthlyPayment(principal, monthlyRate, termMonths) {
  if (termMonths <= 0) return 0;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// Piecewise-linear sub-scores so they degrade gracefully past the threshold
// instead of cliff-edging to zero.
function dscrSubScore(dscr) {
  if (!Number.isFinite(dscr) || dscr <= 0) return 0;
  if (dscr >= 1.5) return 100;
  if (dscr >= 1.2) return 80 + ((dscr - 1.2) / 0.3) * 20;
  if (dscr >= 1.0) return 50 + ((dscr - 1.0) / 0.2) * 30;
  return Math.max(0, dscr * 50);
}

function coverageSubScore(cov) {
  if (!Number.isFinite(cov) || cov <= 0) return 0;
  if (cov >= 1.5) return 100;
  if (cov >= 1.25) return 80 + ((cov - 1.25) / 0.25) * 20;
  if (cov >= 1.0) return 50 + ((cov - 1.0) / 0.25) * 30;
  return Math.max(0, cov * 50);
}

function verdictFromScore(score) {
  if (score >= 75) return 'APPROVE';
  if (score >= 55) return 'REVIEW';
  return 'DECLINE';
}

function ratePremiumFor(verdict) {
  return { APPROVE: 0, REVIEW: 1.5, DECLINE: null }[verdict];
}

function buildFeedback({
  dscr,
  coverage,
  netIncome,
  monthlyPayment,
  loanAmount,
  collateralValue,
  monthlyRevenue,
  fundabilityScore,
}) {
  const items = [];

  // Cash-flow check
  if (netIncome <= 0) {
    items.push(
      `BLOCKER: Operating expenses ($${fmt(monthlyRevenue * 0)}—) exceed revenue. ` +
        `Net income must be positive before any commercial loan is fundable.`
    );
  } else if (dscr < 1.0) {
    items.push(
      `BLOCKER: DSCR is ${dscr.toFixed(2)} — net income does not even cover the ` +
        `monthly payment of $${fmt(monthlyPayment)}. Loan is unservicable as proposed.`
    );
  } else if (dscr < TARGET_DSCR) {
    items.push(
      `WARNING: DSCR is ${dscr.toFixed(2)}. Uzbek banks typically require ≥ ${TARGET_DSCR.toFixed(2)}. ` +
        `Increase net income by ~$${fmt(monthlyPayment * TARGET_DSCR - netIncome)} / month, ` +
        `extend the term, or reduce the loan amount.`
    );
  } else if (dscr < 1.5) {
    items.push(
      `DSCR of ${dscr.toFixed(2)} clears the ${TARGET_DSCR.toFixed(2)} floor but is tight — ` +
        `expect the bank to price you up or ask for additional covenants.`
    );
  } else {
    items.push(
      `Strong DSCR (${dscr.toFixed(2)}) — comfortable cash-flow cushion. ` +
        `You have leverage to negotiate the rate.`
    );
  }

  // Collateral check
  const coveragePct = Math.round(coverage * 100);
  if (coverage < 1.0) {
    items.push(
      `BLOCKER: Collateral coverage is ${coveragePct}%. The loan exceeds the asset value — ` +
        `unsecured by Uzbek lending standards.`
    );
  } else if (coverage < TARGET_COVERAGE) {
    const needed = loanAmount * TARGET_COVERAGE - collateralValue;
    items.push(
      `WARNING: Your collateral coverage is ${coveragePct}%. Uzbek banks typically require ${Math.round(
        TARGET_COVERAGE * 100
      )}%. Either lower the loan request to $${fmt(collateralValue / TARGET_COVERAGE)}, ` +
        `or pledge an extra $${fmt(needed)} of collateral.`
    );
  } else if (coverage < 1.5) {
    items.push(
      `Collateral coverage of ${coveragePct}% meets the floor — expect standard rates.`
    );
  } else {
    items.push(
      `Strong collateral cushion (${coveragePct}%) — opens room to negotiate a rate discount.`
    );
  }

  // Composite verdict
  const verdict = verdictFromScore(fundabilityScore);
  if (verdict === 'APPROVE') {
    items.push(
      `Overall: file is bank-ready. Fundability score ${fundabilityScore}/100 — proceed with confidence.`
    );
  } else if (verdict === 'REVIEW') {
    items.push(
      `Overall: borderline file (${fundabilityScore}/100). A bank will likely approve with conditions ` +
        `(rate premium of ~${ratePremiumFor('REVIEW')}%, additional guarantor, or quarterly covenant review).`
    );
  } else {
    items.push(
      `Overall: file would be declined as-is (${fundabilityScore}/100). Restructure before applying.`
    );
  }

  return items;
}

function fmt(n) {
  return Math.max(0, Math.round(n)).toLocaleString();
}

function analyzeFinance({
  loanAmount,
  collateralValue,
  monthlyRevenue,
  monthlyExpenses,
  termMonths,
}) {
  const payment = monthlyPayment(loanAmount, MONTHLY_RATE, termMonths);
  const totalPayment = payment * termMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const netIncome = monthlyRevenue - monthlyExpenses;
  const dscr = payment > 0 ? netIncome / payment : 0;
  const coverage = loanAmount > 0 ? collateralValue / loanAmount : 0;

  // Composite Bank Fundability Score.
  const dscrScore = dscrSubScore(dscr);
  const coverageScore = coverageSubScore(coverage);
  const operatingMargin = monthlyRevenue > 0 ? netIncome / monthlyRevenue : 0;
  const marginBonus = Math.max(0, Math.min(10, operatingMargin * 25));

  let fundabilityScore = Math.round(
    dscrScore * 0.55 + coverageScore * 0.40 + marginBonus * 0.5
  );

  // Hard floor: if either ratio is below 1.0, score is capped.
  if (dscr < 1.0 || coverage < 1.0) {
    fundabilityScore = Math.min(fundabilityScore, 45);
  }
  fundabilityScore = Math.max(0, Math.min(100, fundabilityScore));

  const verdict = verdictFromScore(fundabilityScore);

  const feedback = buildFeedback({
    dscr,
    coverage,
    netIncome,
    monthlyPayment: payment,
    loanAmount,
    collateralValue,
    monthlyRevenue,
    fundabilityScore,
  });

  return {
    inputs: {
      loanAmount,
      collateralValue,
      monthlyRevenue,
      monthlyExpenses,
      termMonths,
    },
    assumptions: {
      annualRatePct: ANNUAL_RATE * 100,
      targetDSCR: TARGET_DSCR,
      targetCoverage: TARGET_COVERAGE,
    },
    loan: {
      monthlyPayment: round2(payment),
      totalPayment: round2(totalPayment),
      totalInterest: round2(totalInterest),
    },
    metrics: {
      netIncome: round2(netIncome),
      operatingMarginPct: round2(operatingMargin * 100),
      dscr: round2(dscr),
      dscrPasses: dscr >= TARGET_DSCR,
      collateralCoverage: round2(coverage),
      collateralCoveragePct: Math.round(coverage * 100),
      coveragePasses: coverage >= TARGET_COVERAGE,
    },
    fundabilityScore,
    verdict,
    ratePremiumPct: ratePremiumFor(verdict),
    feedback,
  };
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

module.exports = { analyzeFinance };
