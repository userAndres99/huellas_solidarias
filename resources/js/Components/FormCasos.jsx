import React, { useState, useEffect, useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import MapaInteractivo from './MapaInteractivo';
import FiltroCiudad from './FiltroCiudad';

export default function FormCasos() {
  const { props } = usePage();
  const user = props?.auth?.user ?? null;
  const defaultAvatar = '/images/DefaultPerfil.jpg';

  const { data, setData, post, processing, errors, reset } = useForm({
    fotoAnimal: null,
    tipoAnimal: '',
    descripcion: '',
    situacion: '',
    sexo: '',
    tamano: '',
    ciudad: '',
    ciudad_id: '',
    latitud: '',
    longitud: '',
    telefonoContacto: '',
  });

  const [mapCenter, setMapCenter] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [showMarkerOnSelect, setShowMarkerOnSelect] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (file) => {
    setData('fotoAnimal', file || null);
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoAnimal') {
      handleFileChange(files?.[0] ?? null);
    } else {
      setData(name, value);
    }
  };

  const handleCiudadSelect = (value) => {
    if (!value || !Array.isArray(value)) return;
    const [lat, lon] = value.map(Number);
    setData('ciudad', '');
    setData('ciudad_id', '');
    setData('latitud', lat);
    setData('longitud', lon);

    setMapCenter([lat, lon]);
    setInitialPosition([lat, lon]);
    setShowMarkerOnSelect(true);
  };

  const reverseGeocodeAndSetCity = async (lat, lon) => {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&accept-language=es`;

      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'HuellasSolidarias/1.0 (contacto@example.com)' },
      });
      if (response.ok) {
        const result = await response.json();
        const addr = result.address || {};
        const cityName =
          addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        if (cityName) {
          setData('ciudad', cityName);
          setData('ciudad_id', '');
        }
      } else {
        console.warn('Nominatim non-OK', response.status);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  };

  const handleLocationSelect = async ([lat, lng]) => {
    setData('latitud', lat);
    setData('longitud', lng);
    await reverseGeocodeAndSetCity(lat, lng);
    setMapCenter([lat, lng]);
    setInitialPosition([lat, lng]);
    setShowMarkerOnSelect(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/casos', {
      forceFormData: true,
      onError: () => {
        // opcional: dejar focus en primer error
        const firstKey = Object.keys(errors || {})[0];
        console.warn('Errores de validación', errors);
      },
      onSuccess: () => {
        // limpiar preview y form si querés
        if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        setPreview(null);
        reset('fotoAnimal', 'descripcion', 'telefonoContacto', 'ciudad', 'latitud', 'longitud', 'tipoAnimal', 'situacion', 'sexo', 'tamano', 'ciudad_id');
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* titulo + user */}
        <div className="px-6 py-4 flex items-center justify-between border-b">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Publicar caso</h1>
            <p className="text-sm text-gray-500">Completa los datos para publicar el caso del animal.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Publica como</div>
              <div className="font-medium text-gray-800">{user?.name ?? 'Usuario'}</div>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden border">
              <img
                src={user?.profile_photo_url ?? defaultAvatar}
                alt={user?.name ?? 'Avatar'}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* grid form + mapa/preview */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
          {/*formulario */}
          <div className="space-y-4">
            {/* Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto del animal</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-dashed border-2 border-gray-200 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-gray-300 transition"
                aria-hidden
              >
                <div className="w-24 h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 7l4-4 4 4 6-6 4 4" />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{data.fotoAnimal ? data.fotoAnimal.name : 'Hacé click o arrastrá una imagen'}</div>
                  <div className="text-xs text-gray-500 mt-1">Formato PNG/JPEG — Máx 10 MB. Usaremos la versión sin fondo internamente para comparación.</div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  name="fotoAnimal"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
              {errors.fotoAnimal && <p className="mt-2 text-sm text-red-600">{errors.fotoAnimal}</p>}
            </div>

            {/* Tipo / Situación*/}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de animal</label>
                <select
                  name="tipoAnimal"
                  value={data.tipoAnimal}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Seleccioná tipo</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.tipoAnimal && <p className="mt-1 text-sm text-red-600">{errors.tipoAnimal}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Situación</label>
                <select
                  name="situacion"
                  value={data.situacion}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Seleccioná situación</option>
                  <option value="Adopcion">Adopcion</option>
                  <option value="Abandonado">Abandonado</option>
                  <option value="Perdido">Perdido</option>
                </select>
                {errors.situacion && <p className="mt-1 text-sm text-red-600">{errors.situacion}</p>}
              </div>
            </div>

            {/* Sexo / Tamaño */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <select
                  name="sexo"
                  value={data.sexo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Seleccioná sexo</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                {errors.sexo && <p className="mt-1 text-sm text-red-600">{errors.sexo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                <select
                  name="tamano"
                  value={data.tamano}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Seleccioná tamaño</option>
                  <option value="Chico">Chico</option>
                  <option value="Mediano">Mediano</option>
                  <option value="Grande">Grande</option>
                </select>
                {errors.tamano && <p className="mt-1 text-sm text-red-600">{errors.tamano}</p>}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={data.descripcion}
                onChange={handleChange}
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 resize-none p-2"
                required
              />
              {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
              <input
                type="text"
                name="telefonoContacto"
                value={data.telefonoContacto}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200 p-2"
                placeholder="Ej: 1123456789"
              />
              {errors.telefonoContacto && <p className="mt-1 text-sm text-red-600">{errors.telefonoContacto}</p>}
            </div>

            {/* Ciudad + Buscador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar ciudad</label>
              <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
              <div className="mt-2">
                <input
                  type="text"
                  name="ciudad"
                  value={data.ciudad}
                  readOnly
                  className="w-full rounded-md border-gray-200 bg-gray-50 p-2 text-sm"
                  placeholder="Ciudad seleccionada"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitud</label>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2">{data.latitud ?? '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitud</label>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2">{data.longitud ?? '-'}</div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Publicando...
                  </>
                ) : (
                  'Publicar caso'
                )}
              </button>
            </div>
          </div>

          {/*mapa + preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md border border-gray-100 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa</h3>
              <div className="w-full h-56 bg-white rounded overflow-hidden flex items-center justify-center border">
                {preview ? (
                  <img src={preview} alt="Preview" className="object-contain w-full h-full" />
                ) : (
                  <div className="text-sm text-gray-400">Aquí se mostrará la foto que subas</div>
                )}
              </div>

              {data.tipoAnimal || data.descripcion ? (
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700">{data.tipoAnimal || 'Animal'}</div>
                  <div className="text-sm text-gray-500 line-clamp-3">{data.descripcion || 'Sin descripción aún'}</div>
                  <div className="text-xs text-gray-400 mt-2">{data.ciudad || 'Ciudad'}</div>
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-md border border-gray-100 p-2 h-80">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Ubicación en el mapa</h3>
              <MapaInteractivo
                onLocationSelect={handleLocationSelect}
                tipoAnimal={data.tipoAnimal}
                showMarkers={false}
                center={mapCenter}
                initialPosition={initialPosition}
                marker={showMarkerOnSelect}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}