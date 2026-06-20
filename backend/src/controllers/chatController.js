import { getOpenAI, OPENAI_MODEL } from '../services/openai.js';
import db from '../config/db.js';
import { getTariffs, calcPrecio } from './tariffController.js';
import { sendBudgetEmail, notifyStudio } from '../services/email.js';

const SYSTEM = `Eres "Tinta", la asistente IA del estudio Rick Art (tatuajes de realismo B/N, religioso y dark, en España).
Español, tono cercano y profesional, frases cortas, sin emojis. NO inventes precios: usá la herramienta consultar_precio.
Flujo del estudio (importante, explicalo si preguntan):
- Primero damos un PRESUPUESTO. El presupuesto NO tiene fecha todavía.
- Cuando el cliente confirma y abona la seña, recién ahí el estudio agenda las sesiones en el calendario.
Tu objetivo: entender la pieza (qué, zona, tamaño), dar precio con consultar_precio y, si el cliente quiere avanzar,
registrar el presupuesto con crear_presupuesto (necesitás nombre y email; el teléfono ayuda para coordinar por WhatsApp).
El estudio trabaja SOLO en negro, nunca prometas color. Si ya hay una cotización por foto en el contexto, usá esos datos.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'consultar_precio',
      description: 'Calcula el rango de precio según el tarifario del estudio.',
      parameters: {
        type: 'object',
        properties: {
          horas: { type: 'number' },
          zona: { type: 'string' },
          estilo: { type: 'string', enum: ['realismo', 'religioso', 'dark', 'blackwork', 'lettering', 'fine line'] },
        },
        required: ['horas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crear_presupuesto',
      description: 'Registra el presupuesto del cliente (sin fecha). El estudio lo agenda cuando el cliente confirme y pague la seña.',
      parameters: {
        type: 'object',
        properties: {
          nombre: { type: 'string' }, email: { type: 'string' }, telefono: { type: 'string' },
          titulo: { type: 'string' }, zona: { type: 'string' }, estilo: { type: 'string' },
          horas: { type: 'number' }, precio: { type: 'number' }, cotizacion_id: { type: 'number' },
        },
        required: ['nombre', 'email', 'titulo'],
      },
    },
  },
];

async function runTool(name, a) {
  if (name === 'consultar_precio') {
    const tarifas = await getTariffs();
    const maxH = Number(tarifas.config.session_max_hours) || 6;
    const sesiones = Math.max(1, Math.ceil((a.horas || 3) / maxH));
    const { min, max, deposito } = calcPrecio(tarifas, { horas: a.horas || 3, zona: a.zona, estilo: a.estilo, sesiones });
    return { precio_min_eur: min, precio_max_eur: max, sesiones, deposito_eur: deposito, moneda: 'EUR' };
  }
  if (name === 'crear_presupuesto') {
    let clienteId;
    const f = await db.query('SELECT id FROM clientes WHERE email=? LIMIT 1', [a.email]);
    if (f.rows.length) clienteId = f.rows[0].id;
    else {
      const ins = await db.query('INSERT INTO clientes (nombre,email,telefono) VALUES (?,?,?)', [a.nombre, a.email, a.telefono || null]);
      clienteId = ins.rows.insertId;
    }
    const maxH = 6;
    const sesiones = Math.max(1, Math.ceil((a.horas || 3) / maxH));
    const p = await db.query(
      `INSERT INTO proyectos (cliente_id, cotizacion_id, titulo, zona_cuerpo, estilo, horas_totales, sesiones_pactadas, precio_pactado, estado)
       VALUES (?,?,?,?,?,?,?,?, 'presupuesto')`,
      [clienteId, a.cotizacion_id || null, a.titulo, a.zona || null, a.estilo || null, a.horas || null, sesiones, a.precio || null]
    );
    if (a.cotizacion_id) await db.query("UPDATE cotizaciones SET cliente_id=?, estado='enviada' WHERE id=?", [clienteId, a.cotizacion_id]);
    Promise.allSettled([
      sendBudgetEmail({ to: a.email, nombre: a.nombre, titulo: a.titulo, precio: a.precio, sesiones }),
      notifyStudio({ nombre: a.nombre, telefono: a.telefono, titulo: a.titulo, precio: a.precio, tipo: 'presupuesto' }),
    ]);
    return { ok: true, proyecto_id: p.rows.insertId, estado: 'presupuesto', email_enviado_a: a.email };
  }
  return { error: 'tool_desconocida' };
}

export async function chat(req, res) {
  try {
    const ai = getOpenAI();
    if (!ai) return res.status(503).json({ error: 'IA no configurada' });
    const { messages = [], cotizacion } = req.body;
    const ctx = cotizacion ? [{ role: 'system', content: `Cotización por foto vigente: ${JSON.stringify(cotizacion)}` }] : [];
    const convo = [{ role: 'system', content: SYSTEM }, ...ctx, ...messages];

    let r = await ai.chat.completions.create({ model: OPENAI_MODEL, temperature: 0.5, tools, messages: convo });
    let msg = r.choices[0].message;
    let guard = 0;
    while (msg.tool_calls?.length && guard < 3) {
      guard++;
      convo.push(msg);
      for (const call of msg.tool_calls) {
        const out = await runTool(call.function.name, JSON.parse(call.function.arguments || '{}'));
        convo.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out) });
      }
      r = await ai.chat.completions.create({ model: OPENAI_MODEL, temperature: 0.5, tools, messages: convo });
      msg = r.choices[0].message;
    }
    res.json({ reply: msg.content });
  } catch (e) {
    console.error('[chat]', e);
    res.status(500).json({ error: 'Error en el asistente' });
  }
}
