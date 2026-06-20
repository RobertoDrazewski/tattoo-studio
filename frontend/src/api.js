const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';

const token = () => localStorage.getItem('rickart_token');
const headers = (json = true) => {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  const t = token(); if (t) h.Authorization = `Bearer ${t}`;
  return h;
};
async function req(path, { method = 'GET', body, form } = {}) {
  const opts = { method, headers: headers(!form) };
  if (form) opts.body = form;
  else if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || res.statusText);
    Object.assign(err, data); // conserva campos extra (ej: copy de texto cuando solo falla la imagen)
    throw err;
  }
  return res.status === 204 ? null : res.json();
}
// Cloudinary devuelve URLs absolutas; si alguna vez es relativa, la prefijamos
export const asset = (u) => (!u ? '' : /^https?:|^data:/.test(u) ? u : (import.meta.env.VITE_API_URL || '') + u);

export const api = {
  // Público
  cotizar: (form) => req('/cotizar', { method: 'POST', form }),
  chat: (messages, cotizacion) => req('/chat', { method: 'POST', body: { messages, cotizacion } }),
  crearReserva: (body) => req('/reservas', { method: 'POST', body }),
  disponibilidad: (horas, desde) => req(`/disponibilidad?horas=${horas}${desde ? `&desde=${desde}` : ''}`),
  galeria: (cat) => req(`/galeria${cat ? `?categoria=${cat}` : ''}`),
  banner: () => req('/banner'),
  instagram: () => req('/instagram'),
  tarifas: () => req('/tarifas'),
  contacto: (body) => req('/contacto', { method: 'POST', body }),

  // Auth
  login: (email, password) => req('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => req('/auth/me'),

  // Calendario
  turnos: (todos) => req(`/turnos${todos ? '?todos=1' : ''}`),
  actualizarTurno: (id, body) => req(`/turnos/${id}`, { method: 'PATCH', body }),

  // Galería admin
  subirGaleria: (form) => req('/galeria', { method: 'POST', form }),
  editarGaleria: (id, body) => req(`/galeria/${id}`, { method: 'PATCH', body }),
  borrarGaleria: (id) => req(`/galeria/${id}`, { method: 'DELETE' }),

  // Banner admin
  banners: () => req('/banner/all'),
  crearBanner: (form) => req('/banner', { method: 'POST', form }),
  generarBanner: (idea) => req('/banner/generar', { method: 'POST', body: { idea } }),
  estadoBanner: (jobId) => req(`/banner/generar/${jobId}`),
  editarBanner: (id, form) => req(`/banner/${id}`, { method: 'PATCH', form }),
  borrarBanner: (id) => req(`/banner/${id}`, { method: 'DELETE' }),

  // Reservas admin
  reservas: (estado) => req(`/admin/reservas${estado ? `?estado=${estado}` : ''}`),
  actualizarReserva: (id, body) => req(`/admin/reservas/${id}`, { method: 'PATCH', body }),
  agendarReserva: (id, body) => req(`/admin/reservas/${id}/agendar`, { method: 'POST', body }),
  eliminarReserva: (id) => req(`/admin/reservas/${id}`, { method: 'DELETE' }),
  clientes: () => req('/admin/clientes'),

  // Tarifas admin
  updateTarifaConfig: (body) => req('/tarifas/config', { method: 'PUT', body }),
  addTarifa: (tipo, body) => req(`/tarifas/${tipo}`, { method: 'POST', body }),
  updateTarifa: (tipo, id, body) => req(`/tarifas/${tipo}/${id}`, { method: 'PATCH', body }),
  deleteTarifa: (tipo, id) => req(`/tarifas/${tipo}/${id}`, { method: 'DELETE' }),

  // Métricas
  metricas: () => req('/metricas'),
  recomendaciones: (metricas) => req('/metricas/recomendaciones', { method: 'POST', body: { metricas } }),
};