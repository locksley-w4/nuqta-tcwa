// Block F — Lending & banking products. Surfaces models F1–F5.
import {
  Banknote, ShieldCheck, ShieldAlert, ShieldX, Briefcase, AlertTriangle, Calculator,
} from 'lucide-react';

const NPL_TONES = {
  green: { container: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: ShieldCheck,  label: 'Green — no anomalies' },
  amber: { container: 'bg-amber-50 border-amber-200 text-amber-800',       icon: ShieldAlert,  label: 'Amber — watch list'   },
  red:   { container: 'bg-rose-50 border-rose-200 text-rose-800',          icon: ShieldX,      label: 'Red — early warning' },
};

export default function LendingPanel({ lending }) {
  if (!lending) return null;
  const npl = NPL_TONES[lending.nplEarlyWarning.status] || NPL_TONES.green;
  const NplIcon = npl.icon;

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
          <Banknote size={16} />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Lending &amp; banking products</h3>
        <span className="ml-2 rounded-full bg-canvas-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
          Block F · M-F1…M-F5
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* M-F1 + composite credit risk */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Credit risk score</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-slate-900">{lending.creditRiskScore}</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
              {lending.creditGrade}
            </span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <Triple label="Client"   value={lending.creditRiskTriple.client} />
            <Triple label="Location" value={lending.creditRiskTriple.location} />
            <Triple label="Niche"    value={lending.creditRiskTriple.niche} />
          </div>
          <div className="mt-2 text-[10px] text-slate-400">M-F1 — client × location × niche</div>
        </div>

        {/* M-F2 — Loan sizing recommendation */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Recommended loan</div>
            <Calculator size={14} className="text-slate-400" />
          </div>
          <div className="mt-1 font-mono text-3xl font-bold text-slate-900">
            ${lending.recommendedLoanAmount.toLocaleString()}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Sized so monthly debt service stays under 40% of projected cash flow at the
            standard 24% APR / 36-month term.
          </p>
          <div className="mt-2 text-[10px] text-slate-400">M-F2</div>
        </div>

        {/* M-F4 — NPL Early Warning */}
        <div className={`rounded-xl border p-4 ${npl.container}`}>
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider opacity-80">NPL early warning</div>
            <NplIcon size={16} />
          </div>
          <div className="mt-1 text-lg font-bold">{npl.label}</div>
          <div className="mt-1 font-mono text-sm">
            {lending.nplEarlyWarning.defaultProb12mPct}% default prob (12mo)
          </div>
          <div className="mt-2 text-[10px] opacity-70">M-F4 · transactional anomaly score {lending.nplEarlyWarning.anomalyScore}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* M-F3 — DTI Predictor */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Debt-to-Income forecast (M-F3)
            </div>
            <AlertTriangle size={14} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <DtiBox label="6 mo"  value={lending.dti.sixMonth} />
            <DtiBox label="12 mo" value={lending.dti.twelveMonth} />
            <DtiBox label="24 mo" value={lending.dti.twentyFour} />
          </div>
        </div>

        {/* M-F5 — Bank Product Recommender */}
        <div className="rounded-xl border border-canvas-200 bg-canvas-50/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Bank product recommender (M-F5)
            </div>
            <Briefcase size={14} className="text-slate-400" />
          </div>
          <div className="text-base font-semibold text-slate-900">
            {lending.productRecommendation.name}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {lending.productRecommendation.reason}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {lending.productRecommendation.eligibleProducts.map((p) => (
              <span
                key={p}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Triple({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-700">{value}/100</span>
    </div>
  );
}

function DtiBox({ label, value }) {
  const passes = value < 0.40;
  return (
    <div className={`rounded-lg px-2 py-1.5 ${passes ? 'bg-emerald-50' : 'bg-rose-50'}`}>
      <div className={`text-[10px] uppercase ${passes ? 'text-emerald-700' : 'text-rose-700'}`}>
        {label}
      </div>
      <div className={`font-mono text-base font-bold ${passes ? 'text-emerald-700' : 'text-rose-700'}`}>
        {Math.round(value * 100)}%
      </div>
    </div>
  );
}
