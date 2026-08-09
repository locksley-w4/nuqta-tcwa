// Full Block-D breakdown — opened from FinancialSummary's "View full
// financials" button. Cash flow chart, unit economics, NPV/IRR, margins,
// rental burden, runway/survival.
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer,
} from 'recharts';
import Modal from './Modal.jsx';

export default function FullFinancialsModal({ open, onClose, blocks }) {
  if (!blocks) return null;
  const f = blocks.financials;

  // Build a chart-friendly array from the 24-month cash flow simulator.
  const cashFlowChart = f.cashFlow.map((c, i) => ({
    label: `${c.month}${c.yearOffset > 0 ? '+1' : ''}`,
    monthly: c.monthly,
    cumulative: c.cumulative,
    cashGap: c.cashGap,
    idx: i,
  }));

  // Find contiguous cash-gap regions so we can shade them on the chart.
  const gapRegions = [];
  let start = null;
  cashFlowChart.forEach((p, i) => {
    if (p.cashGap && start == null) start = i;
    if ((!p.cashGap || i === cashFlowChart.length - 1) && start != null) {
      gapRegions.push({ x1: cashFlowChart[start].label, x2: cashFlowChart[i].label });
      start = null;
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Full financial breakdown"
      subtitle="Block D · M-D1 through M-D6"
      maxWidth="max-w-4xl"
    >
      {/* M-D1 — viability headline */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Break-even" value={`${f.breakEvenMonths} mo`} model="M-D1" />
        <Stat label="Runway" value={`${f.runwayMonths} mo`} model="M-D1" />
        <Stat
          label="Survival 2y"
          value={`${f.survival2yProb}%`}
          model="M-D1"
          tone={f.survival2yProb >= 70 ? 'good' : f.survival2yProb >= 50 ? 'warn' : 'bad'}
        />
        <Stat
          label="Cash-gap months"
          value={`${f.cashGapMonths} / 24`}
          model="M-D5"
          tone={f.cashGapMonths === 0 ? 'good' : f.cashGapMonths < 4 ? 'warn' : 'bad'}
        />
      </div>

      {/* M-D5 — Cash flow simulator chart */}
      <section className="mt-6">
        <SectionHeader title="Cash flow simulator" model="M-D5" caption="24-month cumulative cash position. Shaded regions = cash-gap months." />
        <div className="h-64 rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <ResponsiveContainer>
            <LineChart data={cashFlowChart} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                stroke="#cbd5e1"
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
              />
              {gapRegions.map((r, i) => (
                <ReferenceArea key={i} x1={r.x1} x2={r.x2} fill="#fda4af" fillOpacity={0.18} />
              ))}
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                name="Cumulative"
              />
              <Line
                type="monotone"
                dataKey="monthly"
                stroke="#16a34a"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="Monthly"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* M-D2 — Unit Economics */}
      <section className="mt-6">
        <SectionHeader title="Unit economics" model="M-D2" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="LTV"         value={`$${f.unitEconomics.ltvUSD.toLocaleString()}`} />
          <Stat label="CAC"         value={`$${f.unitEconomics.cacUSD.toLocaleString()}`} />
          <Stat label="Payback"     value={`${f.unitEconomics.paybackPeriodMonths} mo`} />
          <Stat
            label="LTV / CAC"
            value={`${f.unitEconomics.ltvCacRatio}x`}
            tone={f.unitEconomics.ltvCacRatio >= 3 ? 'good' : f.unitEconomics.ltvCacRatio >= 2 ? 'warn' : 'bad'}
          />
        </div>
      </section>

      {/* M-D3 — ROI / NPV / IRR */}
      <section className="mt-6">
        <SectionHeader title="Return on investment" model="M-D3" caption="DCF over 24 months at 10% discount rate." />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="ROI"  value={`${f.roiEstimate}%`} />
          <Stat label="NPV"  value={`$${f.npvUSD.toLocaleString()}`} tone={f.npvUSD > 0 ? 'good' : 'bad'} />
          <Stat label="IRR"  value={`${f.irrPct}%`} />
        </div>
      </section>

      {/* M-D6 — Margins */}
      <section className="mt-6">
        <SectionHeader title="Costs &amp; margins" model="M-D6" />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="COGS"          value={`${f.cogsPct}%`} />
          <Stat label="Gross margin"  value={`${f.grossMarginPct}%`} />
          <Stat
            label="Net margin"
            value={`${f.netMarginPct}%`}
            tone={f.netMarginPct >= 15 ? 'good' : f.netMarginPct >= 8 ? 'warn' : 'bad'}
          />
        </div>
      </section>

      {/* M-D4 — Rental burden */}
      <section className="mt-6">
        <SectionHeader title="Rental burden" model="M-D4" />
        <div className={`rounded-xl border p-4 ${RENT_TONES[f.rentalBurden.zone]}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                Zone · {f.rentalBurden.zone.toUpperCase()}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold">
                {f.rentalBurden.currentRentPct}% of revenue
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="opacity-80">Safe ceiling</div>
              <div className="font-mono">{f.rentalBurden.safeRentPct}%</div>
              <div className="mt-1 opacity-80">Recommended max rent</div>
              <div className="font-mono">${f.rentalBurden.recommendedMaxRent.toLocaleString()} / mo</div>
            </div>
          </div>
        </div>
      </section>
    </Modal>
  );
}

const RENT_TONES = {
  green:  'border-emerald-200 bg-emerald-50 text-emerald-800',
  yellow: 'border-amber-200 bg-amber-50 text-amber-800',
  red:    'border-rose-200 bg-rose-50 text-rose-800',
};

const TONES = {
  good: 'text-emerald-600',
  warn: 'text-amber-600',
  bad:  'text-rose-600',
  default: 'text-slate-900',
};

function Stat({ label, value, model, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {label}
        {model && (
          <span className="rounded bg-canvas-200 px-1 py-px font-mono text-[9px] text-slate-500">
            {model}
          </span>
        )}
      </div>
      <div className={`mt-0.5 font-mono text-lg font-semibold ${TONES[tone]}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ title, model, caption }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {model && (
          <span className="rounded bg-canvas-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            {model}
          </span>
        )}
      </div>
      {caption && <p className="text-xs text-slate-500">{caption}</p>}
    </div>
  );
}
