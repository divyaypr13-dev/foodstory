import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

const pinIcon = L.divIcon({
  className: 'foodstory-map-pin',
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#E23E3E;border:3px solid #FFFFFF;box-shadow:0 3px 8px rgba(31,27,22,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

export default function MapView({ restaurants = [], center }) {
  const validRestaurants = restaurants.filter(
    (r) =>
      Array.isArray(r.location?.coordinates) &&
      r.location.coordinates.length === 2 &&
      !Number.isNaN(r.location.coordinates[0]) &&
      !Number.isNaN(r.location.coordinates[1])
  );

  const defaultCenter =
    center ||
    (validRestaurants[0]
      ? [validRestaurants[0].location.coordinates[1], validRestaurants[0].location.coordinates[0]]
      : [12.9716, 77.5946]);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(31,27,22,0.06)] overflow-hidden h-[460px] sm:h-[540px]">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validRestaurants.map((r) => {
          const [lng, lat] = r.location.coordinates;
          return (
            <Marker key={r._id} position={[lat, lng]} icon={pinIcon}>
              <Popup>
                <div className="space-y-1 min-w-[160px]">
                  <p className="font-semibold text-sm text-[#1F1B16] m-0">{r.name}</p>
                  <p className="text-xs text-[#1F1B16]/70 m-0">
                    {r.city} · ★ {Number(r.ratingAvg || 0).toFixed(1)}
                  </p>
                  <Link
                    to={`/restaurants/${r._id}`}
                    className="inline-block text-xs font-semibold text-[#E23E3E] hover:underline pt-1"
                  >
                    View Menu & Stories →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
