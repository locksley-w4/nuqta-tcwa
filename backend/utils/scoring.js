// Bank scoring weights per spec:
// Final = 0.30 * Location + 0.25 * Demand + 0.20 * Competition + 0.25 * Financials
const WEIGHTS = {
  location: 0.30,
  demand: 0.25,
  competition: 0.20,
  financial: 0.25,
};

// Business types that are highly exposed to local competition.
// For these, the competition score is dampened (penalty applied).
const COMPETITION_SENSITIVE = [
  'cafe', 'coffee', 'restaurant', 'bakery', 'bar',
  'pizza', 'fast food', 'burger', 'sushi',
];

function isCompetitionSensitive(businessType) {
  const t = (businessType || '').toLowerCase();
  return COMPETITION_SENSITIVE.some((k) => t.includes(k));
}

function computeFinalScore(scores, weights) {
  const v =
    scores.locationScore * weights.location +
    scores.demandScore * weights.demand +
    scores.competitionScore * weights.competition +
    scores.financialScore * weights.financial;
  return Math.round(Math.max(0, Math.min(100, v)));
}

function recommendationFromScore(finalScore) {
  if (finalScore >= 75) return 'YES';
  if (finalScore >= 55) return 'CONDITIONAL';
  return 'NO';
}

function creditRiskFromScore(finalScore) {
  if (finalScore >= 75) return 'Low';
  if (finalScore >= 55) return 'Medium';
  return 'High';
}

module.exports = {
  WEIGHTS,
  computeFinalScore,
  recommendationFromScore,
  creditRiskFromScore,
  isCompetitionSensitive,
};
