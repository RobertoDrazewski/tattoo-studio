import { useEffect, useState } from 'react';
import { api, asset } from '../api';
const CATS = ['todos', 'realismo', 'religioso', 'dark'];
const PH = Array.from({ length: 8 }, (_, i) => ({ id: `ph-${i}`, _empty: true }));

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('todos');
  const [active, setActive] = useState(null);
  useEffect(() => {
    api.galeria(cat === 'todos' ? '' : cat).then((d) => setItems(d.length ? d : PH)).catch(() => setItems(PH));
  }, [cat]);
  return (
    <section id="galeria" className="bg-snow py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow">El trabajo</p><h2 className="mt-3 display text-5xl text-ink md:text-6xl">Galería</h2></div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`border px-4 py-2 font-body text-xs font-medium uppercase tracking-[0.12em] transition ${cat === c ? 'border-ink bg-ink text-snow' : 'border-line text-soft hover:border-ink hover:text-ink'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((it) => (
            <button key={it.id} onClick={() => !it._empty && setActive(it)} className="group relative aspect-[3/4] overflow-hidden border border-line bg-paper">
              {it._empty ? (
                <div className="flex h-full w-full items-center justify-center"><span className="font-body text-[10px] uppercase tracking-[0.2em] text-soft">Próximamente</span></div>
              ) : (
                <>
                  <img src={asset(it.imagen_url)} alt={it.titulo || 'Tatuaje Rick Art'} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  {it.titulo && <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-ink/80 to-transparent px-3 py-3 font-body text-xs uppercase tracking-wide text-snow opacity-0 transition group-hover:opacity-100">{it.titulo}</span>}
                </>
              )}
            </button>
          ))}
        </div>
      </div>
      {active && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/90 p-6" onClick={() => setActive(null)}>
          <img src={asset(active.imagen_url)} alt={active.titulo} className="max-h-[90vh] max-w-full" />
        </div>
      )}
    </section>
  );
}
