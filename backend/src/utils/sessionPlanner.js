import db from '../config/db.js';
import 'dotenv/config';

/**
 * Planificador de sesiones.
 *
 * Reglas (parametrizables por .env):
 *  - Una sesión dura como máximo SESSION_MAX_HOURS (ej. 6h).
 *  - Piezas grandes se parten en N sesiones; entre sesiones de la MISMA
 *    pieza hay un descanso de cicatrización (HEALING_GAP_DAYS, ~3 semanas).
 *  - Solo se agenda en WORK_DAYS, entre WORK_START_HOUR y WORK_END_HOUR.
 *  - Se busca el primer hueco libre que no choque con turnos existentes.
 */

const env = (k, d) => process.env[k] ?? d;
const num = (k, d) => Number(env(k, d));

const cfg = () => ({
  maxHours: num('SESSION_MAX_HOURS', 6),
  healingDays: num('HEALING_GAP_DAYS', 21),
  workDays: env('WORK_DAYS', '2,3,4,5,6').split(',').map(Number), // 0=dom
  startHour: num('WORK_START_HOUR', 11),
  endHour: num('WORK_END_HOUR', 20),
});

/** Cuántas sesiones y de qué duración para X horas totales */
export function splitIntoSessions(totalHours) {
  const { maxHours } = cfg();
  const n = Math.max(1, Math.ceil(totalHours / maxHours));
  const base = Math.floor((totalHours / n) * 2) / 2; // medias horas
  const sessions = Array.from({ length: n }, () => base);
  let remainder = +(totalHours - base * n).toFixed(1);
  let i = 0;
  while (remainder > 0.01) {
    sessions[i % n] += 0.5;
    remainder -= 0.5;
    i++;
  }
  return sessions; // ej. [6, 6, 4]  para 16h
}

function isWorkDay(date, workDays) {
  return workDays.includes(date.getDay());
}

/** Próximo inicio válido a partir de `from`, respetando días/horas laborales */
function nextSlotStart(from, workDays, startHour) {
  const d = new Date(from);
  if (d.getHours() < startHour) d.setHours(startHour, 0, 0, 0);
  // si ya pasó el horario, ir al día siguiente
  while (!isWorkDay(d, workDays)) d.setDate(d.getDate() + 1);
  d.setHours(startHour, 0, 0, 0);
  return d;
}

async function hasConflict(inicio, fin) {
  const { rows } = await db.query(
    `SELECT id FROM turnos
     WHERE estado <> 'cancelado'
       AND inicio < ? AND fin > ?
     LIMIT 1`,
    [fin, inicio]
  );
  return rows.length > 0;
}

/**
 * Devuelve un plan de sesiones con fechas concretas y libres.
 * @param {number} totalHours
 * @param {Date|string} earliest  fecha mínima de inicio (default: hoy+2 días)
 */
export async function planSessions(totalHours, earliest) {
  const { healingDays, workDays, startHour, endHour } = cfg();
  const durations = splitIntoSessions(totalHours);

  let cursor = new Date(earliest || Date.now() + 2 * 864e5);
  cursor = nextSlotStart(cursor, workDays, startHour);

  const plan = [];
  for (let s = 0; s < durations.length; s++) {
    const dur = durations[s];
    let placed = false;
    let guard = 0;

    while (!placed && guard < 365) {
      guard++;
      if (!isWorkDay(cursor, workDays)) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startHour, 0, 0, 0);
        continue;
      }
      const fin = new Date(cursor.getTime() + dur * 36e5);
      const finOk = fin.getHours() <= endHour && fin.getDate() === cursor.getDate();

      if (finOk && !(await hasConflict(cursor, fin))) {
        plan.push({
          numero_sesion: s + 1,
          total_sesiones: durations.length,
          horas: dur,
          inicio: new Date(cursor),
          fin,
        });
        placed = true;
        // siguiente sesión: tras el descanso de cicatrización
        cursor = new Date(fin.getTime() + healingDays * 864e5);
        cursor = nextSlotStart(cursor, workDays, startHour);
      } else {
        // probar día siguiente
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(startHour, 0, 0, 0);
      }
    }
  }
  return plan;
}
