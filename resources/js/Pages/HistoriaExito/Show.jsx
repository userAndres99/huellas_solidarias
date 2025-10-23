import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import Comentarios from "@/Components/Comentarios";




function Show ({initialId}){   
    const id = initialId || window.location.pathname.split('/').pop();
    const [historia , setHistoria] = useState(undefined);
    const [loading, setLoading] = useState(true);




    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchHistoria = async() => {

            try{
                const res = await fetch(`/historias/json/${id}`,{
                    headers: { Accept: "application/json"},
                    signal,
                });

                if(!res.ok) throw new Error('Not fount');


                const data = await res.json();
                setHistoria(data);
            }catch(error){
                if(error.name !== 'AbortError'){
                    console.log('Error al obtener historia: ', error);
                    setHistoria(null);
                }
            }finally{
                setLoading(false);
            }


        };

        fetchHistoria();

        return() => controller.abort();
    }, [id]);



    if(loading){
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-low"></div>
                <p className="mt-2 text-gray-600">Cargando Historia...</p>
            </div>
        )
    }


    if(historia === null){
        return(
            <div className="flex items-center justify-center h-64 text-red-600">
                No se pudo cargar la historia o no existe
            </div>
        )
    }



    return (
        <>
             <Head title={`Historia: ${historia.titulo || "Animal"}`} />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link
                    href="/historias"
                    className="text-blue-600 font-medium hover:underline mb-6 inline-block"
                >
                    ← Volver a Historias
                </Link>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    {/* Imagenes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {historia.imagen_antes ? (
                            <img
                                src={historia.imagen_antes}
                                className="w-full h-80 md:h-96 object-cover rounded-tl-xl rounded-tr-xl md:rounded-tr-none md:rounded-bl-xl"
                                alt="Antes"
                            />
                        ) : (
                            <div className="w-full h-80 md:h-96 bg-gray-100 flex items-center justify-center text-gray-500 rounded-tl-xl rounded-tr-xl md:rounded-tr-none md:rounded-bl-xl">
                                Sin Imagen
                            </div>
                        )}

                        {historia.imagen_despues ? (
                            <img
                                src={historia.imagen_despues}
                                className="w-full h-80 md:h-96 object-cover rounded-bl-xl rounded-br-xl md:rounded-bl-none md:rounded-tr-xl"
                                alt="Después"
                            />
                        ) : (
                            <div className="w-full h-80 md:h-96 bg-gray-100 flex items-center justify-center text-gray-500 rounded-bl-xl rounded-br-xl md:rounded-bl-none md:rounded-tr-xl">
                                Sin Imagen
                            </div>
                        )}
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-3 text-gray-800">
                            {historia.titulo || "Animal"}
                        </h2>
                        <p className="text-gray-700 mb-4">{historia.descripcion}</p>
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">
                            {historia.testimonio}
                        </blockquote>
                    </div>
                </div>


                {/* SECCIÓN DE COMENTARIOS */}
            {historia && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Comentarios</h3>
                    <Comentarios
                        comentableType="App\\Models\\Historia"
                        comentableId={historia.id}
                    />
                </div>
            )}
            </div>
        
        </>
    )



}



Show.layout = (page) => {
    return (
        <AuthenticatedLayout
            user = {page.props.auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Profile</h2>}
            children={page}
        ></AuthenticatedLayout>
    )
}


export default Show;