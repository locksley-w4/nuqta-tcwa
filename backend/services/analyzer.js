// Top-level orchestrator. Calls all 7 SQB Layer-2 model blocks (A-G),
// applies business-type sensitivity, computes the weighted final score,
// and asks the reasoning engine for human-readable commentary.

const { hashString, seededRandom } = require('../utils/random');
const {
  buildBlockA,
  buildBlockB,
  buildBlockC,
  buildBlockD,
  buildBlockE,
} = require('./blocks');
const { buildBlockF } = require('./lending');
const { buildBlockG } = require('./social');
const { buildReasoning } = require('./reasoning');
const {
  WEIGHTS,
  computeFinalScore,
  recommendationFromScore,
  creditRiskFromScore,
  isCompetitionSensitive,
} = require('../utils/scoring');

function analyzeBusiness({ businessType, lat, lng }) {
  const seed = hashString(
    `${businessType.toLowerCase()}|${lat.toFixed(3)}|${lng.toFixed(3)}`
  );
  const rand = seededRandom(seed);

  const market = buildBlockA(rand, businessType);
  const demand = buildBlockB(rand);
  const location = buildBlockC(rand);
  // Block D depends on demand for cash-flow / NPV calculations.
  const financials = buildBlockD(rand, businessType, demand);
  const risk = buildBlockE(rand, lat, lng, businessType);

  // Competition sensitivity penalty for cafes/restaurants.
  let competitionScore = risk.competitionScore;
  let competitionSensitive = false;
  if (isCompetitionSensitive(businessType)) {
    competitionScore = Math.round(competitionScore * 0.85);
    competitionSensitive = true;
  }

  const finalScore = computeFinalScore(
    {
      locationScore: location.locationScore,
      demandScore: demand.demandScore,
      competitionScore,
      financialScore: financials.financialScore,
    },
    WEIGHTS
  );

  const recommendation = recommendationFromScore(finalScore);
  const creditRisk = creditRiskFromScore(finalScore);

  const summary = {
    locationScore: location.locationScore,
    demandScore: demand.demandScore,
    competitionScore,
    financialScore: financials.financialScore,
    finalScore,
    recommendation,
    creditRisk,
    competitionSensitive,
  };

  // Block F (Lending) and G (Audience) need the rolled-up blocks/summary.
  const lending = buildBlockF(rand, {
    blocks: { market, demand, location, financials, risk },
    summary,
  });
  const social = buildBlockG(rand);

  // Per-block normalized scores for the radar.
  const blockScores = {
    market: market.nicheOpportunityScore,
    demand: demand.demandScore,
    location: location.locationScore,
    financials: financials.financialScore,
    risk: Math.round((competitionScore + (100 - risk.closureProbability)) / 2),
    lending: lending.creditRiskScore,
    social: social.spendingPower.index,
  };

  const reasoning = buildReasoning({
    blocks: { market, demand, location, financials, risk },
    summary,
    businessType,
  });

  return {
    businessType,
    coordinates: { lat, lng },
    blocks: { market, demand, location, financials, risk, lending, social },
    blockScores,
    summary,
    reasoning,
    weights: WEIGHTS,
  };
}

module.exports = { analyzeBusiness };
