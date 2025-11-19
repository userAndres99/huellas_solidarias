import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Función para obtener el icono según el tipo de animal (o de organización que quiere marcar su ubicacion)
function getMarkerIcon(tipoAnimal, markerType = 'animal') {

  // para la organizacion si quiere marcar su ubicacion
  if (markerType === 'org') {
    const iconUrl = 'https://cdn-icons-png.flaticon.com/512/684/684908.png'; // edificio
    return new L.icon({ iconUrl, iconSize: [28, 28], iconAnchor: [14, 28] });
  }

  // modo animal
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
  return new L.icon({ iconUrl, iconSize: [32, 32], iconAnchor: [16, 32] });
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

function LocationMarker({ onLocationSelect, getTipoAnimal, markerType = 'animal' }) {
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

  return position ? (
    <Marker position={position} icon={getMarkerIcon(tipo, markerType)} />
  ) : null;
}

export default function MapaInteractivo({
  onLocationSelect,
  center,
  tipoAnimal,
  readOnly = false,
  initialPosition = null,
  marker = false,
  markerType = 'animal',
  showMarkers = true,
  filterTipo = null,
  filterSituacion = null,
  filterCiudad = null,
}) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!showMarkers) return;
    
    const params = new URLSearchParams();
    if (filterTipo) params.append('tipo', filterTipo);
    if (filterSituacion) params.append('situacion', filterSituacion);
    if (filterCiudad) params.append('ciudad', filterCiudad);
    const url = params.toString() ? `/casos/json?${params.toString()}` : '/casos/json';

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const lista = Array.isArray(data) ? data : data.data || [];
        setMarkers(lista);
      })
      .catch(() => setMarkers([]));
  }, [showMarkers]);

  const mapCenter = center || (initialPosition ? initialPosition : [-38.9339, -67.9900]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <ChangeView center={center || initialPosition} />

        {!readOnly && onLocationSelect && (
          <LocationMarker
            onLocationSelect={onLocationSelect}
            getTipoAnimal={() => tipoAnimal}
            markerType={markerType}
          />
        )}

        {/* marcador para modo lectura/detalle*/}
        {readOnly && initialPosition && marker && (
          <Marker position={initialPosition} icon={getMarkerIcon(tipoAnimal, markerType)} />
        )}

        {/* marcadores globales (solo si showMarkers = true) */}
        {showMarkers &&
          markers
            .filter(m => {
              
              if (!m.latitud || !m.longitud) return false;
              
              if (filterTipo) {
                if (!m.tipoAnimal || String(m.tipoAnimal).toLowerCase() !== String(filterTipo).toLowerCase()) return false;
              }
              if (filterSituacion) {
                if (!m.situacion || String(m.situacion).toLowerCase() !== String(filterSituacion).toLowerCase()) return false;
              }
              if (filterCiudad) {
                if (!m.ciudad || String(m.ciudad).toLowerCase() !== String(filterCiudad).toLowerCase()) return false;
              }
              return true;
            })
            .map((m) => (
              <Marker
                key={m.id}
                position={[Number(m.latitud), Number(m.longitud)]}
                icon={getMarkerIcon(m.tipoAnimal)}
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