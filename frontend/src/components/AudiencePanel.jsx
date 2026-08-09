// Block G — Social profile & target audience. Surfaces models G1–G5.
import { Users, Activity, Sparkles, Heart, Wallet } from 'lucide-react';

export default function AudiencePanel({ social }) {
  if (!social) return null;
  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <span className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
          <Users size={16} />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Audience &amp; social profile</h3>
        <span className="ml-2 rounded-full bg-canvas-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
          Block G · M-G1…M-G5
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* M-G1 — Customer Segment Profiler */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Top customer segments (M-G1)
            </div>
            <Sparkles size={14} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {social.segments.map((s, i) => (
              <SegmentRow key={s.name} segment={s} accent={SEGMENT_TONES[i % SEGMENT_TONES.length]} />
            ))}
          </div>
        </div>

        {/* M-G2 — Day Population */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Day population (M-G2)
            </div>
            <Activity size={14} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {social.dayPopulation.total.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Total daily headcount · peak hour {formatHour(social.dayPopulation.peakHour)}
          </div>
          <div className="mt-3 space-y-1 text-xs">
            <PopRow label="Residents" value={social.dayPopulation.residents} color="bg-violet-500" />
            <PopRow label="Visitors"  value={social.dayPopulation.visitors}  color="bg-blue-500" />
            <PopRow label="Transit"   value={social.dayPopulation.transit}   color="bg-teal-500" />
          </div>
          <HourBars data={social.dayPopulation.byHour} />
        </div>

        {/* M-G3 — Behavior */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Consumer behavior (M-G3)
            </div>
            <Heart size={14} className="text-slate-400" />
          </div>
          <div className="text-base font-semibold capitalize text-slate-900">
            {social.consumerBehavior.dominant}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {social.consumerBehavior.dominantDescription}
          </p>
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
            {social.consumerBehavior.mix.map((m, i) => (
              <span
                key={m.type}
                title={`${m.type}: ${m.sharePct}%`}
                className={BEHAVIOR_BARS[i % BEHAVIOR_BARS.length]}
                style={{ width: `${m.sharePct}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
            {social.consumerBehavior.mix.map((m) => (
              <span key={m.type}>
                {m.type} {m.sharePct}%
              </span>
            ))}
          </div>
        </div>

        {/* M-G4 + M-G5 — Brand affinity & spending power */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Brand affinity &amp; spending power
            </div>
            <Wallet size={14} className="text-slate-400" />
          </div>

          <div className="mb-2 text-[11px] text-slate-500">M-G4 — Chains vs independents</div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-canvas-200">
            <span
              className="bg-blue-500"
              style={{ width: `${social.brandAffinity.chainPct}%` }}
              title={`Chains ${social.brandAffinity.chainPct}%`}
            />
            <span
              className="bg-emerald-500"
              style={{ width: `${social.brandAffinity.independentPct}%` }}
              title={`Independents ${social.brandAffinity.independentPct}%`}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Chains {social.brandAffinity.chainPct}%</span>
            <span>Independents {social.brandAffinity.independentPct}%</span>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">M-G5 — Spending power</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-slate-900">
              {social.spendingPower.index}
              <span className="text-sm text-slate-400">/100</span>
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SPEND_BANDS[social.spendingPower.band]}`}>
              {social.spendingPower.band}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SEGMENT_TONES = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
];

const BEHAVIOR_BARS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
];

const SPEND_BANDS = {
  High: 'bg-emerald-100 text-emerald-700',
  Mid:  'bg-amber-100 text-amber-700',
  Low:  'bg-rose-100 text-rose-700',
};

function SegmentRow({ segment, accent }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{segment.name}</span>
        <span className="font-mono text-slate-600">{segment.sharePct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas-200">
        <div className={`h-full ${accent}`} style={{ width: `${segment.sharePct}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        {segment.ageRange} · {segment.incomeBand} income · top MCC: {segment.topMcc.join(', ')}
      </div>
    </div>
  );
}

function PopRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-mono text-slate-700">{value.toLocaleString()}</span>
    </div>
  );
}

function HourBars({ data }) {
  const max = Math.max(...data.map((d) => d.headcount));
  return (
    <div className="mt-3 flex items-end gap-0.5">
      {data.map((d) => (
        <span
          key={d.hour}
          title={`${formatHour(d.hour)} · ${d.headcount}`}
          className="flex-1 rounded-sm bg-violet-300"
          style={{ height: `${(d.headcount / max) * 36}px`, minHeight: 4 }}
        />
      ))}
    </div>
  );
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}
