import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Banner from './components/Banner';
import Gallery from './components/Gallery';
import InstagramFeed from './components/InstagramFeed';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ChatWidget from './components/ChatWidget';
import AdminApp from './admin/AdminApp';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <div className="relative min-h-screen bg-snow">
      <Navbar onReservar={() => setChatOpen(true)} />
      <main>
        <Hero onReservar={() => setChatOpen(true)} />
        <Banner />
        <Gallery />
        <InstagramFeed />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
