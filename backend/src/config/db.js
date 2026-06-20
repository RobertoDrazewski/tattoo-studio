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

const pool = mysql.createPool({
  ...(typeof poolConfig === 'string' ? { uri: poolConfig } : poolConfig),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

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
