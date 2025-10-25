import React, { useState, useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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

  const [preview, setPreview] = useState(null);

  

  function submit(e) {
    e.preventDefault();
    // useForm detecta y envia FormData 
    const payload = { ...data };
    if (payload.starts_at) payload.starts_at = new Date(payload.starts_at).toISOString();
    if (payload.ends_at) payload.ends_at = new Date(payload.ends_at).toISOString();

    // crea FormData 
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

  // preview de imagen 
  useEffect(() => {
    if (!data.image) {
      setPreview(null);
      return;
    }

    const url = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image);
    setPreview(url);

    return () => {
      if (data.image && typeof data.image !== 'string') URL.revokeObjectURL(url);
    };
  }, [data.image]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Nuevo evento</h2>}>
      <Head title="Crear evento" />

  <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl mb-4 font-semibold">Nuevo evento</h1>
        <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
          {/* Imagen*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen promocional</label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18M8 11l2 2 4-4 6 6" />
                </svg>
                <input type="file" accept="image/*" onChange={e => setData('image', e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </label>

              <div className="flex-1">
                <div className="text-sm text-gray-700">Sube una imagen para promocionar tu evento.</div>
                <div className="text-xs text-gray-400">PNG/JPG, máx. 4MB</div>
              </div>
            </div>

            {errors.image && <div className="text-red-600 mt-2">{errors.image}</div>}

            {preview && (
              <div className="mt-3">
                <div className="mx-auto w-full max-w-md h-36 overflow-hidden rounded-lg border">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex justify-center">
                  <button type="button" onClick={() => { setData('image', null); setPreview(null); }} className="mt-2 text-sm text-red-600">Quitar imagen</button>
                </div>
              </div>
            )}
          </div>

          {/* Titulo, Tipo jornada y Descripcion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input value={data.titulo} onChange={e => setData('titulo', e.target.value)} className="w-full border rounded-md p-2 focus:ring-1 focus:ring-blue-500" />
              {errors.titulo && <div className="text-red-600 mt-1">{errors.titulo}</div>}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de jornada</label>
              <input value={data.tipo} onChange={e => setData('tipo', e.target.value)} className="w-full border rounded-md p-2 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={data.descripcion} onChange={e => setData('descripcion', e.target.value)} className="w-full border rounded-md p-2 min-h-[120px] focus:ring-1 focus:ring-blue-500" />
          </div>

          {/* Fechas*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora inicio</label>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="datetime-local"
                    value={data.starts_at || ''}
                    onChange={e => setData('starts_at', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Seleccionar fecha y hora de inicio"
                  />
                </label>

                <span className="text-sm text-gray-700">{data.starts_at ? new Date(data.starts_at).toLocaleString() : 'No seleccionado'}</span>
              </div>
              {errors.starts_at && <div className="text-red-600 mt-1">{errors.starts_at}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora fin (opcional)</label>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="datetime-local"
                    value={data.ends_at || ''}
                    onChange={e => setData('ends_at', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Seleccionar fecha y hora de fin"
                  />
                </label>

                <span className="text-sm text-gray-700">{data.ends_at ? new Date(data.ends_at).toLocaleString() : 'No seleccionado'}</span>
              </div>
            </div>
          </div>

        

        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            Limpiar
          </button>

          <button
            type="submit"
            disabled={processing}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {processing && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            <span>Publicar</span>
          </button>
        </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}