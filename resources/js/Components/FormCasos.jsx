import React, { useState } from 'react';
import MapaInteractivo from './MapaInteractivo';
import axios from 'axios';

export default function FormCasos() {
  const [formData, setFormData] = useState({
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
      setFormData({ ...formData, [name]: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLocationSelect = ([lat, lng]) => {
    setFormData({ ...formData, latitud: lat, longitud: lng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        // Solo agregar fotoAnimal si hay archivo
        if (key === 'fotoAnimal' && !formData[key]) return;
        data.append(key, formData[key]);
      });

      // CSRF token desde meta
      const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
      data.append('_token', csrfToken);

      const res = await axios.post('/casos', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      alert('Caso registrado exitosamente');
      console.log(res.data);

      setFormData({
        fotoAnimal: null,
        tipoAnimal: '',
        descripcion: '',
        situacion: '',
        ciudad: '',
        latitud: '',
        longitud: '',
        telefonoContacto: '',
      });
    } catch (err) {
      console.error(err.response?.data || err);
      alert('Error al registrar el caso. Revisa que todos los datos sean correctos y que estés logueado.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="flex flex-col gap-2 max-w-md mx-auto p-4 bg-white shadow rounded"
    >
      <label>Foto del Animal:</label>
      <input type="file" name="fotoAnimal" onChange={handleChange} />

      <label>Tipo de Animal:</label>
      <select name="tipoAnimal" value={formData.tipoAnimal} onChange={handleChange} required>
        <option value="">Seleccionar</option>
        <option value="Perro">Perro</option>
        <option value="Gato">Gato</option>
        <option value="Ave">Ave</option>
        <option value="Otro">Otro</option>
      </select>

      <label>Descripción:</label>
      <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required />

      <label>Situación:</label>
      <input type="text" name="situacion" value={formData.situacion} onChange={handleChange} required />

      <label>Ciudad:</label>
      <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} required />

      <label>Teléfono de Contacto:</label>
      <input type="text" name="telefonoContacto" value={formData.telefonoContacto} onChange={handleChange} />

      <label>Ubicación en el mapa:</label>
      <MapaInteractivo onLocationSelect={handleLocationSelect} />

      <p>Latitud: {formData.latitud} | Longitud: {formData.longitud}</p>

      <button type="submit" className="bg-blue-500 text-white rounded p-2 mt-3">
        Publicar caso
      </button>
    </form>
  );
}
