import { useEffect, useState } from 'react';
import { api, asset } from '../api';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { 
    api.banner()
      .then((data) => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else if (data) {
          // Por seguridad, si el backend devolviera un objeto único lo envuelve en un array
          setBanners([data]);
        }
      })
      .catch(() => {}); 
  }, []);

  // Temporizador de Autoplay: Cambia de slide cada 5 segundos
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <section className="bg-paper py-6 group relative">
      <div className="mx-auto max-w-6xl px-5 relative">
        
        {/* Contenedor principal del Carrusel con altura mínima segura para mobile y desktop */}
        <div className="relative overflow-hidden rounded-xl bg-ink text-snow shadow-2xl min-h-[580px] sm:min-h-[500px] md:min-h-[400px]">
          
          {banners.map((b, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={b.id || index}
                className={`absolute inset-0 flex flex-col md:flex-row items-stretch transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                
                {/* Bloque Izquierdo: Texto y Botón */}
                <div className="flex flex-col justify-center flex-1 p-8 md:p-12 lg:p-16 gap-6 z-10">
                  <div>
                    {b.titulo && (
                      <h3 className="display text-3xl font-bold uppercase tracking-wide md:text-4xl lg:text-5xl text-snow">
                        {b.titulo}
                      </h3>
                    )}
                    {b.subtitulo && (
                      <p className="mt-3 font-body text-sm md:text-base text-zinc-300 leading-relaxed">
                        {b.subtitulo}
                      </p>
                    )}
                  </div>
                  
                  {b.cta_texto && (
                    <div className="mt-2">
                      <a 
                        href={b.cta_url || '#contacto'} 
                        className="inline-block bg-snow px-8 py-4 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-ink transition hover:bg-blood hover:text-snow"
                      >
                        {b.cta_texto}
                      </a>
                    </div>
                  )}
                </div>

                {/* Bloque Derecho: Imagen Realista (100% Opacidad, Sin Filtros) */}
                {b.imagen_url && (
                  <div className="w-full md:w-1/2 min-h-[250px] md:min-h-full relative overflow-hidden">
                    <img 
                      src={asset(b.imagen_url)} 
                      alt={b.titulo || "Publicidad Rick Art"} 
                      className="absolute inset-0 h-full w-full object-cover opacity-100 filter-none"
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Controles interactivos (Solo visibles si hay más de 1 banner activo) */}
        {banners.length > 1 && (
          <>
            {/* Flecha Izquierda (Aparece en hover en pantallas grandes) */}
            <button
              onClick={prevSlide}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-ink/60 hover:bg-blood text-snow p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
              aria-label="Anterior banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Flecha Derecha (Aparece en hover en pantallas grandes) */}
            <button
              onClick={nextSlide}
              className="absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-ink/60 hover:bg-blood text-snow p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
              aria-label="Siguiente banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Indicadores inferiores (Puntos de posición) */}
            <div className="absolute bottom-10 left-12 md:left-16 z-20 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-blood' : 'w-2 bg-zinc-500 hover:bg-zinc-300'
                  }`}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
}