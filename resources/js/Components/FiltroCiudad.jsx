import React, { useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { cleanPlaceName } from '@/Services/geonamesHelpers';

// Usar GeoNames (https://www.geonames.org/export/web-services.html)
const GEONAMES_URL = 'https://secure.geonames.org/searchJSON';
const GEONAMES_USER = import.meta.env.VITE_GEONAMES_USER;
const CITY_FCODES = new Set([
  'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLL', 'PPLR', 'PPLS',
]);

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

    // fetch a GeoNames 
    const fetchFor = async (q) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // Forzar resultados solo en Argentina (country=AR)
      const params = new URLSearchParams({
        q: q,
        maxRows: '20',
        username: GEONAMES_USER,
        lang: 'es',
        featureClass: 'P', 
        country: 'AR',
      });

      const res = await fetch(`${GEONAMES_URL}?${params.toString()}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) return { error: res.status };
      const data = await res.json();
      return data.geonames || [];
    };

    const fetchByNameEquals = async (name) => {
      if (!name) return [];
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const params = new URLSearchParams({
        name_equals: name,
        maxRows: '20',
        username: GEONAMES_USER,
        lang: 'es',
        featureClass: 'P',
        country: 'AR',
      });

      const res = await fetch(`${GEONAMES_URL}?${params.toString()}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) return { error: res.status };
      const data = await res.json();
      return data.geonames || [];
    };

    // función que intenta búsqueda por prefijo 
    const fetchByNameStartsWith = async (prefix) => {
      if (!prefix) return [];
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const params = new URLSearchParams({
        name_startsWith: prefix,
        maxRows: '20',
        username: GEONAMES_USER,
        lang: 'es',
        featureClass: 'P',
        country: 'AR',
      });

      const res = await fetch(`${GEONAMES_URL}?${params.toString()}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) return { error: res.status };
      const data = await res.json();
      return data.geonames || [];
    };

    try {
      // Intentar primero búsqueda exacta por nombre
      let lista = await fetchByNameEquals(qRaw);
      // si no hay resultados, intentar con la versión normalizada 
      if (!lista || lista.length === 0) {
        lista = await fetchByNameEquals(qNorm);
      }

      if (!lista || lista.length === 0) {
        lista = await fetchFor(qRaw);
      }

      if (!lista || lista.length === 0) {
        lista = await fetchFor(qNorm);
      }

      // Si aún no hay resultados generales, intentar búsqueda por prefijo
      if (!lista || lista.length === 0) {
        lista = await fetchByNameStartsWith(qRaw);
      }
      if (!lista || lista.length === 0) {
        lista = await fetchByNameStartsWith(qNorm);
      }

      // FILTRAR: mantener principalmente ciudades.
      const MIN_POPULATION = 1000;
      lista = (lista || []).filter((g) => {
        const fcode = (g.fcode || g.featureCode || '').toString();
        const population = g.population ? Number(g.population) : 0;
        return CITY_FCODES.has(fcode) || population >= MIN_POPULATION;
      });

      const normalize = (s) =>
        (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      // elimina duplicados exactos
      const byKey = new Map();
      for (const g of lista) {
        const name = g.name || '';
        const displayName = cleanPlaceName(name);
        const admin = g.adminName1 || '';
        const admin2 = g.adminName2 || '';
        const country = g.countryName || '';
        const lat = g.lat !== undefined ? parseFloat(g.lat) : null;
        const lon = g.lng !== undefined ? parseFloat(g.lng) : null;

        const latR = lat !== null && !Number.isNaN(lat) ? lat.toFixed(4) : '';
        const lonR = lon !== null && !Number.isNaN(lon) ? lon.toFixed(4) : '';
        const key = `${normalize(name)}::${normalize(admin)}::${latR}::${lonR}`;

        if (byKey.has(key)) continue;

        const labelParts = [displayName];
        if (admin) labelParts.push(admin);
        let label = labelParts.join(' - ');

        byKey.set(key, {
          id: g.geonameId || `${name}-${admin}-${latR}-${lonR}`,
          nombre: name,
          provincia: admin,
          admin2: admin2,
          population: g.population ? Number(g.population) : 0,
          centroide: lat !== null && lon !== null ? { lat, lon } : null,
          fcode: (g.fcode || g.featureCode || '').toString(),
          label,
        });
      }

      let processed = Array.from(byKey.values());

      // para evitar mostrar barrios/sectores pequeños por separado. (si es un barrio muy alejado de cualquier sitio grande se conserva)
      const MIN_POPULATION_GROUP = 1000;
      const labelMap = new Map(); 
        const normalizeLabel = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      for (const item of processed) {
        const pop = item.population || 0;
        const admin2Name = item.admin2 || '';

        if (pop < MIN_POPULATION_GROUP && admin2Name) {
          const newLabel = `${admin2Name}${item.provincia ? ' - ' + item.provincia : ''}`;
          const keyLabel = normalizeLabel(newLabel);
          if (!labelMap.has(keyLabel)) {
            labelMap.set(keyLabel, { value: `admin2:${admin2Name}:${item.provincia}`, label: newLabel, centroide: item.centroide || null });
          }
        } else {
          const keyLabel = normalizeLabel(item.label || item.nombre || '');
          if (!labelMap.has(keyLabel)) {
            labelMap.set(keyLabel, { value: item.id, label: item.label, centroide: item.centroide || null });
          }
        }
      }

      processed = Array.from(labelMap.values()).map((it) => ({ id: it.value, nombre: it.label, provincia: '', centroide: it.centroide, label: it.label }));

      // Si hay coincidencias exactas por nombre
      const qNameNorm = normalize(qRaw || qNorm || '');
      const exactMatches = processed.filter((p) => normalize(p.nombre) === qNameNorm);
      if (exactMatches.length > 0) {
        processed = exactMatches;
      }

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

  // cuando el usuario selecciona una opción: pasar la opción completa al callback
  const handleChange = (option) => {
    if (!option) {
      onCiudadSelect && onCiudadSelect(null);
      return;
    }
    onCiudadSelect && onCiudadSelect(option);
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