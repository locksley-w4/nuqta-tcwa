// Circular SVG gauge for the overall score. Tone (color + label) shifts on
// the recommendation tier.
import { Check, AlertTriangle, X } from 'lucide-react';

const TONES = {
  good: {
    stroke: '#16a34a',
    track: '#dcfce7',
    text: 'text-emerald-600',
    badge: 'bg-emerald-500 text-white',
    label: 'GOOD LOCATION',
    icon: Check,
    blurb: 'Promising opportunity with manageable risks.',
  },
  warn: {
    stroke: '#d97706',
    track: '#fef3c7',
    text: 'text-amber-600',
    badge: 'bg-amber-500 text-white',
    label: 'CONDITIONAL',
    icon: AlertTriangle,
    blurb: 'Workable site, but mitigations are required.',
  },
  bad: {
    stroke: '#dc2626',
    track: '#fee2e2',
    text: 'text-rose-600',
    badge: 'bg-rose-500 text-white',
    label: 'NOT RECOMMENDED',
    icon: X,
    blurb: 'Site signals are weak — consider alternatives.',
  },
};

function toneFor(score) {
  if (score >= 75) return TONES.good;
  if (score >= 55) return TONES.warn;
  return TONES.bad;
}

export default function OverallScoreGauge({ score }) {
  const tone = toneFor(score);
  const Icon = tone.icon;

  // Geometry
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="rounded-2xl bg-canvas-100 p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Overall score
      </div>

      <div className="relative mt-3 inline-flex">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tone.track}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tone.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className={`text-5xl font-bold leading-none ${tone.text}`}>{score}</span>
            <span className="ml-1 text-base text-slate-400">/100</span>
          </div>
        </div>
        <span
          className={`absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full ${tone.badge} shadow-card`}
        >
          <Icon size={14} strokeWidth={3} />
        </span>
      </div>

      <div className={`mt-3 text-base font-semibold ${tone.text}`}>{tone.label}</div>
      <p className="mt-1 max-w-[18rem] text-sm leading-relaxed text-slate-500">{tone.blurb}</p>
    </div>
  );
}
