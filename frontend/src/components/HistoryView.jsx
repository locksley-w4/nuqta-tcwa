// History list — past analyses pulled from localStorage. Click an entry to
// restore that analysis; trash icon removes it.
import { Clock, Trash2, MapPin, ArrowRight, Coffee, Inbox } from 'lucide-react';

const TONES = {
  YES: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CONDITIONAL: 'border-amber-200 bg-amber-50 text-amber-700',
  NO: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function HistoryView({ entries, onRestore, onDelete, onClear }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-canvas-200 bg-white py-16 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-100 text-slate-500">
          <Inbox size={22} />
        </div>
        <div className="text-base font-semibold text-slate-900">No history yet</div>
        <p className="mt-1 text-sm text-slate-500">
          Run an analysis from the Analyze tab — your past reports show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {entries.length} past {entries.length === 1 ? 'analysis' : 'analyses'} · stored locally in your browser
        </p>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-canvas-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-canvas-100"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {entries.map((e) => {
          const tone = TONES[e.recommendation] || TONES.CONDITIONAL;
          return (
            <div
              key={e.id}
              className="group flex items-start gap-3 rounded-2xl border border-canvas-200 bg-white p-4 shadow-card transition hover:border-brand-200"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone}`}>
                <Coffee size={18} />
              </span>

              <button
                type="button"
                onClick={() => onRestore(e)}
                className="flex-1 text-left"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{e.businessType}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>
                    {e.recommendation}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={11} className="shrink-0" />
                  <span className="line-clamp-1">{e.address || `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}`}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700">Score {e.finalScore}/100</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={11} />
                    {formatTime(e.timestamp)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-500 opacity-0 transition group-hover:opacity-100">
                  Restore analysis
                  <ArrowRight size={12} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDelete(e.id)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleDateString();
}
