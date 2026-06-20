import db from '../config/db.js';
import { getOpenAI, OPENAI_MODEL } from '../services/openai.js';
import { persistImage } from '../middleware/upload.js';
import { getTariffs, calcPrecio } from './tariffController.js';

const SYSTEM_PROMPT = `Eres el asistente de cotización de Rick Art, estudio de tatuajes en España
especializado en realismo en blanco y negro, religioso y dark (sin color).
Analizás la foto de un diseño/referencia con criterio de tatuador profesional: nivel de detalle,
contraste y degradados del realismo B/N, tamaño relativo y zona del cuerpo.
Respondé SOLO con JSON válido, sin markdown:
{
  "estilo_detectado": string,        // uno de: realismo, religioso, dark, blackwork, lettering, fine line
  "complejidad": "baja"|"media"|"alta"|"muy alta",
  "horas_estimadas": number,
  "tamano_estimado": string,
  "observaciones": string,           // 1-2 frases en español
  "apto_estudio": boolean
}`;

export async function cotizar(req, res) {
  try {
    const { zona_cuerpo = '', tamano = '' } = req.body || {};
    const img = await persistImage(req.file, 'disenos');
    if (!img) return res.status(400).json({ error: 'Falta la imagen del diseño' });

    const ai = getOpenAI();
    let analysis;
    if (ai) {
      const completion = await ai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Zona: ${zona_cuerpo || 'no especificada'}. Tamaño deseado: ${tamano || 'no especificado'}. Devolvé el JSON.` },
              { type: 'image_url', image_url: { url: img.dataUrl } },
            ],
          },
        ],
      });
      analysis = JSON.parse(completion.choices[0].message.content);
    } else {
      const big = /espalda|pecho|muslo|manga/i.test(zona_cuerpo);
      analysis = { estilo_detectado: 'realismo', complejidad: big ? 'alta' : 'media', horas_estimadas: big ? 12 : 4, tamano_estimado: tamano || (big ? '30x25 cm' : '15x12 cm'), observaciones: 'Estimación preliminar; se confirma en consulta.', apto_estudio: true };
    }

    const tarifas = await getTariffs();
    const horas = Math.max(1, Number(analysis.horas_estimadas) || 3);
    const maxH = Number(tarifas.config.session_max_hours) || 6;
    const sesiones = Math.max(1, Math.ceil(horas / maxH));
    const { min, max, deposito } = calcPrecio(tarifas, { horas, zona: zona_cuerpo, estilo: analysis.estilo_detectado, sesiones });

    const { rows } = await db.query(
      `INSERT INTO cotizaciones (imagen_url, public_id, zona_cuerpo, tamano_cm, estilo, horas_estimadas, sesiones_estimadas, precio_min_eur, precio_max_eur, analisis_ia, estado)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'enviada')`,
      [img.url, img.public_id, zona_cuerpo, analysis.tamano_estimado || tamano, analysis.estilo_detectado, horas, sesiones, min, max, JSON.stringify(analysis)]
    );

    res.json({
      cotizacion_id: rows.insertId,
      imagen_url: img.url,
      estilo: analysis.estilo_detectado,
      complejidad: analysis.complejidad,
      horas_estimadas: horas,
      sesiones_estimadas: sesiones,
      tamano: analysis.tamano_estimado || tamano,
      precio_min_eur: min,
      precio_max_eur: max,
      deposito_eur: deposito,
      observaciones: analysis.observaciones,
      apto_estudio: analysis.apto_estudio !== false,
    });
  } catch (err) {
    console.error('[cotizar]', err);
    res.status(500).json({ error: 'No se pudo generar la cotización' });
  }
}
