// Top-of-dashboard hero shown when both site and finance results exist.
// Combines geographic and financial scores into one number.
import { TrendingUp, MapPin, Wallet } from 'lucide-react';

const TIERS = {
  HIGH: {
    label: 'HIGH success probability',
    container: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white text-emerald-800',
    badge: 'bg-emerald-500 text-white',
    note: 'Both site and financials clear the bar — proceed to apply.',
  },
  MODERATE: {
    label: 'MODERATE success probability',
    container: 'border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/60 to-white text-amber-800',
    badge: 'bg-amber-500 text-white',
    note: 'One side is strong, the other needs tightening before funding.',
  },
  LOW: {
    label: 'LOW success probability',
    container: 'border-rose-200 bg-gradient-to-br from-rose-50 via-rose-50/60 to-white text-rose-800',
    badge: 'bg-rose-500 text-white',
    note: 'Both site and financial signals are weak — restructure before applying.',
  },
};

function tierFor(score) {
  if (score >= 75) return TIERS.HIGH;
  if (score >= 55) return TIERS.MODERATE;
  return TIERS.LOW;
}

export default function SuccessProbability({ geoScore, finScore }) {
  const combined = Math.round(geoScore * 0.5 + finScore * 0.5);
  const tier = tierFor(combined);

  return (
    <div className={`rounded-2xl border p-6 shadow-card ${tier.container}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <span className={`rounded-xl p-3 ${tier.badge} shadow-card`}>
            <TrendingUp size={32} strokeWidth={2.4} />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Overall business success probability
            </div>
            <div className="text-5xl font-bold leading-none">{combined}%</div>
            <div className="mt-1 text-sm font-semibold uppercase tracking-wide opacity-90">
              {tier.label}
            </div>
            <div className="mt-1 text-sm opacity-90">{tier.note}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Component icon={MapPin} label="Geographic" score={geoScore} sub="Site, demand, comp." />
          <Component icon={Wallet} label="Financial" score={finScore} sub="DSCR, collateral, ROI" />
        </div>
      </div>
    </div>
  );
}

function Component({ icon: Icon, label, score, sub }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest opacity-70">{label}</span>
        <span className="rounded bg-black/5 p-1">
          <Icon size={12} />
        </span>
      </div>
      <div className="mt-1 font-mono text-2xl font-bold">
        {score}
        <span className="text-sm opacity-70">/100</span>
      </div>
      <div className="text-[10px] opacity-70">{sub}</div>
    </div>
  );
}
