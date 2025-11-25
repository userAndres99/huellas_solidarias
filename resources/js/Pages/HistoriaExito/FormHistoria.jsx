import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import '@/../css/components/form3D.css';
import MensajeFlash from '@/Components/MensajeFlash';

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

    const page = usePage();
    const user = page.props.auth?.user ?? {};
    const avatarUrl = user?.profile_photo_url ?? '/images/DefaultPerfil.jpg';
    const userName = user?.name ?? '';



    const handleImageChange = (e, tipo) => {
        const file = e. target.files[0];
        if(file){
            setData(tipo, file);
            const preview = URL.createObjectURL(file);
            if(tipo === 'antes') setPreviewAntes(preview);
            else setPreviewDespues(preview);
        }
    };

    useEffect(() => {
        return () => {
            if (previewAntes && previewAntes.startsWith('blob:')) URL.revokeObjectURL(previewAntes);
            if (previewDespues && previewDespues.startsWith('blob:')) URL.revokeObjectURL(previewDespues);
        };
    }, [previewAntes, previewDespues]);

    const removeAntes = () => {
        if (previewAntes && previewAntes.startsWith('blob:')) URL.revokeObjectURL(previewAntes);
        setPreviewAntes(null);
        setData('antes', null);
        try { const input = document.getElementById('antes'); if (input) input.value = ''; } catch (e) {}
    };

    const removeDespues = () => {
        if (previewDespues && previewDespues.startsWith('blob:')) URL.revokeObjectURL(previewDespues);
        setPreviewDespues(null);
        setData('despues', null);
        try { const input = document.getElementById('despues'); if (input) input.value = ''; } catch (e) {}
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
            <div className="relative max-w-4xl mx-auto mt-8 mb-8 pt-20 pb-6 px-6 border border-gray-100 shadow-lg rounded-2xl w-full" style={{ backgroundColor: '#16A34A' }}>
                    <div className="card-3d-container">
                            <div className="inner p-6">
                                {recentlySuccessful && (
                                    <MensajeFlash tipo="success">
                                        <strong>¡Historia subida con éxito!</strong> Gracias por compartir esperanza 💚
                                    </MensajeFlash>
                                )}

                                <form 
                                    onSubmit={handleSubmit}
                                    className='space-y-4'
                                    encType='multipart/form-data'
                                >
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

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-center'>
                                <div>
                                    <div className="card-3d-container">
                                        <div className="card-3d p-4 bg-transparent">
                                            <div className="inner text-center">
                                                <label className='block text-sm font-medium text-white mb-2'>Antes</label>

                                                {previewAntes ? (
                                                    <label htmlFor="antes" className="mb-3 flex justify-center cursor-pointer">
                                                        <img
                                                            src={previewAntes}
                                                            alt='Antes'
                                                            className='w-full h-48 object-cover rounded-lg border'
                                                        />
                                                    </label>
                                                ) : (
                                                    <label htmlFor="antes" className="mb-3 flex justify-center cursor-pointer">
                                                        <div
                                                            className="inline-flex flex-col items-center p-3 border-2 border-dashed rounded-lg cursor-pointer text-sm text-white hover:border-blue-300 transition w-full max-w-xs"
                                                            style={{ borderColor: '#16A34A', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
                                                        >
                                                            <div className="mb-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                                                                </svg>
                                                            </div>
                                                            <div className="text-sm">Hace click para subir una imagen</div>
                                                            <div className="mt-2 text-xs text-white/80">Sin archivo seleccionado</div>
                                                        </div>
                                                    </label>
                                                )}

                                                <input
                                                    id="antes"
                                                    type="file"
                                                    accept='image/*'
                                                    className='hidden'
                                                    onChange={(e) => handleImageChange(e, "antes")}
                                                />

                                                {errors.antes && (
                                                    <p className='text-sm text-red-500 mt-1'>{errors.antes}</p>
                                                )}

                                                {data.antes && (
                                                    <div className="mt-2 flex items-center justify-center gap-3">
                                                        <span className="text-xs text-white/80 truncate max-w-xs">{data.antes.name}</span>
                                                        <button type="button" onClick={removeAntes} className="text-xs text-red-300 hover:text-red-400 underline">Eliminar foto</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="card-3d-container">
                                        <div className="card-3d p-4 bg-transparent">
                                            <div className="inner text-center">
                                                <label className='block text-sm font-medium text-white mb-2'>Después</label>

                                                {previewDespues ? (
                                                    <label htmlFor="despues" className="mb-3 flex justify-center cursor-pointer">
                                                        <img
                                                            src={previewDespues}
                                                            alt='Después'
                                                            className='w-full h-48 object-cover rounded-lg border'
                                                        />
                                                    </label>
                                                ) : (
                                                    <label htmlFor="despues" className="mb-3 flex justify-center cursor-pointer">
                                                        <div
                                                            className="inline-flex flex-col items-center p-3 border-2 border-dashed rounded-lg cursor-pointer text-sm text-white hover:border-blue-300 transition w-full max-w-xs"
                                                            style={{ borderColor: '#16A34A', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
                                                        >
                                                            <div className="mb-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                                                                </svg>
                                                            </div>
                                                            <div className="text-sm">Hace click para subir una imagen</div>
                                                            <div className="mt-2 text-xs text-white/80">Sin archivo seleccionado</div>
                                                        </div>
                                                    </label>
                                                )}

                                                <input
                                                    id="despues"
                                                    type="file"
                                                    accept='image/*'
                                                    className='hidden'
                                                    onChange={(e) => handleImageChange(e, 'despues')}
                                                />

                                                {errors.despues && (
                                                    <p className='text-sm text-red-500 mt-1'>{errors.despues}</p>
                                                )}

                                                {data.despues && (
                                                    <div className="mt-2 flex items-center justify-center gap-3">
                                                        <span className="text-xs text-white/80 truncate max-w-xs">{data.despues.name}</span>
                                                        <button type="button" onClick={removeDespues} className="text-xs text-red-300 hover:text-red-400 underline">Eliminar foto</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>

                        <div className="card-3d-container">
                            <div className="card-3d p-4 bg-transparent">
                                <div className="inner">
                                    <label className='block text-sm font-medium text-white mb-1'>Título</label>
                                    <input
                                        type="text"
                                        value={data.titulo}
                                        onChange={(e) => setData("titulo", e.target.value)}
                                        className='w-full rounded-md border border-[#0f3a2f] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80'
                                        style={{ backgroundColor: '#15803D', borderColor: '#16A34A' }}
                                        placeholder='Ej: De la calle al hogar'
                                    />
                                    {errors.titulo && (
                                        <p className='text-sm text-red-500 mt-1'>{errors.titulo}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card-3d-container">
                            <div className="card-3d p-4 bg-transparent">
                                <div className="inner">
                                    <label className='block text-sm font-medium text-white mb-1'>Descripción</label>
                                    <textarea
                                        value={data.descripcion}
                                        onChange={(e) => setData("descripcion", e.target.value)}
                                        className='w-full rounded-md border border-[#0f3a2f] px-3 py-2 h-28 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80'
                                        style={{ backgroundColor: '#15803D', borderColor: '#16A34A' }}
                                        placeholder='Ej: Luna fue rescatada de la calle y ahora vive feliz.'
                                    />
                                    {errors.descripcion && (
                                        <p className='text-sm text-red-500 mt-1'>{errors.descripcion}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card-3d-container">
                            <div className="card-3d p-4 bg-transparent">
                                <div className="inner">
                                    <label className='block text-sm font-medium text-white mb-1'>Testimonio</label>
                                    <textarea
                                        value={data.testimonio}
                                        onChange={(e) => setData("testimonio", e.target.value)}
                                        className='w-full rounded-md border border-[#0f3a2f] px-3 py-2 h-28 resize-y focus:outline-none focus:ring-2 focus:ring-blue-200 text-white placeholder-white/80'
                                        style={{ backgroundColor: '#15803D', borderColor: '#16A34A' }}
                                        placeholder="Ej: Adoptar a Luna fue una de las mejores decisiones."
                                    />
                                    {errors.testimonio && (
                                        <p className='text-sm text-red-500 mt-1'>{errors.testimonio}</p>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mt-2 flex justify-center md:justify-end">
                            <div className="btn-3d-container">
                                <div className="btn-3d">
                                    <button type='submit' disabled={processing} className='inner-btn w-full md:w-auto'>
                                        {processing ? 'Publicando...' : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        </div>

                                </form>
                            </div>
                    </div>
                </div>
    );

}