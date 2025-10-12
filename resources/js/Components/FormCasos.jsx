import React from 'react';
import MapaInteractivo from './MapaInteractivo';
import { useForm } from '@inertiajs/react';

export default function FormCasos() {
  const { data, setData, post, reset, processing, errors } = useForm({
    fotoAnimal: null,
    tipoAnimal: '',
    descripcion: '',
    situacion: '',
    ciudad: '',
    ciudad_id: '',
    latitud: '',
    longitud: '',
    telefonoContacto: '',
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoAnimal') {
      setData(name, files[0] || null);
    } else {
      setData(name, value);
    }
  };

  const reverseGeocodeAndSetCity = async (lat, lon) => {
    try {
      const georefUrl = `https://apis.datos.gob.ar/georef/api/localidades?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&max=5`;
      const r1 = await fetch(georefUrl);
      if (r1.ok) {
        const j1 = await r1.json();
        const locs = j1.localidades || [];
        if (locs.length > 0) {
          const first = locs[0];
          const label = `${first.nombre}${first.provincia ? ' - ' + first.provincia.nombre : ''}`;
          const id = first.id || `${first.nombre}|${first.provincia?.nombre || ''}`;
          setData('ciudad', label);
          setData('ciudad_id', id);
          return;
        }
      }
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=es`;
      const r2 = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'HuellasSolidarias/1.0 (contacto@example.com)' },
      });
      if (r2.ok) {
        const j2 = await r2.json();
        const addr = j2.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        if (cityName) {
          setData('ciudad', cityName);
          setData('ciudad_id', '');
          return;
        }
      }
    } catch (err) {
    }
  };

  //recibe lat/lng desde MapaInteractivo
  const handleLocationSelect = async ([lat, lng]) => {
    setData('latitud', lat);
    setData('longitud', lng);
    await reverseGeocodeAndSetCity(lat, lng);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/casos', {
      forceFormData: true,
      onSuccess: () => {
        alert('Caso registrado exitosamente');
        reset();
      },
      onError: () => {
        alert('Error al registrar el caso. Revisa los datos.');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md mx-auto p-4 bg-white shadow rounded">
      <label>Foto del Animal:</label>
      <input type="file" name="fotoAnimal" onChange={handleChange} />

      <label>Tipo de Animal:</label>
      <select name="tipoAnimal" value={data.tipoAnimal} onChange={handleChange} required>
        <option value="">Seleccionar</option>
        <option value="Perro">Perro</option>
        <option value="Gato">Gato</option>
        <option value="Otro">Otro</option>
      </select>
      {errors.tipoAnimal && <div className="text-red-600">{errors.tipoAnimal}</div>}

      <label>Descripción:</label>
      <textarea name="descripcion" value={data.descripcion} onChange={handleChange} required />

      <label>Situación:</label>
      <input type="text" name="situacion" value={data.situacion} onChange={handleChange} required />

      <label>Ciudad:</label>
      <input
        type="text"
        name="ciudad"
        value={data.ciudad}
        onChange={() => {}}
        readOnly
        aria-readonly="true"
        className="border px-2 py-1 rounded bg-gray-100 cursor-not-allowed"
        required
      />

      <label>Teléfono de Contacto:</label>
      <input type="text" name="telefonoContacto" value={data.telefonoContacto} onChange={handleChange} />

      <label>Ubicación en el mapa:</label>
      <MapaInteractivo
        onLocationSelect={handleLocationSelect}
        tipoAnimal={data.tipoAnimal}
        showMarkers={false}
      />

      <p>Latitud: {data.latitud} | Longitud: {data.longitud}</p>

      <button type="submit" disabled={processing} className="bg-blue-500 text-white rounded p-2 mt-3">
        Publicar caso
      </button>
    </form>
  );
}