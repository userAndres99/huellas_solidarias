import React, { useState, useEffect } from 'react';
import MapaInteractivo from './MapaInteractivo';
import FiltroCiudad from './FiltroCiudad';
import '@/../css/components/form3D.css';
import { useForm, usePage } from '@inertiajs/react';
import { cleanPlaceName } from '@/Services/geonamesHelpers';

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

  //GeoNames
  const GEONAMES_REVERSE = 'https://secure.geonames.org/findNearbyPlaceNameJSON';
  const GEONAMES_USER = import.meta.env.VITE_GEONAMES_USER;

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

  const removePhoto = () => {
   
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setData('fotoAnimal', null);
   
    try {
      const input = document.getElementById('fotoAnimal');
      if (input) input.value = '';
    } catch (e) {
      
    }
  };

  const handleCiudadSelect = (option) => {
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
      setShowMarkerOnSelect(true);
    }
  };

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
      if (!res.ok) return;
      const json = await res.json();
      const list = json.geonames || [];
      if (!list || list.length === 0) return;

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

      if (cities.length > 0) {
        const c = cities[0];
        const nameC = cleanPlaceName(c.name || c.toponymName || '');
        const adminC = c.adminName1 || '';

        setData('ciudad', `${nameC} - ${adminC}`);
        setData('ciudad_id', c.geonameId || '');
        return;
      }

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

      const chosen = list[0];
      const name = chosen.name || chosen.toponymName || '';
      const admin = chosen.adminName1 || '';
      const displayName = cleanPlaceName(name);
      const labelParts = [displayName];
      if (admin) labelParts.push(admin);
      const label = labelParts.join(' - ');

      setData('ciudad', label);
      setData('ciudad_id', chosen.geonameId || '');
    } catch (err) {
      console.error('Error reverse geocoding (GeoNames):', err);
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
      className="relative max-w-4xl mx-auto pt-20 pb-6 px-6 border border-gray-100 shadow-lg rounded-2xl w-full"
      style={{ backgroundColor: '#16A34A' }}
    >
      
      {/*foto + nombre del usuario */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto flex items-center gap-2 bg-white/75 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preview del mensaje y Foto*/}
        <div className="col-span-1 md:col-span-2">
          <div className="card-3d-container">
            <div className="card-3d p-4">
              <label className="block text-sm font-medium text-white mb-2">Foto del Animal</label>

              {previewUrl ? (
                <div className="mb-3 flex justify-center">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-lg border"
                  />
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
                  id="fotoAnimal"
                  type="file"
                  name="fotoAnimal"
                  onChange={handleChange}
                  className="hidden"
                />
                <label htmlFor="fotoAnimal" className="flex items-center justify-center w-full">
                  <div
                    className="inline-flex flex-col items-center p-3 border-2 border-dashed rounded-lg cursor-pointer text-sm text-white hover:border-blue-300 transition w-full max-w-xs"
                    style={{ borderColor: '#16A34A', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                    </svg>
                    <div className="text-xs text-white">{data.fotoAnimal ? 'Cambiar foto' : 'hace click para subir una imagen'}</div>
                    {data.fotoAnimal ? (
                      <div className="mt-2 text-sm text-white truncate max-w-full">{data.fotoAnimal.name}</div>
                    ) : (
                      <div className="mt-2 text-sm text-white/80">Sin archivo seleccionado</div>
                    )}
                  </div>
                </label>
                {data.fotoAnimal && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-xs text-red-300 hover:text-red-400 underline"
                    >
                      Eliminar foto
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Tipo de Animal</label>
              <select
                id="tipoAnimal"
                name="tipoAnimal"
                value={data.tipoAnimal}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white"
                style={{ backgroundColor: '#15803D' }}
              >
                <option value="" disabled>Seleccioná tipo de animal</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.tipoAnimal && <div className="text-red-600 text-sm mt-1">{errors.tipoAnimal}</div>}
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Situación</label>
              <select
                id="situacion"
                name="situacion"
                value={data.situacion}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white"
                style={{ backgroundColor: '#15803D' }}
              >
                <option value="" disabled>Seleccioná situación</option>
                <option value="Adopcion">Adopcion</option>
                <option value="Abandonado">Abandonado</option>
                <option value="Perdido">Perdido</option>
              </select>
              {errors.situacion && <div className="text-red-600 text-sm mt-1">{errors.situacion}</div>}
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={data.sexo}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white"
                style={{ backgroundColor: '#15803D' }}
              >
                <option value="" disabled>Seleccioná sexo</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
              {errors.sexo && <div className="text-red-600 text-sm mt-1">{errors.sexo}</div>}
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Tamaño</label>
              <select
                id="tamano"
                name="tamano"
                value={data.tamano}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white"
                style={{ backgroundColor: '#15803D' }}
              >
                <option value="" disabled>Seleccioná tamaño</option>
                <option value="Chico">Chico</option>
                <option value="Mediano">Mediano</option>
                <option value="Grande">Grande</option>
              </select>
              {errors.tamano && <div className="text-red-600 text-sm mt-1">{errors.tamano}</div>}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={data.descripcion}
                onChange={handleChange}
                required
                placeholder="Describa el motivo o situación de la publicación"
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 h-32 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80"
                style={{ backgroundColor: '#15803D' }}
              />
              {errors.descripcion && <div className="text-red-600 text-sm mt-1">{errors.descripcion}</div>}
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Teléfono de Contacto (Opcional)</label>
              <input
                id="telefonoContacto"
                type="text"
                name="telefonoContacto"
                value={data.telefonoContacto}
                onChange={handleChange}
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80"
                style={{ backgroundColor: '#15803D' }}
                placeholder="Ej: +54 9 11 1234-5678"
              />
            </div>
          </div>
        </div>

        <div className="card-3d-container">
          <div className="card-3d p-4">
            <div className="inner w-full">
              <label className="block text-sm font-medium text-white mb-1">Buscar Ciudad</label>
              <FiltroCiudad onCiudadSelect={handleCiudadSelect} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Ciudad Seleccionada</label>
              <input
                type="text"
                name="ciudad"
                value={data.ciudad}
                readOnly
                className="w-full rounded-md border border-[#0f3a2f] px-3 py-2 bg-[#15803D] text-white cursor-not-allowed"
                style={{ borderColor: '#16A34A' }}
                required
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 card-3d-container">
          <div className="card-3d p-4">
            <div className="inner">
              <label className="block text-sm font-medium text-white mb-1">Ubicación en el mapa</label>
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
        </div>
      </div>

      {/* Checkbox específico para situación "Perdido"*/}
      {data.situacion === 'Perdido' && (
        <div className="mt-4 mb-2">
          <div className="card-3d-container">
            <div className="card-3d p-4">
              <div className="inner flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    id="buscarCoincidencias"
                    name="buscarCoincidencias"
                    type="checkbox"
                    checked={!!data.buscarCoincidencias}
                    onChange={(e) => setData('buscarCoincidencias', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-200 text-green-400 focus:ring-green-300"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="buscarCoincidencias" className="font-medium text-white">
                    ¿Querés que busquemos si tu mascota fue reportada en nuestra web?
                  </label>
                  <p className="text-xs text-white/80">
                    (Usamos IA para analizar la imagen y ver si alguien la ha reportado como abandonada.)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        <div className="mt-4 flex justify-end items-center gap-3">
        <div className="btn-3d-container">
          <div className="btn-3d">
            <button
              type="submit"
              disabled={processing}
              className="inner-btn"
            >
              {processing ? 'Publicando...' : 'Publicar caso'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}