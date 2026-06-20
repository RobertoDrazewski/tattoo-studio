import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

let configured = false;
function ensure() {
  if (configured) return cloudinary;
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return cloudinary;
}

const FOLDER = process.env.CLOUDINARY_FOLDER || 'rickart';

/** Sube un buffer a Cloudinary. subfolder: 'galeria' | 'disenos' */
export function uploadBuffer(buffer, subfolder = 'galeria') {
  const cl = ensure();
  if (!cl) return Promise.reject(new Error('Cloudinary no configurado'));
  return new Promise((resolve, reject) => {
    const stream = cl.uploader.upload_stream(
      { folder: `${FOLDER}/${subfolder}`, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id }))
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId) {
  const cl = ensure();
  if (!cl || !publicId) return;
  try { await cl.uploader.destroy(publicId); } catch {}
}

export const cloudinaryReady = () => !!process.env.CLOUDINARY_CLOUD_NAME;
