export async function fetchWithCsrf(url, options = {}) {
  const token = document.querySelector('meta[name="csrf-token"]').content;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'X-CSRF-TOKEN': token,
      ...(options.headers || {}),
    },
    credentials: 'include', // <--- MUY IMPORTANTE
  });

  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}
