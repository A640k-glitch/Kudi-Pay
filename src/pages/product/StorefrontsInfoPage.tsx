import React, { useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import BrutalButton from '../../components/ui/BrutalButton';
import { BrutalCard } from '../../components/ui/BrutalCard';
import { Palette, Globe, Smartphone, ShieldCheck } from 'lucide-react';
import { NeoStore, NeoCheckSquare } from '../../components/icons/NeoIcons';

export const StorefrontsInfoPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans selection:bg-[#FFD166] selection:text-black">
      <Navbar />

      <main className="pt-32 pb-24 overflow-hidden">
        {/* HERO */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD166] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
                <NeoStore className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-sm">Storefronts</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] uppercase tracking-tight">
                Your Store.<br/>
                <span className="bg-[#4D9DE0] text-white px-4">Your Rules.</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold max-w-lg border-b-[4px] border-[#FF6666] pb-4">
                Launch a beautiful online store in 3 minutes. Zero coding, zero stress.
              </p>
              <BrutalButton color="#E0FF4F" className="text-xl">
                Open Your Storefront
              </BrutalButton>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-[#FF6666] translate-x-4 translate-y-4 border-[3px] border-black"></div>
              <div className="bg-white border-[3px] border-black p-8 relative z-10">
                <div className="w-full h-64 bg-gray-100 border-[3px] border-black flex items-center justify-center flex-col gap-4">
                    <NeoStore className="w-16 h-16 text-gray-400" />
                    <span className="font-black text-gray-400 uppercase text-2xl">[ STORE PREVIEW ]</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center uppercase">
            Everything you need <br/>to <span className="text-[#FF6666] underline decoration-[6px] underline-offset-[10px]">sell online</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Palette, title: 'Custom Themes', color: '#E0FF4F', desc: 'Make it yours with custom colors and layouts.' },
              { icon: Globe, title: 'Custom Domain', color: '#4D9DE0', desc: 'Connect your own .com or .ng domain name.' },
              { icon: Smartphone, title: 'Mobile First', color: '#FFD166', desc: 'Looks perfect on every device, every time.' },
              { icon: NeoCheckSquare, title: 'Inventory Sync', color: '#FF6666', desc: 'Auto-syncs with your WhatsApp orders.' },
              { icon: ShieldCheck, title: 'Secure Checkout', color: '#06D6A0', desc: 'Accept cards, transfers, and USSD safely.' },
              { icon: NeoStore, title: 'Unlimited Products', color: '#FFFFFF', desc: 'Add as many items as you want. No limits.' },
            ].map((feature, idx) => (
              <BrutalCard key={idx} color={feature.color} className={idx % 2 === 0 ? 'transform rotate-1' : 'transform -rotate-1'}>
                <div className="p-3 bg-white border-[3px] border-black inline-block mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase">{feature.title}</h3>
                <p className="text-lg font-bold">{feature.desc}</p>
              </BrutalCard>
            ))}
          </div>
        </section>

      </main>
      <Footer ctaHeading="Ready to start selling?" ctaButton="Open Your Storefront" />
    </div>
  );
};
