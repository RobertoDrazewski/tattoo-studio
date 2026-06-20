import multer from 'multer';
import { uploadBuffer, cloudinaryReady } from '../services/cloudinary.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Solo imágenes')),
});

/**
 * Persiste la imagen en Cloudinary y devuelve { url, public_id, dataUrl }.
 * dataUrl se usa para pasarle la imagen a la IA de cotización.
 */
export async function persistImage(file, subfolder = 'galeria') {
  if (!file) return null;
  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  if (cloudinaryReady()) {
    const { url, public_id } = await uploadBuffer(file.buffer, subfolder);
    return { url, public_id, dataUrl };
  }
  // Sin Cloudinary: devolvemos solo el dataUrl (no recomendado en prod)
  return { url: dataUrl, public_id: null, dataUrl };
}
