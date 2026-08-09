// Finance result card — light theme version. Verdict + DSCR / Coverage
// ratio bars + AI bank feedback bullets.
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Dot,
  Receipt,
  PiggyBank,
} from 'lucide-react';

const VERDICTS = {
  APPROVE: {
    icon: CheckCircle2,
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badge: 'bg-emerald-500 text-white',
    line: 'Bank-ready file. Standard rate likely.',
  },
  REVIEW: {
    icon: AlertTriangle,
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    badge: 'bg-amber-500 text-white',
    line: 'Borderline file. Approval likely with conditions.',
  },
  DECLINE: {
    icon: XCircle,
    container: 'bg-rose-50 border-rose-200 text-rose-800',
    badge: 'bg-rose-500 text-white',
    line: 'File would be declined as proposed. Restructure first.',
  },
};

export default function FinanceResult({ finance }) {
  if (!finance) return null;
  const v = VERDICTS[finance.verdict] || VERDICTS.DECLINE;
  const Icon = v.icon;

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <span className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
          <Banknote size={16} />
        </span>
        <h3 className="text-base font-semibold text-slate-900">
          Financial viability &amp; bank readiness
        </h3>
      </div>

      <div className={`mb-5 rounded-xl border p-5 ${v.container}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${v.badge}`}>
              <Icon size={24} strokeWidth={2.4} />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">Bank verdict</div>
              <div className="text-2xl font-bold leading-tight">{finance.verdict}</div>
              <div className="mt-0.5 text-sm opacity-90">{v.line}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest opacity-70">Fundability</div>
            <div className="font-mono text-3xl font-bold">{finance.fundabilityScore}</div>
            <div className="text-[10px] opacity-70">
              out of 100
              {finance.ratePremiumPct != null && <> · rate +{finance.ratePremiumPct}%</>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <RatioBar
          label="DSCR"
          subLabel="Net income / monthly payment"
          value={finance.metrics.dscr}
          target={finance.assumptions.targetDSCR}
          max={3}
          passes={finance.metrics.dscrPasses}
          unit="x"
        />
        <RatioBar
          label="Collateral coverage"
          subLabel="Collateral / loan amount"
          value={finance.metrics.collateralCoverage}
          target={finance.assumptions.targetCoverage}
          max={2.5}
          passes={finance.metrics.coveragePasses}
          unit="x"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SmallStat
          icon={Receipt}
          label="Monthly payment"
          value={`$${fmt(finance.loan.monthlyPayment)}`}
          sub={`${finance.assumptions.annualRatePct}% / yr`}
        />
        <SmallStat
          icon={PiggyBank}
          label="Net income"
          value={`$${fmt(finance.metrics.netIncome)}`}
          sub={`Margin ${finance.metrics.operatingMarginPct}%`}
          tone={finance.metrics.netIncome > 0 ? 'good' : 'bad'}
        />
        <SmallStat
          icon={Receipt}
          label="Total interest"
          value={`$${fmt(finance.loan.totalInterest)}`}
          sub={`Over ${finance.inputs.termMonths} mo`}
        />
        <SmallStat
          icon={Banknote}
          label="Total payment"
          value={`$${fmt(finance.loan.totalPayment)}`}
          sub={`Loan $${fmt(finance.inputs.loanAmount)}`}
        />
      </div>

      <div className="mt-5 rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
            <Sparkles size={14} />
          </span>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            AI bank feedback
          </h4>
        </div>
        <ul className="space-y-1.5">
          {finance.feedback.map((line, i) => (
            <li key={i} className="flex items-start gap-1 text-sm text-slate-700">
              <Dot size={20} className="-mt-0.5 shrink-0 text-violet-500" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RatioBar({ label, subLabel, value, target, max, passes, unit = '' }) {
  const pct = Math.min(100, (value / max) * 100);
  const targetPct = Math.min(100, (target / max) * 100);
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-[11px] text-slate-400">{subLabel}</div>
        </div>
        <div
          className={`font-mono text-xl font-semibold ${
            passes ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {value.toFixed(2)}
          {unit}
          <span className="ml-1 text-xs">{passes ? '✓' : '✗'}</span>
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-canvas-200">
        <div
          className={`h-full ${passes ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
          style={{ left: `calc(${targetPct}% - 1px)` }}
          title={`Target ${target}${unit}`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>0</span>
        <span className="text-amber-600">target {target}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function SmallStat({ icon: Icon, label, value, sub, tone }) {
  const valueClass =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <span className="rounded bg-violet-50 p-1 text-violet-600">
            <Icon size={12} />
          </span>
        )}
      </div>
      <div className={`mt-1 font-mono text-base font-semibold ${valueClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
    </div>
  );
}

function fmt(n) {
  return Math.max(0, Math.round(n)).toLocaleString();
}
