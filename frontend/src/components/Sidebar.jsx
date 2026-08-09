// Left sidebar: brand, nav, business-type select, location search,
// finance fields (analyze mode only), find-location + run-analysis buttons,
// and a tip card at the bottom.
import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Clock,
  Sparkles,
  Lightbulb,
  ChevronDown,
  Coffee,
  UtensilsCrossed,
  Cake,
  Dumbbell,
  Pill,
  BookOpen,
  ShoppingBag,
  Loader2,
  X,
  Map as MapIcon,
  Compass,
  Wallet,
  Globe2,
  Crosshair,
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'Coffee shop', icon: Coffee },
  { value: 'Restaurant', icon: UtensilsCrossed },
  { value: 'Bakery', icon: Cake },
  { value: 'Gym', icon: Dumbbell },
  { value: 'Pharmacy', icon: Pill },
  { value: 'Bookstore', icon: BookOpen },
  { value: 'Retail shop', icon: ShoppingBag },
];

function iconForBusinessType(value) {
  const match = BUSINESS_TYPES.find((b) => b.value === value);
  return match ? match.icon : Coffee;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export default function Sidebar({
  view,                    // 'analyze' | 'history'
  onViewChange,
  mode,                    // 'analyze' | 'find'
  businessType,
  onBusinessTypeChange,
  location,                // { lat, lng, address }
  onLocationChange,
  finance,                 // { loanAmount, collateralValue, monthlyRevenue, monthlyExpenses, termMonths }
  onFinanceChange,
  onRunAnalysis,
  onFindLocation,
  findScope,
  onFindScopeChange,
  loading,
  findLoading,
  locationInputRef,
  onOpenMapPicker,
  isMobileOpen,            // mobile drawer state
  onCloseMobile,
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  const TypeIcon = iconForBusinessType(businessType);

  // Inline geocoder for the location textarea.
  const [query, setQuery] = useState(location?.address || '');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (location?.address && location.address !== query) {
      setQuery(location.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.address]);

  function handleQueryChange(v) {
    setQuery(v);
    setSearchOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v || v.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=json&limit=6&q=${encodeURIComponent(v)}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function pickResult(r) {
    onLocationChange({
      lat: Number(r.lat),
      lng: Number(r.lon),
      address: r.display_name,
    });
    setQuery(r.display_name);
    setResults([]);
    setSearchOpen(false);
  }

  const isFindMode = mode === 'find';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col overflow-y-auto bg-ink-950 px-5 py-6 text-slate-100 shadow-2xl transition-transform duration-300 md:relative md:z-auto md:translate-x-0 md:shadow-none ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="mb-7 flex items-center gap-3">
        <img
          src="/nuqta.png"
          alt="Nuqta"
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
        />
        <div className="flex-1">
          <div className="text-lg font-semibold leading-tight tracking-tight">Nuqta</div>
          <div className="mt-0.5 text-xs leading-snug text-slate-400">
            Find the best places to open and grow
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-ink-900 hover:text-slate-100 md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* "Find location" CTA — sits above the Analyze nav. Includes a
          scope toggle so the user can scan the whole city or just the area
          around the currently selected location. */}
      <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
        <div className="mb-2 flex rounded-lg bg-ink-900/60 p-0.5">
          <ScopeButton
            active={findScope === 'city'}
            onClick={() => onFindScopeChange?.('city')}
            icon={Globe2}
            label="Whole city"
            hint="15"
          />
          <ScopeButton
            active={findScope === 'local'}
            onClick={() => onFindScopeChange?.('local')}
            icon={Crosshair}
            label="Near here"
            hint="5"
            disabled={!location}
          />
        </div>
        <button
          type="button"
          onClick={onFindLocation}
          disabled={findLoading || (findScope === 'local' && !location)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {findLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Scanning {findScope === 'local' ? 'area' : 'city'}...
            </>
          ) : (
            <>
              <Compass size={14} />
              {findScope === 'local' ? 'Find near here' : 'Find in city'}
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="mb-6 space-y-1">
        <NavItem
          icon={Search}
          label="Analyze"
          active={view === 'analyze'}
          onClick={() => onViewChange?.('analyze')}
        />
        <NavItem
          icon={Clock}
          label="History"
          active={view === 'history'}
          onClick={() => onViewChange?.('history')}
        />
      </nav>

      <div className="mb-1 h-px bg-slate-800" />

      <div className="flex-1 overflow-y-auto pt-5">
        {/* Business type */}
        <div className="relative mb-5">
          <Label>Business type</Label>
          <button
            type="button"
            onClick={() => setTypeOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-ink-900 px-3 py-2.5 text-sm text-slate-100 transition hover:border-slate-700"
          >
            <span className="flex items-center gap-2">
              <TypeIcon size={14} className="text-slate-400" />
              {businessType}
            </span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>
          {typeOpen && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-800 bg-ink-900 shadow-card">
              {BUSINESS_TYPES.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onBusinessTypeChange(b.value);
                        setTypeOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-ink-800"
                    >
                      <Icon size={14} className="text-slate-400" />
                      {b.value}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Location with inline map button */}
        <div className="relative mb-5">
          <div className="mb-2 flex items-center justify-between">
            <Label as="span">Location</Label>
            <button
              type="button"
              onClick={onOpenMapPicker}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-500 transition hover:bg-brand-500/10"
              title="Pick on map"
            >
              <MapIcon size={11} />
              Map
            </button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-3 text-slate-500"
            />
            <textarea
              ref={locationInputRef}
              rows={3}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search address, city or POI..."
              className="w-full resize-none rounded-lg border border-slate-800 bg-ink-900 py-2 pl-9 pr-9 text-sm leading-relaxed text-slate-100 outline-none focus:border-brand-500"
            />
            {searching ? (
              <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-slate-500" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
            {searchOpen && results.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-800 bg-ink-900 shadow-card">
                {results.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => pickResult(r)}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-ink-800"
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Finance — hidden in find-location mode */}
        {!isFindMode && (
          <div className="mb-5">
            <Label>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={11} />
                Finance
              </span>
            </Label>
            <div className="space-y-2">
              <FinanceField
                label="Loan amount"
                prefix="$"
                value={finance.loanAmount}
                onChange={(v) => onFinanceChange({ ...finance, loanAmount: v })}
              />
              <FinanceField
                label="Collateral value"
                prefix="$"
                value={finance.collateralValue}
                onChange={(v) => onFinanceChange({ ...finance, collateralValue: v })}
              />
              <FinanceField
                label="Monthly revenue"
                prefix="$"
                value={finance.monthlyRevenue}
                onChange={(v) => onFinanceChange({ ...finance, monthlyRevenue: v })}
              />
              <FinanceField
                label="Monthly expenses"
                prefix="$"
                value={finance.monthlyExpenses}
                onChange={(v) => onFinanceChange({ ...finance, monthlyExpenses: v })}
              />
              <FinanceField
                label="Term"
                suffix="mo"
                value={finance.termMonths}
                onChange={(v) => onFinanceChange({ ...finance, termMonths: v })}
              />
            </div>
          </div>
        )}

        {/* Run analysis is the primary form-submit button at the bottom. */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={loading || !location}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Run analysis
            </>
          )}
        </button>
      </div>

      {/* Tip card */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-ink-900/60 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <span className="text-sm font-medium text-slate-200">Tip</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          {isFindMode
            ? 'Showing the top opportunity hotspots — click any pin to analyze that exact site.'
            : 'Choose a location and business type to see AI-powered insights.'}
        </p>
      </div>
    </aside>
  );
}

function ScopeButton({ active, onClick, icon: Icon, label, hint, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
        active
          ? 'bg-emerald-500 text-white'
          : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <Icon size={11} />
      {label}
      <span className={`text-[10px] ${active ? 'opacity-90' : 'opacity-60'}`}>· {hint}</span>
    </button>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-500/10 text-brand-500'
          : 'text-slate-400 hover:bg-ink-900 hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Label({ children, as: Tag = 'div' }) {
  return (
    <Tag className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </Tag>
  );
}

function FinanceField({ label, value, onChange, prefix, suffix }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] text-slate-500">{label}</span>
      <div className="flex items-center rounded-lg border border-slate-800 bg-ink-900 focus-within:border-brand-500">
        {prefix && <span className="pl-2.5 text-xs text-slate-500">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? '' : Number(v));
          }}
          className="w-full bg-transparent px-2 py-1.5 text-sm text-slate-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-2.5 text-[11px] text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}
