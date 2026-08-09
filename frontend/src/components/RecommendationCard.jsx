// Final recommendation card. Tone (color + headline + blurb) keys off the
// recommendation tier. "View action plan" opens a modal with tailored next
// steps; "Download report" exports the full analysis as JSON.
import { useState } from 'react';
import { Trophy, ChevronRight, Download } from 'lucide-react';
import ActionPlanModal from './ActionPlanModal.jsx';
import { downloadReport } from '../utils/downloadReport.js';

const STYLES = {
  YES: {
    container: 'border-emerald-100 bg-emerald-50/70',
    iconBg: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    headline: 'Excellent opportunity',
    headlineClass: 'text-emerald-700',
    blurb: (type) =>
      `This location shows excellent potential for a successful ${type.toLowerCase()}. Proceed with confidence.`,
  },
  CONDITIONAL: {
    container: 'border-emerald-100 bg-emerald-50/70',
    iconBg: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-500',
    headline: 'Good opportunity',
    headlineClass: 'text-emerald-700',
    blurb: (type) =>
      `This location shows strong potential for a successful ${type.toLowerCase()}. Proceed with detailed planning and due diligence.`,
  },
  NO: {
    container: 'border-rose-100 bg-rose-50/70',
    iconBg: 'bg-rose-100 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-500',
    headline: 'Not recommended',
    headlineClass: 'text-rose-700',
    blurb: (type) =>
      `This location does not currently support a viable ${type.toLowerCase()}. Consider stronger sites before committing.`,
  },
};

export default function RecommendationCard({
  summary,
  businessType,
  result,
  finance,
  address,
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const s = STYLES[summary.recommendation] || STYLES.NO;

  function handleDownload() {
    downloadReport({ result, finance, address });
  }

  return (
    <div className={`rounded-2xl border ${s.container} p-6 shadow-card`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full ${s.iconBg}`}
          >
            <Trophy size={28} />
          </span>
          <div>
            <div className="text-sm text-slate-500">Our recommendation</div>
            <div className={`text-2xl font-bold ${s.headlineClass}`}>{s.headline}</div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              {s.blurb(businessType)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-60">
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-card transition ${s.button}`}
          >
            View action plan
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-lg bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            Download report
            <Download size={14} />
          </button>
        </div>
      </div>

      <ActionPlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        result={result}
        finance={finance}
      />
    </div>
  );
}
