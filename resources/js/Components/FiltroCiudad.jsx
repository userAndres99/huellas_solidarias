import React, { useState, useCallback } from "react";
import Select from "react-select";
import debounce from "lodash.debounce";

export default function FiltroCiudad({ onCiudadSelect }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCiudades = async (inputValue) => {
    if (!inputValue || inputValue.length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(
          inputValue
        )}&campos=nombre,provincia,centroide&max=10`
      );
      const data = await res.json();

      if (data.localidades) {

        const seen = new Set();
        const unicas = data.localidades.filter((loc) => {
          const key = `${loc.nombre}-${loc.provincia?.nombre || ""}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const formatted = unicas.map((loc) => ({
          label: `${loc.nombre} - ${loc.provincia?.nombre || ""}`,
          value: [loc.centroide.lat, loc.centroide.lon],
        }));

        setOptions(formatted);
      }
    } catch (error) {
      console.error("Error al buscar ciudades:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchCiudades, 400), []);

  const handleSelect = (selected) => {
    if (selected) {
      onCiudadSelect(selected.value);
    }
  };

  return (
    <div className="max-w-md mx-auto mb-4 z-[9999] relative">
      <Select
        isClearable
        isLoading={loading}
        placeholder="Buscar ciudad (ej: Buenos Aires)"
        onInputChange={(value) => {
          debouncedFetch(value);
          return value;
        }}
        options={options}
        onChange={handleSelect}
        noOptionsMessage={() => "Escribí al menos 3 letras..."}
        menuPortalTarget={document.body} 
        styles={{
          control: (base) => ({
            ...base,
            borderColor: "#ccc",
            boxShadow: "none",
            borderRadius: "0.5rem",
            zIndex: 9999,
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#e0f2fe" : "white",
            color: "#333",
            cursor: "pointer",
          }),
        }}
      />
    </div>
  );
}