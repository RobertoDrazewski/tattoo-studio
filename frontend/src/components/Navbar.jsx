import { useEffect, useState } from 'react';
import Logo from './Logo';

const links = [
  { id: 'inicio', label: 'Inicio' }, 
  { id: 'galeria', label: 'Galería' }, 
  { id: 'contacto', label: 'Contacto' }
];

export default function Navbar({ onReservar }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', f); 
    return () => window.removeEventListener('scroll', f);
  }, []);

  // Inicialización del traductor
  useEffect(() => {
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({
          pageLanguage: 'es',
          includedLanguages: 'es,en,fr,it,de,pt,ca,eu,gl',
          autoDisplay: false
        }, 'google_translate_element');
      };
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Función que dispara el cambio de idioma
  const changeLanguage = (lang) => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  };

  const go = (id) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-snow/90 backdrop-blur border-b border-line' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <button onClick={() => go('inicio')} aria-label="Rick Art"><Logo height={scrolled ? 48 : 64} /></button>
        
        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)} className="font-body text-[13px] font-medium uppercase tracking-[0.15em] text-soft transition hover:text-ink">{l.label}</button>
          ))}
          
          {/* Selector con banderas (Emojis) */}
          <div className="flex items-center gap-2 border-l border-line pl-6">
            <button onClick={() => changeLanguage('es')} title="Español">🇪🇸</button>
            <button onClick={() => changeLanguage('en')} title="English">🇬🇧</button>
            <button onClick={() => changeLanguage('fr')} title="Français">🇫🇷</button>
            <button onClick={() => changeLanguage('de')} title="Deutsch">🇩🇪</button>
            <button onClick={() => changeLanguage('it')} title="Italiano">🇮🇹</button>
          </div>

          <button onClick={onReservar} className="bg-ink px-6 py-2.5 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-snow transition hover:bg-blood">Reservar</button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden" aria-label="Menú">
           <div className="space-y-1.5"><span className="block h-px w-6 bg-ink" /><span className="block h-px w-6 bg-ink" /><span className="block h-px w-6 bg-ink" /></div>
        </button>
      </nav>

      {/* Widget Oculto (Necesario para que el script funcione) */}
      <div id="google_translate_element" className="hidden"></div>
    </header>
  );
}