// Modal map picker. Opens from the location field's map icon. Lets the
// user search by address (Nominatim), click anywhere to drop a pin, then
// confirm the selection.
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2, X, Check, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

function ClickCapture({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerModal({ initial, onCancel, onConfirm }) {
  const [pick, setPick] = useState(initial || null);
  const [query, setQuery] = useState(initial?.address || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  // Close on Esc
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  function handleQueryChange(v) {
    setQuery(v);
    setShowResults(true);
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
    setPick({ lat: Number(r.lat), lng: Number(r.lon), address: r.display_name });
    setQuery(r.display_name);
    setResults([]);
    setShowResults(false);
  }

  async function handleMapClick(lat, lng) {
    setPick({ lat, lng, address: null });
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setPick({ lat, lng, address: data.display_name });
        setQuery(data.display_name);
      }
    } catch {
      /* best-effort */
    }
  }

  const center = pick ? [pick.lat, pick.lng] : [41.2995, 69.2401];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-canvas-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-brand-50 p-1.5 text-brand-500">
              <MapPin size={16} />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Pick a location</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-canvas-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative border-b border-canvas-200 p-4">
          <Search size={14} className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search address, city or POI..."
            className="w-full rounded-lg border border-canvas-200 bg-canvas-50 py-2 pl-9 pr-9 text-sm text-slate-900 outline-none focus:border-brand-500 focus:bg-white"
          />
          {searching && (
            <Loader2 size={14} className="absolute right-7 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
          {showResults && results.length > 0 && (
            <ul className="absolute left-4 right-4 z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-canvas-200 bg-white shadow-card">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-canvas-50"
                  >
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-72 md:h-[420px]">
          <MapContainer center={center} zoom={pick ? 14 : 11} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap, &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {pick && (
              <>
                <Marker position={[pick.lat, pick.lng]} />
                <FlyTo lat={pick.lat} lng={pick.lng} />
              </>
            )}
            <ClickCapture onClick={handleMapClick} />
          </MapContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-canvas-200 px-5 py-3">
          <div className="text-xs text-slate-500">
            {pick ? (
              <>
                Selected:{' '}
                <span className="font-mono text-slate-700">
                  {pick.lat.toFixed(4)}, {pick.lng.toFixed(4)}
                </span>
              </>
            ) : (
              'Click anywhere on the map to drop a pin'
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-canvas-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-canvas-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => pick && onConfirm(pick)}
              disabled={!pick}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={14} />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
