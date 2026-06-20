import Logo from './Logo';
// Importamos la imagen desde la carpeta assets
import rickPhoto from '../assets/ricki.png';

// Asignamos la imagen importada a la constante
const HERO_PHOTO = rickPhoto;

const ESTILOS = [
  'Mini tattoo / Flash', 'Chicano', 'Hand lettering', 'Black and Grey',
  'Realismo', 'Surrealismo', 'Horror', 'Religioso', 'Japonés',
];

export default function Hero({ onReservar }) {
  return (
    <section id="inicio" className="relative overflow-hidden bg-snow pt-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 md:grid-cols-[1.1fr_0.9fr] md:pb-28 md:pt-12">
        <div>
          <p className="eyebrow animate-fadeUp">Estudio de tatuaje · España</p>
          <h1 className="mt-5 display text-5xl leading-[0.95] text-ink animate-fadeUp sm:text-6xl md:text-7xl">
            Realismo<br />en Black and Grey.<br /><span className="text-soft">De flash a espalda completa.</span>
          </h1>
          <p className="mt-7 max-w-md font-body text-lg leading-relaxed text-soft animate-fadeUp">
            Black and Grey en todas sus formas, con higiene de clínica y criterio de artista.
          </p>

          {/* Chips de estilos */}
          <div className="mt-6 flex flex-wrap gap-2 animate-fadeUp">
            {ESTILOS.map((e) => (
              <span key={e} className="border border-line px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.1em] text-soft">{e}</span>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4 animate-fadeUp">
            <button onClick={onReservar} className="bg-ink px-8 py-4 font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-snow transition hover:bg-blood">Reservar / Cotizar</button>
            <a href="#galeria" className="font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-ink underline decoration-line decoration-2 underline-offset-8 transition hover:decoration-blood">Ver galería</a>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-paper">
            {HERO_PHOTO ? (
              <img
                src={HERO_PHOTO}
                alt="Rick tatuando"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-6">
                <Logo height={140} variant="mark" />
                <span className="font-body text-[11px] uppercase tracking-[0.25em] text-soft">Foto del artista</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between font-body text-[11px] uppercase tracking-[0.2em] text-soft">
            <span>+12 años</span><span>Black and Grey</span><span>@rick.art13</span>
          </div>
        </div>
      </div>
    </section>
  );
}
