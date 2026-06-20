const NUM = import.meta.env.VITE_WHATSAPP || '34622373795';
export default function WhatsAppFloat() {
  return (
    <a href={`https://wa.me/${NUM}?text=Hola%20Rick%20Art,%20quiero%20consultar%20por%20un%20tatuaje`} target="_blank" rel="noopener noreferrer"
       aria-label="WhatsApp" className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/20 transition hover:scale-105">
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6C14 28.4 15 28.6 16 28.6c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1 0-2-.2-2.9-.6l-.4-.2-4.9.9.9-4.8-.3-.4C7.5 18.9 7 17 7 15c0-5 4-9 9-9s9 4 9 9-4 9.8-9 9.8zm5-7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-1.4-.7-2.3-1.3-3.2-2.9-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2-1.1 2.2 0 1.5 1.1 3 1.3 3.2.2.2 2.2 3.4 5.4 4.6 2 .8 2.7.9 3.7.7.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.1-1.3z" /></svg>
    </a>
  );
}
