import React, { useState } from 'react';
import MapaInteractivo from './MapaInteractivo';
import FiltroCiudad from './FiltroCiudad';
import { useForm } from '@inertiajs/react';

export default function FormCasos() {
  const { data, setData, post, processing, errors } = useForm({
    fotoAnimal: null,
    tipoAnimal: '',
    descripcion: '',
    situacion: '',
    sexo: '',          
    tamano: '',         
    ciudad: '',
    ciudad_id: '',
    latitud: '',
    longitud: '',
    telefonoContacto: '',
  });

  const [mapCenter, setMapCenter] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [showMarkerOnSelect, setShowMarkerOnSelect] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoAnimal') setData(name, files[0] || null);
    else setData(name, value);
  };

  const handleCiudadSelect = (value) => {
    if (!value || !Array.isArray(value)) return;
    const [lat, lon] = value.map(Number);
    setData('ciudad', '');
    setData('ciudad_id', '');
    setData('latitud', lat);
    setData('longitud', lon);

    setMapCenter([lat, lon]);
    setInitialPosition([lat, lon]);
    setShowMarkerOnSelect(true);
  };

  const reverseGeocodeAndSetCity = async (lat, lon) => {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&accept-language=es`;

      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'HuellasSolidarias/1.0 (contacto@example.com)' },
      });
      if (response.ok) {
        const result = await response.json();
        const addr = result.address || {};
        const cityName =
          addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        if (cityName) {
          setData('ciudad', cityName);
          setData('ciudad_id', '');
        }
      } else {
        console.warn('Nominatim non-OK', response.status);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  };

  const handleLocationSelect = async ([lat, lng]) => {
    setData('latitud', lat);
    setData('longitud', lng);
    await reverseGeocodeAndSetCity(lat, lng);
    setMapCenter([lat, lng]);
    setInitialPosition([lat, lng]);
    setShowMarkerOnSelect(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/casos', {
      forceFormData: true,
      onError: () => {
        alert('Error al registrar el caso. Revisa los datos.');
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 max-w-md mx-auto p-4 bg-white shadow rounded"
    >
      <label>Foto del Animal:</label>
      <input type="file" name="fotoAnimal" onChange={handleChange} />

      <label>Tipo de Animal:</label>
      <select name="tipoAnimal" value={data.tipoAnimal} onChange={handleChange} required>
        <option value="" disabled>Seleccioná tipo de animal</option>
        <option value="Perro">Perro</option>
        <option value="Gato">Gato</option>
        <option value="Otro">Otro</option>
      </select>
      {errors.tipoAnimal && <div className="text-red-600">{errors.tipoAnimal}</div>}

      <label>Situación:</label>
      <select name="situacion" value={data.situacion} onChange={handleChange} required>
        <option value="" disabled>Seleccioná situación</option>
        <option value="Adopcion">Adopcion</option>
        <option value="Abandonado">Abandonado</option>
        <option value="Perdido">Perdido</option>
      </select>
      {errors.situacion && <div className="text-red-600">{errors.situacion}</div>}

      <label>Sexo:</label>
      <select name="sexo" value={data.sexo} onChange={handleChange} required>
        <option value="" disabled>Seleccioná sexo</option>
        <option value="Macho">Macho</option>
        <option value="Hembra">Hembra</option>
      </select>
      {errors.sexo && <div className="text-red-600">{errors.sexo}</div>}

      <label>Tamaño:</label>
      <select name="tamano" value={data.tamano} onChange={handleChange} required>
        <option value="" disabled>Seleccioná tamaño</option>
        <option value="Chico">Chico</option>
        <option value="Mediano">Mediano</option>
        <option value="Grande">Grande</option>
      </select>
      {errors.tamano && <div className="text-red-600">{errors.tamano}</div>}

      <label>Descripción:</label>
      <textarea name="descripcion" value={data.descripcion} onChange={handleChange} required />

      <label>Teléfono de Contacto (Opcional):</label>
      <input
        type="text"
        name="telefonoContacto"
        value={data.telefonoContacto}
        onChange={handleChange}
      />

      <label>Buscar Ciudad:</label>
      <FiltroCiudad onCiudadSelect={handleCiudadSelect} />

      <label>Ciudad Seleccionada:</label>
      <input
        type="text"
        name="ciudad"
        value={data.ciudad}
        readOnly
        className="border px-2 py-1 rounded bg-gray-100 cursor-not-allowed"
        required
      />

      <label>Ubicación en el mapa:</label>
      <MapaInteractivo
        onLocationSelect={handleLocationSelect}
        tipoAnimal={data.tipoAnimal}
        showMarkers={false}
        center={mapCenter}
        initialPosition={initialPosition}
        marker={showMarkerOnSelect}
      />

      <p>Latitud: {data.latitud} | Longitud: {data.longitud}</p>

      <button
        type="submit"
        disabled={processing}
        className={`bg-blue-500 text-white rounded p-2 mt-3 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {processing ? 'Publicando...' : 'Publicar caso'}
      </button>
    </form>
  );
}