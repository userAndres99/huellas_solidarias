import React, { useState, useRef } from 'react';
import Modal from '@/Components/Modal';
import FiltroCiudad from '@/Components/FiltroCiudad';

export default function ImageSearchModal({ show, onClose }) {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tipoAnimal, setTipoAnimal] = useState('Perro');
  const [ciudad, setCiudad] = useState('');
  const [ciudadOption, setCiudadOption] = useState(null);
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFileName('');
      setPreviewUrl(null);
      return;
    }
    setFileName(f.name);
    setPreviewUrl(URL.createObjectURL(f));
  };

  //hadle submit para buscar coincidencias por imagen
  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files && fileInputRef.current.files[0];
    if (!file) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.enctype = 'multipart/form-data';
    form.action = route('casos.search_image');

    // CSRF
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
      const inputToken = document.createElement('input');
      inputToken.type = 'hidden';
      inputToken.name = '_token';
      inputToken.value = token;
      form.appendChild(inputToken);
    }

    // tipoAnimal
    const t = document.createElement('input');
    t.type = 'hidden';
    t.name = 'tipoAnimal';
    t.value = tipoAnimal;
    form.appendChild(t);

    // ciudad
    const c = document.createElement('input');
    c.type = 'hidden';
    c.name = 'ciudad';
    c.value = ciudad;
    form.appendChild(c);

    // fotoAnimal
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'fotoAnimal';
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    } catch (ex) {
      fileInput.files = fileInputRef.current.files;
    }

    form.appendChild(fileInput);
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md">
      <form onSubmit={handleSubmit} className="p-4">
        <h3 className="text-lg font-semibold mb-3">Buscar coincidencias por imagen</h3>
        <p className="text-sm text-gray-600 mb-4">Subí una foto de tu mascota, contanos qué tipo de animal es y en qué ciudad la perdiste — esto nos ayudará a hacer una búsqueda más precisa.</p>

        <div className="space-y-3">
          <div className="card-3d-container">
            <div className="card-3d p-4" style={{ background: '#C9E8F6', borderColor: '#2563EB' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#0B2447' }}>Foto del animal</label>

              {previewUrl ? (
                <div className="mb-3 flex justify-center">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-40 h-40 object-cover rounded-lg border"
                  />
                </div>
              ) : (
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex flex-col items-center text-xs w-full max-w-xs" style={{ color: '#0B2447' }}>
                      <div>Aún no seleccionaste una imagen</div>
                    </div>
                </div>
              )}

              <div className="inner">
                <input
                  id="modalFotoAnimal"
                  ref={fileInputRef}
                  type="file"
                  name="fotoAnimal"
                  onChange={onFileChange}
                  className="hidden"
                  accept="image/*"
                  required
                />
                <label htmlFor="modalFotoAnimal" className="flex items-center justify-center w-full">
                  <div
                    className="inline-flex flex-col items-center p-3 border-2 border-dashed rounded-lg cursor-pointer text-sm text-gray-700 hover:border-gray-400 transition w-full max-w-xs"
                    style={{ borderColor: '#2563EB', background: 'linear-gradient(180deg, rgba(0,0,0,0.01), rgba(0,0,0,0.01))' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7M12 3v18" />
                    </svg>
                    <div className="text-xs" style={{ color: '#0B2447' }}>{fileName ? 'Cambiar foto' : 'hace click para subir una imagen'}</div>
                    {fileName ? (
                      <div className="mt-2 text-sm truncate max-w-full" style={{ color: '#0B2447' }}>{fileName}</div>
                    ) : (
                      <div className="mt-2 text-sm" style={{ color: '#0B2447' }}>Sin archivo seleccionado</div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="card-3d-container">
            <div className="card-3d p-4" style={{ background: '#C9E8F6', borderColor: '#2563EB' }}>
              <div className="inner">
                <label className="block text-sm font-medium mb-1" style={{ color: '#0B2447' }}>Tipo de animal</label>
                <select value={tipoAnimal} onChange={(e) => setTipoAnimal(e.target.value)} name="tipoAnimal" className="mt-1 block w-full rounded-md border border-blue-200 bg-white text-[#0B2447] px-3 py-2" style={{ borderColor: '#93C5FD', color: '#0B2447' }}>
                  <option value="Perro" style={{ backgroundColor: '#C9E8F6', color: '#0B2447' }}>Perro</option>
                  <option value="Gato" style={{ backgroundColor: '#C9E8F6', color: '#0B2447' }}>Gato</option>
                  <option value="Otro" style={{ backgroundColor: '#C9E8F6', color: '#0B2447' }}>Otro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-3d-container">
            <div className="card-3d p-4" style={{ background: '#C9E8F6', borderColor: '#2563EB' }}>
              <div className="inner w-full">
                <label className="block text-sm font-medium mb-1" style={{ color: '#0B2447' }}>Buscar Ciudad</label>
                <FiltroCiudad
                  placeholder="Buscar ciudad..."
                  onCiudadSelect={(opt) => {
                    setCiudadOption(opt || null);
                    setCiudad(opt ? opt.label : '');
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded shadow-md active:translate-y-1 active:shadow-sm transition transform inline-flex items-center justify-center relative z-30"
              style={{ background: 'linear-gradient(180deg,#1E3A8A,#1E40AF)', border: '1px solid #2563EB', boxShadow: '0 6px 0 rgba(0,0,0,0.12)', color: '#FFFFFF' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded text-white shadow-md active:translate-y-1 active:shadow-sm transition transform inline-flex items-center justify-center relative z-30"
              style={{ background: 'linear-gradient(180deg,#1E3A8A,#1E40AF)', border: '1px solid #2563EB', boxShadow: '0 6px 0 rgba(0,0,0,0.2)', color: '#FFFFFF' }}
            >
              Buscar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}