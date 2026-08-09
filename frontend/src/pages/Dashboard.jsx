// Main dashboard. Owns all request lifecycles + UI mode (analyze vs find).
//   - Run analysis  → calls /analyze (and /analyze-finance in parallel if
//     finance fields are filled). Renders the site + finance result panels.
//   - Find location → calls /find-hotspots and switches main view to the
//     hotspots grid. Clicking any hotspot flips back to analyze mode and
//     re-runs the full analyze (+ finance) at that exact coord.
//   - Map icon in the location field opens the modal map picker.
import { useEffect, useRef, useState } from 'react';
import { Pencil, Menu } from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import MapPickerModal from '../components/MapPickerModal.jsx';
import OverallScoreGauge from '../components/OverallScoreGauge.jsx';
import MapPreview from '../components/MapPreview.jsx';
import KeyInsights from '../components/KeyInsights.jsx';
import FinancialSummary from '../components/FinancialSummary.jsx';
import RiskAssessment from '../components/RiskAssessment.jsx';
import DetailedAnalysis from '../components/DetailedAnalysis.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import HotspotsView from '../components/HotspotsView.jsx';
import FinanceResult from '../components/FinanceResult.jsx';
import SuccessProbability from '../components/SuccessProbability.jsx';
import LendingPanel from '../components/LendingPanel.jsx';
import AudiencePanel from '../components/AudiencePanel.jsx';
import HistoryView from '../components/HistoryView.jsx';

const HISTORY_KEY = 'sqb_analysis_history_v1';
const HISTORY_LIMIT = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* quota or privacy mode — silently ignore */
  }
}

// Relative /api/* paths work unchanged in dev (Vite proxies them to :5001)
// and in production (Vercel routes them to the serverless function).
const ANALYZE_URL = import.meta.env.VITE_API_URL || '/api/analyze';
const FINANCE_URL = import.meta.env.VITE_FINANCE_URL || '/api/analyze-finance';
const HOTSPOTS_URL = import.meta.env.VITE_HOTSPOTS_URL || '/api/find-hotspots';

const DEFAULT_LOCATION = {
  lat: 41.299,
  lng: 69.27,
  address: 'Square, Mirabad District, Tashkent, 170000, Uzbekistan',
};

const DEFAULT_FINANCE = {
  loanAmount: 50000,
  collateralValue: 75000,
  monthlyRevenue: 20000,
  monthlyExpenses: 14000,
  termMonths: 36,
};

function financeIsFilled(f) {
  return (
    Number(f.loanAmount) > 0 &&
    Number(f.termMonths) > 0 &&
    f.collateralValue !== '' &&
    f.monthlyRevenue !== '' &&
    f.monthlyExpenses !== ''
  );
}

export default function Dashboard() {
  const [view, setView] = useState('analyze'); // 'analyze' | 'history'
  const [mode, setMode] = useState('analyze'); // 'analyze' | 'find'
  const [findScope, setFindScope] = useState('city'); // 'city' | 'local'
  const [businessType, setBusinessType] = useState('Coffee shop');
  const [history, setHistory] = useState(() => loadHistory());

  // Persist history whenever it changes.
  useEffect(() => {
    saveHistory(history);
  }, [history]);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [finance, setFinance] = useState(DEFAULT_FINANCE);

  const [result, setResult] = useState(null);
  const [financeResult, setFinanceResult] = useState(null);
  const [hotspotsResult, setHotspotsResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [findLoading, setFindLoading] = useState(false);
  const [error, setError] = useState(null);

  const [bankerView, setBankerView] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const locationInputRef = useRef(null);

  // Run /analyze and /analyze-finance in parallel. Site result is required;
  // finance is best-effort and silently skipped if the form isn't filled.
  async function runAnalysis(coordOverride) {
    if (!location && !coordOverride) return;
    const lat = coordOverride?.lat ?? Number(location.lat);
    const lng = coordOverride?.lng ?? Number(location.lng);

    setLoading(true);
    setError(null);
    setMode('analyze');

    const calls = [
      fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, lat, lng }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Site analysis failed');
        return data;
      }),
    ];

    if (financeIsFilled(finance)) {
      calls.push(
        fetch(FINANCE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finance),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Finance check failed');
          return data;
        })
      );
    }

    try {
      const [site, fin] = await Promise.all(calls);
      setResult(site);
      setFinanceResult(fin || null);
      // Push to history (newest first, dedupe by businessType+coords).
      pushHistory({
        result: site,
        finance: fin || null,
        address: location?.address,
        finance_inputs: financeIsFilled(finance) ? finance : null,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function pushHistory({ result, finance, address, finance_inputs }) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      businessType: result.businessType,
      lat: result.coordinates.lat,
      lng: result.coordinates.lng,
      address: address || null,
      finalScore: result.summary.finalScore,
      recommendation: result.summary.recommendation,
      result,
      finance,
      financeInputs: finance_inputs,
    };
    setHistory((prev) => {
      const next = [entry, ...prev.filter((e) =>
        !(e.businessType === entry.businessType &&
          Math.abs(e.lat - entry.lat) < 1e-4 &&
          Math.abs(e.lng - entry.lng) < 1e-4)
      )].slice(0, HISTORY_LIMIT);
      return next;
    });
  }

  function restoreHistory(entry) {
    setView('analyze');
    setMode('analyze');
    setBusinessType(entry.businessType);
    setLocation({
      lat: entry.lat,
      lng: entry.lng,
      address: entry.address,
    });
    if (entry.financeInputs) setFinance(entry.financeInputs);
    setResult(entry.result);
    setFinanceResult(entry.finance || null);
  }

  function deleteHistoryEntry(id) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  async function runFindLocation() {
    setFindLoading(true);
    setError(null);
    setMode('find');

    // Build payload — local scope sends lat/lng so the backend scans a
    // 5 km box around the selected point instead of the whole city.
    const payload = { businessType, scope: findScope };
    if (findScope === 'local' && location) {
      payload.lat = location.lat;
      payload.lng = location.lng;
    }

    try {
      const res = await fetch(HOTSPOTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hotspot scan failed');
      setHotspotsResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setFindLoading(false);
    }
  }

  function handlePickHotspot(h) {
    const newLoc = {
      lat: h.lat,
      lng: h.lng,
      address: `Hotspot #${h.rank} · ${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}`,
    };
    setLocation(newLoc);
    runAnalysis(newLoc);
  }

  function focusLocationInput() {
    locationInputRef.current?.focus();
    locationInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden">
      {/* Mobile backdrop — visible only when the off-canvas drawer is open. */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isMobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        view={view}
        onViewChange={(next) => {
          setView(next);
          // Returning to "Analyze" should also reset mode so the user
          // exits the find/hotspots flow if they were inside it.
          if (next === 'analyze') setMode('analyze');
        }}
        mode={mode}
        businessType={businessType}
        onBusinessTypeChange={setBusinessType}
        location={location}
        onLocationChange={setLocation}
        finance={finance}
        onFinanceChange={setFinance}
        onRunAnalysis={() => {
          setView('analyze');
          setMode('analyze');
          runAnalysis();
        }}
        onFindLocation={() => {
          setView('analyze');
          runFindLocation();
        }}
        findScope={findScope}
        onFindScopeChange={setFindScope}
        loading={loading}
        findLoading={findLoading}
        locationInputRef={locationInputRef}
        onOpenMapPicker={() => setMapPickerOpen(true)}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        {/* Mobile top bar — hidden on md+ since the sidebar is always visible */}
        <div className="flex items-center justify-between border-b border-canvas-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg p-1.5 text-slate-700 transition hover:bg-canvas-100"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/nuqta.png" alt="Nuqta" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-base font-semibold tracking-tight text-slate-900">Nuqta</span>
          </div>
          <span className="w-8" aria-hidden="true" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-10 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 break-words text-xl font-semibold text-slate-900 md:text-2xl">
            {view === 'history' ? 'History'
              : mode === 'find' ? 'Top locations'
              : 'Analysis result'}
          </h1>
          {view === 'analyze' && <BankerToggle value={bankerView} onChange={setBankerView} />}
        </div>

        {error && view === 'analyze' && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {view === 'history' && (
          <HistoryView
            entries={history}
            onRestore={restoreHistory}
            onDelete={deleteHistoryEntry}
            onClear={clearHistory}
          />
        )}

        {view === 'analyze' && mode === 'find' && (
          <>
            {findLoading && <LoadingState text="Scanning city grid..." />}
            {!findLoading && hotspotsResult && (
              <HotspotsView
                result={hotspotsResult}
                businessType={businessType}
                onPickHotspot={handlePickHotspot}
              />
            )}
            {!findLoading && !hotspotsResult && !error && (
              <EmptyFind />
            )}
          </>
        )}

        {view === 'analyze' && mode === 'analyze' && (
          <>
            {loading && <LoadingState text="Crunching market, demand & risk signals..." />}

            {!loading && !result && !error && <EmptyAnalyze />}

            {!loading && result && (
              <div className="space-y-5">
                {/* Combined hero — only when BOTH site + finance results exist. */}
                {financeResult && (
                  <SuccessProbability
                    geoScore={result.summary.finalScore}
                    finScore={financeResult.fundabilityScore}
                  />
                )}

                <HeroCard
                  result={result}
                  address={location?.address}
                  onChangeLocation={focusLocationInput}
                />

                <KeyInsights result={result} />

                <div className="grid gap-5 lg:grid-cols-2">
                  <FinancialSummary blocks={result.blocks} />
                  <RiskAssessment summary={result.summary} blocks={result.blocks} />
                </div>

                <DetailedAnalysis result={result} />

                <LendingPanel lending={result.blocks.lending} />

                <AudiencePanel social={result.blocks.social} />

                <RecommendationCard
                  summary={result.summary}
                  businessType={result.businessType}
                  result={result}
                  finance={financeResult}
                  address={location?.address}
                />

                {financeResult && <FinanceResult finance={financeResult} />}

                {bankerView && <BankerStrip summary={result.summary} blocks={result.blocks} />}
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {mapPickerOpen && (
        <MapPickerModal
          initial={location}
          onCancel={() => setMapPickerOpen(false)}
          onConfirm={(loc) => {
            setLocation(loc);
            setMapPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function HeroCard({ result, address, onChangeLocation }) {
  const headline =
    truncateAddress(address) ||
    `${result.coordinates.lat.toFixed(4)}, ${result.coordinates.lng.toFixed(4)}`;

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{headline}</h2>
          <p className="mt-1 text-sm text-slate-500">{result.businessType}</p>
        </div>
        <button
          type="button"
          onClick={onChangeLocation}
          className="flex items-center gap-1.5 rounded-lg border border-canvas-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-canvas-100"
        >
          <Pencil size={13} />
          Change location
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px),1fr]">
        <OverallScoreGauge score={result.summary.finalScore} />
        <MapPreview
          lat={result.coordinates.lat}
          lng={result.coordinates.lng}
          competitors={result.blocks.risk.competitors}
          competitorsCount={result.blocks.risk.competitorsWithin1km}
        />
      </div>
    </div>
  );
}

function truncateAddress(addr) {
  if (!addr) return null;
  return addr.length > 80 ? addr.slice(0, 80) + '…' : addr;
}

function BankerToggle({ value, onChange }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 rounded-full border border-canvas-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-card">
      <span>Banker view</span>
      <span
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!value);
          }
        }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          value ? 'bg-brand-500' : 'bg-canvas-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-card transition ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </label>
  );
}

function BankerStrip({ summary, blocks }) {
  const grade =
    summary.finalScore >= 75 ? 'Low' : summary.finalScore >= 55 ? 'Medium' : 'High';
  const tone =
    grade === 'Low'    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    grade === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                         'bg-rose-50 border-rose-200 text-rose-800';
  return (
    <div className={`rounded-2xl border ${tone} p-6 shadow-card`}>
      <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
        Banker view · credit risk
      </div>
      <div className="mt-1 text-2xl font-bold">{grade} risk</div>
      <p className="mt-1 max-w-2xl text-sm opacity-90">
        Based on the geographic score ({summary.finalScore}/100), break-even of{' '}
        {blocks.financials.breakEvenMonths} months and competition density of{' '}
        {blocks.risk.competitionDensity}/km², the bank's internal grading places this
        file in the <strong>{grade}</strong> risk band.
      </p>
    </div>
  );
}

function EmptyAnalyze() {
  return (
    <div className="rounded-2xl border border-dashed border-canvas-200 bg-white px-4 py-16 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div className="text-base font-semibold text-slate-900">No analysis yet</div>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Pick a business type, location, and (optionally) finance details, then click <em>Run analysis</em>.
      </p>
    </div>
  );
}

function EmptyFind() {
  return (
    <div className="rounded-2xl border border-dashed border-canvas-200 bg-white px-4 py-16 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </div>
      <div className="text-base font-semibold text-slate-900">Find the best spots</div>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Click <em>Find location</em> to scan the city for the best places to open your business.
      </p>
    </div>
  );
}

function LoadingState({ text }) {
  return (
    <div className="rounded-2xl border border-canvas-200 bg-white px-4 py-16 text-center shadow-card">
      <div className="text-sm text-slate-500">{text}</div>
    </div>
  );
}
