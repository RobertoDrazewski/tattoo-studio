import Logo from './Logo';
// Importamos la imagen de Puma Code
import pumaIcon from '../assets/iconopuma.png';

const NUM = import.meta.env.VITE_WHATSAPP || '34622373795';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      {/* Redujimos max-w-6xl a max-w-4xl y el padding vertical py-14 a py-8 para hacerlo mucho más compacto */}
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
          
          {/* Logo ligeramente más chico para acompañar el nuevo tamaño del footer */}
          <Logo height={64} />
          
          <div className="text-center md:text-right">
            <a href="mailto:ricardoaizcorbe84@gmail.com" className="block font-body text-sm text-ink hover:text-blood">
              ricardoaizcorbe84@gmail.com
            </a>
            <a href={`https://wa.me/${NUM}`} className="mt-1 block font-body text-sm text-ink hover:text-blood">
              +34 622 373 795
            </a>
            
            {/* Íconos sociales mejorados (SVG) */}
            <div className="mt-4 flex justify-center gap-3 md:justify-end">
              <a 
                href="https://instagram.com/rick.art13" 
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-soft transition hover:border-ink hover:bg-snow hover:text-ink" 
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href={`https://wa.me/${NUM}`} 
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-soft transition hover:border-ink hover:bg-snow hover:text-ink" 
                aria-label="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Sección inferior: Copyright, Acceso Staff y Créditos más apretados */}
        <div className="mt-8 flex flex-col items-center justify-center gap-5 border-t border-line/40 pt-6">
          <p className="text-center font-body text-[10px] uppercase tracking-[0.2em] text-soft">
            © {new Date().getFullYear()} Rick Art · Todos los derechos reservados
          </p>

          <a
            href="/admin"
            className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-soft transition hover:text-ink active:text-ink"
          >
            Acceso Staff
          </a>

          <a 
            href="https://puma-code.com" 
            target="_blank" 
            rel="noreferrer" 
            className="group flex flex-col items-center gap-1.5"
          >
            <span className="font-body text-[8px] uppercase tracking-[0.25em] text-soft transition duration-300 group-hover:text-ink">
              Powered by puma-code.com
            </span>
            <img 
              src={pumaIcon} 
              alt="Puma Code" 
              className="h-9 w-auto transition duration-300 group-hover:scale-105" 
            />
          </a>
        </div>
      </div>
    </footer>
  );
}