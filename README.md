# Rick Art — Estudio de tatuaje (web + sistema de turnos con IA)

Estética **clínica blanca**: profesional, limpia, mucho aire. Realismo en negro, religioso y dark.
Stack: **Node + Express + MySQL (Railway) + Cloudinary + OpenAI + Nodemailer** · **React + Vite + Tailwind**.

## Funcionalidad
- **Web pública**: hero, banner dinámico, galería (Cloudinary), feed de Instagram, contacto.
- **Chat IA "Tinta"**: el cliente sube una foto del diseño → GPT‑4o estima estilo, horas y sesiones → cotiza con el **tarifario real** → si el cliente quiere avanzar, registra un **presupuesto**.
- **Flujo de reserva (igual que Good Trip)**: el presupuesto entra **sin fecha**. Cuando el cliente confirma y paga la seña, el admin lo **agenda** y recién ahí pasa al **calendario** (con nombre, precio pactado, sesiones y horarios).

## Panel de administración (`/admin`)
1. **Reservas** — presupuestos y reservas; thumbnail del diseño del cliente, botón de WhatsApp, marcar seña, **agendar**, eliminar.
2. **Calendario** — sesiones confirmadas organizadas por día.
3. **Tarifas** — editable: tarifa/hora, mínimo, % seña, máx. horas/sesión + multiplicadores por **zona del cuerpo**, **estilo/modelo** e **insumos**. La IA cotiza con esto.
4. **Banner IA** — describís una promo y la IA escribe el copy; lo publicás en la home.
5. **Galería** — subís imágenes a Cloudinary.
6. **Métricas** — KPIs (ingresos del mes, ticket promedio, conversión, horas), gráfico de ingresos mensuales y **recomendaciones de marketing con IA**.
7. **Tatuajes por cliente** — historial agrupado por cliente.

## Puesta en marcha

### 1. Base de datos (Railway)
1. En Railway: **New → Database → MySQL**.
2. Copiá `backend/.env.example` a `backend/.env` y completá:
   - Desde tu compu: usá `MYSQL_PUBLIC_URL` (host `…proxy.rlwy.net`).
   - En Railway (deploy): `MYSQL_URL=${{MySQL.MYSQL_URL}}` (interna).
3. Creá las tablas. Opción A (recomendada): `cd backend && npm i && npm run db:init`
   (crea tablas + siembra admin + tarifas por defecto).
   Opción B: importá `schema.sql` en TablePlus (**Run All ⌘⇧Return**, no "Run Current").

### 2. Cloudinary (imágenes)
Creá una cuenta gratis en cloudinary.com → Dashboard → copiá `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` al `.env`.

### 3. OpenAI (chat + cotización + métricas)
`OPENAI_API_KEY` desde platform.openai.com. Modelo por defecto: `gpt-4o`.

### 4. Email (Gmail personal)
La "API key" de Gmail = **App Password**: myaccount.google.com → Seguridad → **Contraseñas de aplicaciones** (requiere 2FA).
Poné ese valor en `SMTP_PASS`. `SMTP_USER` y `MAIL_FROM` = ricardoaizcorbe84@gmail.com.

### 5. Levantar
```bash
# backend
cd backend && npm install && npm run dev     # :4000
# frontend (otra terminal)
cd frontend && npm install && npm run dev     # :5173
```
Frontend `.env`: `VITE_API_URL=http://localhost:4000` y `VITE_WHATSAPP=34622373795`.

### Admin
`/admin` · usuario `ricardoaizcorbe84@gmail.com` · contraseña inicial `rickart2026` (cambiala).

## Deploy en Railway
- **MySQL** (plugin) → **Backend** (root `/backend`, `MYSQL_URL=${{MySQL.MYSQL_URL}}`, resto de vars) → **Frontend** (root `/frontend`, `VITE_API_URL=<url backend>`).
- Restringí CORS en `server.js` a tu dominio en producción.

## Contacto del estudio
Email: ricardoaizcorbe84@gmail.com · WhatsApp: +34 622 373 795 · IG: @rick_art13
