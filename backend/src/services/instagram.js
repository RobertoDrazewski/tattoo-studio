import db from '../config/db.js';
import 'dotenv/config';

/**
 * Instagram con Graph API ("Instagram API with Instagram Login").
 * ⚠️ La Basic Display API se dio de baja el 04/12/2024. Hace falta:
 *   - Cuenta de Instagram PROFESIONAL (Business o Creator)
 *   - App en developers.facebook.com con el producto "Instagram"
 *   - Token de larga duración (IG_ACCESS_TOKEN) + IG_USER_ID
 * Ver README → "Conectar Instagram".
 *
 * Estrategia: cacheamos el feed en MySQL y solo refrescamos cada
 * IG_CACHE_HOURS. Si no hay token o falla, devolvemos la galería local.
 */

const GRAPH = 'https://graph.instagram.com';

async function fetchFromGraph() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error('IG_ACCESS_TOKEN ausente');

  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
  const url = `${GRAPH}/me/media?fields=${fields}&limit=12&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Graph API ${res.status}`);
  const json = await res.json();

  return (json.data || [])
    .filter((m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM')
    .map((m) => ({
      id: m.id,
      caption: m.caption || '',
      image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
      permalink: m.permalink,
      timestamp: m.timestamp,
    }));
}

async function localFallback() {
  const { rows } = await db.query(
    'SELECT imagen_url, titulo FROM galeria ORDER BY destacada DESC, orden ASC, id DESC LIMIT 12'
  );
  return rows.map((r, i) => ({
    id: `local-${i}`,
    caption: r.titulo || '',
    image: r.imagen_url,
    permalink: process.env.IG_PROFILE_URL || 'https://instagram.com/rick.art13',
    local: true,
  }));
}

/** Devuelve el feed, usando cache si está fresco */
export async function getInstagramFeed({ force = false } = {}) {
  const cacheHours = Number(process.env.IG_CACHE_HOURS || 6);

  if (!force) {
    const { rows } = await db.query(
      'SELECT payload, fetched_at FROM instagram_cache ORDER BY id DESC LIMIT 1'
    );
    if (rows.length) {
      const ageHrs = (Date.now() - new Date(rows[0].fetched_at).getTime()) / 36e5;
      if (ageHrs < cacheHours) {
        const payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
        return { source: 'cache', items: payload };
      }
    }
  }

  try {
    const items = await fetchFromGraph();
    await db.query('INSERT INTO instagram_cache (payload) VALUES (?)', [JSON.stringify(items)]);
    // limpiamos cache vieja
    await db.query('DELETE FROM instagram_cache WHERE id NOT IN (SELECT id FROM (SELECT id FROM instagram_cache ORDER BY id DESC LIMIT 3) t)');
    return { source: 'graph', items };
  } catch (err) {
    console.warn('[instagram] fallback a galería local:', err.message);
    const items = await localFallback();
    return { source: 'fallback', items, error: err.message };
  }
}