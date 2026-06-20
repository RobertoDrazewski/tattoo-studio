import OpenAI from 'openai';
import 'dotenv/config';

/**
 * Lazy init: no instanciamos el cliente al cargar el módulo.
 * Evita que el deploy reviente si la key todavía no está seteada,
 * y permite arrancar el server sin OpenAI (modo degradado).
 */
let _client = null;
let _warned = false;

export function getOpenAI() {
  const raw = process.env.OPENAI_API_KEY;
  if (!raw) return null;

  // Detecta espacios/saltos de línea colados al copiar la key (causa típica de
  // "is not a legal HTTP header value" — la key se ve bien pero tiene un \n o
  // espacio extra que rompe el header Authorization).
  const key = raw.trim();
  if (key !== raw && !_warned) {
    console.warn('[openai] OPENAI_API_KEY tenía espacios/saltos de línea extra; se recortaron automáticamente. Revisá cómo se pegó la variable en el panel de hosting.');
    _warned = true;
  }
  if (/\s/.test(key) && !_warned) {
    console.error('[openai] OPENAI_API_KEY contiene espacios en medio del valor — probablemente está mal copiada. Las llamadas a OpenAI van a fallar.');
    _warned = true;
  }

  if (!_client) {
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';