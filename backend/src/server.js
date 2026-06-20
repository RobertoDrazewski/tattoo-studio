import express from 'express';
import cors from 'cors';
import path from 'node:path';
import 'dotenv/config';
import api from './routes/index.js';

const app = express();

const allowed = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://rickart13.up.railway.app',
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Sin origin (curl, healthcheck, server-to-server) → permitir
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    console.warn('[cors] origen bloqueado:', origin);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Imágenes subidas (dev). En prod usar Cloudinary/S3 (ver upload.js)
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'rickart-api' }));
app.use('/api', api);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🖤 Rick Art API en :${PORT}`));