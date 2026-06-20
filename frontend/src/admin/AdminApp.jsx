import { useEffect, useState } from 'react';
import { api, asset } from '../api';
import Logo from '../components/Logo';

const WA = (tel) => `https://wa.me/${(tel || '').replace(/[^0-9]/g, '')}`;
const eur = (n) => (n == null ? '—' : `${Number(n).toLocaleString('es-ES')} €`);

const TABS = [
  ['reservas', 'Reservas'], ['calendario', 'Calendario'], ['tarifas', 'Tarifas'],
  ['banner', 'Banner IA'], ['galeria', 'Galería'], ['metricas', 'Métricas'], ['clientes', 'Tatuajes por cliente'],
];

export default function AdminApp() {
  const [authed, setAuthed] = useState(null);
  const [tab, setTab] = useState('reservas');
  useEffect(() => { api.me().then(() => setAuthed(true)).catch(() => setAuthed(false)); }, []);
  if (authed === null) return <div className="grid min-h-screen place-items-center bg-snow text-soft">Cargando…</div>;
  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-snow px-4 py-6 md:flex">
          <div className="px-2"><Logo height={56} /></div>
          <nav className="mt-10 space-y-1">
            {TABS.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`block w-full px-3 py-2.5 text-left font-body text-sm font-medium tracking-wide transition ${tab === k ? 'bg-ink text-snow' : 'text-soft hover:bg-paper hover:text-ink'}`}>{l}</button>
            ))}
          </nav>
          <a href="/" className="mt-auto flex items-center gap-2 px-3 py-2.5 text-left font-body text-xs uppercase tracking-widest text-soft transition hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>
            Volver a Home
          </a>
          <button onClick={() => { localStorage.removeItem('rickart_token'); location.reload(); }} className="px-3 py-2 text-left font-body text-xs uppercase tracking-widest text-soft hover:text-blood">Cerrar sesión</button>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Header mobile: logo + acciones arriba, tabs como chips scrolleables debajo (más fácil de tocar que un <select>) */}
          <header className="sticky top-0 z-20 border-b border-line bg-snow/95 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <Logo height={32} />
              <div className="flex items-center gap-2">
                <a href="/" aria-label="Volver a Home" className="flex h-10 w-10 items-center justify-center border border-line text-soft active:bg-paper">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>
                </a>
                <button onClick={() => { localStorage.removeItem('rickart_token'); location.reload(); }} aria-label="Cerrar sesión" className="flex h-10 w-10 items-center justify-center border border-line text-soft active:bg-paper">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
              {TABS.map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`shrink-0 whitespace-nowrap border px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wide transition ${tab === k ? 'border-ink bg-ink text-snow' : 'border-line text-soft'}`}>{l}</button>
              ))}
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
            {tab === 'reservas' && <TabReservas />}
            {tab === 'calendario' && <TabCalendario />}
            {tab === 'tarifas' && <TabTarifas />}
            {tab === 'banner' && <TabBanner />}
            {tab === 'galeria' && <TabGaleria />}
            {tab === 'metricas' && <TabMetricas />}
            {tab === 'clientes' && <TabClientes />}
          </main>
        </div>
      </div>
    </div>
  );
}

function H({ children, sub }) {
  return <div className="mb-6"><h1 className="display text-2xl text-ink sm:text-3xl">{children}</h1>{sub && <p className="mt-1 font-body text-sm text-soft sm:text-base">{sub}</p>}</div>;
}
function Login({ onOk }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState('');
  const go = async () => { try { const { token } = await api.login(email, password); localStorage.setItem('rickart_token', token); onOk(); } catch { setErr('Credenciales inválidas'); } };
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="w-full max-w-sm border border-line bg-snow p-8">
        <div className="mb-6 flex justify-center"><Logo height={64} /></div>
        <h1 className="mb-6 text-center font-body text-sm uppercase tracking-[0.2em] text-soft">Panel de administración</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" inputMode="email" autoCapitalize="off" className="mb-3 w-full border border-line px-4 py-3.5 font-body text-base focus:border-ink focus:outline-none" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} type="password" placeholder="Contraseña" className="w-full border border-line px-4 py-3.5 font-body text-base focus:border-ink focus:outline-none" />
        {err && <p className="mt-3 font-body text-sm text-blood">{err}</p>}
        <button onClick={go} className="mt-5 w-full bg-ink py-4 font-body text-sm font-semibold uppercase tracking-[0.14em] text-snow active:bg-blood">Entrar</button>
      </div>
    </div>
  );
}

/* ───────────── RESERVAS ───────────── */
function TabReservas() {
  const [items, setItems] = useState([]); const [filtro, setFiltro] = useState('presupuesto'); const [busy, setBusy] = useState(false);
  const load = () => api.reservas(filtro === 'todos' ? '' : filtro).then(setItems).catch(() => {});
  useEffect(() => { load(); }, [filtro]);
  const agendar = async (r) => {
    const desde = prompt('Fecha de inicio (YYYY-MM-DD). Vacío = primer hueco disponible:', '');
    setBusy(true);
    try { await api.agendarReserva(r.id, { desde: desde || undefined, precio_pactado: r.precio_pactado }); load(); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  const seña = async (r) => { await api.actualizarReserva(r.id, { deposito_pagado: !r.deposito_pagado }); load(); };
  const eliminar = async (r) => { if (confirm(`¿Eliminar la reserva de ${r.cliente_nombre}?`)) { await api.eliminarReserva(r.id); load(); } };
  const setPrecio = async (r) => { const v = prompt('Precio pactado (€):', r.precio_pactado || ''); if (v !== null) { await api.actualizarReserva(r.id, { precio_pactado: Number(v) }); load(); } };

  return (
    <div>
      <H sub="Presupuestos sin fecha y reservas confirmadas. Agendá cuando el cliente pague la seña.">Reservas</H>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
        {[['presupuesto', 'Presupuestos'], ['confirmado', 'Confirmadas'], ['finalizado', 'Finalizadas'], ['todos', 'Todas']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`shrink-0 whitespace-nowrap border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide transition ${filtro === k ? 'border-ink bg-ink text-snow' : 'border-line text-soft hover:border-ink'}`}>{l}</button>
        ))}
      </div>
      {!items.length && <p className="font-body text-soft">No hay reservas en este estado.</p>}
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="border border-line bg-snow p-4">
            <div className="flex gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-paper sm:h-24 sm:w-24">
                {r.diseno_url ? <img src={asset(r.diseno_url)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center font-body text-[9px] uppercase text-soft">sin foto</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-base font-bold leading-tight text-ink sm:text-lg">{r.cliente_nombre}</span>
                  <Estado e={r.estado} />
                  {r.deposito_pagado ? <span className="bg-ink px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-snow">seña ok</span> : null}
                </div>
                <p className="mt-1 font-body text-xs text-soft sm:text-sm">{r.titulo} · {r.zona_cuerpo || 's/zona'} · {r.estilo || ''} {r.tamano_cm ? `· ${r.tamano_cm}` : ''}</p>
                <p className="mt-1 font-body text-sm font-medium text-ink">{eur(r.precio_pactado)} · {r.sesiones_pactadas || 1} ses. {r.horas_totales ? `· ${r.horas_totales} h` : ''}</p>
              </div>
            </div>
            {/* Acciones: grid de 2 columnas en mobile (fáciles de tocar), fila en desktop */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:flex sm:flex-wrap sm:border-t-0 sm:pt-0">
              <a href={WA(r.telefono)} target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center justify-center gap-1.5 bg-[#25D366] px-3 py-2.5 font-body text-xs font-semibold text-white">
                <svg viewBox="0 0 32 32" className="h-4 w-4 shrink-0 fill-white"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6C14 28.4 15 28.6 16 28.6c6.6 0 12-5.4 12-12S22.6 3 16 3z"/></svg>WhatsApp
              </a>
              <button onClick={() => setPrecio(r)} className="min-h-[44px] border border-line px-3 py-2.5 font-body text-xs active:bg-paper">Precio</button>
              <button onClick={() => seña(r)} className="min-h-[44px] border border-line px-3 py-2.5 font-body text-xs active:bg-paper">{r.deposito_pagado ? 'Quitar seña' : 'Marcar seña'}</button>
              {r.estado !== 'confirmado' && r.estado !== 'finalizado' ? (
                <button onClick={() => agendar(r)} disabled={busy} className="min-h-[44px] bg-ink px-3 py-2.5 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood disabled:opacity-50">Agendar</button>
              ) : <span className="hidden sm:block" />}
              <button onClick={() => eliminar(r)} className="col-span-2 min-h-[44px] border border-line px-3 py-2.5 font-body text-xs text-blood active:border-blood sm:col-span-1">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Estado({ e }) {
  const map = { presupuesto: 'bg-paper text-soft border border-line', confirmado: 'bg-ink text-snow', en_proceso: 'bg-blood text-snow', finalizado: 'border border-ink text-ink', cancelado: 'line-through text-soft border border-line' };
  return <span className={`px-2 py-0.5 font-body text-[10px] uppercase tracking-wide ${map[e] || ''}`}>{e}</span>;
}

/* ───────────── CALENDARIO ───────────── */
function TabCalendario() {
  const [turnos, setTurnos] = useState([]);
  const [verTodos, setVerTodos] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const load = () => api.turnos(verTodos).then(setTurnos).catch(() => {});
  useEffect(() => { load(); }, [verTodos]);
  const grupos = turnos.reduce((acc, t) => { const k = new Date(t.inicio).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); (acc[k] ||= []).push(t); return acc; }, {});
  const accion = async (t, estado) => {
    if (estado === 'cancelado' && !confirm(`¿Cancelar el turno de ${t.cliente_nombre}?`)) return;
    setBusyId(t.id);
    try { await api.actualizarTurno(t.id, { estado }); await load(); }
    catch (e) { alert(e.message || 'No se pudo actualizar el turno'); }
    finally { setBusyId(null); }
  };
  return (
    <div>
      <H sub="Sesiones confirmadas. Cada bloque muestra cliente, pieza, precio pactado y horario.">Calendario</H>
      <label className="mb-5 flex items-center gap-2 font-body text-xs text-soft">
        <input type="checkbox" className="h-4 w-4" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
        Ver también completados y cancelados
      </label>
      {!turnos.length && <p className="font-body text-soft">No hay turnos agendados. Confirmá una reserva para que aparezca acá.</p>}
      <div className="space-y-6 sm:space-y-7">
        {Object.entries(grupos).map(([dia, lista]) => (
          <div key={dia}>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.18em] text-blood">{dia}</p>
            <div className="space-y-2">
              {lista.map((t) => (
                <div key={t.id} className={`border border-line bg-snow p-3 ${t.estado === 'cancelado' ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="shrink-0 text-center">
                      <p className="font-display text-base font-bold text-ink sm:text-lg">{new Date(t.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="font-body text-[10px] uppercase text-soft">a {new Date(t.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-line pl-3 sm:pl-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-display font-bold text-ink">{t.cliente_nombre}</p>
                        {t.estado === 'completado' && <span className="bg-ink px-2 py-0.5 font-body text-[10px] uppercase text-snow">completado</span>}
                        {t.estado === 'cancelado' && <span className="border border-line px-2 py-0.5 font-body text-[10px] uppercase text-soft">cancelado</span>}
                      </div>
                      <p className="font-body text-xs text-soft sm:text-sm">{t.proyecto_titulo || 'Tatuaje'} · sesión {t.numero_sesion}/{t.total_sesiones} {t.precio_pactado ? `· ${eur(t.precio_pactado)}` : ''}</p>
                    </div>
                  </div>
                  {t.estado !== 'cancelado' && t.estado !== 'completado' && (
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 sm:flex sm:items-center sm:border-t-0 sm:pt-0">
                      <a href={WA(t.telefono)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center bg-[#25D366] sm:w-11 sm:shrink-0" title="WhatsApp"><svg viewBox="0 0 32 32" className="h-4 w-4 fill-white"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6C14 28.4 15 28.6 16 28.6c6.6 0 12-5.4 12-12S22.6 3 16 3z"/></svg></a>
                      <button onClick={() => accion(t, 'completado')} disabled={busyId === t.id} className="h-11 whitespace-nowrap border border-line px-2 font-body text-xs active:bg-paper disabled:opacity-50 sm:px-3 sm:text-sm">✓ Hecho</button>
                      <button onClick={() => accion(t, 'cancelado')} disabled={busyId === t.id} className="h-11 whitespace-nowrap border border-line px-2 font-body text-xs text-blood active:border-blood disabled:opacity-50 sm:px-3 sm:text-sm">✕ Cancelar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── TARIFAS ───────────── */
function TabTarifas() {
  const [t, setT] = useState(null);
  const load = () => api.tarifas().then(setT).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!t) return <p className="font-body text-soft">Cargando tarifario…</p>;
  const saveCfg = async () => { await api.updateTarifaConfig(t.config); alert('Configuración guardada'); };
  const cfg = (k) => (e) => setT({ ...t, config: { ...t.config, [k]: e.target.value } });

  return (
    <div>
      <H sub="La IA usa estos valores para cotizar. Precio ≈ horas × tarifa/hora × zona × estilo + insumos.">Tarifas</H>

      <Card title="Configuración general">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field label="Tarifa/hora (€)"><input type="number" inputMode="decimal" value={t.config.tarifa_hora_eur} onChange={cfg('tarifa_hora_eur')} className="inp" /></Field>
          <Field label="Mínimo/sesión (€)"><input type="number" inputMode="decimal" value={t.config.minimo_sesion_eur} onChange={cfg('minimo_sesion_eur')} className="inp" /></Field>
          <Field label="Seña (%)"><input type="number" inputMode="decimal" value={t.config.deposito_pct} onChange={cfg('deposito_pct')} className="inp" /></Field>
          <Field label="Máx h/sesión"><input type="number" inputMode="decimal" value={t.config.session_max_hours} onChange={cfg('session_max_hours')} className="inp" /></Field>
        </div>
        <button onClick={saveCfg} className="mt-4 w-full bg-ink py-3 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood sm:w-auto sm:px-5 sm:py-2.5">Guardar configuración</button>
      </Card>

      <MultTable tipo="zonas" label="Zonas del cuerpo" campo="zona" items={t.zonas} reload={load} />
      <MultTable tipo="estilos" label="Estilos / modelos de tatuaje" campo="estilo" items={t.estilos} reload={load} />
      <InsumosTable items={t.insumos} reload={load} />
    </div>
  );
}
function MultTable({ tipo, label, campo, items, reload }) {
  const [nuevo, setNuevo] = useState({ [campo]: '', multiplicador: 1, nota: '' });
  const add = async () => { if (!nuevo[campo]) return; await api.addTarifa(tipo, nuevo); setNuevo({ [campo]: '', multiplicador: 1, nota: '' }); reload(); };
  const upd = async (it, field, val) => { await api.updateTarifa(tipo, it.id, { ...it, [field]: val }); reload(); };
  const del = async (it) => { if (confirm('¿Borrar este ítem?')) { await api.deleteTarifa(tipo, it.id); reload(); } };
  return (
    <Card title={label}>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-2 last:border-0 last:pb-0 sm:flex-nowrap sm:border-0 sm:pb-0">
            <input defaultValue={it[campo]} onBlur={(e) => e.target.value !== it[campo] && upd(it, campo, e.target.value)} className="inp min-w-0 flex-1 capitalize" />
            <div className="flex items-center gap-1.5 shrink-0"><span className="font-body text-xs text-soft">×</span><input type="number" inputMode="decimal" step="0.05" defaultValue={it.multiplicador} onBlur={(e) => Number(e.target.value) !== Number(it.multiplicador) && upd(it, 'multiplicador', e.target.value)} className="inp w-20" /></div>
            <button onClick={() => del(it)} className="shrink-0 px-2 py-2.5 font-body text-xs text-blood active:underline">Borrar</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <input placeholder={`Nueva ${campo}`} value={nuevo[campo]} onChange={(e) => setNuevo({ ...nuevo, [campo]: e.target.value })} className="inp min-w-0 flex-1" />
        <input type="number" inputMode="decimal" step="0.05" value={nuevo.multiplicador} onChange={(e) => setNuevo({ ...nuevo, multiplicador: e.target.value })} className="inp w-20 shrink-0" />
        <button onClick={add} className="w-full bg-ink px-4 py-2.5 font-body text-xs font-semibold uppercase text-snow active:bg-blood sm:w-auto">+ Añadir</button>
      </div>
    </Card>
  );
}
function InsumosTable({ items, reload }) {
  const [n, setN] = useState({ nombre: '', costo_eur: 0, por_sesion: 1 });
  const add = async () => { if (!n.nombre) return; await api.addTarifa('insumos', n); setN({ nombre: '', costo_eur: 0, por_sesion: 1 }); reload(); };
  const upd = async (it, f, v) => { await api.updateTarifa('insumos', it.id, { ...it, [f]: v }); reload(); };
  const del = async (it) => { if (confirm('¿Borrar este insumo?')) { await api.deleteTarifa('insumos', it.id); reload(); } };
  return (
    <Card title="Insumos y extras">
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3 last:border-0 last:pb-0 sm:flex-nowrap sm:border-0 sm:pb-0">
            <input defaultValue={it.nombre} onBlur={(e) => e.target.value !== it.nombre && upd(it, 'nombre', e.target.value)} className="inp min-w-0 flex-1" />
            <input type="number" inputMode="decimal" defaultValue={it.costo_eur} onBlur={(e) => Number(e.target.value) !== Number(it.costo_eur) && upd(it, 'costo_eur', e.target.value)} className="inp w-20 shrink-0" />
            <label className="flex shrink-0 items-center gap-1.5 font-body text-xs text-soft"><input type="checkbox" className="h-4 w-4" checked={!!it.por_sesion} onChange={(e) => upd(it, 'por_sesion', e.target.checked ? 1 : 0)} />x sesión</label>
            <button onClick={() => del(it)} className="shrink-0 px-2 py-2.5 font-body text-xs text-blood active:underline">Borrar</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <input placeholder="Nuevo insumo" value={n.nombre} onChange={(e) => setN({ ...n, nombre: e.target.value })} className="inp min-w-0 flex-1" />
        <input type="number" inputMode="decimal" placeholder="€" value={n.costo_eur} onChange={(e) => setN({ ...n, costo_eur: e.target.value })} className="inp w-20 shrink-0" />
        <label className="flex shrink-0 items-center gap-1.5 font-body text-xs text-soft"><input type="checkbox" className="h-4 w-4" checked={!!n.por_sesion} onChange={(e) => setN({ ...n, por_sesion: e.target.checked ? 1 : 0 })} />x sesión</label>
        <button onClick={add} className="w-full bg-ink px-4 py-2.5 font-body text-xs font-semibold uppercase text-snow active:bg-blood sm:w-auto">+ Añadir</button>
      </div>
    </Card>
  );
}

/* ───────────── BANNER IA ───────────── */
function TabBanner() {
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState({ titulo: '', subtitulo: '', cta_texto: '', cta_url: '', imagen_url: '', expira_at: '' });
  const [gen, setGen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [progress, setProgress] = useState(0);

  const load = () => api.banners().then(setBanners).catch(() => {});
  useEffect(() => { load(); }, []);

  const generar = async () => {
    if (!idea.trim()) return;
    setGen(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const salto = Math.floor(Math.random() * 5) + 2;
        return Math.min(prev + salto, 95);
      });
    }, 450);

    try {
      const r = await api.generarBanner(idea);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { setDraft({ ...draft, ...r }); }, 300);
    } catch (e) {
      clearInterval(interval);
      alert(e.message);
    } finally {
      setTimeout(() => setGen(false), 600);
    }
  };

  const crear = async () => {
    const fd = new FormData();
    Object.entries(draft).forEach(([k, v]) => fd.append(k, v));
    fd.append('activo', '1');
    await api.crearBanner(fd);
    setDraft({ titulo: '', subtitulo: '', cta_texto: '', cta_url: '', imagen_url: '', expira_at: '' });
    setIdea('');
    load();
  };

  const activar = async (b) => { await api.editarBanner(b.id, formOf({ activo: b.activo ? 0 : 1 })); load(); };
  const borrar = async (b) => { if (confirm('¿Borrar este banner?')) { await api.borrarBanner(b.id); load(); } };
  const cambiarExpiracion = async (b) => {
    const actual = b.expira_at ? new Date(b.expira_at).toISOString().slice(0, 16) : '';
    const nueva = prompt('Caducidad (formato AAAA-MM-DDTHH:MM). Vacío = sin caducidad:', actual);
    if (nueva === null) return; // canceló
    await api.editarBanner(b.id, formOf({ expira_at: nueva }));
    load();
  };

  return (
    <div>
      <H sub="Describí una promo o novedad y la IA te escribe el copy y genera la composición. Después lo publicás en la home.">Banner con IA</H>

      <Card title="Generar con IA">
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="Ej: descuento 15% en proyectos de espalda durante julio; o: agenda abierta para realismo religioso este mes" className="inp w-full" />

        {gen && (
          <div className="mt-4 w-full border border-line bg-snow p-3 sm:p-4">
            <div className="mb-1.5 flex flex-col gap-1 font-body text-[11px] uppercase tracking-wider text-soft sm:flex-row sm:items-center sm:justify-between">
              <span>
                {progress < 30 && "🧠 Estudiando idea y estructurando copy..."}
                {progress >= 30 && progress < 60 && "🎨 Redactando prompts seguros en inglés..."}
                {progress >= 60 && progress < 95 && "⚡ Renderizando imagen B/N libre de censura..."}
                {progress >= 95 && progress < 100 && "⏳ Guardando archivo gráfico en el servidor..."}
                {progress === 100 && "🎉 ¡Estructura de Banner completada!"}
              </span>
              <span className="font-bold text-ink">{progress}%</span>
            </div>
            <div className="h-[3px] w-full overflow-hidden bg-paper">
              <div className="h-full bg-blood transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button onClick={generar} disabled={gen} className="mt-3 w-full bg-ink py-3.5 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood disabled:opacity-50 sm:w-auto sm:px-5 sm:py-2.5">
          {gen ? `Procesando (${progress}%)` : 'Generar composición con IA'}
        </button>
      </Card>

      <Card title="Banner a publicar">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título"><input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} className="inp" /></Field>
          <Field label="CTA (texto del botón)"><input value={draft.cta_texto} onChange={(e) => setDraft({ ...draft, cta_texto: e.target.value })} className="inp" /></Field>
          <Field label="Subtítulo"><input value={draft.subtitulo} onChange={(e) => setDraft({ ...draft, subtitulo: e.target.value })} className="inp" /></Field>
          <Field label="CTA URL (opcional)"><input value={draft.cta_url} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })} placeholder="#contacto" className="inp" /></Field>
          <Field label="Caduca el (opcional)"><input type="datetime-local" value={draft.expira_at} onChange={(e) => setDraft({ ...draft, expira_at: e.target.value })} className="inp" /></Field>
        </div>
        <p className="mt-1.5 font-body text-[11px] text-soft">Si lo dejás vacío, el banner queda activo hasta que lo desactives a mano.</p>

        {draft.imagen_url && (
          <div className="mt-4 border border-line bg-paper p-3">
            <p className="mb-2 font-body text-[10px] uppercase tracking-widest text-soft">Imagen generada por IA</p>
            <div className="max-w-xs overflow-hidden border border-line bg-ink">
              <img src={asset(draft.imagen_url)} alt="Composición gráfica de IA" className="h-auto w-full object-cover" />
            </div>
          </div>
        )}

        {(draft.titulo || draft.subtitulo) && (
          <div className="mt-4 border border-line bg-paper p-4">
            <p className="font-body text-[10px] uppercase tracking-widest text-soft">Vista previa del bloque de texto</p>
            <p className="mt-1 display text-xl">{draft.titulo}</p>
            <p className="font-body text-soft">{draft.subtitulo}</p>
            {draft.cta_texto && <span className="mt-2 inline-block bg-ink px-4 py-1.5 font-body text-xs uppercase text-snow">{draft.cta_texto}</span>}
          </div>
        )}

        <button onClick={crear} disabled={!draft.titulo} className="mt-4 w-full bg-ink py-3.5 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood disabled:opacity-50 sm:w-auto sm:px-5 sm:py-2.5">Publicar banner</button>
      </Card>

      <Card title="Banners">
        {!banners.length && <p className="font-body text-soft">Sin banners creados.</p>}
        <div className="space-y-2">
          {banners.map((b) => {
            const vencido = b.expira_at && new Date(b.expira_at) <= new Date();
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 border border-line p-3 sm:flex-nowrap">
                {b.imagen_url && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden border border-line bg-paper">
                    <img src={asset(b.imagen_url)} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-display font-bold text-ink">{b.titulo}</span>
                  <span className="block truncate font-body text-xs text-soft">{b.subtitulo}</span>
                  {b.expira_at ? (
                    <span className={`mt-0.5 block font-body text-[11px] ${vencido ? 'text-blood' : 'text-soft'}`}>
                      {vencido ? 'Venció el' : 'Caduca el'} {new Date(b.expira_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="mt-0.5 block font-body text-[11px] text-soft">Sin caducidad</span>
                  )}
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-1.5 sm:w-auto sm:flex-row sm:items-center">
                  <button onClick={() => activar(b)} className={`px-3 py-2 font-body text-[11px] uppercase ${b.activo ? 'bg-ink text-snow' : 'border border-line text-soft'}`}>{b.activo ? 'Activo' : 'Activar'}</button>
                  <button onClick={() => cambiarExpiracion(b)} className="border border-line px-3 py-2 font-body text-[11px] uppercase text-soft active:border-ink active:text-ink">Caducidad</button>
                  <button onClick={() => borrar(b)} className="px-3 py-2 font-body text-[11px] text-blood active:underline">Borrar</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
function formOf(obj) { const fd = new FormData(); Object.entries(obj).forEach(([k, v]) => fd.append(k, v)); return fd; }

/* ───────────── GALERÍA ───────────── */
function TabGaleria() {
  const [items, setItems] = useState([]); const [f, setF] = useState({ titulo: '', categoria: 'realismo', destacada: false }); const [file, setFile] = useState(null); const [up, setUp] = useState(false);
  const load = () => api.galeria().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  const subir = async () => {
    if (!file) return; setUp(true);
    const fd = new FormData(); fd.append('imagen', file); fd.append('titulo', f.titulo); fd.append('categoria', f.categoria); fd.append('destacada', f.destacada ? '1' : '0');
    try { await api.subirGaleria(fd); setFile(null); setF({ titulo: '', categoria: 'realismo', destacada: false }); load(); } catch (e) { alert(e.message); } finally { setUp(false); }
  };
  const borrar = async (it) => { if (confirm('¿Borrar imagen?')) { await api.borrarGaleria(it.id); load(); } };
  return (
    <div>
      <H sub="Las imágenes se suben a Cloudinary y se muestran en la galería pública.">Galería</H>
      <Card title="Subir imagen">
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} className="font-body text-sm sm:col-span-3" />
          <input placeholder="Título (opcional)" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className="inp" />
          <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} className="inp">
            {['realismo', 'religioso', 'dark', 'blackwork', 'lettering'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 font-body text-sm text-soft"><input type="checkbox" className="h-4 w-4" checked={f.destacada} onChange={(e) => setF({ ...f, destacada: e.target.checked })} />Destacada</label>
        </div>
        <button onClick={subir} disabled={!file || up} className="mt-3 w-full bg-ink py-3.5 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood disabled:opacity-50 sm:w-auto sm:px-5 sm:py-2.5">{up ? 'Subiendo…' : 'Subir a Cloudinary'}</button>
      </Card>
      {/* En mobile: 2 columnas con el botón Borrar siempre visible (sin hover, que no existe en touch) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className="group relative aspect-square overflow-hidden border border-line">
            <img src={asset(it.imagen_url)} alt={it.titulo} className="h-full w-full object-cover" />
            <button onClick={() => borrar(it)} className="absolute bottom-0 left-0 right-0 bg-ink/85 py-2 font-body text-[11px] uppercase tracking-wide text-snow transition active:bg-blood sm:opacity-0 sm:group-hover:opacity-100">Borrar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── MÉTRICAS ───────────── */
function TabMetricas() {
  const [m, setM] = useState(null); const [rec, setRec] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api.metricas().then(setM).catch(() => {}); }, []);
  const generar = async () => { setBusy(true); try { setRec(await api.recomendaciones(m)); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  if (!m) return <p className="font-body text-soft">Calculando métricas…</p>;
  const maxIng = Math.max(1, ...m.serie_ingresos.map((s) => s.ingresos));
  const kpis = [
    ['Ingresos del mes', eur(m.ingresos_mes_eur)], ['Tatuajes confirmados', m.confirmados_mes],
    ['Ticket promedio', eur(m.ticket_promedio_eur)], ['Presupuestos pendientes', m.presupuestos_pendientes],
    ['Conversión', `${m.tasa_conversion}%`], ['Horas agendadas', `${m.horas_agendadas_mes} h`],
  ];
  return (
    <div>
      <H sub="Estimación de ingresos según precios pactados, KPIs del negocio y recomendaciones de IA.">Métricas</H>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map(([l, v]) => (<div key={l} className="border border-line bg-snow p-4 sm:p-5"><p className="font-body text-[10px] uppercase tracking-widest text-soft sm:text-[11px]">{l}</p><p className="mt-2 display text-2xl text-ink sm:text-3xl">{v}</p></div>))}
      </div>
      <Card title="Ingresos por mes" className="mt-6">
        {m.serie_ingresos.length === 1 && (
          <p className="mb-3 font-body text-[11px] text-soft">Todavía hay un solo mes con datos — el gráfico se va a volver comparativo a medida que se acumulen más meses.</p>
        )}
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: 180 }}>
          {m.serie_ingresos.length ? m.serie_ingresos.map((s) => (
            <div key={s.mes} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-col justify-end" style={{ height: 140 }}>
                <span className="mb-1 text-center font-body text-[10px] font-semibold text-ink">{eur(s.ingresos)}</span>
                <div className="w-full bg-ink" style={{ height: `${Math.max((s.ingresos / maxIng) * 100, 6)}%` }} title={eur(s.ingresos)} />
              </div>
              <span className="font-body text-[9px] text-soft sm:text-[10px]">{s.mes.slice(5)}</span>
            </div>
          )) : <p className="font-body text-soft">Aún sin datos.</p>}
        </div>
      </Card>
      <Card title="Recomendaciones de marketing (IA)">
        <button onClick={generar} disabled={busy} className="w-full bg-ink py-3.5 font-body text-xs font-semibold uppercase tracking-wide text-snow active:bg-blood disabled:opacity-50 sm:w-auto sm:px-5 sm:py-2.5">{busy ? 'Analizando…' : 'Generar recomendaciones'}</button>
        {rec && (
          <div className="mt-4">
            {rec.diagnostico && <p className="mb-3 border-l-2 border-blood pl-3 font-body text-sm italic text-soft">{rec.diagnostico}</p>}
            <ul className="space-y-2">{(rec.recomendaciones || []).map((r, i) => <li key={i} className="flex gap-3 font-body text-sm text-ink"><span className="font-display font-bold text-blood">{i + 1}</span>{r}</li>)}</ul>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ───────────── TATUAJES POR CLIENTE ───────────── */
function TabClientes() {
  const [clientes, setClientes] = useState([]);
  useEffect(() => { api.clientes().then(setClientes).catch(() => {}); }, []);
  return (
    <div>
      <H sub="Historial de trabajos agrupados por cliente.">Tatuajes por cliente</H>
      {!clientes.length && <p className="font-body text-soft">Todavía no hay clientes con proyectos.</p>}
      <div className="space-y-4">
        {clientes.map((c) => (
          <div key={c.id} className="border border-line bg-snow p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="truncate font-display text-base font-bold text-ink sm:text-lg">{c.nombre}</p><p className="truncate font-body text-xs text-soft sm:text-sm">{c.email || 's/email'} · {c.telefono || 's/tel'}</p></div>
              {c.telefono && <a href={WA(c.telefono)} target="_blank" rel="noreferrer" className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#25D366]"><svg viewBox="0 0 32 32" className="h-4 w-4 fill-white"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6C14 28.4 15 28.6 16 28.6c6.6 0 12-5.4 12-12S22.6 3 16 3z"/></svg></a>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {c.proyectos.map((p) => (
                <div key={p.id} className="min-w-0">
                  <div className="aspect-square overflow-hidden border border-line bg-paper">{p.diseno_url ? <img src={asset(p.diseno_url)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center font-body text-[9px] uppercase text-soft">sin foto</div>}</div>
                  <p className="mt-1 truncate font-body text-xs text-ink">{p.titulo}</p>
                  <p className="truncate font-body text-[10px] text-soft sm:text-[11px]">{eur(p.precio)} · {p.estado}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── UI helpers ───────────── */
function Card({ title, children, className = '' }) {
  return <section className={`mb-5 border border-line bg-snow p-4 sm:p-5 ${className}`}><h2 className="mb-4 font-body text-xs font-semibold uppercase tracking-[0.18em] text-soft">{title}</h2>{children}</section>;
}
function Field({ label, children }) {
  return <label className="block"><span className="mb-1 block font-body text-[11px] uppercase tracking-wide text-soft">{label}</span>{children}</label>;
}
