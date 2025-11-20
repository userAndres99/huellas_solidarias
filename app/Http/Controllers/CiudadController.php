<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caso;

class CiudadController extends Controller
{
    /**
     * Buscar ciudades existentes en los casos que coincidan 
     */
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));

        if ($q === '') {
            return response()->json(['data' => []]);
        }

        $cities = Caso::query()
            ->whereNotNull('ciudad')
            ->where('ciudad', 'like', "%{$q}%")
            ->select('ciudad')
            ->distinct()
            ->orderBy('ciudad')
            ->limit(10)
            ->pluck('ciudad');

        return response()->json(['data' => $cities]);
    }
}
