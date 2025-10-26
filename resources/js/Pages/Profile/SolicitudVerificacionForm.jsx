import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

import FiltroCiudad from '@/Components/FiltroCiudad'; // tu componente existente
import MapaInteractivo from '@/Components/MapaInteractivo'; // tu componente existente

export default function SolicitudVerificacionForm() {
  const page = usePage();
  const user = page.props.auth?.user ?? null;

  // añadimos ciudad/ciudad_id/latitud/longitud al formulario
  const { data, setData, post, processing, errors, reset } = useForm({
    organization_name: '',
    organization_phone: '',
    organization_email: '',
    message: '',
    documents: [],
    // ubicacion
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

  // Maneja la selección desde tu FiltroCiudad (devuelve [lat, lon])
  const handleCiudadSelect = async (value) => {
    if (!value || !Array.isArray(value)) return;
    const [lat, lon] = value.map(Number);

    setData('ciudad', '');      // opcional: usamos reverse-geocode para nombre
    setData('ciudad_id', '');
    setData('latitud', lat);
    setData('longitud', lon);

    // centrar y mostrar marcador
    setMapCenter([lat, lon]);
    setInitialPosition([lat, lon]);
    setShowMarker(true);

    // intentar obtener nombre de ciudad por reverse-geocode
    await reverseGeocodeAndSetCity(lat, lon);
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

  // Reverse geocoding con Nominatim para obtener nombre de ciudad
  const reverseGeocodeAndSetCity = async (lat, lon) => {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&accept-language=es`;

      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'HuellasSolidarias/1.0 (contacto@example.com)' },
      });

      if (!response.ok) {
        console.warn('Nominatim no respondió OK', response.status);
        return;
      }

      const result = await response.json();
      const addr = result.address || {};
      const cityName =
        addr.city || addr.town || addr.village || addr.municipality || addr.county || '';

      if (cityName) {
        setData('ciudad', cityName);
        setData('ciudad_id', result.place_id || ''); // opcional
      }
    } catch (err) {
      console.error('Error en reverse geocode:', err);
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

  if (!user) {
    return (
      <div className="p-6">
        <p>No estás autenticado.</p>
      </div>
    );
  }

  if (user.role_name !== 'Usuario') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Acceso no permitido</h1>
        <p className="mt-2 text-sm text-gray-700">Esta página está disponible solamente para usuarios.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head title="Solicitar verificación" />
      <h1 className="text-2xl font-semibold mb-4">Solicitar verificación como representante</h1>

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

        {/* Buscar ciudad (tu componente existente) */}
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

        {/* MAPA para seleccionar ubicación */}
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
    </div>
  );
}