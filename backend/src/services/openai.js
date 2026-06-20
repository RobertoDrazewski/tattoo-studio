import OpenAI from 'openai';
import 'dotenv/config';

let _client = null;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  
  if (!_client) {
    const config = { apiKey: process.env.OPENAI_API_KEY };
    
    // Si tu proveedor te dio una URL, la usamos aquí.
    // Si no la tienes, esto es lo que está rompiendo tu app.
    if (process.env.OPENAI_BASE_URL) {
      config.baseURL = process.env.OPENAI_BASE_URL;
    }
    
    _client = new OpenAI(config);
  }
  
  return _client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';