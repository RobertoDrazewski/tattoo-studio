import { useEffect, useState } from 'react';
import { api, asset } from '../api';
export default function InstagramFeed() {
  const [items, setItems] = useState([]); const [src, setSrc] = useState(null);
  useEffect(() => { api.instagram().then((d) => { setItems(d.items || []); setSrc(d.source); }).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between">
          <div><p className="eyebrow">De donde vienen mis clientes</p><h2 className="mt-3 display text-4xl text-ink md:text-5xl">Instagram</h2></div>
          <a href="https://instagram.com/rick.art13" target="_blank" rel="noreferrer" className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-ink hover:text-blood">@rick.art13 →</a>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {items.slice(0, 12).map((p) => (
            <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden border border-line">
              <img src={asset(p.image)} alt={p.caption?.slice(0, 50) || 'Post'} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </a>
          ))}
        </div>
        {src === 'fallback' && <p className="mt-4 font-body text-[11px] uppercase tracking-widest text-soft">* Mostrando galería local — conectar token de Instagram</p>}
      </div>
    </section>
  );
}
