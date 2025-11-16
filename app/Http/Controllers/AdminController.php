<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Simple index action for admin area.
     * Created as a minimal stub to avoid ReflectionException when listing routes
     * or when the route is accidentally invoked while the full admin UI
     * implementation is missing.
     */
    public function index(Request $request)
    {
        // Redirect to dashboard for now. Replace with admin view when available.
        return redirect()->route('dashboard');
    }
}
