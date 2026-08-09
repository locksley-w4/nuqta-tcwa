// Four-card "Key insights" row. Each insight is derived from the analysis
// blocks so it summarizes the file at a glance.
import { TrendingUp, MapPin, DollarSign, ShieldAlert } from 'lucide-react';

const TONES = {
  green:  'bg-emerald-50 text-emerald-600',
  blue:   'bg-blue-50 text-blue-600',
  amber:  'bg-amber-50 text-amber-600',
  rose:   'bg-rose-50 text-rose-600',
  slate:  'bg-slate-100 text-slate-600',
};

export default function KeyInsights({ result }) {
  const insights = buildInsights(result);
  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Key insights</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insights.map((it, i) => (
          <Card key={i} {...it} />
        ))}
      </div>
    </div>
  );
}

function Card({ icon: Icon, tone, title, body }) {
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
      <span
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${TONES[tone]}`}
      >
        <Icon size={16} />
      </span>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function buildInsights(result) {
  const { businessType, blocks } = result;
  const insights = [];

  // Demand
  if (blocks.demand.demandScore >= 70) {
    insights.push({
      icon: TrendingUp,
      tone: 'green',
      title: 'Strong demand',
      body: `High foot traffic and solid demand for ${businessType.toLowerCase()}s in this area.`,
    });
  } else if (blocks.demand.demandScore >= 50) {
    insights.push({
      icon: TrendingUp,
      tone: 'amber',
      title: 'Moderate demand',
      body: `Demand is steady but not exceptional; expect a slow ramp-up phase.`,
    });
  } else {
    insights.push({
      icon: TrendingUp,
      tone: 'rose',
      title: 'Weak demand',
      body: `Local demand signals are below average — sales projections are conservative.`,
    });
  }

  // Location
  if (blocks.location.locationScore >= 70) {
    insights.push({
      icon: MapPin,
      tone: 'blue',
      title: 'Great location',
      body: `Excellent visibility and accessibility with ${blocks.location.anchorEffect.rating.toLowerCase()} anchor effect.`,
    });
  } else if (blocks.location.locationScore >= 50) {
    insights.push({
      icon: MapPin,
      tone: 'amber',
      title: 'Decent location',
      body: `Pedestrian traffic is acceptable but anchor effect is ${blocks.location.anchorEffect.rating.toLowerCase()}.`,
    });
  } else {
    insights.push({
      icon: MapPin,
      tone: 'rose',
      title: 'Weak location',
      body: `Foot traffic ${blocks.location.pedestrianTrafficScore}/100 — site requires destination-driven marketing.`,
    });
  }

  // Financial
  if (blocks.financials.financialScore >= 70) {
    insights.push({
      icon: DollarSign,
      tone: 'amber',
      title: 'Profitable potential',
      body: `Estimated break-even in ${blocks.financials.breakEvenMonths} months with ${blocks.financials.roiEstimate}% ROI.`,
    });
  } else if (blocks.financials.financialScore >= 50) {
    insights.push({
      icon: DollarSign,
      tone: 'amber',
      title: 'Marginal payback',
      body: `Break-even ~${blocks.financials.breakEvenMonths} months — ROI of ${blocks.financials.roiEstimate}% is below typical.`,
    });
  } else {
    insights.push({
      icon: DollarSign,
      tone: 'rose',
      title: 'Slow payback',
      body: `Break-even ${blocks.financials.breakEvenMonths} months — capital tied up longer than typical.`,
    });
  }

  // Competition
  if (blocks.risk.competitorsWithin1km >= 12) {
    insights.push({
      icon: ShieldAlert,
      tone: 'rose',
      title: 'High competition',
      body: `${blocks.risk.competitorsWithin1km} competitors within 1km. Focus on differentiation to stand out.`,
    });
  } else if (blocks.risk.competitorsWithin1km >= 5) {
    insights.push({
      icon: ShieldAlert,
      tone: 'amber',
      title: 'Moderate competition',
      body: `${blocks.risk.competitorsWithin1km} competitors within 1km. Healthy market with room to position.`,
    });
  } else {
    insights.push({
      icon: ShieldAlert,
      tone: 'green',
      title: 'Low competition',
      body: `Only ${blocks.risk.competitorsWithin1km} competitors within 1km — strong room to capture share.`,
    });
  }

  return insights;
}
