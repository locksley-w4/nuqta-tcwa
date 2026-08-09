// Financial summary card — three high-level metrics plus a "View full
// financials" link that opens the full Block-D modal.
import { useState } from 'react';
import { DollarSign, TrendingUp, Briefcase, ArrowRight } from 'lucide-react';
import FullFinancialsModal from './FullFinancialsModal.jsx';

export default function FinancialSummary({ blocks }) {
  const [open, setOpen] = useState(false);
  // Approximate monthly profit using the demand forecast and a typical
  // small-business operating margin.
  const monthlyRevenue = Math.round(blocks.demand.annualRevenue / 12);
  const margin = 0.16; // ~16% — typical retail/F&B operating margin
  const monthlyProfit = Math.round(monthlyRevenue * margin);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <h3 className="mb-5 text-base font-semibold text-slate-900">Financial summary</h3>

      <div className="grid grid-cols-3 gap-4">
        <Metric
          icon={DollarSign}
          accent="bg-emerald-50 text-emerald-600"
          label="Break-even"
          value={`${blocks.financials.breakEvenMonths} mo`}
          sub="Time to break-even"
        />
        <Metric
          icon={TrendingUp}
          accent="bg-blue-50 text-blue-600"
          label="ROI (est.)"
          value={`${blocks.financials.roiEstimate}%`}
          sub="Return on investment"
        />
        <Metric
          icon={Briefcase}
          accent="bg-violet-50 text-violet-600"
          label="Est. monthly profit"
          value={`$${monthlyProfit.toLocaleString()}`}
          sub="After break-even"
        />
      </div>

      {/* Unit economics (M-D2) + NPV (M-D3) + rental burden (M-D4) */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-canvas-200 bg-canvas-50 p-3 text-xs md:grid-cols-4">
        <Mini label="LTV / CAC"      value={`${blocks.financials.unitEconomics.ltvCacRatio}x`} model="M-D2" />
        <Mini label="Payback"        value={`${blocks.financials.unitEconomics.paybackPeriodMonths} mo`} model="M-D2" />
        <Mini label="NPV (24mo)"     value={`$${(blocks.financials.npvUSD / 1000).toFixed(1)}k`} model="M-D3" />
        <Mini label="Rent burden"    value={`${blocks.financials.rentalBurden.currentRentPct}%`}
              tone={blocks.financials.rentalBurden.zone}
              model="M-D4" />
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-canvas-200 bg-canvas-50 px-4 py-2.5 text-sm font-medium text-brand-500 transition hover:bg-canvas-100"
      >
        View full financials
        <ArrowRight size={14} />
      </button>

      <FullFinancialsModal
        open={open}
        onClose={() => setOpen(false)}
        blocks={blocks}
      />
    </div>
  );
}

function Mini({ label, value, model, tone }) {
  const valueClass =
    tone === 'green'  ? 'text-emerald-600' :
    tone === 'yellow' ? 'text-amber-600'   :
    tone === 'red'    ? 'text-rose-600'    : 'text-slate-900';
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {label}
        {model && (
          <span className="rounded bg-canvas-200 px-1 py-px font-mono text-[9px] text-slate-500">
            {model}
          </span>
        )}
      </div>
      <div className={`font-mono text-sm font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function Metric({ icon: Icon, accent, label, value, sub }) {
  return (
    <div className="text-center">
      <span className={`mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
        <Icon size={16} />
      </span>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}
