import { getInstagramFeed } from '../services/instagram.js';

/** GET /api/instagram  (público, cacheado) */
export async function feed(req, res) {
  try {
    const data = await getInstagramFeed({ force: req.query.force === '1' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener Instagram', items: [] });
  }
}
