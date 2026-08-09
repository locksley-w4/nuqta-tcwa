// Risk assessment card. Top: overall risk grade. Below: list of risk
// factors with right-aligned severity tags. "View all risks" opens the
// full Block-E modal.
import { useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import AllRisksModal from './AllRisksModal.jsx';

const GRADES = {
  Low:    { container: 'bg-emerald-50 text-emerald-700', label: 'Low risk' },
  Medium: { container: 'bg-amber-50 text-amber-700',     label: 'Medium risk' },
  High:   { container: 'bg-rose-50 text-rose-700',       label: 'High risk' },
};

const SEVERITY = {
  Low:    'text-emerald-600',
  Medium: 'text-amber-600',
  High:   'text-rose-600',
};

export default function RiskAssessment({ summary, blocks }) {
  const [open, setOpen] = useState(false);
  const grade = gradeFor(summary.finalScore);
  const g = GRADES[grade];

  const factors = buildFactors(summary, blocks);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Risk assessment</h3>

      <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 ${g.container}`}>
        <AlertTriangle size={14} />
        <span className="text-sm font-semibold">{g.label}</span>
      </div>

      <ul className="space-y-2.5">
        {factors.map((f, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
              {f.label}
            </span>
            <span className={`font-medium ${SEVERITY[f.severity]}`}>{f.severity}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-center gap-1 rounded-lg border border-canvas-200 bg-canvas-50 px-4 py-2.5 text-sm font-medium text-brand-500 transition hover:bg-canvas-100"
      >
        View all risks
        <ArrowRight size={14} />
      </button>

      <AllRisksModal open={open} onClose={() => setOpen(false)} blocks={blocks} />
    </div>
  );
}

function gradeFor(score) {
  if (score >= 75) return 'Low';
  if (score >= 55) return 'Medium';
  return 'High';
}

function buildFactors(summary, blocks) {
  const factors = [];

  factors.push({
    label: 'Competition (M-E1)',
    severity:
      blocks.risk.competitorsWithin1km >= 12 ? 'High' :
      blocks.risk.competitorsWithin1km >= 5  ? 'Medium' : 'Low',
  });

  factors.push({
    label: 'Market stability (M-B5)',
    severity:
      blocks.demand.demandScore >= 70 ? 'Low' :
      blocks.demand.demandScore >= 50 ? 'Medium' : 'High',
  });

  factors.push({
    label: 'Regulatory risk (M-E3)',
    severity:
      blocks.risk.regulatoryRisk.score < 35 ? 'Low' :
      blocks.risk.regulatoryRisk.score < 60 ? 'Medium' : 'High',
  });

  factors.push({
    label: 'Entry barriers (M-E4)',
    severity:
      blocks.risk.entryBarriers.index < 35 ? 'Low' :
      blocks.risk.entryBarriers.index < 60 ? 'Medium' : 'High',
  });

  factors.push({
    label: 'Price pressure (M-E5)',
    severity:
      blocks.risk.pricePressure.score < 35 ? 'Low' :
      blocks.risk.pricePressure.score < 60 ? 'Medium' : 'High',
  });

  return factors;
}
