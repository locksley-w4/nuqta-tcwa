// Full Block-E breakdown — opened from RiskAssessment's "View all risks"
// button. Top-3 closure factors, regulatory, entry barriers, price pressure,
// and the competitor table.
import Modal from './Modal.jsx';
import { ShieldAlert, Building2, AlertTriangle, Tag, Users } from 'lucide-react';

export default function AllRisksModal({ open, onClose, blocks }) {
  if (!blocks) return null;
  const r = blocks.risk;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Full risk breakdown"
      subtitle="Block E · M-E1 through M-E5"
      maxWidth="max-w-4xl"
    >
      {/* M-E2 — Closure probability + top-3 factors */}
      <section>
        <SectionHeader
          icon={ShieldAlert}
          title="Closure probability"
          model="M-E2"
          tone="rose"
        />
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-rose-600">
              {r.closureProbability}%
            </span>
            <span className="text-sm text-slate-500">2-year closure probability</span>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Top 3 risk factors
            </div>
            {r.closureRiskFactors.map((f, i) => (
              <FactorBar key={i} rank={i + 1} factor={f.factor} contribution={f.contributionPct} />
            ))}
          </div>
        </div>
      </section>

      {/* M-E3 — Regulatory risk */}
      <section className="mt-6">
        <SectionHeader icon={AlertTriangle} title="Regulatory risk" model="M-E3" tone="amber" />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Risk score"            value={`${r.regulatoryRisk.score}/100`} tone={tone(r.regulatoryRisk.score, 'inverse')} />
          <Stat label="Inspections / year"    value={r.regulatoryRisk.expectedInspectionsYear} />
          <Stat label="Avg fine"              value={`$${r.regulatoryRisk.avgFineUSD.toLocaleString()}`} />
        </div>
      </section>

      {/* M-E4 — Entry barriers */}
      <section className="mt-6">
        <SectionHeader icon={Building2} title="Market entry barriers" model="M-E4" tone="violet" />
        <div className="grid grid-cols-3 gap-3">
          <BarStat label="Financial"   value={r.entryBarriers.financial}   />
          <BarStat label="Regulatory"  value={r.entryBarriers.regulatory}  />
          <BarStat label="Competitive" value={r.entryBarriers.competitive} />
        </div>
        <div className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
          Composite barrier index: <span className="font-mono font-semibold">{r.entryBarriers.index}/100</span>
        </div>
      </section>

      {/* M-E5 — Price pressure */}
      <section className="mt-6">
        <SectionHeader icon={Tag} title="Price pressure" model="M-E5" tone="amber" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pressure score"    value={`${r.pricePressure.score}/100`} tone={tone(r.pricePressure.score, 'inverse')} />
          <Stat
            label="Optimal price band"
            value={`$${r.pricePressure.optimalPriceUSD.min} – $${r.pricePressure.optimalPriceUSD.max}`}
          />
        </div>
      </section>

      {/* M-E1 — Competitor intelligence */}
      <section className="mt-6">
        <SectionHeader icon={Users} title="Competitor intelligence" model="M-E1" tone="blue" />
        <div className="mb-3 grid grid-cols-4 gap-3">
          <Stat label="Within 1 km"   value={r.competitorsWithin1km} />
          <Stat label="Within 300 m"  value={r.competitorsWithin300m} />
          <Stat label="Avg rating"    value={`${r.avgCompetitorRating} / 5`} />
          <Stat label="Avg price"     value={`$${r.avgCompetitorPriceUSD}`} />
        </div>

        {r.competitors?.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-canvas-200">
            <table className="w-full text-sm">
              <thead className="bg-canvas-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-right">Distance</th>
                  <th className="px-3 py-2 text-right">Rating</th>
                  <th className="px-3 py-2 text-right">Avg ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-200">
                {r.competitors.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-slate-700">{c.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{c.distanceKm} km</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{c.rating}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">${c.avgPriceUSD}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Modal>
  );
}

const TONE_CLASSES = {
  rose:   'bg-rose-50 text-rose-600',
  amber:  'bg-amber-50 text-amber-600',
  blue:   'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
};

const STAT_TONES = {
  good: 'text-emerald-600',
  warn: 'text-amber-600',
  bad:  'text-rose-600',
  default: 'text-slate-900',
};

function tone(score, mode = 'normal') {
  // For "inverse" metrics, lower is better.
  const v = mode === 'inverse' ? 100 - score : score;
  return v >= 70 ? 'good' : v >= 45 ? 'warn' : 'bad';
}

function Stat({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-lg font-semibold ${STAT_TONES[tone]}`}>{value}</div>
    </div>
  );
}

function BarStat({ label, value }) {
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span className="font-mono text-slate-700">{value}/100</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas-200">
        <div className="h-full bg-violet-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FactorBar({ rank, factor, contribution }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-600">
            {rank}
          </span>
          {factor}
        </span>
        <span className="font-mono text-xs text-slate-500">{contribution}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas-200">
        <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, contribution)}%` }} />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, model, tone }) {
  const accent = TONE_CLASSES[tone] || TONE_CLASSES.blue;
  return (
    <div className="mb-2 flex items-center gap-2">
      {Icon && (
        <span className={`rounded-lg p-1.5 ${accent}`}>
          <Icon size={14} />
        </span>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {model && (
        <span className="rounded bg-canvas-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
          {model}
        </span>
      )}
    </div>
  );
}
