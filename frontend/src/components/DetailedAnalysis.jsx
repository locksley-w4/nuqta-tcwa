// Detailed analysis card. Tabs across the top expose every model in each of
// the 7 SQB Layer-2 blocks (A-G) plus an Overview roll-up. The "Show more
// details" button toggles a per-tab notes panel describing each model and
// the raw values backing the bars.
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TABS = ['Overview', 'Market', 'Demand', 'Location', 'Financials', 'Risk', 'Lending', 'Audience'];

export default function DetailedAnalysis({ result }) {
  const [tab, setTab] = useState('Overview');
  const [expanded, setExpanded] = useState(false);
  const rows = rowsFor(tab, result);
  const notes = notesFor(tab, result);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Detailed analysis</h3>

      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1 border-b border-canvas-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2.5 text-sm transition ${
              tab === t
                ? 'border-brand-500 font-semibold text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,260px]">
        <div className="space-y-3.5">
          {rows.map((r) => (
            <Bar key={r.label} {...r} />
          ))}
        </div>
        <SidePanel result={result} />
      </div>

      {expanded && notes.length > 0 && (
        <div className="mt-5 rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Model notes · {tab}
          </div>
          <ul className="space-y-2.5">
            {notes.map((n) => (
              <li key={n.code} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-700">
                  {n.code}
                </span>
                <div>
                  <div className="font-medium text-slate-800">{n.name}</div>
                  <div className="text-slate-600">{n.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-5 flex w-full items-center justify-center gap-1 rounded-lg border border-canvas-200 bg-canvas-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-canvas-100"
      >
        {expanded ? 'Hide details' : 'Show more details'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </div>
  );
}

function Bar({ label, value, color, suffix = '/100', model }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          {model && (
            <span className="rounded bg-canvas-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {model}
            </span>
          )}
          {label}
        </span>
        <span className="font-mono text-slate-900">
          {Math.round(value)}{suffix}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-canvas-100">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SidePanel({ result }) {
  const som = result.blocks.market.som;
  const annual = result.blocks.demand.annualRevenue;
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        Opportunity size (SOM)
      </div>
      <div className="mt-2 text-3xl font-bold text-emerald-700">${som}M</div>
      <div className="text-xs text-emerald-700/80">Serviceable Obtainable Market</div>

      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        Projected annual revenue
      </div>
      <div className="mt-1 text-2xl font-bold text-emerald-700">
        ${annual.toLocaleString()}
      </div>
    </div>
  );
}

const C = {
  green: '#16a34a',
  blue:  '#2563eb',
  amber: '#f59e0b',
  rose:  '#e11d48',
  violet:'#7c3aed',
  teal:  '#0d9488',
};

function rowsFor(tab, result) {
  const { blocks, blockScores } = result;
  const compScore = Math.max(0, 100 - blocks.risk.competitorsWithin1km * 4);

  if (tab === 'Market') {
    return [
      { label: 'Niche opportunity (M-A5)',  value: blocks.market.nicheOpportunityScore,         color: C.green,  model: 'M-A5' },
      { label: 'Saturation index (M-A3)',   value: blocks.market.saturationIndex,                color: C.amber,  model: 'M-A3' },
      { label: 'GAP (normative vs actual)',  value: clampScore(50 - blocks.market.gapAnalysis.gapPercent), color: C.blue,  model: 'M-A2' },
      { label: 'Wallet share',               value: Math.min(100, blocks.market.walletShare.sharePct * 12), color: C.violet, model: 'M-A4' },
      { label: 'Cannibalization risk',       value: blocks.market.cannibalization.overlapPct * 3, color: C.rose,   model: 'M-A6' },
    ];
  }
  if (tab === 'Demand') {
    return [
      { label: 'Demand score (M-B1)',           value: blocks.demand.demandScore,                          color: C.green,  model: 'M-B1' },
      { label: 'Population growth 5y (M-B3)',   value: blocks.demand.populationDynamics.growth5yPct * 12,  color: C.blue,   model: 'M-B3' },
      { label: 'Income trend 3y (M-B4)',        value: blocks.demand.incomeTrend.threeYearPct * 4,         color: C.green,  model: 'M-B4' },
      { label: 'MCC trend strength (M-B5)',     value: blocks.demand.mccTrend.strength,                    color: C.violet, model: 'M-B5' },
      { label: 'New competitors next 12mo',     value: clampScore(100 - blocks.demand.competitorRegistrationForecast.next12m * 8), color: C.rose, model: 'M-B6' },
    ];
  }
  if (tab === 'Location') {
    return [
      { label: 'Pedestrian traffic (M-C2)',  value: blocks.location.pedestrianTrafficScore, color: C.blue,   model: 'M-C2' },
      { label: 'Car traffic (M-C2)',         value: blocks.location.carTrafficScore,        color: C.blue,   model: 'M-C2' },
      { label: 'Anchor effect (M-C5)',       value: blocks.location.anchorEffect.score,     color: C.green,  model: 'M-C5' },
      { label: 'Street vitality (M-C4)',     value: blocks.location.streetVitalityIndex,    color: C.green,  model: 'M-C4' },
      { label: 'Visibility (M-C6)',          value: blocks.location.visibilityScore,        color: C.amber,  model: 'M-C6' },
      { label: 'Composite score (M-C1)',     value: blocks.location.locationScore,          color: C.blue,   model: 'M-C1' },
    ];
  }
  if (tab === 'Financials') {
    return [
      { label: 'Financial viability (M-D1)',     value: blocks.financials.financialScore,                          color: C.green,  model: 'M-D1' },
      { label: 'Survival 2y (M-D1)',             value: blocks.financials.survival2yProb,                          color: C.green,  model: 'M-D1' },
      { label: 'ROI score (M-D3)',               value: Math.min(100, blocks.financials.roiEstimate * 1.5),        color: C.blue,   model: 'M-D3' },
      { label: 'LTV/CAC ratio (M-D2)',           value: Math.min(100, blocks.financials.unitEconomics.ltvCacRatio * 12), color: C.violet, model: 'M-D2' },
      { label: 'Net margin (M-D6)',              value: Math.max(0, blocks.financials.netMarginPct * 4),           color: C.green,  model: 'M-D6' },
      { label: 'Rental burden — safety (M-D4)',  value: rentalSafetyScore(blocks.financials.rentalBurden),         color: rentalColor(blocks.financials.rentalBurden), model: 'M-D4' },
    ];
  }
  if (tab === 'Risk') {
    return [
      { label: 'Competition score (M-E1)',  value: compScore,                                  color: C.amber, model: 'M-E1' },
      { label: 'Closure resilience (M-E2)', value: Math.max(0, 100 - blocks.risk.closureProbability * 1.5), color: C.green, model: 'M-E2' },
      { label: 'Regulatory safety (M-E3)',  value: 100 - blocks.risk.regulatoryRisk.score,     color: C.blue,  model: 'M-E3' },
      { label: 'Entry barriers (M-E4)',     value: blocks.risk.entryBarriers.index,            color: C.rose,  model: 'M-E4' },
      { label: 'Price pressure (M-E5)',     value: blocks.risk.pricePressure.score,            color: C.amber, model: 'M-E5' },
    ];
  }
  if (tab === 'Lending') {
    return [
      { label: 'Credit risk score (M-F1)',     value: blocks.lending.creditRiskScore,                       color: C.blue,   model: 'M-F1' },
      { label: '— client component',           value: blocks.lending.creditRiskTriple.client,               color: C.violet, model: 'M-F1' },
      { label: '— location component',         value: blocks.lending.creditRiskTriple.location,             color: C.violet, model: 'M-F1' },
      { label: '— niche component',            value: blocks.lending.creditRiskTriple.niche,                color: C.violet, model: 'M-F1' },
      { label: 'NPL early warning (M-F4)',     value: 100 - blocks.lending.nplEarlyWarning.anomalyScore,    color: C.green,  model: 'M-F4' },
      { label: 'DTI safety @ 12mo (M-F3)',     value: Math.max(0, 100 - blocks.lending.dti.twelveMonth * 100), color: C.amber, model: 'M-F3' },
    ];
  }
  if (tab === 'Audience') {
    return [
      { label: 'Spending power (M-G5)',       value: blocks.social.spendingPower.index,            color: C.violet, model: 'M-G5' },
      { label: 'Chain-brand affinity (M-G4)', value: blocks.social.brandAffinity.chainPct,         color: C.blue,   model: 'M-G4' },
      { label: 'Day population intensity (M-G2)', value: clampScore(blocks.social.dayPopulation.total / 200), color: C.teal, model: 'M-G2' },
      { label: 'Top segment share (M-G1)',    value: blocks.social.segments[0]?.sharePct || 0,     color: C.green,  model: 'M-G1' },
      { label: `Behavior: ${blocks.social.consumerBehavior.dominant}`,
        value: blocks.social.consumerBehavior.mix.find(m => m.type === blocks.social.consumerBehavior.dominant)?.sharePct || 0,
        color: C.amber, model: 'M-G3' },
    ];
  }
  // Overview
  return [
    { label: 'Market potential',     value: blockScores.market,    color: C.green },
    { label: 'Demand',               value: blockScores.demand,    color: C.green },
    { label: 'Location quality',     value: blockScores.location,  color: C.blue },
    { label: 'Competition',          value: compScore,             color: C.amber },
    { label: 'Financial viability',  value: blockScores.financials,color: C.green },
    { label: 'Lending fit',          value: blockScores.lending,   color: C.blue },
    { label: 'Audience strength',    value: blockScores.social,    color: C.violet },
  ];
}

function rentalSafetyScore({ currentRentPct }) {
  return Math.max(0, Math.min(100, 100 - (currentRentPct - 8) * 5));
}
function rentalColor({ zone }) {
  return zone === 'green' ? C.green : zone === 'yellow' ? C.amber : C.rose;
}
function clampScore(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Per-tab model notes — surfaced when the user clicks "Show more details".
function notesFor(tab, result) {
  const { blocks } = result;
  if (tab === 'Market') {
    return [
      { code: 'M-A1', name: 'Market sizing',         detail: `TAM $${blocks.market.tam}M · SAM $${blocks.market.sam}M · SOM $${blocks.market.som}M.` },
      { code: 'M-A2', name: 'GAP analysis',          detail: `Normative ${blocks.market.gapAnalysis.normativeCount} outlets vs actual ${blocks.market.gapAnalysis.actualCount} (${blocks.market.gapAnalysis.gapVerdict}).` },
      { code: 'M-A3', name: 'Saturation index',      detail: `Niche saturation ${blocks.market.saturationIndex}/100 — 0 empty, 100 overheated.` },
      { code: 'M-A4', name: 'Wallet share',          detail: `${blocks.market.walletShare.sharePct}% of household spend in this MCC, trend ${blocks.market.walletShare.trend}.` },
      { code: 'M-A5', name: 'Niche opportunity',     detail: `Composite niche-opportunity score ${blocks.market.nicheOpportunityScore}/100.` },
      { code: 'M-A6', name: 'Cross-niche cannibalization', detail: `${blocks.market.cannibalization.overlapPct}% revenue overlap with: ${blocks.market.cannibalization.niches.join(', ')}.` },
    ];
  }
  if (tab === 'Demand') {
    return [
      { code: 'M-B1', name: 'Demand forecast',          detail: `12-mo $${blocks.demand.annualRevenue.toLocaleString()}; peak $${blocks.demand.peak.toLocaleString()}, trough $${blocks.demand.trough.toLocaleString()}. Confidence band widens to 36 mo.` },
      { code: 'M-B2', name: 'Seasonality model',        detail: `Index peaks during Ramadan/Navro'z (${Math.max(...blocks.demand.seasonalityIndex.map(s => s.index))}); summer trough.` },
      { code: 'M-B3', name: 'Population dynamics',      detail: `${blocks.demand.populationDynamics.growth5yPct}% population growth in 5 yr; target audience growth ${blocks.demand.populationDynamics.targetAudienceGrowthPct}%.` },
      { code: 'M-B4', name: 'Income trend',             detail: `Purchasing power index ${blocks.demand.incomeTrend.purchasingPowerIndex}/100; +${blocks.demand.incomeTrend.threeYearPct}% income over 3 yr.` },
      { code: 'M-B5', name: 'MCC trend',                detail: `${blocks.demand.mccTrend.direction} (strength ${blocks.demand.mccTrend.strength}). Signal: ${blocks.demand.mccTrend.signal}.` },
      { code: 'M-B6', name: 'Competitor registration',  detail: `Expecting ~${blocks.demand.competitorRegistrationForecast.next12m} new competitors in 12 mo, ~${blocks.demand.competitorRegistrationForecast.next24m} in 24 mo.` },
    ];
  }
  if (tab === 'Location') {
    return [
      { code: 'M-C1', name: 'Location score',     detail: `Composite ${blocks.location.locationScore}/100 from 8 sub-factors.` },
      { code: 'M-C2', name: 'Traffic scoring',    detail: `Pedestrian ${blocks.location.pedestrianTrafficScore}/100, car ${blocks.location.carTrafficScore}/100, peak hour ${String(blocks.location.peakHour).padStart(2, '0')}:00.` },
      { code: 'M-C3', name: 'Isochrone demand',   detail: `~${blocks.location.isochrone.fiveMinPopulation.toLocaleString()} reachable in 5 min walk · ${blocks.location.isochrone.tenMinPopulation.toLocaleString()} in 10 min.` },
      { code: 'M-C4', name: 'Street vitality',    detail: `${blocks.location.streetVitalityIndex}% active storefronts on the corridor.` },
      { code: 'M-C5', name: 'Anchor effect',      detail: `${blocks.location.anchorEffect.rating} (${blocks.location.anchorEffect.score}/100) — ${blocks.location.anchorEffect.nearbyAnchors} anchors nearby.` },
      { code: 'M-C6', name: 'Visibility score',   detail: `${blocks.location.visibilityScore}/100 — share of approach lines that see the storefront.` },
    ];
  }
  if (tab === 'Financials') {
    return [
      { code: 'M-D1', name: 'Viability check',       detail: `Break-even ${blocks.financials.breakEvenMonths} mo · runway ${blocks.financials.runwayMonths} mo · 2-yr survival ${blocks.financials.survival2yProb}%.` },
      { code: 'M-D2', name: 'Unit economics',        detail: `LTV $${blocks.financials.unitEconomics.ltvUSD} · CAC $${blocks.financials.unitEconomics.cacUSD} · LTV/CAC ${blocks.financials.unitEconomics.ltvCacRatio}x · payback ${blocks.financials.unitEconomics.paybackPeriodMonths} mo.` },
      { code: 'M-D3', name: 'ROI / NPV / IRR',       detail: `ROI ${blocks.financials.roiEstimate}% · NPV $${blocks.financials.npvUSD.toLocaleString()} · IRR ${blocks.financials.irrPct}%.` },
      { code: 'M-D4', name: 'Rental burden',         detail: `${blocks.financials.rentalBurden.currentRentPct}% of revenue (${blocks.financials.rentalBurden.zone} zone) · safe ceiling ${blocks.financials.rentalBurden.safeRentPct}%.` },
      { code: 'M-D5', name: 'Cash flow simulator',   detail: `${blocks.financials.cashGapMonths}/24 cash-gap months flagged in the Monte-Carlo run.` },
      { code: 'M-D6', name: 'COGS & margins',        detail: `COGS ${blocks.financials.cogsPct}% · gross ${blocks.financials.grossMarginPct}% · net ${blocks.financials.netMarginPct}%.` },
    ];
  }
  if (tab === 'Risk') {
    return [
      { code: 'M-E1', name: 'Competitor intelligence', detail: `${blocks.risk.competitorsWithin1km} within 1km, ${blocks.risk.competitorsWithin300m} within 300m · avg rating ${blocks.risk.avgCompetitorRating}/5 · avg ticket $${blocks.risk.avgCompetitorPriceUSD}.` },
      { code: 'M-E2', name: 'Churn prediction',        detail: `Closure prob ${blocks.risk.closureProbability}%. Top factor: ${blocks.risk.closureRiskFactors[0]?.factor} (${blocks.risk.closureRiskFactors[0]?.contributionPct}%).` },
      { code: 'M-E3', name: 'Regulatory risk',         detail: `Score ${blocks.risk.regulatoryRisk.score}/100 · ~${blocks.risk.regulatoryRisk.expectedInspectionsYear} inspections/yr · avg fine $${blocks.risk.regulatoryRisk.avgFineUSD}.` },
      { code: 'M-E4', name: 'Entry barriers',          detail: `Composite ${blocks.risk.entryBarriers.index}/100 (financial ${blocks.risk.entryBarriers.financial}, regulatory ${blocks.risk.entryBarriers.regulatory}, competitive ${blocks.risk.entryBarriers.competitive}).` },
      { code: 'M-E5', name: 'Price pressure',          detail: `Pressure ${blocks.risk.pricePressure.score}/100 · optimal price band $${blocks.risk.pricePressure.optimalPriceUSD.min}–$${blocks.risk.pricePressure.optimalPriceUSD.max}.` },
    ];
  }
  if (tab === 'Lending') {
    return [
      { code: 'M-F1', name: 'Credit risk score',          detail: `${blocks.lending.creditRiskScore}/100 (grade ${blocks.lending.creditGrade}) — client × location × niche.` },
      { code: 'M-F2', name: 'Loan sizing recommender',    detail: `Recommended loan amount $${blocks.lending.recommendedLoanAmount.toLocaleString()} (40% of cash flow, 36 mo @ 24% APR).` },
      { code: 'M-F3', name: 'DTI predictor',              detail: `DTI 6 mo ${Math.round(blocks.lending.dti.sixMonth * 100)}% · 12 mo ${Math.round(blocks.lending.dti.twelveMonth * 100)}% · 24 mo ${Math.round(blocks.lending.dti.twentyFour * 100)}%.` },
      { code: 'M-F4', name: 'NPL early warning',          detail: `${blocks.lending.nplEarlyWarning.status.toUpperCase()} signal · default prob (12mo) ${blocks.lending.nplEarlyWarning.defaultProb12mPct}%.` },
      { code: 'M-F5', name: 'Bank product recommender',   detail: `${blocks.lending.productRecommendation.name} — ${blocks.lending.productRecommendation.reason}` },
    ];
  }
  if (tab === 'Audience') {
    return [
      { code: 'M-G1', name: 'Customer segment profiler',    detail: `Top segment: ${blocks.social.segments[0]?.name} (${blocks.social.segments[0]?.sharePct}%) · ${blocks.social.segments[0]?.ageRange} · ${blocks.social.segments[0]?.incomeBand} income.` },
      { code: 'M-G2', name: 'Day population estimator',     detail: `${blocks.social.dayPopulation.total.toLocaleString()} total — residents ${blocks.social.dayPopulation.residents.toLocaleString()}, visitors ${blocks.social.dayPopulation.visitors.toLocaleString()}, transit ${blocks.social.dayPopulation.transit.toLocaleString()}. Peak ${String(blocks.social.dayPopulation.peakHour).padStart(2, '0')}:00.` },
      { code: 'M-G3', name: 'Consumer behavior',            detail: `Dominant behavior: ${blocks.social.consumerBehavior.dominant} — ${blocks.social.consumerBehavior.dominantDescription}` },
      { code: 'M-G4', name: 'Brand affinity',               detail: `Chains ${blocks.social.brandAffinity.chainPct}% vs independents ${blocks.social.brandAffinity.independentPct}%.` },
      { code: 'M-G5', name: 'Spending power',               detail: `${blocks.social.spendingPower.index}/100 (${blocks.social.spendingPower.band}) — heat-mapped purchasing power.` },
    ];
  }
  // Overview tab — summarize each block's headline number
  return [
    { code: 'A', name: 'Market potential',     detail: `Niche opportunity ${blocks.market.nicheOpportunityScore}/100, saturation ${blocks.market.saturationIndex}/100.` },
    { code: 'B', name: 'Demand & forecasting', detail: `12-mo revenue $${blocks.demand.annualRevenue.toLocaleString()} with ${blocks.demand.demandScore}/100 score.` },
    { code: 'C', name: 'Location quality',     detail: `Composite location score ${blocks.location.locationScore}/100.` },
    { code: 'D', name: 'Financials',           detail: `Break-even ${blocks.financials.breakEvenMonths} mo · ROI ${blocks.financials.roiEstimate}% · net margin ${blocks.financials.netMarginPct}%.` },
    { code: 'E', name: 'Risk & competition',   detail: `${blocks.risk.competitorsWithin1km} competitors / 1km · closure prob ${blocks.risk.closureProbability}%.` },
    { code: 'F', name: 'Lending fit',          detail: `Credit grade ${blocks.lending.creditGrade} (${blocks.lending.creditRiskScore}/100).` },
    { code: 'G', name: 'Audience strength',    detail: `Spending power ${blocks.social.spendingPower.index}/100 (${blocks.social.spendingPower.band}).` },
  ];
}
