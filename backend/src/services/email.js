import nodemailer from 'nodemailer';
import 'dotenv/config';

let _t = null;
function tx() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!_t) _t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _t;
}

const WA = process.env.WHATSAPP_NUMBER || '34622373795';
const fmt = (d) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

// Plantilla clara (estética clínica)
const shell = (inner) => `
<div style="background:#f4f3f1;padding:32px;font-family:Helvetica,Arial,sans-serif;color:#141414">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e3df;border-radius:14px;overflow:hidden">
    <div style="padding:26px 32px;border-bottom:1px solid #efece8">
      <span style="font-size:24px;font-weight:800;letter-spacing:.5px;color:#111">RICK ART</span>
      <div style="font-size:11px;letter-spacing:3px;color:#9a948c;margin-top:4px;text-transform:uppercase">Realismo · Religioso · Dark</div>
    </div>
    <div style="padding:32px">${inner}</div>
    <div style="padding:18px 32px;border-top:1px solid #efece8;font-size:12px;color:#9a948c">
      Rick Art · ${process.env.CONTACT_EMAIL || 'ricardoaizcorbe84@gmail.com'} · WhatsApp +${WA}
    </div>
  </div>
</div>`;

export async function sendBudgetEmail({ to, nombre, titulo, precio, sesiones }) {
  const t = tx(); if (!t || !to) return { skipped: true };
  const inner = `
    <h1 style="font-size:20px;margin:0 0 8px;color:#111">Recibimos tu presupuesto${nombre ? `, ${nombre}` : ''}</h1>
    <p style="color:#5b5650;line-height:1.6;margin:0 0 20px">
      Tu proyecto <b>${titulo || 'tatuaje'}</b> quedó registrado.${precio ? ` Estimación: <b>${precio} €</b>${sesiones ? ` · ${sesiones} ${sesiones > 1 ? 'sesiones' : 'sesión'}` : ''}.` : ''}
    </p>
    <p style="color:#5b5650;line-height:1.6;margin:0 0 24px">
      Todavía <b>no tiene fecha</b>. En cuanto quieras confirmarlo y abonar la seña, lo agendamos y te paso los días.
    </p>
    <a href="https://wa.me/${WA}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;font-weight:600;letter-spacing:.5px">CONFIRMAR POR WHATSAPP</a>`;
  return t.sendMail({ from: process.env.MAIL_FROM, to, subject: 'Tu presupuesto en Rick Art', html: shell(inner) });
}

export async function sendAppointmentEmail({ to, nombre, sesiones, proyecto }) {
  const t = tx(); if (!t || !to) return { skipped: true };
  const lista = sesiones.map((s) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #efece8;color:#5b5650">Sesión ${s.numero_sesion}/${s.total_sesiones}</td>
    <td style="padding:10px 0;border-bottom:1px solid #efece8;color:#111;text-align:right;text-transform:capitalize">${fmt(s.inicio)}</td></tr>`).join('');
  const inner = `
    <h1 style="font-size:20px;margin:0 0 8px;color:#111">Turno confirmado${nombre ? `, ${nombre}` : ''}</h1>
    <p style="color:#5b5650;margin:0 0 22px">Tu proyecto <b>${proyecto || 'tatuaje'}</b> quedó agendado.</p>
    <table style="width:100%;border-collapse:collapse">${lista}</table>
    <p style="color:#9a948c;font-size:13px;margin:22px 0 0;line-height:1.6">Llegá 10 min antes, descansado e hidratado. Para reprogramar, escribinos por WhatsApp.</p>`;
  return t.sendMail({ from: process.env.MAIL_FROM, to, subject: 'Tu turno en Rick Art está confirmado', html: shell(inner) });
}

export async function notifyStudio({ nombre, telefono, titulo, precio, tipo = 'reserva' }) {
  const t = tx(); const to = process.env.STUDIO_NOTIFY_EMAIL; if (!t || !to) return { skipped: true };
  const inner = `<h1 style="font-size:18px;color:#111;margin:0 0 12px">Nuevo ${tipo}</h1>
    <p style="color:#5b5650;line-height:1.7;margin:0"><b>Cliente:</b> ${nombre || '—'}<br/><b>Tel:</b> ${telefono || '—'}<br/><b>Proyecto:</b> ${titulo || '—'}<br/><b>Precio:</b> ${precio ? precio + ' €' : '—'}</p>`;
  return t.sendMail({ from: process.env.MAIL_FROM, to, subject: `Nuevo ${tipo} · ${nombre || 'cliente'}`, html: shell(inner) });
}

export async function sendContactEmail({ nombre, email, telefono, mensaje }) {
  const t = tx(); const to = process.env.STUDIO_NOTIFY_EMAIL; if (!t || !to) return { skipped: true };
  const inner = `<h1 style="font-size:18px;color:#111;margin:0 0 12px">Consulta desde la web</h1>
    <p style="color:#5b5650;line-height:1.7"><b>${nombre}</b> (${email || 's/email'} · ${telefono || 's/tel'})<br/><br/>${mensaje}</p>`;
  return t.sendMail({ from: process.env.MAIL_FROM, to, replyTo: email, subject: `Consulta web · ${nombre}`, html: shell(inner) });
}
