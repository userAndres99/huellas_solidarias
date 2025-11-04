import React, { useState, useEffect } from 'react';
import MapaInteractivo from './MapaInteractivo';
import FiltroCiudad from './FiltroCiudad';
import { useForm, usePage } from '@inertiajs/react';

export default function FormCasos() {
  const { data, setData, post, processing, errors } = useForm({
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
    buscarCoincidencias: false,  //check
  });

  const page = usePage();
  const user = page.props.auth?.user ?? {};

  const [mapCenter, setMapCenter] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [showMarkerOnSelect, setShowMarkerOnSelect] = useState(false);

  // Georef API base (para obtener la etiqueta formateada igual que FiltroCiudad)
  const GEOREF_BASE = 'https://apis.datos.gob.ar/georef/api/v2.0';

  // preview para la imagen
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    // limpiar objectURL al desmontar o cuando cambie previewUrl
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fotoAnimal') {
      const file = files[0] || null;
      setData(name, file);

      // generar preview y revocar el anterior si existe
      if (file) {
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
      } else {
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
      }
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
          // obtener la misma etiqueta que usamos en FiltroCiudad
          try {
            const params = new URLSearchParams({
              nombre: cityName,
              max: '5',
              campos: 'nombre,centroide,provincia,id',
              formato: 'json',
            });

            const geoRes = await fetch(`${GEOREF_BASE}/localidades?${params.toString()}`);
            if (geoRes.ok) {
              const geoJson = await geoRes.json();
              const localidades = geoJson.localidades || [];

              // Buscar la localidad más cercana si tenemos centroide
              let chosen = null;
              if (localidades.length === 1) {
                chosen = localidades[0];
              } else if (localidades.length > 1) {
                // Si hay varios preferir la que tenga centroide y si es posible la más cercana al punto
                let minDist = Infinity;
                for (const loc of localidades) {
                  const centro = loc.centroide || {};
                  if (centro.lat !== undefined && centro.lon !== undefined) {
                    const d = Math.hypot(Number(centro.lat) - Number(lat), Number(centro.lon) - Number(lon));
                    if (d < minDist) {
                      minDist = d;
                      chosen = loc;
                    }
                  }
                }
                // fallback si ninguno tenía centroide
                if (!chosen) chosen = localidades[0];
              }

              if (chosen) {
                const nombre = chosen.nombre || cityName;
                const prov = chosen.provincia?.nombre || '';
                const labelParts = [nombre];
                if (prov) labelParts.push(prov);
                const label = labelParts.join(' - ');
                setData('ciudad', label);
                setData('ciudad_id', chosen.id || '');
                return;
              }
            }
          } catch (e) {
            // si falla la consulta a georef
            console.warn('Georef lookup failed:', e);
          }

          // fallback sencillo usar lo que devolvió Nominatim (en caso de error en georef)
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
    });
  };

  const avatarUrl = user?.profile_photo_url ?? '/images/DefaultPerfil.jpg';
  const userName = user?.name ?? '';

  return (
    <form
      onSubmit={handleSubmit}
      className="relative max-w-2xl mx-auto p-6 bg-white border border-gray-100 shadow-lg rounded-2xl"
    >
      {/*foto + nombre del usuario */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/75 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover border"
        />
        <span className="hidden sm:inline text-sm font-medium text-gray-700 truncate max-w-[6.5rem] sm:max-w-[14rem]">
          <span className="align-middle">{userName}</span>
          {user?.organizacion?.nombre ? (
            <span className="text-xs text-gray-500 align-middle"> ({user.organizacion.nombre})</span>
          ) : null}
        </span>
      </div>

      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Publicar caso</h2>
        <p className="text-sm text-gray-500 mt-1">Completá los datos para publicar un animal.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preview del mensaje y Foto */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Animal</label>

          {previewUrl ? (
            <div className="mb-3 flex justify-center">
              <img
                src={previewUrl}
                alt="preview"
                className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-lg border"
              />
            </div>
          ) : (
            <div className="mb-3">
              <div className="text-xs text-gray-400">Aún no seleccionaste una imagen</div>
            </div>
          )}

          <input
            id="fotoAnimal"
            type="file"
            name="fotoAnimal"
            onChange={handleChange}
            className="hidden"
          />
          <label
            htmlFor="fotoAnimal"
            className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer text-sm text-gray-600 hover:border-blue-300 transition"
          >
            <div className="text-center">
              <div className="text-xs text-gray-400">Hacé click o arrastrá una imagen</div>
              {data.fotoAnimal ? (
                <div className="mt-2 text-sm text-gray-700 truncate">{data.fotoAnimal.name}</div>
              ) : (
                <div className="mt-2 text-sm text-gray-500">Sin archivo seleccionado</div>
              )}
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Animal</label>
          <select
            id="tipoAnimal"
            name="tipoAnimal"
            value={data.tipoAnimal}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="" disabled>Seleccioná tipo de animal</option>
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.tipoAnimal && <div className="text-red-600 text-sm mt-1">{errors.tipoAnimal}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Situación</label>
          <select
            id="situacion"
            name="situacion"
            value={data.situacion}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="" disabled>Seleccioná situación</option>
            <option value="Adopcion">Adopcion</option>
            <option value="Abandonado">Abandonado</option>
            <option value="Perdido">Perdido</option>
          </select>
          {errors.situacion && <div className="text-red-600 text-sm mt-1">{errors.situacion}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
          <select
            id="sexo"
            name="sexo"
            value={data.sexo}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="" disabled>Seleccioná sexo</option>
            <option value="Macho">Macho</option>
            <option value="Hembra">Hembra</option>
          </select>
          {errors.sexo && <div className="text-red-600 text-sm mt-1">{errors.sexo}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
          <select
            id="tamano"
            name="tamano"
            value={data.tamano}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="" disabled>Seleccioná tamaño</option>
            <option value="Chico">Chico</option>
            <option value="Mediano">Mediano</option>
            <option value="Grande">Grande</option>
          </select>
          {errors.tamano && <div className="text-red-600 text-sm mt-1">{errors.tamano}</div>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={data.descripcion}
            onChange={handleChange}
            required
            placeholder="Describa el motivo o situación de la publicación"
            className="w-full rounded-md border border-gray-300 px-3 py-2 h-32 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {errors.descripcion && <div className="text-red-600 text-sm mt-1">{errors.descripcion}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto (Opcional)</label>
          <input
            id="telefonoContacto"
            type="text"
            name="telefonoContacto"
            value={data.telefonoContacto}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Ej: +54 9 11 1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Ciudad</label>
          <div className="w-full">
            <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad Seleccionada</label>
          <input
            type="text"
            name="ciudad"
            value={data.ciudad}
            readOnly
            className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50 cursor-not-allowed"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en el mapa</label>
          <div className="h-64 w-full rounded-md overflow-hidden border border-gray-200">
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
      </div>

      {/* Checkbox específico para situación "Perdido"*/}
      {data.situacion === 'Perdido' && (
        <div className="mt-4 mb-2 flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              id="buscarCoincidencias"
              name="buscarCoincidencias"
              type="checkbox"
              checked={!!data.buscarCoincidencias}
              onChange={(e) => setData('buscarCoincidencias', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm">
            <label htmlFor="buscarCoincidencias" className="font-medium text-gray-700">
              ¿Querés que busquemos si tu mascota fue reportada en nuestra web?
            </label>
            <p className="text-xs text-gray-500">
              (Usamos IA para analizar la imagen y ver si alguien la ha reportado como abandonada.)
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Latitud:</span> {data.latitud || '-'}{' '}
          <span className="mx-2">|</span>
          <span className="font-medium">Longitud:</span> {data.longitud || '-'}
        </div>

        <button
          type="submit"
          disabled={processing}
          className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-white font-medium transition ${
            processing ? 'opacity-50 cursor-not-allowed bg-blue-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          {processing ? 'Publicando...' : 'Publicar caso'}
        </button>
      </div>
    </form>
  );
}