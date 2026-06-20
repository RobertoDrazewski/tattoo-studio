import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Pool MySQL para Railway.
 * Soporta MYSQL_URL (string de conexión que expone Railway) o variables sueltas.
 *
 * Patrón de uso (igual que en Good Trip / El Manzano):
 *   const { rows } = await db.query('SELECT * FROM artistas WHERE id = ?', [id]);
 * `query` SIEMPRE devuelve { rows }, nunca un array suelto.
 */

const poolConfig = process.env.MYSQL_URL
  ? process.env.MYSQL_URL
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

// Log seguro (sin password) de a qué host se está conectando realmente.
// Útil para detectar en los logs de Railway si quedó apuntando a la URL pública
// en vez de la interna (mysql.railway.internal) o viceversa.
try {
  const hostShown = typeof poolConfig === 'string'
    ? new URL(poolConfig.replace('mysql://', 'http://')).hostname
    : poolConfig.host;
  console.log(`[db] conectando a host: ${hostShown}`);
} catch {
  console.log('[db] conectando (no se pudo parsear el host para el log)');
}

const pool = mysql.createPool({
  ...(typeof poolConfig === 'string' ? { uri: poolConfig } : poolConfig),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  connectTimeout: 10000, // 10s — si el host no responde, falla rápido en vez de colgar el proceso (502 sin info)
});

pool.on('error', (err) => console.error('[db] pool error:', err.code || err.message));

export const db = {
  /** Devuelve siempre { rows } */
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return { rows };
  },
  /** Para transacciones / control fino */
  getConnection: () => pool.getConnection(),
  pool,
};

export default db;