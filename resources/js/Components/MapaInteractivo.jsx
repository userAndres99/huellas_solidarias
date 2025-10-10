import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

const iconAnimal = new L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
  iconSize: [32, 32],
});

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect([lat, lng]);
    },
  });

  return position ? <Marker position={position} icon={iconAnimal} /> : null;
}

export default function MapaInteractivo({ onLocationSelect }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    fetch("/casos")
      .then(res => res.json())
      .then(data => setMarkers(data));
  }, []);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={[-38.9339, -67.9900]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}

        {markers
          .filter(m => m.latitud && m.longitud)
          .map((m, i) => (
            <Marker key={i} position={[m.latitud, m.longitud]} icon={iconAnimal}>
              <Popup>Animal reportado aquí</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
