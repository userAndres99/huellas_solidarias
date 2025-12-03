import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

import FiltroCiudad from '@/Components/FiltroCiudad'; 
import MapaInteractivo from '@/Components/MapaInteractivo'; 
import '@/../css/components/form3D.css';
import MensajeFlash from '@/Components/MensajeFlash';
// GeoNames 
const GEONAMES_REVERSE = 'https://secure.geonames.org/findNearbyPlaceNameJSON';
const GEONAMES_USER = import.meta.env.VITE_GEONAMES_USER;
import { cleanPlaceName } from '@/Services/geonamesHelpers';

export default function SolicitudVerificacionForm() {
  const page = usePage();
  const user = page.props.auth?.user ?? null;
  const { flash, existingPending, lastSolicitud } = page.props;
  const [localFlash, setLocalFlash] = useState(flash?.success ?? null);

  useEffect(() => {
    if (flash?.success) {
      setLocalFlash(flash.success);
    }
  }, [flash?.success]);

  // añadimos ciudad/ciudad_id/latitud/longitud al formulario
  const { data, setData, post, processing, errors, reset } = useForm({
    organization_name: '',
    organization_phone: '',
    organization_email: '',
    message: '',
    documents: [],
    ciudad: '',
    ciudad_id: '',
    latitud: '',
    longitud: '',
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [showMarker, setShowMarker] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrls && previewUrls.length) {
        previewUrls.forEach((u) => {
          if (u && typeof u === 'string' && u.startsWith('blob:')) URL.revokeObjectURL(u);
        });
      }
    };
  }, [previewUrls]);

  const onFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);

    const existing = Array.from(data.documents || []);

    const combined = [...existing];
    newFiles.forEach((nf) => {
      const exists = combined.some((cf) => cf && nf && cf.name === nf.name && cf.size === nf.size && cf.type === nf.type);
      if (!exists) combined.push(nf);
    });

    setData('documents', combined);

    setPreviewUrls((prev) => {
      if (prev && prev.length) {
        prev.forEach((u) => { if (u && typeof u === 'string' && u.startsWith('blob:')) URL.revokeObjectURL(u); });
      }

      const urls = combined.map((f) => (f && f.type && f.type.startsWith('image/') ? URL.createObjectURL(f) : null));

      try {
        const input = document.getElementById('documents');
        if (input) {
          const dt = new DataTransfer();
          combined.forEach((f) => dt.items.add(f));
          input.files = dt.files;
        }
      } catch (err) {
       
      }

      return urls;
    });
  };

  const removeDocument = (index) => {
    const current = Array.from(data.documents || []);
    const newFiles = current.filter((_, i) => i !== index);
    setData('documents', newFiles);

    setPreviewUrls((prev) => {
      if (!prev) return [];
      const toRevoke = prev[index];
      if (toRevoke && typeof toRevoke === 'string' && toRevoke.startsWith('blob:')) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== index);
    });

    try {
      const input = document.getElementById('documents');
      if (input) {
        const dt = new DataTransfer();
        newFiles.forEach((f) => dt.items.add(f));
        input.files = dt.files;
      }
    } catch (e) {
      
    }
  };

  const handleCiudadSelect = async (option) => {
    if (!option) return;
    const centroide = option.data?.centroide;
    const lat = centroide?.lat ?? null;
    const lon = centroide?.lon ?? null;

    if (lat !== null && lon !== null) {
      
      setData('ciudad', option.label || '');
      setData('ciudad_id', option.value || '');
      setData('latitud', Number(lat));
      setData('longitud', Number(lon));

      setMapCenter([Number(lat), Number(lon)]);
      setInitialPosition([Number(lat), Number(lon)]);
      setShowMarker(true);
    }
  };

  // Cuando el usuario marca en el mapa
  const handleLocationSelect = async ([lat, lng]) => {
    setData('latitud', lat);
    setData('longitud', lng);
    await reverseGeocodeAndSetCity(lat, lng);

    setMapCenter([lat, lng]);
    setInitialPosition([lat, lng]);
    setShowMarker(true);
  };

  // Reverse
  const reverseGeocodeAndSetCity = async (lat, lon) => {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lon),
        username: GEONAMES_USER,
        lang: 'es',
        radius: '30',
        maxRows: '10',
      });

      const url = `${GEONAMES_REVERSE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('GeoNames reverse did not respond OK', res.status);
        return;
      }

      const json = await res.json();
      const list = json.geonames || [];
      if (!list || list.length === 0) return;

      // 1. Filtrar ciudades reales dentro de la misma respuesta
      const cities = list.filter((g) => {
        const fcode = (g.fcode || '').toString().toUpperCase();
        const pop = g.population ? Number(g.population) : 0;

        return (
          g.fcl === 'P' &&
          (
            fcode === 'PPLA' ||
            fcode === 'PPLA2' ||
            fcode === 'PPLA3' ||
            fcode === 'PPL'
          ) &&
          pop > 3000
        );
      });

      // 2. Si encontramos ciudades en la respuesta, usar la más cercana (primer elemento)
      if (cities.length > 0) {
        const c = cities[0];
        const nameC = cleanPlaceName(c.name || c.toponymName || '');
        const adminC = c.adminName1 || '';

        setData('ciudad', `${nameC} - ${adminC}`);
        setData('ciudad_id', c.geonameId || '');
        return;
      }

      // 3. Si NO hay ciudades en la respuesta -> hacemos un segundo request pidiendo solo ciudades
      try {
        const nearCityParams = new URLSearchParams({
          lat: String(lat),
          lng: String(lon),
          username: GEONAMES_USER,
          lang: 'es',
          featureClass: 'P',
          maxRows: '1',
        });
        nearCityParams.append('featureCode', 'PPL');
        nearCityParams.append('featureCode', 'PPLA');

        const nearCityUrl = `https://secure.geonames.org/findNearbyPlaceNameJSON?${nearCityParams.toString()}`;
        const cityRes = await fetch(nearCityUrl);

        if (cityRes.ok) {
          const cj = await cityRes.json();
          const best = cj.geonames?.[0];

          if (best) {
            const nameB = cleanPlaceName(best.name || best.toponymName || '');
            const adminB = best.adminName1 || '';

            setData('ciudad', `${nameB} - ${adminB}`);
            setData('ciudad_id', best.geonameId || '');
            return;
          }
        }
      } catch (err2) {
        console.warn('Error buscando ciudad cercana:', err2);
      }

      // Si todo lo anterior falla, fallback al primer resultado (aunque sea barrio)
      const pick = list[0];
      const name = pick.name || pick.toponymName || '';
      const admin = pick.adminName1 || pick.adminName || '';
      const displayName = cleanPlaceName(name);
      const label = admin ? `${displayName} - ${admin}` : displayName;

      setData('ciudad', label);
      setData('ciudad_id', pick.geonameId || '');
    } catch (err) {
      console.error('Error en GeoNames reverse geocode:', err);
    }
  };

  const submit = (e) => {
    e.preventDefault();

    post(route('profile.request_verification'), {
      forceFormData: true,
      onSuccess: () => {
        reset('organization_name', 'organization_phone', 'organization_email', 'message', 'documents', 'ciudad', 'ciudad_id', 'latitud', 'longitud');
        setPreviewUrls([]);
        setShowMarker(false);
        setInitialPosition(null);
        setMapCenter(null);
      },
    });
  };

  return (
    <>
      <Head title="Solicitar verificación" />

      {/* Mensajes flash  */}
      {localFlash && (
        <MensajeFlash tipo="success">{localFlash}</MensajeFlash>
      )}

      <div className="relative max-w-3xl mx-auto mt-4 mb-8 pt-8 pb-6 px-6 border border-gray-100 shadow-lg rounded-2xl w-full" style={{ backgroundColor: '#16A34A' }}>
        {Object.keys(page.props.errors || {}).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">{page.props.errors.message ?? 'Error al enviar la solicitud.'}</div>
        )}

        {!user ? (
          <div className="p-6">
            <p>No estás autenticado.</p>
          </div>
        ) : user.role_name !== 'Usuario' ? (
          <div className="p-6">
            <h1 className="text-xl font-semibold">Acceso no permitido</h1>
            <p className="mt-2 text-sm text-gray-700">Esta página está disponible solamente para usuarios.</p>
          </div>
        ) : existingPending ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-center">
              <h2 className="font-semibold">Solicitud pendiente</h2>
              <p className="text-sm text-gray-700 mt-2 mx-auto max-w-xl">Usted ya envió una solicitud. Espere la respuesta del equipo para volver a intentarlo.</p>
              {lastSolicitud && (
                <p className="text-xs text-gray-500 mt-4">Enviada: {new Date(lastSolicitud.created_at).toLocaleString()} · Estado: {lastSolicitud.status}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {lastSolicitud && lastSolicitud.status === 'rejected' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h2 className="font-semibold text-red-800">Su solicitud fue rechazada</h2>
                {lastSolicitud.response_message && (
                  <p className="mt-2 text-sm text-gray-700"><strong>Motivo:</strong> {lastSolicitud.response_message}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">Enviada: {new Date(lastSolicitud.created_at).toLocaleString()}</p>
              </div>
            )}


            <div className="card-3d-container">
              <div className="card-3d p-4 bg-transparent">
                <div className="inner">
            <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
                <div>
                  <InputLabel htmlFor="organization_name" value={"Nombre de la organización *"} />
                  <input
                    id="organization_name"
                    name="organization_name"
                    type="text"
                    required
                    aria-required="true"
                    value={data.organization_name}
                    onChange={(e) => setData('organization_name', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#0f3a2f] p-2 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ backgroundColor: '#15803D' }}
                    placeholder="Nombre de la organización"
                  />
                  <InputError message={errors.organization_name} className="mt-1" />
                </div>

              <div>
                <InputLabel htmlFor="organization_phone" value={"Teléfono de la organización *"} />
                <input
                  id="organization_phone"
                  name="organization_phone"
                  type="text"
                  required
                  aria-required="true"
                  value={data.organization_phone}
                  onChange={(e) => setData('organization_phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#0f3a2f] p-2 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ backgroundColor: '#15803D' }}
                  placeholder="+54 9 11 1234 5678"
                />
                <InputError message={errors.organization_phone} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="organization_email" value={"Correo de la organización *"} />
                <input
                  id="organization_email"
                  name="organization_email"
                  type="email"
                  required
                  aria-required="true"
                  value={data.organization_email}
                  onChange={(e) => setData('organization_email', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#0f3a2f] p-2 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ backgroundColor: '#15803D' }}
                  placeholder="contacto@organizacion.org"
                />
                <InputError message={errors.organization_email} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="message" value="Mensaje / aclaración (opcional)" />
                <textarea
                  id="message"
                  value={data.message}
                  onChange={(e) => setData('message', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-[#0f3a2f] p-2 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ backgroundColor: '#15803D' }}
                  placeholder="Alguna aclaración sobre la representación..."
                />
                <InputError message={errors.message} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="documents" value="Documentación (PDF) - opcional" />
                {(data.documents && data.documents.length > 0) && (
                  <div className="mb-2 flex flex-wrap gap-3">
                    {data.documents.map((f, i) => (
                      <div key={i} className="inline-flex flex-col items-center w-32">
                        {previewUrls[i] ? (
                          <div className="w-32 h-32 overflow-hidden rounded">
                            <img src={previewUrls[i]} alt={`preview-${i}`} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 flex items-center justify-center rounded border bg-white/5 text-sm text-white p-2">
                            <div className="text-xs truncate text-center">{f.name}</div>
                          </div>
                        )}
                        <button type="button" onClick={() => removeDocument(i)} className="mt-1 text-xs text-red-400 hover:text-red-600">Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  id="documents"
                  name="documents[]"
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={onFilesChange}
                  className="mt-1 block w-full text-white"
                />
                <InputError message={errors['documents.0'] ?? errors.documents} className="mt-1" />
              </div>

              {/* Buscar ciudad  */}
              <div>
                <InputLabel value="Buscar ciudad / seleccionar ubicación" />
                <div className="mt-1">
                  <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
                </div>
              </div>

              <div>
                <InputLabel value="Ciudad seleccionada" />
                <input
                  type="text"
                  name="ciudad"
                  value={data.ciudad}
                  readOnly
                  className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 text-white cursor-not-allowed"
                  style={{ backgroundColor: '#145C2A' }}
                />
              </div>

              {/* seleccionar ubicacion */}
              <div>
                <InputLabel value={"Marcar ubicación en el mapa *"} />
                <div className="h-64 w-full rounded-md overflow-hidden border border-gray-200 mt-2">
                  <MapaInteractivo
                    onLocationSelect={handleLocationSelect}
                    tipoAnimal={null}
                    showMarkers={false}
                    markerType="org"
                    center={mapCenter}
                    initialPosition={initialPosition}
                    marker={showMarker}
                  />
                </div>
                <InputError message={(errors.latitud || errors.longitud) ? (errors.latitud || errors.longitud) : null} className="mt-1" />
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Latitud:</span> {data.latitud || '-'}{' '}
                <span className="mx-2">|</span>
                <span className="font-medium">Longitud:</span> {data.longitud || '-'}
              </div>

              <div className="mt-4 flex justify-end items-center gap-3">
                <div className="btn-3d-container">
                  <div className="btn-3d">
                    <button type="submit" disabled={processing} className="inner-btn">
                      {processing ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

SolicitudVerificacionForm.layout = (page) => (
  <AuthenticatedLayout
    {...page.props}
    header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Solicitar verificación</h2>}
  >
    {page}
  </AuthenticatedLayout>
);