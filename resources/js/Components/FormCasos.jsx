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

  const handleLocationSelect = ([lat, lng]) => {
    setData('latitud', lat);
    setData('longitud', lng);
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
      <input type="text" name="ciudad" value={data.ciudad} onChange={handleChange} required />

      <label>Teléfono de Contacto:</label>
      <input type="text" name="telefonoContacto" value={data.telefonoContacto} onChange={handleChange} />

      <label>Ubicación en el mapa:</label>
      <MapaInteractivo
  onLocationSelect={handleLocationSelect}
  tipoAnimal={data.tipoAnimal}
  showMarkers={false} // NO mostrar los demás marcadores
/>


      <p>Latitud: {data.latitud} | Longitud: {data.longitud}</p>

      <button type="submit" disabled={processing} className="bg-blue-500 text-white rounded p-2 mt-3">
        Publicar caso
      </button>
    </form>
  );
} 