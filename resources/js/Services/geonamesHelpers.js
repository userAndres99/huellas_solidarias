export function cleanPlaceName(s) {
  if (!s) return s;
  let name = String(s).trim();
  const patterns = [/^Ciudad de\s+/i, /^Municipio de\s+/i, /^Departamento de\s+/i, /^Villa\s+/i, /^Comuna de\s+/i, /^Distrito de\s+/i, /^Localidad de\s+/i];
  for (const p of patterns) {
    name = name.replace(p, '');
  }
  return name;
}
