import React from 'react';
import { useForm } from '@inertiajs/react';

export default function CreateEvento() {
  const { data, setData, post, processing, errors, reset } = useForm({
    titulo: '',
    descripcion: '',
    tipo: '',
    starts_at: null,
    ends_at: null,
    lat: null,
    lng: null,
    image: null,
  });

  function submit(e) {
    e.preventDefault();
    // useForm detecta y envia FormData automáticamente
    const payload = { ...data };
    if (payload.starts_at) payload.starts_at = new Date(payload.starts_at).toISOString();
    if (payload.ends_at) payload.ends_at = new Date(payload.ends_at).toISOString();

    // crea FormData manualmente
    const formData = new FormData();
    Object.keys(payload).forEach(k => {
      if (payload[k] !== null && payload[k] !== undefined) formData.append(k, payload[k]);
    });

    post(route('organizacion.eventos.store'), {
      forceFormData: true,
      data: formData,
      onSuccess: () => {
        reset();
      }
    });
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Nuevo evento</h1>
      <form onSubmit={submit} encType="multipart/form-data">
        <div>
          <label>Título</label>
          <input value={data.titulo} onChange={e => setData('titulo', e.target.value)} className="w-full border p-2" />
          {errors.titulo && <div className="text-red-600">{errors.titulo}</div>}
        </div>

        <div className="mt-2">
          <label>Descripción</label>
          <textarea value={data.descripcion} onChange={e => setData('descripcion', e.target.value)} className="w-full border p-2" />
        </div>

        <div className="mt-2">
          <label>Tipo de jornada</label>
          <input value={data.tipo} onChange={e => setData('tipo', e.target.value)} className="w-full border p-2" />
        </div>

        <div className="mt-2">
          <label>Fecha y hora inicio</label>
          <input
            type="datetime-local"
            value={data.starts_at || ''}
            onChange={e => setData('starts_at', e.target.value)}
            className="w-full border p-2"
          />
          {errors.starts_at && <div className="text-red-600">{errors.starts_at}</div>}
        </div>

        <div className="mt-2">
          <label>Fecha y hora fin (opcional)</label>
          <input
            type="datetime-local"
            value={data.ends_at || ''}
            onChange={e => setData('ends_at', e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div className="mt-2">
          <label>Imagen promocional</label>
          <input type="file" onChange={e => setData('image', e.target.files[0])} className="w-full" />
          {errors.image && <div className="text-red-600">{errors.image}</div>}
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button type="button" className="btn" onClick={() => reset()}>Limpiar</button>
          <button type="submit" className="btn btn-primary" disabled={processing}>Publicar</button>
        </div>
      </form>
    </div>
  );
}