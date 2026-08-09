// Compact Leaflet map for the top hero card. Shows the analyzed point as a
// blue pin, the 1 km catchment as a dashed disk, and every competitor in
// `competitors[]` as a rose CircleMarker with a hover tooltip.
import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Users } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.6 });
  }, [lat, lng, zoom, map]);
  return null;
}

export default function MapPreview({ lat, lng, competitors, competitorsCount }) {
  // Tighter zoom so the 1 km disk + competitor pins all fit in view.
  const zoom = 14;
  const count = competitorsCount ?? competitors?.length ?? 0;

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* 1 km catchment ring */}
        <Circle
          center={[lat, lng]}
          radius={1000}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.05,
            weight: 1.2,
            dashArray: '4 6',
          }}
        />

        {/* Competitor pins */}
        {competitors?.map((c) => (
          <CircleMarker
            key={`comp-${c.id}`}
            center={[c.lat, c.lng]}
            radius={6}
            pathOptions={{
              color: '#f43f5e',
              fillColor: '#f43f5e',
              fillOpacity: 0.75,
              weight: 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -2]}>
              <span className="text-[11px]">
                {c.name} · {c.distanceKm} km
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Analyzed site pin (drawn last so it sits on top) */}
        <Marker position={[lat, lng]} />

        <Recenter lat={lat} lng={lng} zoom={zoom} />
      </MapContainer>

      {count > 0 && (
        <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-card">
          <Users size={12} className="text-rose-500" />
          {count} competitors nearby
        </div>
      )}
    </div>
  );
}
