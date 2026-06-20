import db from '../config/db.js';
import { persistImage } from '../middleware/upload.js';
import { destroyImage } from '../services/cloudinary.js';

export async function listarGaleria(req, res) {
  const { categoria } = req.query;
  const params = [];
  let sql = 'SELECT id, imagen_url, titulo, categoria, destacada FROM galeria';
  if (categoria) { sql += ' WHERE categoria=?'; params.push(categoria); }
  sql += ' ORDER BY destacada DESC, orden ASC, id DESC';
  const { rows } = await db.query(sql, params);
  res.json(rows);
}

export async function subirGaleria(req, res) {
  try {
    const { titulo = '', categoria = 'realismo', destacada = 0 } = req.body;
    const img = await persistImage(req.file, 'galeria');
    if (!img) return res.status(400).json({ error: 'Falta la imagen' });
    const { rows } = await db.query(
      'INSERT INTO galeria (imagen_url, public_id, titulo, categoria, destacada) VALUES (?,?,?,?,?)',
      [img.url, img.public_id, titulo, categoria, destacada ? 1 : 0]
    );
    res.status(201).json({ id: rows.insertId, imagen_url: img.url });
  } catch (e) {
    console.error('[subirGaleria]', e);
    res.status(500).json({ error: 'No se pudo subir la imagen' });
  }
}

export async function borrarGaleria(req, res) {
  const { rows } = await db.query('SELECT public_id FROM galeria WHERE id=?', [req.params.id]);
  await db.query('DELETE FROM galeria WHERE id=?', [req.params.id]);
  if (rows[0]?.public_id) destroyImage(rows[0].public_id);
  res.json({ ok: true });
}

export async function editarGaleria(req, res) {
  const { titulo, categoria, destacada, orden } = req.body;
  const f = [], p = [];
  if (titulo !== undefined) { f.push('titulo=?'); p.push(titulo); }
  if (categoria !== undefined) { f.push('categoria=?'); p.push(categoria); }
  if (destacada !== undefined) { f.push('destacada=?'); p.push(destacada ? 1 : 0); }
  if (orden !== undefined) { f.push('orden=?'); p.push(orden); }
  if (!f.length) return res.status(400).json({ error: 'Nada para actualizar' });
  p.push(req.params.id);
  await db.query(`UPDATE galeria SET ${f.join(', ')} WHERE id=?`, p);
  res.json({ ok: true });
}
