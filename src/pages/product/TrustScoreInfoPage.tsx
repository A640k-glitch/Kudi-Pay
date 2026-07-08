import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import BrutalButton from '../../components/ui/BrutalButton';
import { BrutalCard } from '../../components/ui/BrutalCard';
import { Award } from 'lucide-react';
import { NeoStar, NeoActivity, NeoShield, NeoTarget } from '../../components/icons/NeoIcons';

export const TrustScoreInfoPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-black font-sans selection:bg-[#FF6666] selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 overflow-hidden">
        {/* HERO */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6666] border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-2">
                <NeoStar className="w-5 h-5 text-white" fill="currentColor" />
                <span className="font-bold uppercase tracking-wider text-sm text-white">Trust Score</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] uppercase tracking-tight break-words">
                Reputation <br/>
                <span className="bg-[#E0FF4F] px-2 md:px-4 inline-block mt-2">Is Money.</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold max-w-lg border-b-[4px] border-[#4D9DE0] pb-4">
                Your Trust Score tells the world you're reliable. Higher score = more sales and bigger loans.
              </p>
              <Link to="/signup?intent=start-building" className="inline-block">
                <BrutalButton color="#4D9DE0" textColor="#FFFFFF" className="text-xl">
                  Start Building Now
                </BrutalButton>
              </Link>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-[#4D9DE0] translate-x-4 -translate-y-4 border-[3px] border-black"></div>
              <div className="bg-white border-[3px] border-black p-8 relative z-10">
                <div className="w-full bg-[#E0FF4F] border-[3px] border-black flex items-center justify-center flex-col gap-2 py-12 shadow-[inset_0px_-10px_0px_rgba(0,0,0,0.1)]">
                    <span className="font-black text-black uppercase text-2xl">Your Score</span>
                    <span className="font-black text-[#FF6666] uppercase text-8xl">940</span>
                    <div className="flex items-center gap-1 text-black font-bold uppercase mt-4">
                        <NeoActivity className="w-5 h-5" />
                        Top 5% Merchant
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center uppercase">
            The <span className="bg-black text-[#FF6666] px-4">Blueprint</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: NeoShield, title: 'Identity Verified', color: '#FFFFFF', desc: 'Secure KYC process ensures buyers know you are a real business.' },
              { icon: NeoTarget, title: 'Fulfillment Rate', color: '#FFD166', desc: 'Deliver orders on time and watch your score climb instantly.' },
              { icon: Award, title: 'Unlock Perks', color: '#4D9DE0', desc: 'Get featured on the Kudi marketplace and access premium loans.' },
            ].map((feature, idx) => (
              <BrutalCard key={idx} color={feature.color} className={idx === 1 ? 'transform -translate-y-4' : ''}>
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
      <Footer ctaHeading="Start building your score today" ctaButton="Create Account" />
    </div>
  );
};
