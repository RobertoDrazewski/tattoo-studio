import db from '../config/db.js';
import { planSessions } from '../utils/sessionPlanner.js';

/** GET /api/turnos?desde=&hasta=&todos=1  (admin) — para el calendario */
export async function listarTurnos(req, res) {
  const { desde, hasta, todos } = req.query;
  const params = [];
  let sql = `SELECT t.*, c.nombre AS cliente_nombre, c.telefono, c.email,
                    p.titulo AS proyecto_titulo, p.zona_cuerpo, p.precio_pactado
             FROM turnos t
             JOIN clientes c ON c.id=t.cliente_id
             LEFT JOIN proyectos p ON p.id=t.proyecto_id`;
  const where = [];
  if (!todos) where.push("t.estado<>'cancelado'");
  if (desde) { where.push('t.inicio>=?'); params.push(desde); }
  if (hasta) { where.push('t.inicio<=?'); params.push(hasta); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY t.inicio ASC';
  const { rows } = await db.query(sql, params);
  res.json(rows);
}

/** PATCH /api/turnos/:id (admin) — reprogramar / cambiar estado */
export async function actualizarTurno(req, res) {
  const { inicio, fin, estado, notas } = req.body;
  const f = [], p = [];
  if (inicio) { f.push('inicio=?'); p.push(inicio); }
  if (fin) { f.push('fin=?'); p.push(fin); }
  if (estado) { f.push('estado=?'); p.push(estado); }
  if (notas !== undefined) { f.push('notas=?'); p.push(notas); }
  if (!f.length) return res.status(400).json({ error: 'Nada para actualizar' });
  p.push(req.params.id);
  await db.query(`UPDATE turnos SET ${f.join(', ')} WHERE id=?`, p);
  res.json({ ok: true });
}

/** GET /api/disponibilidad?horas= — propone fechas tentativas (no agenda) */
export async function disponibilidad(req, res) {
  const plan = await planSessions(Number(req.query.horas || 3), req.query.desde);
  res.json(plan.map((s) => ({ inicio: s.inicio, fin: s.fin, numero_sesion: s.numero_sesion, total_sesiones: s.total_sesiones })));
}