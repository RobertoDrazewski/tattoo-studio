import db from '../config/db.js';
import { getOpenAI, OPENAI_MODEL } from '../services/openai.js';

/** GET /api/metricas  (admin) */
export async function metricas(_req, res) {
  try {
    const [pend, confMes, ingresoMes, ticket, totalPres, totalConf, horasMes, serie] = await Promise.all([
      db.query("SELECT COUNT(*) c FROM proyectos WHERE estado='presupuesto'"),
      db.query("SELECT COUNT(*) c FROM proyectos WHERE estado IN ('confirmado','en_proceso','finalizado') AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())"),
      db.query("SELECT COALESCE(SUM(precio_pactado),0) s FROM proyectos WHERE estado IN ('confirmado','en_proceso','finalizado') AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())"),
      db.query("SELECT COALESCE(AVG(precio_pactado),0) a FROM proyectos WHERE precio_pactado IS NOT NULL AND estado<>'cancelado'"),
      db.query("SELECT COUNT(*) c FROM proyectos"),
      db.query("SELECT COUNT(*) c FROM proyectos WHERE estado IN ('confirmado','en_proceso','finalizado')"),
      db.query("SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE,inicio,fin))/60,0) h FROM turnos WHERE MONTH(inicio)=MONTH(CURDATE()) AND YEAR(inicio)=YEAR(CURDATE()) AND estado<>'cancelado'"),
      db.query(`SELECT DATE_FORMAT(created_at,'%Y-%m') mes, COALESCE(SUM(precio_pactado),0) ingresos, COUNT(*) tatuajes
                FROM proyectos WHERE estado IN ('confirmado','en_proceso','finalizado')
                GROUP BY mes ORDER BY mes DESC LIMIT 6`),
    ]);

    const totalP = totalPres.rows[0].c || 0;
    const totalC = totalConf.rows[0].c || 0;
    const data = {
      presupuestos_pendientes: pend.rows[0].c,
      confirmados_mes: confMes.rows[0].c,
      ingresos_mes_eur: Math.round(ingresoMes.rows[0].s),
      ticket_promedio_eur: Math.round(ticket.rows[0].a),
      horas_agendadas_mes: Math.round(horasMes.rows[0].h * 10) / 10,
      tasa_conversion: totalP ? Math.round((totalC / totalP) * 100) : 0,
      serie_ingresos: serie.rows.reverse(),
    };
    res.json(data);
  } catch (e) {
    console.error('[metricas]', e);
    res.status(500).json({ error: 'No se pudieron calcular las métricas' });
  }
}

/** POST /api/metricas/recomendaciones  (admin) — IA de marketing */
export async function recomendaciones(req, res) {
  try {
    const ai = getOpenAI();
    const m = req.body.metricas || {};
    if (!ai) return res.json({ recomendaciones: ['Configurá OPENAI_API_KEY para recibir recomendaciones de IA.'] });

    const prompt = `Sos consultor de marketing para un estudio de tatuajes de realismo B/N (religioso/dark) en España,
cuyos clientes llegan sobre todo por Instagram (@rick.art13). Estos son los números del mes:
- Presupuestos pendientes: ${m.presupuestos_pendientes}
- Tatuajes confirmados este mes: ${m.confirmados_mes}
- Ingresos del mes: ${m.ingresos_mes_eur} €
- Ticket promedio: ${m.ticket_promedio_eur} €
- Tasa de conversión presupuesto→confirmado: ${m.tasa_conversion}%
- Horas agendadas este mes: ${m.horas_agendadas_mes}

Dame 4 recomendaciones concretas y accionables para mejorar ingresos y conversión, priorizando Instagram y el estilo del estudio.
Respondé SOLO con un JSON: { "diagnostico": string (1 frase), "recomendaciones": string[4] }`;

    const c = await ai.chat.completions.create({
      model: OPENAI_MODEL, temperature: 0.6, response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });
    res.json(JSON.parse(c.choices[0].message.content));
  } catch (e) {
    console.error('[recomendaciones]', e);
    res.status(500).json({ error: 'No se pudieron generar recomendaciones' });
  }
}