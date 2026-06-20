import db from '../config/db.js';

/** Helper interno: trae todo el tarifario (lo usa la cotización por IA) */
export async function getTariffs() {
  const [{ rows: cfg }, { rows: zonas }, { rows: estilos }, { rows: insumos }] = await Promise.all([
    db.query('SELECT * FROM tarifa_config WHERE id=1'),
    db.query('SELECT * FROM tarifa_zonas ORDER BY zona'),
    db.query('SELECT * FROM tarifa_estilos ORDER BY estilo'),
    db.query('SELECT * FROM tarifa_insumos ORDER BY id'),
  ]);
  return {
    config: cfg[0] || { tarifa_hora_eur: 90, minimo_sesion_eur: 60, deposito_pct: 30, session_max_hours: 6 },
    zonas, estilos, insumos,
  };
}

/** Calcula precio a partir de horas + zona + estilo usando el tarifario */
export function calcPrecio(tarifas, { horas, zona, estilo, sesiones = 1 }) {
  const base = Number(tarifas.config.tarifa_hora_eur) || 90;
  const z = tarifas.zonas.find((x) => x.zona.toLowerCase() === (zona || '').toLowerCase());
  const e = tarifas.estilos.find((x) => x.estilo.toLowerCase() === (estilo || '').toLowerCase());
  const mz = z ? Number(z.multiplicador) : 1;
  const me = e ? Number(e.multiplicador) : 1;
  const insumosPorSesion = tarifas.insumos.filter((i) => i.por_sesion).reduce((s, i) => s + Number(i.costo_eur), 0);
  const insumosFijos = tarifas.insumos.filter((i) => !i.por_sesion).reduce((s, i) => s + Number(i.costo_eur), 0);

  let total = horas * base * mz * me + insumosPorSesion * sesiones + insumosFijos;
  total = Math.max(total, Number(tarifas.config.minimo_sesion_eur) * sesiones);
  const min = Math.round(total);
  const max = Math.round(total * 1.2);
  return { min, max, deposito: Math.round(min * (Number(tarifas.config.deposito_pct) / 100)) };
}

// ── Endpoints ──
export async function getTarifas(_req, res) {
  res.json(await getTariffs());
}

export async function updateConfig(req, res) {
  const { tarifa_hora_eur, minimo_sesion_eur, deposito_pct, session_max_hours } = req.body;
  await db.query(
    `UPDATE tarifa_config SET tarifa_hora_eur=?, minimo_sesion_eur=?, deposito_pct=?, session_max_hours=? WHERE id=1`,
    [tarifa_hora_eur, minimo_sesion_eur, deposito_pct, session_max_hours]
  );
  res.json({ ok: true });
}

const tablas = { zonas: ['tarifa_zonas', 'zona'], estilos: ['tarifa_estilos', 'estilo'] };

export async function addItem(req, res) {
  const { tipo } = req.params; // zonas | estilos | insumos
  if (tipo === 'insumos') {
    const { nombre, costo_eur = 0, por_sesion = 1 } = req.body;
    const { rows } = await db.query('INSERT INTO tarifa_insumos (nombre,costo_eur,por_sesion) VALUES (?,?,?)', [nombre, costo_eur, por_sesion ? 1 : 0]);
    return res.status(201).json({ id: rows.insertId });
  }
  const t = tablas[tipo];
  if (!t) return res.status(400).json({ error: 'tipo inválido' });
  const nombre = req.body[t[1]];
  const { multiplicador = 1, nota = null } = req.body;
  const { rows } = await db.query(`INSERT INTO ${t[0]} (${t[1]},multiplicador,nota) VALUES (?,?,?)`, [nombre, multiplicador, nota]);
  res.status(201).json({ id: rows.insertId });
}

export async function updateItem(req, res) {
  const { tipo, id } = req.params;
  if (tipo === 'insumos') {
    const { nombre, costo_eur, por_sesion } = req.body;
    await db.query('UPDATE tarifa_insumos SET nombre=?, costo_eur=?, por_sesion=? WHERE id=?', [nombre, costo_eur, por_sesion ? 1 : 0, id]);
    return res.json({ ok: true });
  }
  const t = tablas[tipo];
  if (!t) return res.status(400).json({ error: 'tipo inválido' });
  await db.query(`UPDATE ${t[0]} SET ${t[1]}=?, multiplicador=?, nota=? WHERE id=?`, [req.body[t[1]], req.body.multiplicador, req.body.nota || null, id]);
  res.json({ ok: true });
}

export async function deleteItem(req, res) {
  const { tipo, id } = req.params;
  const map = { zonas: 'tarifa_zonas', estilos: 'tarifa_estilos', insumos: 'tarifa_insumos' };
  if (!map[tipo]) return res.status(400).json({ error: 'tipo inválido' });
  await db.query(`DELETE FROM ${map[tipo]} WHERE id=?`, [id]);
  res.json({ ok: true });
}
