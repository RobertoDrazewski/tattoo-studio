import db from '../config/db.js';
import { persistImage } from '../middleware/upload.js';
import { getOpenAI, OPENAI_MODEL } from '../services/openai.js';

/** POST /api/banner/generar (admin) — IA escribe el copy y genera la imagen */
export async function generarBannerIA(req, res) {
  try {
    const ai = getOpenAI();
    const idea = (req.body?.idea || '').trim();
    
    if (!ai) return res.status(503).json({ error: 'IA no configurada' });
    if (!idea) return res.status(400).json({ error: 'Describí la promo o novedad' });

    console.log(`\n⏳ [1/4] Escribiendo copy...`);
    let copyData;
    try {
      const promptTexto = `Sos el director creativo de un estudio de tatuajes premium (realismo en negro y gris) en España.
      Tu objetivo es crear publicidades con FILO, mordaces, directas, sin pelos en la lengua — pensá en el humor
      seco y un poco cruel de una marca que no le tiene miedo a incomodar un poco, basadas en esta idea: "${idea}".
      No tengas piedad con los clichés del rubro ni con las propias manías del estudio. Picante, sarcástico,
      hasta un poco arrogante está perfecto. Lo único que NO va, bajo ninguna excusa ni metáfora: tensión
      romántica o sexual entre personas, infidelidad, celos de pareja, o cualquier situación con doble lectura
      de ese tipo. Fuera de esa única línea roja, no te guardes nada.

      Ángulos que funcionan muy bien para este estudio (usalos como inspiración, no como lista cerrada):
      - Burlarte del cliente indeciso que lleva meses "pensándolo".
      - El dolor real de una sesión larga, sin endulzarlo.
      - Encarar de frente el arrepentimiento de tatuajes mal hechos en otro lado ("dejá de arruinarte la piel").
      - La obsesión perfeccionista del artista, en tono de orgullo desafiante.
      - Ironizar sobre la lista de espera larga: "si no podés esperar, no es para vos".
      - Cualquier absurdo o exageración que no involucre a dos personas en conflicto entre sí.

      Además del copy, generá un 'visual_prompt' en INGLÉS para una IA de imágenes. Tiene que describir una escena
      fotográfica realista y concreta del mundo del estudio (el artista tatuando, un cliente esperando, primeros
      planos de manos trabajando, el espacio del estudio, una expresión de dolor o concentración, etc.). Puede ser
      intensa, cruda, incluso incómoda visualmente (sangre, tensión muscular, sudor) — esa intensidad está bien.
      Lo que nunca debe aparecer: dos o más personas en una escena de conflicto romántico, sexual, de celos o
      infidelidad, ni nada con esa doble lectura.

      La estética debe ser de alta costura, seria, fotográfica y clínica.
      IMPORTANTE: La imagen NO DEBE TENER NADA DE TEXTO, ni letras, ni carteles.

      Respondé SOLO JSON estricto:
      {
        "titulo": "Texto corto, filoso, directo, en MAYÚSCULAS",
        "subtitulo": "La promo con mordiente, sin doble sentido romántico/sexual",
        "cta_texto": "Texto del botón",
        "visual_prompt": "Vivid, literal English prompt describing a real studio scene. Can be intense or raw. No people in romantic, sexual, jealousy, or infidelity framing."
      }`;

      const c = await ai.chat.completions.create({
        model: OPENAI_MODEL, 
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: promptTexto }],
      });
      copyData = JSON.parse(c.choices[0].message.content);
    } catch (error) {
      console.error('❌ [Error Copy]', error);
      return res.status(500).json({ error: 'Falló la IA de texto.' });
    }

    // 2. Armar el Prompt Visual final e inyectar reglas duras anti-letras
    let promptImagenOptimizado = `Premium black and white realism photography, ultra-detailed, cinematic lighting, clinical tattoo studio aesthetic. 
    Concept: ${copyData.visual_prompt}. 
    CRITICAL INSTRUCTION: Absolutely NO TEXT, NO FONTS, NO LETTERS, NO WATERMARKS. Clean background with negative space.`;

    console.log(`✅ [Copy Listo]:`, copyData.titulo);
    console.log(`🧠 [Prompt Generado]:`, copyData.visual_prompt);

    // 3. Generar Imagen con la API de OpenAI
    console.log(`⏳ [2/4] Generando imagen en el servidor de IA (espera de 15-40s)...`);
    let imgData;
    try {
      const imgRes = await ai.images.generate({
        model: "gpt-image-2", 
        prompt: promptImagenOptimizado,
        n: 1,
        size: "1024x1024"
      });
      imgData = imgRes.data[0];
      console.log(`✅ [Imagen Generada con éxito]`);
    } catch (error) {
      console.error('❌ [Error Imagen]', error);
      // Si la imagen fue rechazada por el filtro de seguridad, no perdemos el copy de texto:
      // el admin puede usar título/subtítulo y subir una imagen manualmente.
      const rechazadaPorSeguridad = error?.status === 400 && /safety/i.test(error?.message || '');
      return res.status(rechazadaPorSeguridad ? 422 : 500).json({
        error: rechazadaPorSeguridad
          ? 'La idea generó una imagen que el filtro de seguridad rechazó. Probá con una idea más literal (sin tensión interpersonal) o subí una imagen manualmente.'
          : 'Falló la IA de imagen: ' + error.message,
        titulo: copyData.titulo,
        subtitulo: copyData.subtitulo,
        cta_texto: copyData.cta_texto,
      });
    }

    // 4. Procesar Imagen recibida (Soporte híbrido URL/Base64)
    console.log(`⏳ [3/4] Procesando archivo gráfico...`);
    let buffer;
    if (imgData && imgData.url) {
      const response = await fetch(imgData.url);
      buffer = Buffer.from(await response.arrayBuffer());
    } else if (imgData && imgData.b64_json) {
      buffer = Buffer.from(imgData.b64_json, 'base64');
    } else {
      return res.status(500).json({ error: 'La respuesta de la IA no contiene datos válidos.', titulo: copyData.titulo, subtitulo: copyData.subtitulo, cta_texto: copyData.cta_texto });
    }

    // 5. Guardar la imagen localmente usando tu middleware
    console.log(`⏳ [4/4] Guardando imagen de manera local...`);
    const savedImage = await persistImage({ 
      buffer, 
      originalname: `banner-${Date.now()}.png`, 
      mimetype: 'image/png' 
    });

    console.log(`🎉 ¡Banner e Imagen listos de forma exitosa!`);

    // Devolvemos la estructura exacta que el frontend necesita para guardarlo
    res.json({ 
      titulo: copyData.titulo,
      subtitulo: copyData.subtitulo,
      cta_texto: copyData.cta_texto,
      imagen_url: savedImage.url 
    });

  } catch (e) {
    console.error('❌ [Error Fatal]', e);
    res.status(500).json({ error: e.message });
  }
}

/** GET /api/banner  → Todos los banners activos y vigentes para la home (público) */
export async function bannerActivo(_req, res) {
  const { rows } = await db.query(
    `SELECT id, titulo, subtitulo, cta_texto, cta_url, imagen_url
     FROM banners
     WHERE activo=1 AND (expira_at IS NULL OR expira_at > NOW())
     ORDER BY orden ASC, id DESC`
  );
  res.json(rows);
}

/** GET /api/banner/all  (admin) */
export async function listarBanners(_req, res) {
  const { rows } = await db.query('SELECT * FROM banners ORDER BY orden ASC, id DESC');
  res.json(rows);
}

/** POST /api/banner  (admin, multipart opcional) */
export async function crearBanner(req, res) {
  const { titulo = null, subtitulo = null, cta_texto = null, cta_url = null, activo = 0, orden = 0, expira_at = null } = req.body;
  let imagen_url = req.body.imagen_url || null;
  if (req.file) imagen_url = (await persistImage(req.file)).url;
  
  const { rows } = await db.query(
    'INSERT INTO banners (titulo, subtitulo, cta_texto, cta_url, imagen_url, activo, orden, expira_at) VALUES (?,?,?,?,?,?,?,?)',
    [titulo, subtitulo, cta_texto, cta_url, imagen_url, activo ? 1 : 0, orden, expira_at || null]
  );
  res.status(201).json({ id: rows.insertId });
}

/** PATCH /api/banner/:id  (admin) */
export async function editarBanner(req, res) {
  const allowed = ['titulo', 'subtitulo', 'cta_texto', 'cta_url', 'imagen_url', 'activo', 'orden', 'expira_at'];
  const f = [], p = [];
  
  if (req.file) { 
    f.push('imagen_url=?'); 
    p.push((await persistImage(req.file)).url); 
  }
  
  for (const k of allowed) {
    if (req.body[k] !== undefined && !(k === 'imagen_url' && req.file)) {
      f.push(`${k}=?`);
      let val = req.body[k];
      if (k === 'activo') val = val ? 1 : 0;
      else if (k === 'expira_at') val = val ? val : null; // '' → NULL (sin caducidad)
      else val = val ?? null;
      p.push(val);
    }
  }
  if (!f.length) return res.status(400).json({ error: 'Nada para actualizar' });
  
  p.push(req.params.id);
  await db.query(`UPDATE banners SET ${f.join(', ')} WHERE id=?`, p);
  res.json({ ok: true });
}

/** DELETE /api/banner/:id  (admin) */
export async function borrarBanner(req, res) {
  await db.query('DELETE FROM banners WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}