import React, { useMemo, useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import debounce from 'lodash.debounce';

const opcionesTipo = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Perro', label: 'Perro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Otro', label: 'Otro' },
];

const opcionesSituacion = [
  { value: '', label: 'Todas las situaciones' },
  { value: 'Perdido', label: 'Perdido' },
  { value: 'Abandonado', label: 'Abandonado' },
  { value: 'Adopcion', label: 'Adopcion' },
];

const opcionesOrden = [
  { value: 'reciente', label: 'Más reciente'},
  { value: 'antigua', label: 'Fecha más antigua'}
];

const opcionesSexo  = [
  { value: '', label: 'Cualquier sexo'},
  { value: 'Macho', label: 'Macho'},
  { value: 'Hembra', label: 'Hembra'}
];

const opcionesTamanio = [
  { value: '', label: 'Cualquier tamaño'},
  { value: 'Chico', label: 'Chico'},
  { value: 'Mediano', label: 'Mediano'},
  { value: 'Grande', label: 'Grande'}
];

export default function FiltroGeneral({ filtros, setFiltros }) {
  const [query, setQuery] = useState(filtros.ciudad || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const [local, setLocal] = useState({
    tipo: filtros.tipo || '',
    situacion: filtros.situacion || '',
    ordenFecha: filtros.ordenFecha || '',
    sexo: filtros.sexo || '',
    tamanio: filtros.tamanio || '',
    ciudad: filtros.ciudad || '',
  });
  const [ordenTouched, setOrdenTouched] = useState(false);

  useEffect(() => {
    
    setLocal({
      tipo: filtros.tipo || '',
      situacion: filtros.situacion || '',
      ordenFecha: filtros.ordenFecha || '',
      sexo: filtros.sexo || '',
      tamanio: filtros.tamanio || '',
      ciudad: filtros.ciudad || '',
    });
    setQuery(filtros.ciudad || '');
    setOrdenTouched(false);
  }, [filtros]);

  const fetchSuggestions = useMemo(() => debounce(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const url = `/ciudades?q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      setSuggestions(data.data || []);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 250), []);

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function onDoc(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowList(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleSelectCity = (e, city) => {
    
    if (e && e.stopPropagation) e.stopPropagation();
    setQuery(city);
    setShowList(false);
    setLocal(prev => ({ ...prev, ciudad: city }));
  };

  const handleClearCity = () => {
    setQuery('');
    setSuggestions([]);
    setLocal(prev => ({ ...prev, ciudad: '' }));
  };

  const handleCiudadChange = (value) => {
    setQuery(value);
    setShowList(true);
    if (value && value.length >= 2) {
      
      setIsLoading(true);
      setSuggestions([]);
    } else {
      setIsLoading(false);
      setSuggestions([]);
    }
    setLocal(prev => ({ ...prev, ciudad: value }));
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-end">
      <div className="w-48">
        <Select
          options={opcionesTipo}
          placeholder="Tipo"
          value={local.tipo ? opcionesTipo.find(o => o.value === local.tipo) : null}
          onChange={option => setLocal(prev => ({ ...prev, tipo: option.value }))}
        />
      </div>

      <div className="w-48">
        <Select
          options={opcionesSituacion}
          placeholder="Situación"
          value={local.situacion ? opcionesSituacion.find(o => o.value === local.situacion) : null}
          onChange={option => setLocal(prev => ({ ...prev, situacion: option.value }))}
        />
      </div>

        <div className='w-48'>
        <Select
          options={opcionesOrden}
          placeholder="Fecha"
          value={ordenTouched && local.ordenFecha ? opcionesOrden.find(o => o.value === local.ordenFecha) : null}
          onChange={option => { setLocal(prev => ({...prev, ordenFecha: option.value})); setOrdenTouched(true); }}
        />
      </div>

      <div className='w-48'>
        <Select
          options={opcionesSexo}
          placeholder="Sexo"
          value={local.sexo ? opcionesSexo.find(o => o.value === local.sexo) : null}
          onChange={option => setLocal(prev => ({ ...prev, sexo: option.value}))}
        />
      </div>

      <div className='w-48'>
        <Select
          options={opcionesTamanio}
          placeholder="Tamaño"
          value={local.tamanio ? opcionesTamanio.find(o => o.value === local.tamanio) : null}
          onChange={option => setLocal(prev => ({ ...prev, tamanio: option.value}))}
        />
      </div>

      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          placeholder="Buscar ciudad"
          value={query}
          onChange={e => handleCiudadChange(e.target.value)}
          onFocus={() => setShowList(true)}
          className="border p-2 rounded w-48" 
        />
        {local.ciudad ? (
          <button type="button" onClick={handleClearCity} className="absolute right-1 top-1 text-xs text-slate-500">x</button>
        ) : null}

        {showList && (
          <ul className="absolute z-50 mt-1 bg-white border rounded w-48 max-h-48 overflow-auto text-sm">
            {isLoading ? (
              <li className="px-3 py-2 text-slate-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Buscando...
              </li>
            ) : (suggestions && suggestions.length > 0 ? (
              suggestions.map((s, idx) => (
                <li key={idx} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={(ev) => handleSelectCity(ev, s)}>{s}</li>
              ))
            ) : (
              <li className="px-3 py-2 text-slate-500">{(query && query.length >= 2) ? 'Ciudad no registrada en la web' : 'Escribí al menos 2 caracteres para buscar'}</li>
            ))}
          </ul>
        )}
      </div>

        <div className="flex items-center gap-2 ml-2">
        <button type="button" onClick={() => setFiltros(local)} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar filtros</button>
        <button type="button" onClick={() => { setLocal({ tipo: '', situacion: '', ordenFecha: '', sexo: '', tamanio: '', ciudad: '' }); setQuery(''); setSuggestions([]); setOrdenTouched(false); }} className="px-3 py-1 border border-black rounded">Limpiar</button>
      </div>
    </div>
  );
}
