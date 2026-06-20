import { useState } from 'react';
import { api } from '../api';
export default function Contact() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
  const [sent, setSent] = useState(false); const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    setErr(''); if (!form.nombre || !form.mensaje) return setErr('Completá nombre y mensaje');
    try { await api.contacto(form); setSent(true); } catch { setErr('No se pudo enviar, probá por WhatsApp'); }
  };
  return (
    <section id="contacto" className="bg-snow py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2">
        <div>
          <p className="eyebrow">Hablemos</p>
          <h2 className="mt-3 display text-5xl text-ink md:text-6xl">Contacto</h2>
          <p className="mt-6 max-w-md font-body text-soft">Contame qué tenés en mente. Si ya tenés una referencia, subila en el chat y te paso una estimación de horas, sesiones y precio.</p>
          <div className="mt-8 space-y-1 font-body text-soft">
            <p className="text-ink">ricardoaizcorbe84@gmail.com</p>
            <p className="text-ink">+34 622 373 795</p>
            <p>España</p>
          </div>
        </div>
        <div>
          {sent ? (
            <div className="border border-line bg-paper p-8 text-center">
              <p className="display text-2xl text-ink">Mensaje enviado</p>
              <p className="mt-2 font-body text-soft">Te respondo lo antes posible.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {['nombre', 'email', 'telefono'].map((f) => (
                <input key={f} value={form[f]} onChange={set(f)} placeholder={f === 'nombre' ? 'Nombre' : f === 'email' ? 'Email' : 'Teléfono'}
                       className="w-full border border-line bg-snow px-4 py-3.5 font-body text-ink placeholder:text-soft focus:border-ink focus:outline-none" />
              ))}
              <textarea value={form.mensaje} onChange={set('mensaje')} rows={4} placeholder="¿Qué querés tatuarte? Zona, tamaño, idea..."
                        className="w-full border border-line bg-snow px-4 py-3.5 font-body text-ink placeholder:text-soft focus:border-ink focus:outline-none" />
              {err && <p className="font-body text-sm text-blood">{err}</p>}
              <button onClick={submit} className="w-full bg-ink py-4 font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-snow transition hover:bg-blood">Enviar</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
