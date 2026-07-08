import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Lightning, TrendUp, ShieldCheck, Sparkle, DeviceMobile, ChatCircleText, Package, Wallet, XCircle, ShoppingBag, Storefront } from '@phosphor-icons/react';
import { BrutalMarquee } from '../components/ui/BrutalMarquee';

const RevenueCard = () => {
  const [stage, setStage] = useState(0);
  const [showX, setShowX] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStage(s => (s + 1) % 4);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [stage]);

  useEffect(() => {
    if (stage === 3) {
      const t = setTimeout(() => setShowX(true), 300);
      return () => clearTimeout(t);
    } else {
      setShowX(false);
    }
  }, [stage]);

  const dataSets = [
    [40, 70, 45, 90, 60, 100, 85],
    [80, 50, 90, 40, 75, 60, 95],
    [60, 90, 50, 70, 100, 80, 40],
    [0, 0, 0, 0, 0, 0, 0], // Empty state
  ];

  const metaData = [
    { rev: "₦4,250,000", trend: "+24.5%", trendColor: "bg-green-100 text-green-700 border-green-200", trendIcon: "up" },
    { rev: "₦3,800,000", trend: "+12.0%", trendColor: "bg-green-100 text-green-700 border-green-200", trendIcon: "up" },
    { rev: "₦5,100,000", trend: "+35.2%", trendColor: "bg-green-100 text-green-700 border-green-200", trendIcon: "up" },
    { rev: "₦0", trend: "-100%", trendColor: "bg-red-100 text-red-700 border-red-200", trendIcon: "down" },
  ];

  const currentMeta = metaData[stage];

  return (
    <div className="absolute top-0 right-10 w-[420px] bg-white border-2 border-slate-900 rounded-[24px] shadow-[12px_12px_0px_#4F46E5] z-20 p-6 transform hover:-translate-y-2 transition-transform duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E0FF4F] rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors duration-300">
            <TrendUp weight="bold" className={`w-5 h-5 transition-all duration-300 ${currentMeta.trendIcon === 'down' ? 'rotate-180 text-red-600' : 'text-slate-900'}`} />
          </div>
          <div>
            <div className="label-caps text-slate-500">Total Revenue</div>
            <div className={`text-2xl font-display font-bold transition-all duration-300 ${stage === 3 ? 'text-red-600 scale-105 origin-left' : 'text-slate-900'}`}>
              {currentMeta.rev}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 font-bold text-xs rounded-full border transition-all duration-300 ${currentMeta.trendColor}`}>
          {currentMeta.trend}
        </div>
      </div>
      
      {/* Animated Graph */}
      <div className="flex items-end gap-2 h-24 mb-4 relative">
        {stage === 3 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform ${showX ? 'scale-100' : 'scale-0'} relative`}>
              <div className="absolute inset-0 bg-[#E0FF4F] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] rotate-[10deg] scale-110"></div>
              <div className="relative bg-[#EF4444] border-4 border-slate-900 px-6 py-3 shadow-[8px_8px_0px_#0f172a] rotate-[-5deg] flex items-center justify-center gap-2">
                <span className="text-white font-display font-black text-2xl tracking-wider uppercase drop-shadow-[2px_2px_0px_#0f172a]">No Sales!</span>
              </div>
            </div>
          </div>
        )}
        {dataSets[stage].map((height, i) => (
          <div 
            key={i} 
            className={`flex-1 transition-all duration-700 ease-in-out border-2 border-slate-900 border-b-0 shadow-[2px_2px_0px_#0f172a] ${stage === 3 ? 'bg-[#EF4444]' : (i === 5 ? 'bg-[#4F46E5]' : 'bg-slate-300 hover:bg-[#E0FF4F]')}`} 
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs font-bold text-slate-400">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
};

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#E0FF4F] selection:text-slate-900">
      <Navbar />

      <main className="pt-24 sm:pt-32 pb-20 relative">
        {/* Subtle Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0 opacity-50" />

        {/* Dynamic Glass Gradients */}
        <div className="absolute top-0 left-[-10%] w-[600px] h-[600px] bg-[#E0FF4F] rounded-full mix-blend-multiply blur-[120px] opacity-60 animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-[#4F46E5] rounded-full mix-blend-multiply blur-[120px] opacity-40 animate-pulse pointer-events-none z-0" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] left-[20%] w-[600px] h-[600px] bg-[#10B981] rounded-full mix-blend-multiply blur-[120px] opacity-40 animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s' }} />

        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto mb-24 sm:mb-32 lg:mb-40 flex flex-col lg:flex-row items-center gap-12 sm:gap-16 lg:gap-8 z-10 pt-8 sm:pt-16 group/hero">
          
          {/* Left Text */}
          <div className="flex-1 max-w-2xl z-20">

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[90px] font-display font-black leading-[1.05] tracking-tight mb-6 sm:mb-8 text-slate-900">
              Commerce.<br />
              <span className="text-[#4F46E5] inline-block -rotate-1 origin-left">Unleashed.</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-xl mb-8 sm:mb-12 leading-relaxed font-medium">
              We help ambitious merchants sell faster and build credit without the traditional banking friction. Effortless, instant, and transparent.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-[#E0FF4F] text-slate-900 px-6 sm:px-10 py-4 sm:py-5 rounded-[12px] font-bold text-base sm:text-lg border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] sm:shadow-[6px_6px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] sm:hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] sm:active:translate-y-[6px] active:translate-x-[4px] sm:active:translate-x-[6px] active:shadow-none transition-all">
                  Start Selling Now
                </button>
              </Link>
              <Link to="#how-it-works" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-slate-900 px-6 sm:px-10 py-4 sm:py-5 rounded-[12px] font-bold text-base sm:text-lg border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] sm:shadow-[6px_6px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] sm:hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] sm:active:translate-y-[6px] active:translate-x-[4px] sm:active:translate-x-[6px] active:shadow-none transition-all">
                  How It Works
                </button>
              </Link>
            </div>
          </div>

          {/* Right Hero Graphic - Complex UI Cards */}
          <div className="flex-1 w-full relative h-[400px] sm:h-[500px] hidden lg:block perspective-1000">
            {/* Sales Dashboard Card */}
            <RevenueCard />

            {/* Notification Card - Flashes continuously */}
            <div className="absolute top-52 right-80 w-[300px] bg-[#EF4444] text-white border-2 border-slate-900 rounded-[20px] shadow-[8px_8px_0px_#0f172a] z-30 p-5 animate-[flashCard_5s_ease-in-out_infinite] -rotate-6 transition-all pointer-events-none">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#EF4444]">
                  <Lightning weight="fill" className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-bold text-lg leading-tight mb-1">New Order!</div>
                  <div className="text-white/90 text-sm font-medium">Just received ₦45,000 via WhatsApp link.</div>
                </div>
              </div>
            </div>

            {/* Trust Score Card */}
            <div className="absolute -bottom-10 right-20 w-[360px] bg-white border-2 border-slate-900 rounded-[24px] shadow-[12px_12px_0px_#10B981] z-10 p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="label-caps text-slate-500 mb-1">Capital Readiness</div>
                  <div className="text-3xl font-display font-black text-slate-900">360<span className="text-lg text-slate-400">/500</span></div>
                </div>
                <div className="w-12 h-12 bg-[#10B981]/20 rounded-full border-2 border-[#10B981] flex items-center justify-center">
                  <ShieldCheck weight="fill" className="w-6 h-6 text-[#10B981]" />
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-2">
                <div className="h-full bg-[#10B981] w-[72%] border-r border-slate-900" />
              </div>
              <p className="text-sm font-medium text-slate-600">You're <span className="font-bold text-[#10B981]">72%</span> of the way to a ₦50,000 overdraft.</p>
            </div>
          </div>

        </section>

        {/* RED SLIM BAND */}
        <BrutalMarquee 
          className="bg-[#EF4444] border-y-[3px] border-black py-2.5 text-white font-black uppercase text-sm tracking-widest hover:[&>div]:[animation-play-state:paused] cursor-default z-20 relative shadow-[0_4px_0px_#0f172a]" 
          speed="normal"
        >
          <span className="mx-4">INSTANT STOREFRONTS</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">ZERO CODE REQUIRED</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">WHATSAPP CHECKOUT</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">REAL-TIME INVENTORY</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">BUSINESS LEDGER</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">AUTO-RECEIPTS</span>
          <span className="mx-4 text-slate-900">•</span>
          <span className="mx-4">AI TRUST SCORE</span>
          <span className="mx-4 text-slate-900">•</span>
        </BrutalMarquee>

        {/* ASYMMETRICAL FEATURES LAYOUT */}
        <div className="relative w-full z-10 py-10 sm:py-16 mt-10">
          {/* Dotted/Striped Slanted Texture representing digital infrastructure */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" style={{ maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)' }}>
            <div 
              className="absolute inset-[-50%] bg-[radial-gradient(#94a3b8_4px,transparent_4px)] [background-size:32px_32px] opacity-100 -rotate-45" 
            />
          </div>
          
          <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto mb-20 sm:mb-32 lg:mb-40 relative">
          <div className="mb-16 sm:mb-24 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 sm:gap-8 border-b-2 border-slate-900 pb-8 sm:pb-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-slate-900 max-w-2xl leading-[1.05]">
              Supercharge Your Hustle
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-md font-medium">
              Everything you need to launch, manage, and scale your business from your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Instant Storefronts - Blue Card */}
            <div className="md:col-span-12 lg:col-span-7 bg-[#4F46E5] border-2 border-slate-900 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] flex flex-col justify-between shadow-[8px_8px_0px_#0f172a] sm:shadow-[12px_12px_0px_#0f172a] relative overflow-hidden group">
              <div className="flex justify-between items-start mb-12 sm:mb-16 relative z-10">
                <div className="p-3 sm:p-4 bg-white border-2 border-slate-900 rounded-[12px] sm:rounded-[16px] shadow-[4px_4px_0px_#0f172a] group-hover:-translate-y-1 transition-transform">
                  <Package weight="bold" className="w-6 h-6 sm:w-8 sm:h-8 text-[#4F46E5]" />
                </div>
              </div>
              
              <div className="relative z-10 w-full md:w-[55%] pr-4 flex flex-col items-start">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black mb-4 text-white tracking-tight">Instant Storefronts</h3>
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed font-medium mb-8">
                  Go from zero to selling in 3 minutes. Upload your products, get a link, and start receiving payments seamlessly.
                </p>
                <Link to="/signup?intent=start-building" className="inline-block mt-auto bg-white text-[#4F46E5] px-6 sm:px-8 py-3 sm:py-4 rounded-[12px] font-bold text-base border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
                  Start Building Now
                </Link>
              </div>

              {/* Mini UI Element: Storefront Mockup */}
              <div className="absolute right-[-40px] sm:right-[-60px] lg:right-[-80px] bottom-[-60px] md:bottom-[-80px] w-[320px] sm:w-[420px] bg-[#F8FAFC] border-4 border-slate-900 rounded-[24px] shadow-[12px_12px_0px_#0f172a] rotate-[-6deg] group-hover:rotate-[-2deg] transition-transform duration-500 hidden md:block overflow-hidden">
                {/* Mock Header */}
                <div className="bg-white border-b-4 border-slate-900 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#E0FF4F] rounded-[8px] border-2 border-slate-900 flex items-center justify-center">
                      <Storefront weight="bold" className="w-5 h-5 text-slate-900" />
                    </div>
                    <div className="w-24 h-4 bg-slate-200 rounded-full" />
                  </div>
                  <ShoppingBag weight="bold" className="w-6 h-6 text-slate-900" />
                </div>
                {/* Mock Hero */}
                <div className="p-6 border-b-4 border-slate-900 bg-slate-100 flex flex-col gap-3">
                  <div className="w-3/4 h-6 bg-slate-300 rounded-full" />
                  <div className="w-1/2 h-3 bg-slate-200 rounded-full" />
                </div>
                {/* Mock Grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white border-2 border-slate-900 rounded-[16px] p-3 shadow-[4px_4px_0px_#0f172a]">
                      <div className="aspect-[4/5] bg-slate-100 rounded-[8px] mb-3 border-2 border-slate-200" />
                      <div className="w-16 h-3 bg-slate-200 rounded-full mb-2" />
                      <div className="w-20 h-4 bg-slate-900 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit Built In - Yellow Card */}
            <div className="md:col-span-12 lg:col-span-5 bg-[#E0FF4F] border-2 border-slate-900 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] flex flex-col justify-between shadow-[8px_8px_0px_#0f172a] sm:shadow-[12px_12px_0px_#0f172a] group hover:-translate-y-1 transition-all">
              <div className="p-3 sm:p-4 bg-white border-2 border-slate-900 rounded-[12px] sm:rounded-[16px] shadow-[4px_4px_0px_#0f172a] w-max mb-10 sm:mb-12 group-hover:-rotate-6 transition-transform">
                <Wallet weight="bold" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900" />
              </div>
              
              <div>
                <h3 className="text-3xl sm:text-4xl font-display font-black mb-4 text-slate-900">Credit Built In</h3>
                <p className="text-slate-800 text-base sm:text-lg leading-relaxed font-medium mb-6">
                  Every sale builds your Trust Score. Unlock business loans and overdrafts as you grow.
                </p>
                <Link to="/signup?intent=eligibility" className="inline-block mb-8 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-[12px] font-bold text-base border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
                  Check Eligibility
                </Link>

                {/* Mini UI Element: Loan Unlocked */}
                <div className="bg-white border-2 border-slate-900 rounded-[16px] p-4 shadow-[4px_4px_0px_#0f172a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">Overdraft Limit</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-slate-900">₦50,000</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Magic - Solid Card */}
            <div className="md:col-span-12 bg-[#10B981] border-2 border-slate-900 p-6 sm:p-10 lg:p-16 rounded-[24px] sm:rounded-[32px] flex flex-col md:flex-row gap-8 lg:gap-12 items-center shadow-[8px_8px_0px_#0f172a] sm:shadow-[12px_12px_0px_#0f172a] relative overflow-hidden group">
              <div className="flex-1 w-full relative z-10">
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-4 sm:mb-6 text-white tracking-tight">WhatsApp Magic</h3>
                <p className="text-emerald-50 text-lg sm:text-xl leading-relaxed mb-8 sm:mb-10 font-medium max-w-xl">
                  Manage orders, chat with customers, and accept payments directly from WhatsApp. Your AI assistant handles the routine tasks.
                </p>
                <Link to="/signup?intent=open-storefront" className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-[#10B981] px-8 sm:px-10 py-4 sm:py-5 rounded-[12px] font-bold text-base sm:text-lg shadow-[4px_4px_0px_#0f172a] sm:shadow-[6px_6px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] sm:hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] sm:active:translate-y-[6px] active:translate-x-[4px] sm:active:translate-x-[6px] active:shadow-none transition-all group/btn border-2 border-slate-900">
                  Open Storefront <ArrowRight weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform"/>
                </Link>
              </div>

              {/* Mini UI Element: Chat Interface */}
              <div className="w-full md:w-[350px] lg:w-[400px] shrink-0">
                 <div className="bg-white border-2 border-slate-900 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-[6px_6px_0px_#0f172a] sm:shadow-[8px_8px_0px_#0f172a] group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#10B981] rounded-full border-2 border-slate-900 flex items-center justify-center">
                        <DeviceMobile weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">Kudi Assistant</div>
                        <div className="text-[10px] sm:text-xs font-semibold text-[#10B981]">Online</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-white border-2 border-slate-900 rounded-[12px] rounded-tr-none px-3 sm:px-4 py-2 shadow-[2px_2px_0px_#0f172a] max-w-[85%] sm:max-w-[80%]">
                          <p className="text-xs sm:text-sm font-medium text-slate-900">Sold 2x Ankara for 30k</p>
                        </div>
                      </div>
                      {/* Bot Message */}
                      <div className="flex justify-start">
                        <div className="bg-[#E0FF4F] border-2 border-slate-900 rounded-[12px] rounded-tl-none px-3 sm:px-4 py-2 shadow-[2px_2px_0px_#0f172a] max-w-[95%] sm:max-w-[90%]">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                            <ShieldCheck weight="fill" className="text-slate-900"/> LOGGED!
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-slate-800">Revenue: +₦30,000<br/>Score: +5 PTS 🚀</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </section>
        </div>

      </main>

      <Footer ctaHeading="Ready to scale?" ctaButton="Let's Go" />
    </div>
  );
};
