import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

import FiltroCiudad from '@/Components/FiltroCiudad'; 
import MapaInteractivo from '@/Components/MapaInteractivo'; 
// GeoNames 
const GEONAMES_REVERSE = 'https://secure.geonames.org/findNearbyPlaceNameJSON';
const GEONAMES_USER = import.meta.env.VITE_GEONAMES_USER;
import { cleanPlaceName } from '@/Services/geonamesHelpers';

export default function SolicitudVerificacionForm() {
  const page = usePage();
  const user = page.props.auth?.user ?? null;
  const { flash, existingPending, lastSolicitud } = page.props;

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

  const [previewUrl, setPreviewUrl] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [showMarker, setShowMarker] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setData('documents', files);

    if (files[0]) {
      if (files[0].type.startsWith('image/')) {
        const obj = URL.createObjectURL(files[0]);
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return obj;
        });
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCiudadSelect = async (option) => {
    if (!option) return;
    const centroide = option.data?.centroide;
    const lat = centroide?.lat ?? null;
    const lon = centroide?.lon ?? null;

    if (lat !== null && lon !== null) {
      // usar la etiqueta y id que vienen en la opción para evitar reverse-geocoding
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
        setPreviewUrl(null);
        setShowMarker(false);
        setInitialPosition(null);
        setMapCenter(null);
      },
    });
  };

  return (
    <>
      <Head title="Solicitar verificación" />

      <div className="max-w-3xl mx-auto p-6 card-surface">
        {/* Mensajes flash */}
        {flash?.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">{flash.success}</div>
        )}
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
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded">
            <h2 className="font-semibold">Solicitud pendiente</h2>
            <p className="text-sm text-gray-700 mt-2">Usted ya envió una solicitud. Espere la respuesta del equipo para volver a intentarlo.</p>
            {lastSolicitud && (
              <p className="text-xs text-gray-500 mt-2">Enviada: {new Date(lastSolicitud.created_at).toLocaleString()} · Estado: {lastSolicitud.status}</p>
            )}
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


            <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
              <div>
                <InputLabel htmlFor="organization_name" value="Nombre de la organización (opcional)" />
                <input
                  id="organization_name"
                  type="text"
                  value={data.organization_name}
                  onChange={(e) => setData('organization_name', e.target.value)}
                  className="mt-1 block w-full rounded border-gray-300"
                  placeholder="Nombre de la organización"
                />
                <InputError message={errors.organization_name} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="organization_phone" value="Teléfono de la organización (opcional)" />
                <input
                  id="organization_phone"
                  type="text"
                  value={data.organization_phone}
                  onChange={(e) => setData('organization_phone', e.target.value)}
                  className="mt-1 block w-full rounded border-gray-300"
                  placeholder="+54 9 11 1234 5678"
                />
                <InputError message={errors.organization_phone} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="organization_email" value="Correo de la organización (opcional)" />
                <input
                  id="organization_email"
                  type="email"
                  value={data.organization_email}
                  onChange={(e) => setData('organization_email', e.target.value)}
                  className="mt-1 block w-full rounded border-gray-300"
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
                  className="mt-1 block w-full rounded border-gray-300"
                  placeholder="Alguna aclaración sobre la representación..."
                />
                <InputError message={errors.message} className="mt-1" />
              </div>

              <div>
                <InputLabel htmlFor="documents" value="Documentación (PDF) - opcional" />
                {previewUrl && (
                  <div className="mb-2">
                    <img src={previewUrl} alt="preview" className="w-32 h-32 object-cover rounded" />
                  </div>
                )}
                <input
                  id="documents"
                  name="documents[]"
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={onFilesChange}
                  className="mt-1 block w-full"
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
                  className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* seleccionar ubicacion */}
              <div>
                <InputLabel value="Marcar ubicación en el mapa (opcional)" />
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
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Latitud:</span> {data.latitud || '-'}{' '}
                <span className="mx-2">|</span>
                <span className="font-medium">Longitud:</span> {data.longitud || '-'}
              </div>

              <div className="pt-4">
                <PrimaryButton disabled={processing}>
                  {processing ? 'Enviando...' : 'Enviar solicitud'}
                </PrimaryButton>
              </div>
            </form>
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