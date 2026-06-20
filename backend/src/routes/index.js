import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';

import { login, me } from '../controllers/authController.js';
import { cotizar } from '../controllers/quoteController.js';
import { chat } from '../controllers/chatController.js';
import { listarTurnos, actualizarTurno, disponibilidad } from '../controllers/appointmentController.js';
import { listarGaleria, subirGaleria, borrarGaleria, editarGaleria } from '../controllers/galleryController.js';
import { bannerActivo, listarBanners, crearBanner, editarBanner, borrarBanner, generarBannerIA, estadoBannerIA } from '../controllers/bannerController.js';
import { crearContacto, listarContactos } from '../controllers/contactController.js';
import { feed } from '../controllers/instagramController.js';
import { getTarifas, updateConfig, addItem, updateItem, deleteItem } from '../controllers/tariffController.js';
import { crearReserva, listarReservas, actualizarReserva, agendarReserva, eliminarReserva, tatuajesPorCliente } from '../controllers/reservaController.js';
import { metricas, recomendaciones } from '../controllers/metricsController.js';

const r = Router();

// Público
r.post('/cotizar', upload.single('imagen'), cotizar);
r.post('/chat', chat);
r.post('/reservas', crearReserva);
r.get('/disponibilidad', disponibilidad);
r.get('/galeria', listarGaleria);
r.get('/banner', bannerActivo);
r.get('/instagram', feed);
r.get('/tarifas', getTarifas);
r.post('/contacto', crearContacto);

// Auth
r.post('/auth/login', login);
r.get('/auth/me', requireAuth, me);

// Admin
r.get('/turnos', requireAuth, listarTurnos);
r.patch('/turnos/:id', requireAuth, actualizarTurno);

r.post('/galeria', requireAuth, upload.single('imagen'), subirGaleria);
r.patch('/galeria/:id', requireAuth, editarGaleria);
r.delete('/galeria/:id', requireAuth, borrarGaleria);

r.get('/banner/all', requireAuth, listarBanners);
r.post('/banner', requireAuth, upload.single('imagen'), crearBanner);
r.post('/banner/generar', requireAuth, generarBannerIA);
r.get('/banner/generar/:jobId', requireAuth, estadoBannerIA);
r.patch('/banner/:id', requireAuth, upload.single('imagen'), editarBanner);
r.delete('/banner/:id', requireAuth, borrarBanner);

r.get('/admin/reservas', requireAuth, listarReservas);
r.patch('/admin/reservas/:id', requireAuth, actualizarReserva);
r.post('/admin/reservas/:id/agendar', requireAuth, agendarReserva);
r.delete('/admin/reservas/:id', requireAuth, eliminarReserva);
r.get('/admin/clientes', requireAuth, tatuajesPorCliente);

r.put('/tarifas/config', requireAuth, updateConfig);
r.post('/tarifas/:tipo', requireAuth, addItem);
r.patch('/tarifas/:tipo/:id', requireAuth, updateItem);
r.delete('/tarifas/:tipo/:id', requireAuth, deleteItem);

r.get('/metricas', requireAuth, metricas);
r.post('/metricas/recomendaciones', requireAuth, recomendaciones);

r.get('/contacto', requireAuth, listarContactos);

export default r;