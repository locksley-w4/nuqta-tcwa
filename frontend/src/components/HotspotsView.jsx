// Find-location result view: a big map with green pulse markers + rose
// competitor pins, plus a list of ranked opportunity cards.
import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, ChevronRight, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function hotspotIcon(rank) {
  const tier = rank <= 1 ? 'rank-1' : rank <= 5 ? 'rank-2' : 'rank-3';
  return L.divIcon({
    className: 'hotspot-marker',
    html: `<div class="hotspot-pulse ${tier}">${rank}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ hotspots }) {
  const map = useMap();
  useEffect(() => {
    if (!hotspots?.length) return;
    const bounds = L.latLngBounds(hotspots.map((h) => [h.lat, h.lng]));
    map.fitBounds(bounds.pad(0.2), { animate: true });
  }, [hotspots, map]);
  return null;
}

export default function HotspotsView({ result, businessType, onPickHotspot }) {
  if (!result) return null;
  const center = result.hotspots[0]
    ? [result.hotspots[0].lat, result.hotspots[0].lng]
    : [41.2995, 69.2401];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-canvas-200 bg-white p-6 shadow-card">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          <Sparkles size={11} />
          Opportunity finder
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Top {result.hotspots.length} locations for a {businessType.toLowerCase()}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Scanned {result.totalEvaluated} cells across{' '}
          {result.scope === 'local' ? 'the selected area' : result.city}. Click any hotspot
          to run the full Block A–E analysis at that exact coordinate.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-card">
        <div className="h-72 md:h-[480px]">
          <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap, &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FitBounds hotspots={result.hotspots} />

            {result.competitors?.map((c) => (
              <CircleMarker
                key={`comp-${c.id}`}
                center={[c.lat, c.lng]}
                radius={5}
                pathOptions={{
                  color: '#f43f5e',
                  fillColor: '#f43f5e',
                  fillOpacity: 0.7,
                  weight: 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -2]}>
                  <span className="text-[11px]">{c.name}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {result.hotspots.map((h) => (
              <Marker
                key={`hs-${h.rank}`}
                position={[h.lat, h.lng]}
                icon={hotspotIcon(h.rank)}
                eventHandlers={{ click: () => onPickHotspot(h) }}
              >
                <Tooltip direction="top" offset={[0, -20]}>
                  <strong>#{h.rank} · {h.suitabilityScore}/100</strong>
                  <br />
                  {h.reason}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="flex items-center justify-between border-t border-canvas-200 px-4 py-2 text-[11px] text-slate-500">
          <span>Tip: click a green pin to analyze that exact location.</span>
          <span className="flex items-center gap-3">
            {result.competitors?.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                {result.competitors.length} competitors
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
              {result.hotspots.length} hotspots
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {result.hotspots.map((h) => (
          <HotspotCard key={h.rank} hotspot={h} onClick={() => onPickHotspot(h)} />
        ))}
      </div>
    </div>
  );
}

function HotspotCard({ hotspot, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-canvas-200 bg-white p-5 text-left shadow-card transition hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-card">
          {hotspot.rank}
        </span>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Suitability
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-600">
            {hotspot.suitabilityScore}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs font-mono text-slate-500">
        <MapPin size={11} />
        {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-700">{hotspot.reason}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
        <Pill label="Demand" value={hotspot.demandScore} />
        <Pill label="Foot" value={hotspot.footTrafficScore} />
        <Pill label="Comp." value={hotspot.competitorsWithin500m} suffix=" / 500m" />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600">
        Analyze this site
        <ChevronRight size={14} />
      </div>
    </button>
  );
}

function Pill({ label, value, suffix = '' }) {
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-emerald-700">
      {label}: {value}
      {suffix}
    </span>
  );
}
