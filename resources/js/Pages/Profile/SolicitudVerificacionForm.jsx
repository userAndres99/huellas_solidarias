import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function SolicitudVerificacionForm() {
  const page = usePage();
  const user = page.props.auth?.user ?? null;

  // useForm maneja estado, post y errores automáticamente
  const { data, setData, post, processing, errors, reset } = useForm({
    organization_name: '',
    organization_phone: '',
    organization_email: '',
    message: '',
    documents: [], //guardamos archivos
  });

  // preview opcional para el primer archivo
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setData('documents', files);

    if (files[0]) {
      // preview solo del primer archivo si es imagen
      if (files[0].type.startsWith('image/')) {
        const obj = URL.createObjectURL(files[0]);
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return obj;
        });
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const submit = (e) => {
    e.preventDefault();

    // post usando useForm.post 
    post(route('profile.request_verification'), {
      forceFormData: true, // fuerza multipart/form-data cuando hay File objects
      onSuccess: () => {
        // limpiar campos
        reset('organization_name', 'organization_phone', 'organization_email', 'message', 'documents');
        setPreviewUrl(null);
      },
    });
  };

  if (!user) {
    return (
      <div className="p-6">
        <p>No estás autenticado.</p>
      </div>
    );
  }

  if (user.role_name !== 'Usuario') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Acceso no permitido</h1>
        <p className="mt-2 text-sm text-gray-700">Esta página está disponible solamente para usuarios.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head title="Solicitar verificación" />
      <h1 className="text-2xl font-semibold mb-4">Solicitar verificación como representante</h1>

      <form onSubmit={submit} encType="multipart/form-data" className="space-y-4">
        <div>
          <InputLabel htmlFor="organization_name" value="Nombre de la organización (opcional)" />
          <input
            id="organization_name"
            type="text"
            value={data.organization_name}
            onChange={(e) => setData('organization_name', e.target.value)}
            className="mt-1 block w-full rounded border-gray-300"
            placeholder="Nombre de la organización"
          />
          <InputError message={errors.organization_name} className="mt-1" />
        </div>

        <div>
          <InputLabel htmlFor="organization_phone" value="Teléfono de la organización (opcional)" />
          <input
            id="organization_phone"
            type="text"
            value={data.organization_phone}
            onChange={(e) => setData('organization_phone', e.target.value)}
            className="mt-1 block w-full rounded border-gray-300"
            placeholder="+54 9 11 1234 5678"
          />
          <InputError message={errors.organization_phone} className="mt-1" />
        </div>

        <div>
          <InputLabel htmlFor="organization_email" value="Correo de la organización (opcional)" />
          <input
            id="organization_email"
            type="email"
            value={data.organization_email}
            onChange={(e) => setData('organization_email', e.target.value)}
            className="mt-1 block w-full rounded border-gray-300"
            placeholder="contacto@organizacion.org"
          />
          <InputError message={errors.organization_email} className="mt-1" />
        </div>

        <div>
          <InputLabel htmlFor="message" value="Mensaje / aclaración (opcional)" />
          <textarea
            id="message"
            value={data.message}
            onChange={(e) => setData('message', e.target.value)}
            className="mt-1 block w-full rounded border-gray-300"
            placeholder="Alguna aclaración sobre la representación..."
          />
          <InputError message={errors.message} className="mt-1" />
        </div>

        <div>
          <InputLabel htmlFor="documents" value="Documentación (PDF / JPG / PNG) - opcional" />
          {previewUrl && (
            <div className="mb-2">
              <img src={previewUrl} alt="preview" className="w-32 h-32 object-cover rounded" />
            </div>
          )}
          <input
            id="documents"
            name="documents[]"
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={onFilesChange}
            className="mt-1 block w-full"
          />
          <InputError message={errors['documents.0'] ?? errors.documents} className="mt-1" />
        </div>

        <div className="pt-4">
          <PrimaryButton disabled={processing}>
            {processing ? 'Enviando...' : 'Enviar solicitud'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}