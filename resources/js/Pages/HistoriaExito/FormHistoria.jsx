import React, { useState } from 'react';
import { useForm, usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function  FormHistoria() {
    const [previewAntes, setPreviewAntes] = useState(null);
    const [previewDespues, setPreviewDespues] = useState(null);


    const { data, setData, post, processing, errors, reset, recentlySuccessful} = 
    useForm({
        antes: null,
        despues: null,
        titulo: '',
        descripcion: '',
        testimonio: '',
    });



    const handleImageChange = (e, tipo) => {
        const file = e. target.files[0];
        if(file){
            setData(tipo, file);
            const preview = URL.createObjectURL(file);
            if(tipo === 'antes') setPreviewAntes(preview);
            else setPreviewDespues(preview);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(data);
        post(route('historias.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreviewAntes(null);
                setPreviewDespues(null);
            },
        });
    };






    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Nueva Historia</h2>}>
            <Head title="Publicar Historia" />

            <div className='max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow'>
                {recentlySuccessful && (
                    <div className = "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex-items-center">
                        <span className='text-2xl mr-2'>🐾</span>
                        <span>
                            <strong>¡Historia subida con éxito!</strong> Gracias por compartir esperanza 💚
                        </span>
                    </div>
                )}

                <h2 className='text-2xl font-semibold mb-4 text-center'>
                    Historias de Éxito
                </h2>

                <form 
                    onSubmit={handleSubmit}
                    className='space-y-4'
                    encType='multipart/form-data'
                >

            <div className='grid grid-cols-2 gap-4 text-center'>
                <div>
                    <h3 className='font-medium mb-2'>Antes</h3>
                    <label className='cursor-pointer block'>
                        {previewAntes ?(
                            <img
                                src={previewAntes}
                                alt='Antes'
                                className='w-full h-48 object-cover rounded-lg shadow'
                            />
                        ):(
                            <div className='border-2 border-dashed p-6 rounded-lg text-gray-500'>
                                Subir imagen
                            </div>
                        )}
                        <input 
                        type="file"
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => handleImageChange(e, "antes")}
                        />
                    </label>
                    {errors.antes && (
                        <p className='text-sm text-red-500 mt-1'>{errors.antes}</p>
                    )}
                </div>

                <div>
                    <h3 className='font-medium mb-2'>Después</h3>
                    <label className='cursor-pointer block'>
                        {previewDespues ?(
                        <img
                        src={previewDespues}
                        alt='Después'
                        className='w-full h-48 object-cover rounded-lg shadow'
                        />
                        ): (
                            <div className='border-2 border-dashed p-6 rounded-lg text-gray-500'>
                                Subir Imagen
                            </div>
                        )}

                        <input 
                        type="file"
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => handleImageChange(e, 'despues')}
                        
                        />
                    </label>
                    {errors.despues &&(
                        <p className='text-sm text-red-500 mt-1'>{errors.despues}</p>
                    )}
                </div>
            </div>

            <div>
                <label className='block text-sm font-medium'>Título</label>
                <input 
                type="text"
                value={data.titulo}
                onChange={(e) => setData("titulo", e.target.value)}
                className='w-full border rounded-lg p-2'
                placeholder='Ej: De la calle al hogar'
                />
                {errors.titulo && (
                    <p className='text-sm text-red-500 mt-1'>{errors.titulo}</p>
                )}
            </div>

            <div>
                <label className='block-text-sm font-medium'>Descripción</label>
                <textarea 
                value= {data.descripcion}
                onChange={(e) => setData("descripcion", e.target.value)}
                className='w-full border rounded-lg p-2'
                placeholder= 'Ej: Luna fue rescatada de la calle y ahora vive feliz.'
                ></textarea>
                {errors.descripcion && (
                    <p className='text-sm text-red-500-mt-1'>{errors.descripcion}</p>
                )}
            </div>

            <div>
                <label className='block text-sm font-medium'>Testimonio</label>
                <textarea 
                value={data.testimonio}
                onChange={(e)=> setData("testimonio", e.target.value)}
                className='w-full border rounded-lg p-2'
                placeholder="Ej: Adoptar a Luna fue una de las mejores decisiones."
                ></textarea>
                {errors.testimonio && (
                    <p className='text-sm text-red-500 mt-1'>{errors.testimonio}</p>
                )}
            </div>


            <button
            type='submit'
            disabled= {processing}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50'
            >{processing ? "Publicando..." : "Publicar"}</button>

            </form>
        </div>
        </AuthenticatedLayout>
    )


}