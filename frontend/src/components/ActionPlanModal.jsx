// Action plan modal — opened from RecommendationCard's "View action plan".
// Builds a concrete to-do list from the weakest dimensions in the analysis.
import {
  TrendingUp, MapPin, ShieldAlert, Wallet, Banknote, Sparkles, CheckCircle2,
} from 'lucide-react';
import Modal from './Modal.jsx';

export default function ActionPlanModal({ open, onClose, result, finance }) {
  if (!result) return null;
  const items = buildActionPlan(result, finance);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Action plan"
      subtitle={`Tailored next steps for the ${result.businessType} site at ${result.coordinates.lat.toFixed(4)}, ${result.coordinates.lng.toFixed(4)}.`}
      maxWidth="max-w-3xl"
    >
      <ol className="space-y-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <li
              key={i}
              className={`flex items-start gap-4 rounded-xl border p-4 ${TONES[item.tone] || TONES.brand}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-card">
                <Icon size={16} />
              </span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs opacity-70">Step {i + 1}</span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm leading-relaxed opacity-90">{item.detail}</p>
                {item.metric && (
                  <div className="mt-2 inline-flex rounded-full bg-white/70 px-2.5 py-0.5 font-mono text-[11px]">
                    {item.metric}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {items.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-700">
          Every dimension is in good shape. The site is ready to commit — focus on
          execution: lease, hiring, and opening logistics.
        </div>
      )}
    </Modal>
  );
}

const TONES = {
  brand:   'border-blue-200    bg-blue-50    text-blue-800',
  good:    'border-emerald-200 bg-emerald-50 text-emerald-800',
  warn:    'border-amber-200   bg-amber-50   text-amber-800',
  bad:     'border-rose-200    bg-rose-50    text-rose-800',
};

function buildActionPlan(result, finance) {
  const items = [];
  const { blocks, summary, businessType } = result;

  // Demand
  if (blocks.demand.demandScore < 65) {
    items.push({
      icon: TrendingUp,
      tone: blocks.demand.demandScore < 50 ? 'bad' : 'warn',
      title: 'Strengthen demand signals',
      detail: `Demand score is ${blocks.demand.demandScore}/100. Use the Ramadan/Navro'z launch window (the seasonal index peaks at ${Math.max(...blocks.demand.seasonalityIndex.map(s => s.index))}) and concentrate marketing spend in Feb–Mar.`,
      metric: `Target ≥ 70 demand · current ${blocks.demand.demandScore}`,
    });
  }

  // Location
  if (blocks.location.locationScore < 65) {
    items.push({
      icon: MapPin,
      tone: blocks.location.locationScore < 50 ? 'bad' : 'warn',
      title: 'Improve site visibility',
      detail: `Pedestrian traffic is ${blocks.location.pedestrianTrafficScore}/100 and visibility is ${blocks.location.visibilityScore}/100. Negotiate signage upgrades or partner with the nearest anchor (rated ${blocks.location.anchorEffect.rating}).`,
      metric: `Anchors nearby: ${blocks.location.anchorEffect.nearbyAnchors}`,
    });
  }

  // Competition
  if (blocks.risk.competitorsWithin1km > 10) {
    items.push({
      icon: ShieldAlert,
      tone: blocks.risk.competitorsWithin1km > 18 ? 'bad' : 'warn',
      title: 'Differentiate from local competitors',
      detail: `${blocks.risk.competitorsWithin1km} competitors within 1 km (avg rating ${blocks.risk.avgCompetitorRating}/5, avg ticket $${blocks.risk.avgCompetitorPriceUSD}). Pick a defensible angle — product range, hours, loyalty, or premium positioning above the band.`,
      metric: `Optimal price band: $${blocks.risk.pricePressure.optimalPriceUSD.min}–$${blocks.risk.pricePressure.optimalPriceUSD.max}`,
    });
  }

  // Financials
  if (blocks.financials.breakEvenMonths > 14 || blocks.financials.cashGapMonths > 0) {
    items.push({
      icon: Wallet,
      tone: blocks.financials.breakEvenMonths > 18 ? 'bad' : 'warn',
      title: 'Tighten the financial model',
      detail: `Break-even at ${blocks.financials.breakEvenMonths} months with ${blocks.financials.cashGapMonths} cash-gap month(s) flagged. Target rent ≤ $${blocks.financials.rentalBurden.recommendedMaxRent.toLocaleString()}/mo and trim COGS from ${blocks.financials.cogsPct}%.`,
      metric: `Net margin ${blocks.financials.netMarginPct}% · Runway ${blocks.financials.runwayMonths} mo`,
    });
  }

  // Lending
  if (blocks.lending.creditRiskScore < 65 || blocks.lending.nplEarlyWarning.status !== 'green') {
    items.push({
      icon: Banknote,
      tone: blocks.lending.creditRiskScore < 50 ? 'bad' : 'warn',
      title: 'Boost bank readiness',
      detail: `Credit grade ${blocks.lending.creditGrade} (${blocks.lending.creditRiskScore}/100), NPL signal "${blocks.lending.nplEarlyWarning.status}". Banker recommendation: ${blocks.lending.productRecommendation.name}. Consider raising collateral or lengthening the term to keep DSCR ≥ 1.20.`,
      metric: `Default prob (12mo): ${blocks.lending.nplEarlyWarning.defaultProb12mPct}%`,
    });
  }

  if (finance && finance.fundabilityScore < 70 && finance.feedback?.[0]) {
    items.push({
      icon: Banknote,
      tone: finance.fundabilityScore < 50 ? 'bad' : 'warn',
      title: 'Address bank feedback',
      detail: finance.feedback[0],
      metric: `Fundability ${finance.fundabilityScore}/100 · Verdict ${finance.verdict}`,
    });
  }

  // Final commit step depending on overall recommendation
  if (summary.recommendation === 'YES' || summary.recommendation === 'CONDITIONAL') {
    items.push({
      icon: CheckCircle2,
      tone: 'good',
      title: 'Lock in the lease and start hiring',
      detail: `Final score ${summary.finalScore}/100 (${summary.recommendation}). Negotiate the lease this week, finalize the menu/SKU mix, and begin hiring 30 days before opening.`,
      metric: `Projected annual revenue $${blocks.demand.annualRevenue.toLocaleString()}`,
    });
  } else {
    items.push({
      icon: Sparkles,
      tone: 'brand',
      title: 'Reconsider the site',
      detail: `Score ${summary.finalScore}/100 puts this site in the "no-go" band. Use the Find Location tool to scan the city for spots scoring ≥ 70 for ${businessType} before committing.`,
    });
  }

  return items;
}
