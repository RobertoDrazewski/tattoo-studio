import db from '../config/db.js';
import { planSessions } from '../utils/sessionPlanner.js';
import { destroyImage } from '../services/cloudinary.js';
import { sendBudgetEmail, sendAppointmentEmail, notifyStudio } from '../services/email.js';

async function upsertCliente({ nombre, email, telefono, instagram }) {
  if (email) {
    const { rows } = await db.query('SELECT id FROM clientes WHERE email=? LIMIT 1', [email]);
    if (rows.length) {
      await db.query('UPDATE clientes SET nombre=?, telefono=COALESCE(?,telefono) WHERE id=?', [nombre, telefono || null, rows[0].id]);
      return rows[0].id;
    }
  }
  const { rows } = await db.query('INSERT INTO clientes (nombre,email,telefono,instagram) VALUES (?,?,?,?)', [nombre, email || null, telefono || null, instagram || null]);
  return rows.insertId;
}

/**
 * Crea una RESERVA en estado 'presupuesto' (sin fecha). La usa el chat IA
 * cuando el cliente confirma interés. No toca el calendario todavía.
 */
export async function crearReserva(req, res) {
  try {
    const { cliente, cotizacion_id, titulo, zona_cuerpo, estilo, horas_totales, sesiones, precio } = req.body;
    if (!cliente?.nombre) return res.status(400).json({ error: 'Falta el cliente' });
    const clienteId = await upsertCliente(cliente);
    const { rows } = await db.query(
      `INSERT INTO proyectos (cliente_id, cotizacion_id, titulo, zona_cuerpo, estilo, horas_totales, sesiones_pactadas, precio_pactado, estado)
       VALUES (?,?,?,?,?,?,?,?, 'presupuesto')`,
      [clienteId, cotizacion_id || null, titulo || 'Tatuaje', zona_cuerpo || null, estilo || null, horas_totales || null, sesiones || 1, precio || null]
    );
    if (cotizacion_id) await db.query("UPDATE cotizaciones SET estado='enviada', cliente_id=? WHERE id=?", [clienteId, cotizacion_id]);

    Promise.allSettled([
      sendBudgetEmail({ to: cliente.email, nombre: cliente.nombre, titulo, precio, sesiones }),
      notifyStudio({ nombre: cliente.nombre, telefono: cliente.telefono, titulo, precio, tipo: 'presupuesto' }),
    ]);
    res.status(201).json({ proyecto_id: rows.insertId, estado: 'presupuesto' });
  } catch (e) {
    console.error('[crearReserva]', e);
    res.status(500).json({ error: 'No se pudo crear la reserva' });
  }
}

/** Lista reservas para el panel. ?estado=presupuesto|confirmado|... */
export async function listarReservas(req, res) {
  const { estado } = req.query;
  const params = [];
  let sql = `SELECT p.*, c.nombre AS cliente_nombre, c.email, c.telefono, c.instagram,
                    co.imagen_url AS diseno_url, co.tamano_cm
             FROM proyectos p
             JOIN clientes c ON c.id = p.cliente_id
             LEFT JOIN cotizaciones co ON co.id = p.cotizacion_id`;
  if (estado) { sql += ' WHERE p.estado = ?'; params.push(estado); }
  sql += ' ORDER BY p.created_at DESC';
  const { rows } = await db.query(sql, params);
  res.json(rows);
}

/** Edita una reserva (precio pactado, depósito, estado, notas) */
export async function actualizarReserva(req, res) {
  const { id } = req.params;
  const { precio_pactado, sesiones_pactadas, deposito_pagado, estado, notas } = req.body;
  const f = [], p = [];
  if (precio_pactado !== undefined) { f.push('precio_pactado=?'); p.push(precio_pactado); }
  if (sesiones_pactadas !== undefined) { f.push('sesiones_pactadas=?'); p.push(sesiones_pactadas); }
  if (deposito_pagado !== undefined) { f.push('deposito_pagado=?'); p.push(deposito_pagado ? 1 : 0); }
  if (estado !== undefined) { f.push('estado=?'); p.push(estado); }
  if (notas !== undefined) { f.push('notas=?'); p.push(notas); }
  if (!f.length) return res.status(400).json({ error: 'Nada para actualizar' });
  p.push(id);
  await db.query(`UPDATE proyectos SET ${f.join(', ')} WHERE id=?`, p);
  res.json({ ok: true });
}

/**
 * Agenda la reserva: crea las sesiones en el calendario y pasa a 'confirmado'.
 * body opcional: { desde, precio_pactado, sesiones }
 */
export async function agendarReserva(req, res) {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { desde, precio_pactado, sesiones } = req.body;
    const { rows } = await db.query(
      `SELECT p.*, c.nombre, c.email FROM proyectos p JOIN clientes c ON c.id=p.cliente_id WHERE p.id=?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Reserva no encontrada' });
    const proy = rows[0];
    const horas = Number(proy.horas_totales) || (Number(sesiones || proy.sesiones_pactadas || 1) * 4);

    const plan = await planSessions(horas, desde);
    if (!plan.length) return res.status(409).json({ error: 'Sin disponibilidad en el rango' });

    await conn.beginTransaction();
    await conn.execute(
      `UPDATE proyectos SET estado='confirmado', precio_pactado=COALESCE(?,precio_pactado), sesiones_pactadas=? WHERE id=?`,
      [precio_pactado ?? null, plan.length, id]
    );
    await conn.execute('DELETE FROM turnos WHERE proyecto_id=?', [id]); // regenera si reagenda
    for (const s of plan) {
      await conn.execute(
        `INSERT INTO turnos (proyecto_id,cliente_id,numero_sesion,total_sesiones,inicio,fin,estado,origen)
         VALUES (?,?,?,?,?,?, 'confirmado','admin')`,
        [id, proy.cliente_id, s.numero_sesion, s.total_sesiones, s.inicio, s.fin]
      );
    }
    if (proy.cotizacion_id) await conn.execute("UPDATE cotizaciones SET estado='agendada' WHERE id=?", [proy.cotizacion_id]);
    await conn.commit();

    Promise.allSettled([
      sendAppointmentEmail({ to: proy.email, nombre: proy.nombre, sesiones: plan, proyecto: proy.titulo }),
    ]);
    res.json({ ok: true, sesiones: plan.map((s) => ({ numero_sesion: s.numero_sesion, total_sesiones: s.total_sesiones, inicio: s.inicio, fin: s.fin })) });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error('[agendarReserva]', e);
    res.status(500).json({ error: 'No se pudo agendar' });
  } finally {
    conn.release();
  }
}

/** Elimina una reserva no concretada (y su imagen de diseño) */
export async function eliminarReserva(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT co.public_id FROM proyectos p LEFT JOIN cotizaciones co ON co.id=p.cotizacion_id WHERE p.id=?`, [id]
  );
  await db.query('DELETE FROM proyectos WHERE id=?', [id]); // cascade borra turnos
  if (rows[0]?.public_id) destroyImage(rows[0].public_id);
  res.json({ ok: true });
}

/** Tatuajes agrupados por cliente */
export async function tatuajesPorCliente(_req, res) {
  const { rows } = await db.query(
    `SELECT c.id, c.nombre, c.email, c.telefono, c.instagram,
            p.id AS proyecto_id, p.titulo, p.estado, p.precio_pactado, p.zona_cuerpo, p.created_at,
            co.imagen_url AS diseno_url
     FROM clientes c
     JOIN proyectos p ON p.cliente_id = c.id
     LEFT JOIN cotizaciones co ON co.id = p.cotizacion_id
     ORDER BY c.nombre, p.created_at DESC`
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) map.set(r.id, { id: r.id, nombre: r.nombre, email: r.email, telefono: r.telefono, instagram: r.instagram, proyectos: [] });
    map.get(r.id).proyectos.push({ id: r.proyecto_id, titulo: r.titulo, estado: r.estado, precio: r.precio_pactado, zona: r.zona_cuerpo, diseno_url: r.diseno_url, fecha: r.created_at });
  }
  res.json([...map.values()]);
}
