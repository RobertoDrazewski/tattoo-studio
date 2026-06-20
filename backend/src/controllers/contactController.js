import db from '../config/db.js';
import { sendContactEmail } from '../services/email.js';

/** POST /api/contacto (público) */
export async function crearContacto(req, res) {
  const { nombre, email, telefono, mensaje } = req.body;
  if (!nombre || !mensaje) return res.status(400).json({ error: 'Nombre y mensaje son obligatorios' });
  await db.query(
    'INSERT INTO contactos (nombre, email, telefono, mensaje) VALUES (?,?,?,?)',
    [nombre, email || null, telefono || null, mensaje]
  );
  sendContactEmail({ nombre, email, telefono, mensaje }).catch(() => {});
  res.status(201).json({ ok: true });
}

/** GET /api/contacto (admin) */
export async function listarContactos(_req, res) {
  const { rows } = await db.query('SELECT * FROM contactos ORDER BY created_at DESC LIMIT 200');
  res.json(rows);
}
