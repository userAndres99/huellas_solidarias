<?php

namespace App\Http\Controllers;

use App\Models\SolicitudVerificacion;
use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

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
            'organization_name' => ['nullable','string','max:255'],
            'organization_phone' => ['nullable','string','max:50'],
            'organization_email' => ['nullable','email','max:255'],
            'message' => ['nullable','string'],
            'documents.*' => ['nullable','file','mimes:pdf,jpg,jpeg,png','max:5120'],
            'latitud' => ['nullable','numeric','between:-90,90'],
            'longitud' => ['nullable','numeric','between:-180,180'],
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
        ]);

        // Notificar admins (es algo asi pero tengo que configurarlo)
        // $admins = User::where('role', 'Admin')->get();
        // if ($admins->isNotEmpty()) {
        //     Notification::send($admins, new \App\Notifications\NuevaSolicitudVerificacion($solicitud));
        // }

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
        $solicitud->save();

        $user = $solicitud->user;

        if ($user) {
            if ($request->status === 'approved') {
                $rol = Rol::where('nombre', $user::ROLE_ORG)->first();
                if ($rol) $user->rol_id = $rol->id;
            } elseif ($request->status === 'rejected') {
                $rol = Rol::where('nombre', $user::ROLE_USER)->first();
                if ($rol) $user->rol_id = $rol->id;
            }
            $user->save();
        }

        return redirect()
            ->route('admin.solicitudes.index')
            ->with('success', 'Estado de la solicitud actualizado correctamente.');
    }
}