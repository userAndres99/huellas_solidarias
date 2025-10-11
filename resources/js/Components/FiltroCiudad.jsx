export default function FiltroCiudad({ onCiudadSelect }) {
  const handleChange = (e) => {
    const ciudad = e.target.value;
    onCiudadSelect(ciudad);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-200 sm:rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3H3V4zM3 8h18v13a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
        </svg>
        Filtrar por ciudad
      </h2>

      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ciudad
        </label>
        <select
          name="ciudad"
          onChange={handleChange}
          className="block w-full border border-gray-300 bg-white rounded-lg shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          <option value="">Todas las ciudades</option>
          <option value="cipolleti">Cipolletti</option>
          <option value="neuquen">Neuquén</option>
          <option value="general roca">General Roca</option>
        </select>
      </div>
    </div>
  );
}
