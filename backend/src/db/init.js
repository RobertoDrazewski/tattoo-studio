import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const raw = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const clean = raw.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  const statements = clean.split(';').map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) await db.pool.query(stmt);
  console.log(`✓ ${statements.length} statements aplicados`);

  const email = process.env.SEED_ADMIN_EMAIL || 'ricardoaizcorbe84@gmail.com';
  const pass = process.env.SEED_ADMIN_PASSWORD || 'rickart2026';
  const { rows } = await db.query('SELECT id FROM admins WHERE email=?', [email]);
  if (!rows.length) {
    const hash = await bcrypt.hash(pass, 10);
    await db.query('INSERT INTO admins (email,password_hash,nombre,rol) VALUES (?,?,?,?)', [email, hash, 'Ricardo', 'owner']);
    console.log(`✓ Admin: ${email} / ${pass} (cambialo)`);
  }

  await db.query(`INSERT INTO tarifa_config (id,tarifa_hora_eur,minimo_sesion_eur,deposito_pct,session_max_hours)
     VALUES (1,90,60,30,6) ON DUPLICATE KEY UPDATE id=id`);

  const { rows: zr } = await db.query('SELECT COUNT(*) c FROM tarifa_zonas');
  if (!zr[0].c) {
    const zonas = [['antebrazo',1.0],['brazo',1.1],['hombro',1.15],['pecho',1.25],['espalda',1.3],['pierna',1.1],['mano',1.4],['cuello',1.45],['costillas',1.5]];
    for (const [z,m] of zonas) await db.query('INSERT INTO tarifa_zonas (zona,multiplicador) VALUES (?,?)', [z,m]);
  }
  const { rows: er } = await db.query('SELECT COUNT(*) c FROM tarifa_estilos');
  if (!er[0].c) {
    const estilos = [['realismo',1.2],['religioso',1.25],['dark',1.2],['blackwork',1.0],['lettering',0.9],['fine line',0.85]];
    for (const [e,m] of estilos) await db.query('INSERT INTO tarifa_estilos (estilo,multiplicador) VALUES (?,?)', [e,m]);
  }
  const { rows: ir } = await db.query('SELECT COUNT(*) c FROM tarifa_insumos');
  if (!ir[0].c) {
    const insumos = [['Material descartable y tintas',25,1],['Diseño / boceto personalizado',40,0]];
    for (const [n,c,p] of insumos) await db.query('INSERT INTO tarifa_insumos (nombre,costo_eur,por_sesion) VALUES (?,?,?)', [n,c,p]);
  }
  console.log('✓ Tarifas sembradas');
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
