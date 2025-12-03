import React, { useState, useEffect } from 'react';
import { useForm, Head, usePage } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FiltroCiudad from '@/Components/FiltroCiudad';
import MapaInteractivo from '@/Components/MapaInteractivo';
import '@/../css/components/form3D.css';

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
  const [dateWarning, setDateWarning] = useState(null);
  const [invalidDate, setInvalidDate] = useState(false);

  const handleCiudadSelect = (option) => {
    if (!option) return;
    const centroide = option.data?.centroide;
    const lat = centroide?.lat ?? null;
    const lon = centroide?.lon ?? null;
    if (lat !== null && lon !== null) {
      setData('lat', Number(lat));
      setData('lng', Number(lon));
      setMapCenter([Number(lat), Number(lon)]);
      setInitialPosition([Number(lat), Number(lon)]);
      setShowMarker(true);
    }
  };

  const handleLocationSelect = ([lat, lng]) => {
    setData('lat', lat);
    setData('lng', lng);
    setMapCenter([lat, lng]);
    setInitialPosition([lat, lng]);
    setShowMarker(true);
  };

  // Validar fechas: marcar inválido si ends_at está presente y es <= starts_at.
  useEffect(() => {
    try {
      if (!data.starts_at || !data.ends_at) {
        setInvalidDate(false);
        setDateWarning(null);
        return;
      }

      const start = new Date(data.starts_at);
      const end = new Date(data.ends_at);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setInvalidDate(false);
        setDateWarning(null);
        return;
      }

      if (end <= start) {
        setInvalidDate(true);
        const minEnd = new Date(start.getTime() + 60 * 1000);
        try {
          const human = minEnd.toLocaleString();
          setDateWarning(`La fecha/hora de fin es anterior o igual al inicio. Debés corregirla manualmente (por ejemplo, >= ${human}).`);
        } catch (e) {
          setDateWarning('La fecha/hora de fin es anterior o igual al inicio. Debés corregirla manualmente.');
        }
      } else {
        setInvalidDate(false);
        if (dateWarning) setDateWarning(null);
      }
    } catch (e) {
      // no-op
    }
  }, [data.starts_at, data.ends_at]);

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
  const page = usePage();
  const user = page.props.auth?.user ?? {};
  const avatarUrl = user?.profile_photo_url ?? '/images/DefaultPerfil.jpg';
  const userName = user?.name ?? '';

  const openPicker = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch (e) {
        
      }
    }
    try {
      el.focus();
      el.click();
    } catch (_) {
      
    }
  };

  const removePromoImage = () => {
    try {
      if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    } catch (e) {}
    setPreview(null);
    setData('image', null);
    setData('remove_image', 1);
    try {
      const input = document.getElementById('promoImage');
      if (input) input.value = '';
    } catch (e) {}
  };

  return (
    <>
      <Head title={event ? 'Editar evento' : 'Crear evento'} />

      <div className="relative max-w-4xl mx-auto mt-8 mb-8 pt-20 pb-6 px-6 border border-gray-100 shadow-lg rounded-2xl w-full" style={{ backgroundColor: '#16A34A' }}>
        <div className="card-3d-container">
            <div className="inner p-6">

            <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
              <div className="absolute top-4 right-4 z-50 pointer-events-auto flex items-center gap-2 bg-white/75 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700 truncate max-w-[6.5rem] sm:max-w-[14rem]">
                  <span className="align-middle">{userName}</span>
                  {user?.organizacion?.nombre ? (
                    <span className="text-xs text-gray-500 align-middle"> ({user.organizacion.nombre})</span>
                  ) : null}
                </span>
              </div>
              {/* Imagen */}
              <div className="card-3d-container">
                <div className="card-3d p-4 bg-transparent">
                  <div className="inner">
                    <label className="block text-sm font-medium text-white mb-1">Imagen promocional</label>

                    {preview ? (
                      <div className="mt-2 mb-3">
                        <div className="mx-auto w-full max-w-md h-36 overflow-hidden rounded-lg border">
                          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex justify-center">
                          <button type="button" onClick={removePromoImage} className="mt-2 text-sm text-red-600">Quitar imagen</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 flex justify-center">
                        <div className="inline-flex flex-col items-center text-xs text-white/80 w-full max-w-xs">
                          <div>Aún no seleccionaste una imagen</div>
                        </div>
                      </div>
                    )}

                    <div className="inner">
                      <input
                        id="promoImage"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0] || null;
                          setData('image', file);
                          setData('remove_image', 0);
                          if (file) {
                            try {
                              if (preview && typeof preview === 'string' && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
                            } catch (e) {}
                            setPreview(URL.createObjectURL(file));
                          } else {
                            try { if (preview && typeof preview === 'string' && preview.startsWith('blob:')) URL.revokeObjectURL(preview); } catch (e) {}
                            setPreview(null);
                          }
                        }}
                        className="hidden"
                      />

                      <label htmlFor="promoImage" className="flex items-center justify-center w-full">
                        <div
                          className="inline-flex flex-col items-center p-3 border-2 border-dashed rounded-lg cursor-pointer text-sm text-white hover:border-blue-300 transition w-full max-w-xs"
                          style={{ borderColor: '#16A34A', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                          </svg>
                          <div className="text-xs text-white">{data.image ? 'Cambiar foto' : 'hace click para subir una imagen'}</div>
                          {data.image ? (
                            <div className="mt-2 text-sm text-white truncate max-w-full">{data.image.name}</div>
                          ) : (
                            <div className="mt-2 text-sm text-white/80">Sin archivo seleccionado</div>
                          )}
                        </div>
                      </label>

                      {errors.image && <div className="text-red-600 mt-2">{errors.image}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Título, Tipo y Descripción */}
              <div className="card-3d-container">
                <div className="card-3d p-4 bg-transparent">
                  <div className="inner">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-white mb-1">Título</label>
                        <input name="titulo" value={data.titulo} onChange={e => setData('titulo', e.target.value)} placeholder="Ej: Jornada de Vacunación gratuita" className="w-full rounded-md border border-[#0f3a2f] p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80" style={{ backgroundColor: '#15803D' }} />
                        {errors.titulo && <div className="text-red-600 mt-1">{errors.titulo}</div>}
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-white mb-1">Tipo de jornada <span className="text-red-300">*</span></label>
                        <input name="tipo" value={data.tipo} onChange={e => setData('tipo', e.target.value)} placeholder="Vacunacion, Castracion" className="w-full rounded-md border border-[#0f3a2f] p-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80" style={{ backgroundColor: '#15803D' }} />
                        {errors.tipo && <div className="text-red-600 mt-1">{errors.tipo}</div>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white mb-1">Descripción <span className="text-red-300">*</span></label>
                      <textarea name="descripcion" value={data.descripcion} onChange={e => setData('descripcion', e.target.value)} placeholder="Describa el motivo o situación de la publicación" className="w-full rounded-md border border-[#0f3a2f] p-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80" style={{ backgroundColor: '#15803D' }} />
                      {errors.descripcion && <div className="text-red-600 mt-1">{errors.descripcion}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="card-3d-container">
                <div className="card-3d p-4 bg-transparent">
                  <div className="inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">Fecha y hora inicio</label>
                        <label className="flex items-center gap-3">
                          <div onClick={() => openPicker('starts_at')} className="inline-flex items-center p-2 border rounded bg-white text-gray-700 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input name="starts_at" id="starts_at" type="datetime-local" value={data.starts_at || ''} onChange={e => setData('starts_at', e.target.value)} className="w-full flex-1 min-w-0 rounded-md border border-[#0f3a2f] px-3 py-2 text-white" style={{ backgroundColor: '#15803D' }} aria-label="Seleccionar fecha y hora de inicio" />
                        </label>
                        <div className="mt-2">
                          <span className="text-sm text-white">{data.starts_at ? new Date(data.starts_at).toLocaleString() : 'No seleccionado'}</span>
                        </div>
                        {errors.starts_at && <div className="text-red-600 mt-1">{errors.starts_at}</div>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-1">Fecha y hora fin (opcional)</label>
                        <label className="flex items-center gap-3">
                          <div onClick={() => openPicker('ends_at')} className="inline-flex items-center p-2 border rounded bg-white text-gray-700 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input name="ends_at" id="ends_at" type="datetime-local" value={data.ends_at || ''} onChange={e => setData('ends_at', e.target.value)} min={data.starts_at || ''} className="w-full flex-1 min-w-0 rounded-md border border-[#0f3a2f] px-3 py-2 text-white" style={{ backgroundColor: '#15803D' }} aria-label="Seleccionar fecha y hora de fin" />
                        </label>
                        <div className="mt-2">
                          <span className="text-sm text-white">{data.ends_at ? new Date(data.ends_at).toLocaleString() : 'No seleccionado'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Aviso global para fechas */}
                    {dateWarning && (
                      <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded">{dateWarning}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="card-3d-container">
                <div className="card-3d p-4 bg-transparent">
                  <div className="inner">
                              <label className="block text-sm font-medium text-white mb-1">Seleccione la ubicación del evento <span className="text-red-300">*</span></label>
                    <div className="mt-2">
                      <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
                    </div>

                    <div className="mt-3 h-64 w-full rounded-md overflow-hidden border border-gray-200">
                      <MapaInteractivo onLocationSelect={handleLocationSelect} tipoAnimal={null} showMarkers={false} markerType="org" center={mapCenter} initialPosition={initialPosition} marker={showMarker} />
                    </div>

                    <div className="text-sm text-white/80 mt-2">
                      <span className="font-medium">Lat:</span> {data.lat ?? '-'}{' '}
                      <span className="mx-2">|</span>
                      <span className="font-medium">Lng:</span> {data.lng ?? '-'}
                    </div>
                    { (errors.lat || errors.lng) && (
                      <div className="mt-2 text-sm text-red-600">{errors.lat ?? errors.lng}</div>
                    ) }
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end items-center gap-3">
                {event && (
                  <button type="button" onClick={() => { window.location.href = route('organizacion.eventos.show', event.id); }} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition">Cancelar</button>
                )}

                    <div className="btn-3d-container">
                  <div className="btn-3d">
                    <button type="submit" disabled={processing || invalidDate} className="inner-btn">
                      {processing ? (event ? 'Guardando...' : 'Publicando...') : (event ? 'Editar evento' : 'Publicar evento')}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

CreateEvento.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold">{page.props.event ? 'Editar evento' : 'Nuevo evento'}</h2>}
  >
    {page}
  </AuthenticatedLayout>
);