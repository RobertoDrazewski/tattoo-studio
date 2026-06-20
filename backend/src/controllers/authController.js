import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

/** POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await db.query('SELECT * FROM admins WHERE email=? LIMIT 1', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign(
    { id: rows[0].id, email: rows[0].email, rol: rows[0].rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
  res.json({ token, admin: { id: rows[0].id, email: rows[0].email, nombre: rows[0].nombre } });
}

/** GET /api/auth/me */
export async function me(req, res) {
  res.json({ admin: req.admin });
}
