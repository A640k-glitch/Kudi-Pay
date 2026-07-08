import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import BrutalButton from '../components/ui/BrutalButton';
import { BrutalCard } from '../components/ui/BrutalCard';
import { BrutalMarquee } from '../components/ui/BrutalMarquee';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Zap, TrendingUp, Sparkles, Smile } from 'lucide-react';
import { NeoStar, NeoShield } from '../components/icons/NeoIcons';

export const LandingPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans selection:bg-[#E0FF4F] selection:text-black">
      <Navbar />

      <main className="pt-24 md:pt-32 pb-20 overflow-hidden">
        
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-32 flex flex-col items-center text-center">
          <div className="absolute top-10 left-10 hidden md:block animate-bounce">
            <Sparkles className="w-12 h-12 text-[#FF6666]" strokeWidth={2.5} />
          </div>
          <div className="absolute bottom-20 right-10 hidden md:block">
            <Smile className="w-16 h-16 text-[#4D9DE0] rotate-12" strokeWidth={2.5} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-[#E0FF4F] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 sm:mb-8 transform -rotate-2">
            <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">New Update 🚀</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[100px] font-black leading-[1.1] tracking-tight mb-6 sm:mb-8">
            Commerce.<br />
            <span className="text-[#FF6666] break-words break-all sm:break-normal">Unleashed.</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-bold max-w-2xl mb-8 sm:mb-12 border-b-4 border-[#4D9DE0] pb-2">
            We help ambitious merchants sell faster and build credit without the boring bank stuff.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
            <Link to="/signup" className="w-full sm:w-auto">
              <BrutalButton color="#E0FF4F" className="text-lg sm:text-xl px-6 py-4 sm:px-10 sm:py-5 w-full">
                Start Selling Now
              </BrutalButton>
            </Link>
            <Link to="#how-it-works" className="w-full sm:w-auto mt-2 sm:mt-0">
              <BrutalButton color="#FFFFFF" className="text-lg sm:text-xl px-6 py-4 sm:px-10 sm:py-5 w-full">
                How It Works
              </BrutalButton>
            </Link>
          </div>
        </section>

        {/* MARQUEE */}
        <BrutalMarquee speed="fast" className="bg-[#FF6666] text-black border-y-[4px] border-black text-xl sm:text-2xl font-black uppercase tracking-widest py-3 sm:py-4 mb-20 sm:mb-32">
          <span>NO HIDDEN FEES</span>
          <NeoStar className="w-6 h-6 sm:w-8 sm:h-8 mx-4" fill="currentColor" />
          <span>INSTANT PAYOUTS</span>
          <NeoStar className="w-6 h-6 sm:w-8 sm:h-8 mx-4" fill="currentColor" />
          <span>BUILD TRUST SCORE</span>
          <NeoStar className="w-6 h-6 sm:w-8 sm:h-8 mx-4" fill="currentColor" />
          <span>GROW YOUR BUSINESS</span>
          <NeoStar className="w-6 h-6 sm:w-8 sm:h-8 mx-4" fill="currentColor" />
        </BrutalMarquee>

        {/* FEATURES (BENTO GRID) */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-32">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-12 sm:mb-16 uppercase text-center leading-tight">
            Supercharge <br className="hidden sm:block"/><span className="bg-[#E0FF4F] px-2 sm:px-4 inline-block mt-2 sm:mt-0">Your Hustle</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            <BrutalCard color="#4D9DE0" className="md:col-span-2 text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
                <div className="p-3 sm:p-4 bg-white border-[3px] border-black rounded-full shrink-0">
                  <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#FF6666] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-3 font-bold text-black uppercase text-sm sm:text-base whitespace-nowrap">
                  Lightning Fast
                </div>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4">Instant Storefronts</h3>
              <p className="text-lg sm:text-xl font-bold max-w-md">Go from zero to selling in 3 minutes. Upload your products, get a link, and start receiving payments via WhatsApp or web.</p>
            </BrutalCard>

            <BrutalCard color="#FFD166" className="text-black p-6 sm:p-8">
              <div className="flex justify-between items-start mb-8 sm:mb-12">
                <div className="p-3 sm:p-4 bg-white border-[3px] border-black rounded-full">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4">Credit Built In</h3>
              <p className="text-base sm:text-lg font-bold">Every sale builds your Trust Score. Unlock business loans as you grow.</p>
            </BrutalCard>

            <BrutalCard color="#FF6666" className="text-black p-6 sm:p-8">
              <div className="flex justify-between items-start mb-8 sm:mb-12">
                <div className="p-3 sm:p-4 bg-white border-[3px] border-black rounded-full">
                  <NeoShield className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4">Rock Solid</h3>
              <p className="text-base sm:text-lg font-bold">Bank-grade security. Escrow payments protect both you and your buyers.</p>
            </BrutalCard>

            <BrutalCard color="#06D6A0" className="md:col-span-2 text-black p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center">
                <div className="flex-1 w-full text-center md:text-left">
                  <h3 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4 uppercase">WhatsApp Magic</h3>
                  <p className="text-lg sm:text-xl font-bold mb-6 sm:mb-8">Manage orders, chat with customers, and accept payments directly from WhatsApp. Your AI assistant handles the boring stuff.</p>
                  <Link to="/signup" className="inline-block w-full sm:w-auto">
                    <BrutalButton color="#FFFFFF" className="text-base sm:text-lg w-full sm:w-auto">Try It Out <ArrowRight className="w-5 h-5 ml-2 inline"/></BrutalButton>
                  </Link>
                </div>
                <div className="w-full md:w-1/2 h-40 sm:h-48 bg-black border-[3px] border-black overflow-hidden relative shrink-0">
                   <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                      <div className="bg-[#E0FF4F] border-[3px] border-black p-2 sm:p-4 w-full text-center rotate-[-2deg] font-bold text-base sm:text-xl uppercase break-words">
                        AI Bot Active 🟢
                      </div>
                   </div>
                </div>
              </div>
            </BrutalCard>
          </div>
        </section>

      </main>

      <Footer ctaHeading="Ready to blow up?" ctaButton="Let's Go" />
    </div>
  );
};
