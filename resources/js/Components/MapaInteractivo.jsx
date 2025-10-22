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
    default:
      // icono por defecto 
      iconUrl = '/images/interrogante.jpeg';
  }
  return new L.icon({ iconUrl, iconSize: [32, 32] });
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

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

export default function MapaInteractivo({
  onLocationSelect,
  center,
  tipoAnimal,
  readOnly = false,
  initialPosition = null,
  marker = false,
  showMarkers = true,
}) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!showMarkers) return;
    fetch('/casos/json', { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
       const lista = Array.isArray(data) ? data : data.data || [];
       console.log("Marcadores cargados:", lista);
       setMarkers(lista)

      })
      .catch(() => setMarkers([]));
  }, [showMarkers]);

  const mapCenter = center || (initialPosition ? initialPosition : [-38.9339, -67.9900]);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <ChangeView center={center || initialPosition} />

        {!readOnly && onLocationSelect && (
          <LocationMarker onLocationSelect={onLocationSelect} getTipoAnimal={() => tipoAnimal} />
        )}

        {/* marcador para modo lectura/detalle*/}
        {readOnly && initialPosition && marker && (
          <Marker position={initialPosition} icon={getAnimalIcon(tipoAnimal)} />
        )}

        {/* marcadores globales (solo si showMarkers = true) */}
        {showMarkers &&
          markers
            .filter(m => m.latitud && m.longitud)
            .map((m) => (
              <Marker
                key={m.id}
                position={[Number(m.latitud), Number(m.longitud)]}
                icon={getAnimalIcon(m.tipoAnimal)}
              >
                <Popup>
                  <div style={{ fontWeight: 600 }}>{m.tipoAnimal}</div>
                  <div style={{ fontSize: 12, color: '#444' }}>{m.ciudad}</div>
                  <div style={{ fontSize: 12 }}>{m.descripcion}</div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
