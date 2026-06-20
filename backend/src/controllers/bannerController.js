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

    console.log(`\n⏳ [1/4] Escribiendo copy irreverente (y burlando filtros)...`);
    let copyData;
    try {
      const promptTexto = `Sos el director creativo más irreverente, sarcástico y provocador de un estudio de tatuajes premium (realismo B/N) en España. 
      Tu objetivo es crear publicidades absurdas, con humor negro y mucha picardía basadas en esta idea: "${idea}". 
      
      Además del copy, tenés que generar un 'visual_prompt' en INGLÉS para la IA de imágenes.
      
      ⚠️ REGLA CRÍTICA PARA EL VISUAL_PROMPT: La IA de imágenes tiene un filtro de seguridad EXTREMADAMENTE ESTRICTO. 
      NO uses palabras como "lover", "mistress", "affair", "polyamory", "sexy" ni describas tensión explícitamente romántica o sexual. 
      Para burlar el filtro, el visual_prompt DEBE describir una situación puramente cómica, absurda, de tensión teatral o metafórica que sea 100% "Family Friendly" (PG-13) pero que ilustre el problema de forma brillante. 
      Ejemplo seguro: "A highly realistic black and white photo of a very nervous man sweating heavily in a tattoo waiting room, sitting right between two very angry elegant women glaring at him."
      
      La estética debe ser de alta costura, seria, fotográfica y clínica. 
      IMPORTANTE: La imagen NO DEBE TENER NADA DE TEXTO, ni letras, ni carteles.
      
      Respondé SOLO JSON estricto: 
      { 
        "titulo": "Texto corto, impactante y en MAYÚSCULAS", 
        "subtitulo": "La promo explicada con sarcasmo o absurdo", 
        "cta_texto": "Texto del botón",
        "visual_prompt": "Safe, PG-13 English prompt for the image API without trigger words."
      }`;

      const c = await ai.chat.completions.create({
        model: OPENAI_MODEL, 
        temperature: 0.9, // Creatividad alta para el humor
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
    console.log(`🧠 [Prompt Seguro Generado]:`, copyData.visual_prompt);

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
      return res.status(500).json({ error: 'Falló la IA de imagen: ' + error.message });
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
      return res.status(500).json({ error: 'La respuesta de la IA no contiene datos válidos.' });
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

/** GET /api/banner  → Todos los banners activos para la home (público) */
export async function bannerActivo(_req, res) {
  const { rows } = await db.query(
    'SELECT id, titulo, subtitulo, cta_texto, cta_url, imagen_url FROM banners WHERE activo=1 ORDER BY orden ASC, id DESC'
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
  const { titulo = null, subtitulo = null, cta_texto = null, cta_url = null, activo = 0, orden = 0 } = req.body;
  let imagen_url = req.body.imagen_url || null;
  if (req.file) imagen_url = (await persistImage(req.file)).url;
  
  const { rows } = await db.query(
    'INSERT INTO banners (titulo, subtitulo, cta_texto, cta_url, imagen_url, activo, orden) VALUES (?,?,?,?,?,?,?)',
    [titulo, subtitulo, cta_texto, cta_url, imagen_url, activo ? 1 : 0, orden]
  );
  res.status(201).json({ id: rows.insertId });
}

/** PATCH /api/banner/:id  (admin) */
export async function editarBanner(req, res) {
  const allowed = ['titulo', 'subtitulo', 'cta_texto', 'cta_url', 'imagen_url', 'activo', 'orden'];
  const f = [], p = [];
  
  if (req.file) { 
    f.push('imagen_url=?'); 
    p.push((await persistImage(req.file)).url); 
  }
  
  for (const k of allowed) {
    if (req.body[k] !== undefined && !(k === 'imagen_url' && req.file)) {
      f.push(`${k}=?`); 
      p.push(k === 'activo' ? (req.body[k] ? 1 : 0) : (req.body[k] ?? null));
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