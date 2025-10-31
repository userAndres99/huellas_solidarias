import React, { useRef } from 'react';
import AsyncSelect from 'react-select/async';

// API de localidades del gobierno
const BASE_URL = 'https://apis.datos.gob.ar/georef/api/v2.0';

/**
 * FiltroCiudad
 * - Usa AsyncSelect (react-select) para buscar ciudades.
 */
export default function FiltroCiudad({ onCiudadSelect, placeholder = 'Buscar ciudad...' }) {
  const cacheRef = useRef(new Map()); // cache simple por query
  const abortRef = useRef(null); // para abortar fetchs anteriores

  // Carga de opciones para AsyncSelect
  const loadOptions = async (inputValue) => {
    // mínimo 3 caracteres para buscar
    if (!inputValue || inputValue.trim().length < 3) return [];

    // debounce para no spammear la API
    await new Promise((res) => setTimeout(res, 250));

    // normaliza la query 
    const normalizeQuery = (s) =>
      (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const qRaw = (inputValue || '').toString().trim();
    const qNorm = normalizeQuery(inputValue);

    // usa cache si existe
    const cache = cacheRef.current;
    if (cache.has(qRaw)) return cache.get(qRaw);
    if (cache.has(qNorm)) return cache.get(qNorm);

    // función que hace fetch a la API
    const fetchFor = async (q) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const params = new URLSearchParams({
        nombre: q,
        max: '20',
        campos: 'nombre,centroide,provincia',
        formato: 'json',
      });

      const res = await fetch(`${BASE_URL}/localidades?${params.toString()}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) return { error: res.status };
      const data = await res.json();
      return data.localidades || [];
    };

    try {
      let lista = await fetchFor(qRaw);

      // si no hay resultados, pruebo con la versión normalizada
      if (!lista || lista.length === 0) {
        lista = await fetchFor(qNorm);
      }

      // función de normalización para claves internas (minusculas, sin tildes)
      const normalize = (s) =>
        (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      const getType = (loc) =>
        loc.categoria || loc.tipo || loc.clase || loc.jurisdiccion || loc.tipo_localidad || null;

      // elimina duplicados exactos 
      const byKey = new Map();
      for (const loc of lista) {
        const name = loc.nombre || '';
        const prov = loc.provincia?.nombre || '';
        const lat = loc.centroide?.lat !== undefined ? parseFloat(loc.centroide.lat) : null;
        const lon = loc.centroide?.lon !== undefined ? parseFloat(loc.centroide.lon) : null;

        const latR = lat !== null && !Number.isNaN(lat) ? lat.toFixed(4) : '';
        const lonR = lon !== null && !Number.isNaN(lon) ? lon.toFixed(4) : '';
        const key = `${normalize(name)}::${normalize(prov)}::${latR}::${lonR}`;

        if (byKey.has(key)) continue;

        const tipo = getType(loc);
        const labelParts = [loc.nombre];
        if (prov) labelParts.push(prov);
        let label = labelParts.join(' - ');
        if (tipo) label = `${label} (${tipo})`;

        byKey.set(key, {
          id: loc.id || `${name}-${prov}-${latR}-${lonR}`,
          nombre: loc.nombre,
          provincia: prov,
          centroide: loc.centroide,
          label,
        });
      }

      const processed = Array.from(byKey.values());

      // función que calcula distancia en metros
      const distanceMeters = (a, b) => {
        const lat1 = Number(a.lat);
        const lon1 = Number(a.lon);
        const lat2 = Number(b.lat);
        const lon2 = Number(b.lon);
        const R = 6371000;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const aHarv =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
        return R * c;
      };

      // agrupa entradas muy cercanas (1 km)
      const final = [];
      const MERGE_THRESHOLD_METERS = 1000;
      for (const item of processed) {
        const centro = item.centroide || {};
        const lat = centro.lat !== undefined ? Number(centro.lat) : null;
        const lon = centro.lon !== undefined ? Number(centro.lon) : null;

        if (lat === null || lon === null) {
          final.push(item);
          continue;
        }

        let merged = false;
        for (let k = 0; k < final.length; k++) {
          const existing = final[k];
          const exCentro = existing.centroide || {};
          const exLat = exCentro.lat !== undefined ? Number(exCentro.lat) : null;
          const exLon = exCentro.lon !== undefined ? Number(exCentro.lon) : null;
          if (exLat === null || exLon === null) continue;

          const dist = distanceMeters({ lat, lon }, { lat: exLat, lon: exLon });
          if (dist <= MERGE_THRESHOLD_METERS) {
            // si están muy cerca, conservar la entrada "mejor"
            const keep =
              existing.id && item.id
                ? String(existing.id).length <= String(item.id).length
                  ? existing
                  : item
                : existing;
            if (keep !== existing) final[k] = item;
            merged = true;
            break;
          }
        }

        if (!merged) final.push(item);
      }

      // convertir al formato que espera react-select
      const options = final.map((loc) => ({
        value: loc.id,
        label: loc.label || loc.nombre,
        data: { centroide: loc.centroide },
      }));

      // guardar en cache y devolver
      cache.set(qRaw, options);
      cache.set(qNorm, options);
      return options;
    } catch (err) {
      // si algo falla, devolver lista vacía 
      return [];
    }
  };

  // cuando el usuario selecciona una opción
  const handleChange = (option) => {
    if (!option) {
      onCiudadSelect && onCiudadSelect(null);
      return;
    }
    const centroide = option.data?.centroide;
    if (centroide && typeof centroide.lat === 'number' && typeof centroide.lon === 'number') {
      onCiudadSelect && onCiudadSelect([centroide.lat, centroide.lon]);
    } else {
      onCiudadSelect && onCiudadSelect(null);
    }
  };

  // estilos simples para react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.375rem',
      borderColor: state.isFocused ? '#6366f1' : provided.borderColor,
      boxShadow: state.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : provided.boxShadow,
      minHeight: '40px',
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
  };

  return (
    <div className="relative w-full max-w-xl mx-auto px-4">
      <AsyncSelect
        cacheOptions
        defaultOptions={false}
        loadOptions={loadOptions}
        onChange={handleChange}
        placeholder={placeholder}
        styles={selectStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        isClearable
      />
    </div>
  );
}