import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import BrutalButton from '../../components/ui/BrutalButton';
import { BrutalCard } from '../../components/ui/BrutalCard';
import { TrendingUp, Rocket, Clock, Shield } from 'lucide-react';
import { NeoCoins } from '../../components/icons/NeoIcons';

export const BusinessLoansInfoPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans selection:bg-[#4D9DE0] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 overflow-hidden">
        {/* HERO */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24 relative">
          <div className="flex flex-col-reverse md:flex-row items-center gap-12">
            
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-[#E0FF4F] translate-x-4 translate-y-4 border-[3px] border-black"></div>
              <div className="bg-white border-[3px] border-black p-8 relative z-10">
                <div className="w-full h-64 bg-[#FF6666] border-[3px] border-black flex items-center justify-center flex-col gap-4 shadow-[inset_0px_-10px_0px_rgba(0,0,0,0.2)]">
                    <NeoCoins className="w-20 h-20 text-white" />
                    <span className="font-black text-white uppercase text-4xl">₦5,000,000</span>
                    <span className="font-bold text-white uppercase text-xl">Pre-approved</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8 relative z-10 text-right md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4D9DE0] text-white border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-[2deg]">
                <NeoCoins className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wider text-sm">Business Loans</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] uppercase tracking-tight">
                Grow Faster.<br/>
                <span className="bg-[#E0FF4F] px-4">No Paperwork.</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold max-w-lg border-b-[4px] border-[#FFD166] pb-4 ml-auto md:ml-0">
                Get access to capital based on your Kudi sales history. Instant approval, flexible repayment.
              </p>
              <Link to="/signup?intent=eligibility" className="inline-block">
                <BrutalButton color="#FF6666" className="text-xl">
                  Check Eligibility
                </BrutalButton>
              </Link>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center uppercase">
            How it <span className="bg-black text-[#E0FF4F] px-4">works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: 'Sell & Build', color: '#FFFFFF', desc: 'Every sale you make on Kudi builds your Trust Score.' },
              { icon: Rocket, title: 'Get Offers', color: '#FFD166', desc: 'Receive tailored loan offers based on your revenue.' },
              { icon: Clock, title: 'Instant Cash', color: '#4D9DE0', desc: 'Funds hit your wallet instantly. No waiting.' },
            ].map((feature, idx) => (
              <BrutalCard key={idx} color={feature.color} className="text-center flex flex-col items-center">
                <div className="p-4 bg-white border-[3px] border-black rounded-full mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform hover:scale-110 transition-transform">
                  <feature.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase">{feature.title}</h3>
                <p className="text-lg font-bold">{feature.desc}</p>
              </BrutalCard>
            ))}
          </div>
        </section>

      </main>
      <Footer ctaHeading="Unlock capital faster" ctaButton="Open Your Storefront" />
    </div>
  );
};
