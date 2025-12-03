<?php

namespace App\Http\Controllers;

use App\Models\SolicitudVerificacion;
use App\Models\User;
use App\Models\Rol;
use App\Models\Organizacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SolicitudVerificacionController extends Controller
{
    // Mostrar formulario (verifica si ya existe una solicitud pendiente)
    public function create()
    {
        $user = auth()->user();

        $existingPending = null;
        $lastSolicitud = null;

        if ($user) {
            $existingPending = SolicitudVerificacion::where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            $lastSolicitud = SolicitudVerificacion::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();
        }

        return Inertia::render('Profile/SolicitudVerificacionForm', [
            'existingPending' => (bool) $existingPending,
            'lastSolicitud' => $lastSolicitud ? [
                'id' => $lastSolicitud->id,
                'status' => $lastSolicitud->status,
                'created_at' => $lastSolicitud->created_at,
                'response_message' => $lastSolicitud->response_message,
            ] : null,
        ]);
    }
    // STORE: para que lo invoque (rol 'Usuario')
    public function store(Request $request)
    {
        $request->validate([
            'organization_name' => ['required','string','max:255'],
            'organization_phone' => ['required','string','max:50'],
            'organization_email' => ['required','email','max:255'],
            'message' => ['nullable','string'],
            'documents.*' => ['nullable','file','mimes:pdf,jpg,jpeg,png','max:5120'],
            'latitud' => ['required','numeric','between:-90,90'],
            'longitud' => ['required','numeric','between:-180,180'],
        ]);

        $user = $request->user();

        // Evitar que el usuario tenga varias solicitudes pendientes
        $existing = SolicitudVerificacion::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return back()->withErrors(['message' => 'Ya tienes una solicitud pendiente.']);
        }

        // Guardar documentos
        $saved = [];
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('verification_documents', 'public');
                $saved[] = $path;
            }
        }

        SolicitudVerificacion::create([
            'user_id' => $user->id,
            'organization_name' => $request->input('organization_name'),
            'organization_phone' => $request->input('organization_phone'),
            'organization_email' => $request->input('organization_email'),
            'message' => $request->input('message'),
            'documents' => $saved ?: null,
            'latitud' => $request->input('latitud'),
            'longitud' => $request->input('longitud'),
            'status' => 'pending',
            'notified_user' => false,
        ]);


        return back()->with('success', 'Solicitud enviada correctamente. Nuestro equipo la revisará.');
    }

    // (para admins) - listado
    public function index()
    {
        $solicitudes = SolicitudVerificacion::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Solicitudes', [
            'solicitudes' => $solicitudes,
        ]);
    }

    // (para admin) ver una solicitud
    public function show($id)
    {
        $solicitud = SolicitudVerificacion::with('user','reviewer')->findOrFail($id);

        return Inertia::render('Admin/SolicitudesShow', [
            'solicitud' => $solicitud,
        ]);
    }

    // UPDATE STATUS (aprobar / rechazar)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'response_message' => 'nullable|string|max:1000',
        ]);

        $solicitud = SolicitudVerificacion::findOrFail($id);
        $solicitud->status = $request->status;
        $solicitud->response_message = $request->response_message;
        $solicitud->reviewed_by = auth()->id();
        // Marcar como no notificado al usuario; el dashboard mostrará y marcará como notificado
        $solicitud->notified_user = false;
        $solicitud->save();

        $user = $solicitud->user;

        if ($user) {
            // actualizar solicitud, crear organizacion y actualizar usuario
            DB::transaction(function () use ($request, $solicitud, $user) {
                if ($request->status === 'approved') {
                    // asignar rol de organizacion al usuario
                    $rol = Rol::where('nombre', $user::ROLE_ORG)->first();
                    if ($rol) $user->rol_id = $rol->id;

                    // crear organizacion a partir de la solicitud (si no existe ya una)
                    $orgData = [
                        'usuario_creador_id' => $user->id,
                        'nombre' => $solicitud->organization_name ?? $user->name,
                        'telefono' => $solicitud->organization_phone,
                        'email' => $solicitud->organization_email,
                        'descripcion' => null,
                        'latitud' => $solicitud->latitud,
                        'longitud' => $solicitud->longitud,
                        'documentacion' => $solicitud->documents ?: null,
                        'verificado_en' => Carbon::now(),
                    ];

                    $organizacion = Organizacion::create($orgData);

                    // vincular la organizacion al usuario
                    $user->organizacion_id = $organizacion->id;
                    $user->save();

                } elseif ($request->status === 'rejected') {

                    $rol = Rol::where('nombre', $user::ROLE_USER)->first();
                    if ($rol) $user->rol_id = $rol->id;

                    // si existiera una relacion organizacion en el usuario, la mantenemos con valor null
                    $user->organizacion_id = null;
                    $user->save();
                }
            });
        }

        return redirect()
            ->route('admin.solicitudes.index')
            ->with('success', 'Estado de la solicitud actualizado correctamente.');
    }
}