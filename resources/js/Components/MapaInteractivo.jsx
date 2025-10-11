import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Función para obtener el icono según el tipo de animal
function getAnimalIcon(tipoAnimal) {
  let iconUrl;
  switch (tipoAnimal) {
    case 'Perro':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
      break;
    case 'Gato':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/616/616430.png';
      break;
    case 'Ave':
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/616/616440.png';
      break;
    default:
      iconUrl = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';
  }
  return new L.icon({
    iconUrl,
    iconSize: [32, 32],
  });
}

// Componente para cambiar la vista del mapa
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

// Marcador que coloca el usuario haciendo clic
function LocationMarker({ onLocationSelect, getTipoAnimal }) {
  const [position, setPosition] = useState(null);
  const [tipo, setTipo] = useState('default');

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      const tipoActual = getTipoAnimal ? getTipoAnimal() : 'default';
      setTipo(tipoActual); // actualiza el icono según la opción seleccionada

      setPosition([lat, lng]);
      onLocationSelect([lat, lng]);
    },
  });

  return position ? <Marker position={position} icon={getAnimalIcon(tipo)} /> : null;
}

// Componente principal del mapa
export default function MapaInteractivo({ onLocationSelect, center, tipoAnimal }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    fetch('/casos')
      .then(res => res.json())
      .then(data => setMarkers(data));
  }, []);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer
        center={center || [-38.9339, -67.9900]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <ChangeView center={center} />

        {onLocationSelect && (
          <LocationMarker
            onLocationSelect={onLocationSelect}
            getTipoAnimal={() => tipoAnimal} // función para tomar el tipo actual
          />
        )}

        {markers
          .filter(m => m.latitud && m.longitud)
          .map((m, i) => (
            <Marker
              key={i}
              position={[m.latitud, m.longitud]}
              icon={getAnimalIcon(m.tipoAnimal)}
            >
              <Popup>{m.tipoAnimal} reportado aquí</Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
