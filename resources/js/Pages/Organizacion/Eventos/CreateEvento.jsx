import React, { useState, useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FiltroCiudad from '@/Components/FiltroCiudad';
import MapaInteractivo from '@/Components/MapaInteractivo';

export default function CreateEvento({ event = null }) {
  const initial = {
    titulo: event?.title ?? '',
    descripcion: event?.description ?? '',
    tipo: event?.tipo ?? '',
    starts_at: event?.start ? new Date(event.start).toISOString().slice(0, 16) : '',
    ends_at: event?.end ? new Date(event.end).toISOString().slice(0, 16) : '',
    lat: event?.lat ?? '',
    lng: event?.lng ?? '',
    image: null,
    remove_image: 0,
  };

  const { data, setData, post, put, processing, errors, reset } = useForm(initial);

  const [preview, setPreview] = useState(event?.image_url ?? null);
  const [mapCenter, setMapCenter] = useState(event?.lat && event?.lng ? [Number(event.lat), Number(event.lng)] : null);
  const [initialPosition, setInitialPosition] = useState(event?.lat && event?.lng ? [Number(event.lat), Number(event.lng)] : null);
  const [showMarker, setShowMarker] = useState(!!(event?.lat && event?.lng));

  const handleCiudadSelect = (value) => {
    if (!value || !Array.isArray(value)) return;
    const [lat, lon] = value.map(Number);
    setData('lat', lat);
    setData('lng', lon);
    setMapCenter([lat, lon]);
    setInitialPosition([lat, lon]);
    setShowMarker(true);
  };

  const handleLocationSelect = ([lat, lng]) => {
    setData('lat', lat);
    setData('lng', lng);
    setMapCenter([lat, lng]);
    setInitialPosition([lat, lng]);
    setShowMarker(true);
  };

  async function submit(e) {
    e.preventDefault();
    if (event && event.id) {
      if (data.image instanceof File) {
        const fd = new FormData();
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (typeof val === 'undefined' || val === null) return;
          fd.append(key, val);
        });
        fd.append('_method', 'PUT');
        try {
          const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
          const resp = await fetch(route('organizacion.eventos.update', event.id), {
            method: 'POST',
            headers: {
              'X-CSRF-TOKEN': token,
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: fd,
            credentials: 'same-origin',
          });

          if (resp.ok) {
            reset();
            // redireccionar de vuelta al panel de organización
            window.location.href = route('organizacion.index');
            return;
          } else {
            window.location.reload();
            return;
          }
        } catch (_) {
          window.location.reload();
          return;
        }
      } else {
        await put(route('organizacion.eventos.update', event.id), data, {
          forceFormData: true,
          onSuccess: () => reset(),
        });
      }
    } else {
      await post(route('organizacion.eventos.store'), data, {
        forceFormData: true,
        onSuccess: () => reset(),
      });
    }
  }

  useEffect(() => {
    if (!data.image) {
      if (data.remove_image) {
        setPreview(null);
        return;
      }
      if (!event) setPreview(null);
      return;
    }

    const url = typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image);
    setPreview(url);

    return () => {
      if (data.image && typeof data.image !== 'string') URL.revokeObjectURL(url);
    };
  }, [data.image, data.remove_image, event]);

  useEffect(() => {
    if (event) {
      setPreview(event.image_url ?? null);
      setData('image', null);
      setData('remove_image', 0);
    }
  }, [event]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">{event ? 'Editar evento' : 'Nuevo evento'}</h2>}>
      <Head title={event ? 'Editar evento' : 'Crear evento'} />

      <div className="max-w-3xl mx-auto p-4">
        <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen promocional</label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18M8 11l2 2 4-4 6 6" />
                </svg>
                <input name="image" type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0] || null;
                    setData('image', file);
                    // limpiar cualquier solicitud de eliminación pendiente cuando el usuario selecciona un nuevo archivo
                    setData('remove_image', 0);
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
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
                  <button type="button" onClick={() => {
                      // marcar para eliminación del lado del servidor y limpiar vista previa
                      setData('image', null);
                      setData('remove_image', 1);
                      setPreview(null);
                    }} className="mt-2 text-sm text-red-600">Quitar imagen</button>
                </div>
              </div>
            )}
          </div>

          {/* Título, Tipo y Descripción */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input name="titulo" value={data.titulo} onChange={e => setData('titulo', e.target.value)} className="w-full border rounded-md p-2 focus:ring-1 focus:ring-blue-500" />
              {errors.titulo && <div className="text-red-600 mt-1">{errors.titulo}</div>}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de jornada</label>
              <input name="tipo" value={data.tipo} onChange={e => setData('tipo', e.target.value)} className="w-full border rounded-md p-2 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="descripcion" value={data.descripcion} onChange={e => setData('descripcion', e.target.value)} className="w-full border rounded-md p-2 min-h-[120px] focus:ring-1 focus:ring-blue-500" />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora inicio</label>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input name="starts_at" type="datetime-local" value={data.starts_at || ''} onChange={e => setData('starts_at', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Seleccionar fecha y hora de inicio" />
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
                  <input name="ends_at" type="datetime-local" value={data.ends_at || ''} onChange={e => setData('ends_at', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Seleccionar fecha y hora de fin" />
                </label>

                <span className="text-sm text-gray-700">{data.ends_at ? new Date(data.ends_at).toLocaleString() : 'No seleccionado'}</span>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccione la ubicación del evento (opcional)</label>
            <div className="mt-2">
              <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
            </div>

            <div className="mt-3 h-64 w-full rounded-md overflow-hidden border border-gray-200">
              <MapaInteractivo onLocationSelect={handleLocationSelect} tipoAnimal={null} showMarkers={false} markerType="org" center={mapCenter} initialPosition={initialPosition} marker={showMarker} />
            </div>

            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Lat:</span> {data.lat ?? '-'}{' '}
              <span className="mx-2">|</span>
              <span className="font-medium">Lng:</span> {data.lng ?? '-'}
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            {event ? (
              <>
                <button type="button" onClick={() => { window.location.href = route('organizacion.eventos.show', event.id); }} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition">Cancelar</button>
              </>
            ) : (
              <button type="button" onClick={() => reset()} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition">Limpiar</button>
            )}

            <button type="submit" disabled={processing} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
              {processing && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
        <span>{event ? 'Editar' : 'Publicar'}</span>
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}