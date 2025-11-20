<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        //por defecto no exigimos name/email
        $rules = [
            'name'  => ['string', 'max:255'],
            'email' => ['email', 'max:255'],
            'photo' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:2048'],
        ];

        $validator = Validator::make($request->all(), $rules);

        // Exigir name solo si viene, no está vacío y es distinto del actual
        $validator->sometimes('name', ['required', 'string', 'max:255'], function ($input) use ($user) {
            return isset($input->name) && trim($input->name) !== '' && $input->name !== $user->name;
        });

        // Exigir email solo si viene, no está vacío y es distinto del actual
        $validator->sometimes('email', ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)], function ($input) use ($user) {
            return isset($input->email) && trim($input->email) !== '' && $input->email !== $user->email;
        });

        // Añadir verificación extra: si el email fue modificado, comprobar que el dominio tenga registro
        $validator->after(function ($v) use ($request, $user) {
            if (isset($request->email) && trim($request->email) !== '' && $request->email !== $user->email) {
                $parts = explode('@', $request->email);
                if (count($parts) === 2) {
                    $domain = $parts[1];
                    // comprobar MX o A (para mayor compatibilidad)
                    if (!function_exists('checkdnsrr') || (!checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A'))) {
                        $v->errors()->add('email', 'No se pudo verificar el dominio del correo electrónico. Verificá que sea correcto.');
                    }
                } else {
                    $v->errors()->add('email', 'Formato de correo inválido.');
                }
            }
        });

        // Ejecutar validación 
        $validated = $validator->validate();

        $uploadedPath = null;

        // Procesar archivo si se subio
        if ($request->hasFile('photo')) {
            // borrar anterior si existe 
            if ($user->profile_photo_path) {
                try {
                    Storage::disk('public')->delete($user->profile_photo_path);
                } catch (\Throwable $e) {
                    Log::warning("No se pudo borrar profile_photo_path anterior: " . $e->getMessage());
                }
            }

            $file = $request->file('photo');
            $filename = 'user_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();

            // almacenar
            $path = $file->storeAs('profile-photos', $filename, 'public');
            $uploadedPath = $path;

            // setear path en el usuario
            $user->profile_photo_path = $path;

            //debug
            Log::info("Profile photo uploaded for user {$user->id}: path={$path}");
            Log::info("Exists on disk? " . (Storage::disk('public')->exists($path) ? 'yes' : 'no'));
        }

        // Actualizar name/email solo si pasaron la validación y no están vacíos
        if (array_key_exists('name', $validated) && trim($validated['name']) !== '') {
            $user->name = $validated['name'];
        }

        if (array_key_exists('email', $validated) && trim($validated['email']) !== '') {
            if ($validated['email'] !== $user->email) {
                $user->email_verified_at = null;
            }
            $user->email = $validated['email'];
        }

        // Guardar si hubo cambios o si subimos foto
        if ($uploadedPath !== null || $user->isDirty()) {
            $user->save();
        }

        // Si la petición quiere JSON
        if ($request->wantsJson()) {
            $user->refresh();
            return response()->json([
                'success' => true,
                'profile_photo_path' => $uploadedPath,
                'profile_photo_url' => $user->profile_photo_url,
                'exists_on_disk' => $uploadedPath ? Storage::disk('public')->exists($uploadedPath) : null,
            ]);
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}