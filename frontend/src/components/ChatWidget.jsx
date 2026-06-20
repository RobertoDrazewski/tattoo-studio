import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import mark from '../assets/logo-mark.png';

const QUICK = [
  { key: 'precios', label: 'Consultar precios' },
  { key: 'reservar', label: 'Quiero reservar' },
  { key: 'como', label: '¿Cómo funciona?' },
];
const seed = {
  precios: '¿Cuánto sale un tatuaje?',
  reservar: 'Quiero avanzar con una pieza.',
  como: '¿Cómo es el proceso de reserva?',
};

export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy Tinta, la IA de Rick Art. Contame qué querés tatuarte y en qué zona. Si tenés una referencia, subí la foto y te paso una estimación de horas, sesiones y precio.' },
  ]);
  const [input, setInput] = useState('');
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const { reply } = await api.chat(next.filter((m) => m.role !== 'system').map(({ role, content }) => ({ role, content })), cotizacion);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Se cortó la señal. Probá de nuevo o escribinos por WhatsApp.' }]);
    } finally { setLoading(false); }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    setMessages((m) => [...m, { role: 'user', content: 'Subí una foto de mi diseño', _img: URL.createObjectURL(file) }]);
    try {
      const form = new FormData(); form.append('imagen', file);
      const c = await api.cotizar(form); setCotizacion(c);
      const txt = c.apto_estudio
        ? `Estimación para tu pieza (${c.estilo}, complejidad ${c.complejidad}):\n· ~${c.horas_estimadas} h de trabajo\n· ${c.sesiones_estimadas} ${c.sesiones_estimadas > 1 ? 'sesiones' : 'sesión'}\n· ${c.precio_min_eur}–${c.precio_max_eur} € (seña ${c.deposito_eur} €)\n\n${c.observaciones}\n\nSi querés avanzar te armo el presupuesto. Tené en cuenta: el presupuesto no tiene fecha; cuando confirmás y abonás la seña, agendamos las sesiones.`
        : 'Ese diseño parece llevar color y Rick trabaja solo en negro. ¿Lo adaptamos a realismo B/N?';
      setMessages((m) => [...m, { role: 'assistant', content: txt }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'No pude analizar la imagen. ¿Probás con otra más nítida?' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 border border-ink bg-snow px-4 py-3 shadow-lg shadow-black/10 transition hover:bg-ink hover:text-snow" aria-label="Abrir chat">
        <img src={mark} alt="" className="h-6 w-6" />
        <span className="font-body text-[13px] font-semibold uppercase tracking-[0.1em]">Reservar / Cotizar</span>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex h-[82vh] max-w-md flex-col border border-line bg-snow shadow-2xl sm:inset-x-auto sm:bottom-20 sm:right-5 sm:h-[560px] sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <img src={mark} alt="" className="h-7 w-7" />
              <div className="leading-tight"><p className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-ink">Tinta · IA</p><p className="font-body text-[11px] text-soft">Rick Art</p></div>
            </div>
            <button onClick={() => setOpen(false)} className="text-soft hover:text-ink" aria-label="Cerrar">✕</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line px-3.5 py-2.5 font-body text-sm leading-relaxed ${m.role === 'user' ? 'bg-ink text-snow' : 'border border-line bg-snow text-ink'}`}>
                  {m._img && <img src={m._img} alt="" className="mb-2 max-h-40 border border-line" />}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="flex gap-1 border border-line bg-snow px-4 py-3">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-soft" style={{ animationDelay: `${d * 0.15}s` }} />)}</div></div>}
            <div ref={endRef} />
          </div>

          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 border-t border-line bg-snow px-4 py-2">
              {QUICK.map((q) => <button key={q.key} onClick={() => send(seed[q.key])} className="border border-line px-3 py-1.5 font-body text-[11px] font-medium uppercase tracking-wide text-soft hover:border-ink hover:text-ink">{q.label}</button>)}
            </div>
          )}

          <div className="border-t border-line bg-snow p-3">
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-soft hover:border-ink hover:text-ink" aria-label="Subir foto" title="Subir foto del diseño">📷</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Escribí tu mensaje..." className="flex-1 bg-paper px-3 py-2.5 font-body text-sm text-ink placeholder:text-soft focus:outline-none" />
              <button onClick={() => send()} className="bg-ink px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wide text-snow hover:bg-blood">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
