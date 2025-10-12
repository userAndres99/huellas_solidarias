import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function Index() {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect (() =>{
    // 1. Crear un controlador para poder abordar la solicitud
    const controller = new AbortController();
    const { signal } = controller;

    // 2. Definir la función asincróica
    const obtenerCasos = async () => {
      try{
        const res = await fetch('/casos/json', {
          headers: { Accept: 'application/json'},
          signal, // 3. Asociamos el signal del controlador
        });
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        
        const data = await res.json();
        setCasos(data);
      }catch (error){
        // 4. Si el error fue por aborto, lo ignoramos
        if(error.name === 'AbortError'){
          console.log('Petición cancelada por el usuario');
        }else{
          console.error('Error al obtener los casos:', error);
          setCasos([]);
        }
      }finally{
        setLoading(false);
      }
    };

    // 5. Ejecutamos la función
    obtenerCasos(); 

    // 6. Funcion de limpieza (cleanup)
    return () =>{
      controller.abort(); // Cancela la solicitud si el componente se desmonta
    };
  },[]);

  if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-slow"></div>
    </div>
  );
}

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Publicaciones</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {casos.map(c => (
          <div key={c.id} className="bg-white shadow rounded overflow-hidden">
            <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {c.fotoAnimal ? (
                <img src={c.fotoAnimal} alt={c.tipoAnimal || 'Foto'} className="object-cover w-full h-full" loading="lazy" />
              ) : (
                <div className="text-gray-500">Sin imagen</div>
              )}
            </div>

            <div className="p-3">
              <div className="text-sm text-gray-500 mb-1">{c.tipoAnimal || 'No especificado'}</div>
              <div className="font-medium line-clamp-2 mb-2">{c.descripcion}</div>
              <div className="text-sm text-gray-600 mb-2">{c.ciudad} · {c.situacion}</div>

              <div className="flex items-center justify-between">
                <Link href={`/casos/${c.id}`} className="text-blue-600">Ver detalle</Link>
                {c.latitud && c.longitud && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}#map=16/${c.latitud}/${c.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-gray-600"
                  >
                    Ver mapa
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}