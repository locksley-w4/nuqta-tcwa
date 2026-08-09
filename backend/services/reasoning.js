// Reasoning Engine — converts the numerical blocks into a human-readable
// explanation a banker can quote in a credit memo.

function buildReasoning(ctx) {
  const { blocks, summary, businessType } = ctx;
  const factors = [];

  // Location commentary
  if (blocks.location.locationScore >= 70) {
    factors.push(
      `Strong location: pedestrian traffic ${blocks.location.pedestrianTrafficScore}/100 with ` +
        `${blocks.location.anchorEffect.rating.toLowerCase()} anchor effect ` +
        `(${blocks.location.anchorEffect.nearbyAnchors} major anchors nearby).`
    );
  } else if (blocks.location.locationScore < 50) {
    factors.push(
      `Weak location: foot traffic only ${blocks.location.pedestrianTrafficScore}/100 and ` +
        `${blocks.location.anchorEffect.rating.toLowerCase()} anchor effect.`
    );
  }

  // Demand commentary
  if (blocks.demand.demandScore >= 70) {
    factors.push(
      `Healthy demand: projected $${blocks.demand.annualRevenue.toLocaleString()} annual revenue ` +
        `with seasonal peaks during Ramadan and Navro'z.`
    );
  } else if (blocks.demand.demandScore < 50) {
    factors.push(
      `Subdued demand: $${blocks.demand.annualRevenue.toLocaleString()} projected revenue ` +
        `is below the threshold for sustainable operations.`
    );
  }

  // Risk / competition
  if (blocks.risk.competitorsWithin1km >= 15) {
    factors.push(
      `High competition: ${blocks.risk.competitorsWithin1km} similar businesses within 1 km — ` +
        `market saturation risk.`
    );
  } else if (blocks.risk.competitorsWithin1km <= 5) {
    factors.push(
      `Low competition: only ${blocks.risk.competitorsWithin1km} competitors within 1 km — ` +
        `room to capture share.`
    );
  }

  // Financials
  if (blocks.financials.breakEvenMonths <= 12) {
    factors.push(
      `Fast payback: break-even in ~${blocks.financials.breakEvenMonths} months ` +
        `with ${blocks.financials.roiEstimate}% projected ROI.`
    );
  } else if (blocks.financials.breakEvenMonths > 18) {
    factors.push(
      `Slow payback: ~${blocks.financials.breakEvenMonths} months to break-even — ` +
        `capital tied up longer than typical.`
    );
  }

  if (blocks.risk.closureProbability >= 40) {
    factors.push(
      `Elevated closure risk (${blocks.risk.closureProbability}%) — execution must be tight.`
    );
  }

  let summaryText;
  if (summary.recommendation === 'YES') {
    summaryText =
      `Strong viability score of ${summary.finalScore}/100. Market, location and financial ` +
      `indicators all support opening a ${businessType} at this site.`;
  } else if (summary.recommendation === 'CONDITIONAL') {
    summaryText =
      `Mixed signals (${summary.finalScore}/100). A ${businessType} is feasible here but ` +
      `requires mitigations on the weaker dimensions before funding.`;
  } else {
    summaryText =
      `Low viability (${summary.finalScore}/100). Current location and market signals do not ` +
      `support a ${businessType} at this site.`;
  }

  return { summary: summaryText, factors };
}

module.exports = { buildReasoning };
