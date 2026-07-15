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
    <div className="relative min-[800px]:absolute min-[800px]:top-0 min-[800px]:right-0 w-[400px] max-w-full bg-white border-2 border-slate-900 rounded-[24px] shadow-[12px_12px_0px_#4F46E5] z-20 p-6 transform hover:-translate-y-2 transition-transform duration-300">
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

const TrustScoreCard = () => {
  const [score, setScore] = useState(0);

  useEffect(() => {
    let start = Date.now();
    const duration = 10000; // Very slow 10-second fill
    const maxScore = 935;
    const pauseDuration = 4000; // 4 second pause before restart

    let animationFrameId: number;

    const update = () => {
      const now = Date.now();
      const elapsed = now - start;

      if (elapsed < duration) {
        const progress = Math.min(1, elapsed / duration);
        const easeOut = progress * (2 - progress);
        setScore(Math.floor(easeOut * maxScore));
        animationFrameId = requestAnimationFrame(update);
      } else if (elapsed < duration + pauseDuration) {
        setScore(maxScore);
        animationFrameId = requestAnimationFrame(update);
      } else {
        start = Date.now();
        setScore(0);
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const percentage = Math.round((score / 1000) * 100);

  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex = (c: string) => parseInt(c.slice(1), 16);
    const r1 = hex(color1) >> 16, g1 = (hex(color1) >> 8) & 0xff, b1 = hex(color1) & 0xff;
    const r2 = hex(color2) >> 16, g2 = (hex(color2) >> 8) & 0xff, b2 = hex(color2) & 0xff;
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
  };

  const getDynamicColor = (currentScore: number) => {
    if (currentScore <= 200) return '#EF4444'; // Red
    if (currentScore <= 400) return interpolateColor('#EF4444', '#FACC15', (currentScore - 200) / 200); // Red to Yellow
    if (currentScore <= 600) return interpolateColor('#FACC15', '#D97706', (currentScore - 400) / 200); // Yellow to Dark Yellow
    if (currentScore <= 800) return interpolateColor('#D97706', '#10B981', (currentScore - 600) / 200); // Dark Yellow to Green
    return '#10B981'; // Green
  };

  const currentColor = getDynamicColor(score);

  return (
    <div 
      className="relative min-[800px]:absolute min-[800px]:bottom-0 min-[800px]:right-10 w-[340px] max-w-full bg-white border-2 border-slate-900 rounded-[24px] z-10 p-6 transform min-[800px]:rotate-3 hover:rotate-0 transition-transform duration-300"
      style={{ boxShadow: `12px 12px 0px ${currentColor}` }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="label-caps text-slate-500 mb-1">Trust Score</div>
          <div className="text-3xl font-display font-black text-slate-900">{score}<span className="text-lg text-slate-400">/1000</span></div>
        </div>
        <div 
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
          style={{ backgroundColor: `${currentColor}33`, borderColor: currentColor }}
        >
          <ShieldCheck weight="fill" className="w-6 h-6" style={{ color: currentColor }} />
        </div>
      </div>
      {/* Progress Bar */}
      <div className="w-full h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-2">
        <div className="h-full border-r border-slate-900" style={{ width: `${percentage}%`, backgroundColor: currentColor }} />
      </div>
      <p className="text-sm font-medium text-slate-600">You're <span className="font-bold" style={{ color: currentColor }}>{percentage}%</span> of the way to unlocking Tier 1 funding.</p>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        {/* Dynamic Glass Gradients - Shifted Right */}
        <div className="hidden md:block absolute top-0 right-[-10%] w-[500px] h-[500px] bg-[#E0FF4F] rounded-full mix-blend-multiply blur-[120px] opacity-60 animate-pulse pointer-events-none z-0" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[5%] w-[600px] h-[600px] bg-[#4F46E5] rounded-full mix-blend-multiply blur-[120px] opacity-40 animate-pulse pointer-events-none z-0" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] right-[15%] w-[500px] h-[500px] bg-[#10B981] rounded-full mix-blend-multiply blur-[120px] opacity-40 animate-pulse pointer-events-none z-0" style={{ animationDuration: '10s' }} />

        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto mb-24 sm:mb-32 lg:mb-40 flex flex-col min-[800px]:flex-row items-start min-[800px]:items-center justify-center gap-12 sm:gap-16 min-[800px]:gap-12 lg:gap-24 z-10 pt-8 sm:pt-16 group/hero">

          {/* Left Text */}
          <div className="flex-1 max-w-2xl z-20">

            <h1 className="text-4xl xs:text-5xl sm:text-6xl min-[800px]:text-[44px] min-[900px]:text-[52px] lg:text-[68px] xl:text-[80px] 2xl:text-[90px] font-display font-black leading-[1.05] tracking-tight mb-6 sm:mb-8 text-slate-900">
              Commerce.<br />
              <span className="text-[#4F46E5] inline-block -rotate-1 origin-left">Unleashed.</span>
            </h1>

            <p className="text-base sm:text-lg min-[800px]:text-sm min-[900px]:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-slate-600 max-w-xl mb-8 sm:mb-12 leading-relaxed font-medium">
              We help ambitious merchants sell faster and build credit without the traditional banking friction. Effortless, instant, and transparent.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-[#E0FF4F] text-slate-900 px-5 sm:px-8 min-[800px]:px-5 min-[900px]:px-6 lg:px-10 py-3.5 sm:py-4.5 min-[800px]:py-3.5 min-[900px]:py-4 lg:py-5 rounded-[12px] font-bold text-sm sm:text-base min-[800px]:text-sm min-[900px]:text-base lg:text-lg border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] sm:shadow-[6px_6px_0px_#0f172a] min-[800px]:shadow-[4px_4px_0px_#0f172a] min-[900px]:shadow-[5px_5px_0px_#0f172a] lg:shadow-[6px_6px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] sm:hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] sm:active:translate-y-[6px] active:translate-x-[4px] sm:active:translate-x-[6px] active:shadow-none transition-all">
                  Start Selling Now
                </button>
              </Link>
              <Link to="#how-it-works" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-slate-900 px-5 sm:px-8 min-[800px]:px-5 min-[900px]:px-6 lg:px-10 py-3.5 sm:py-4.5 min-[800px]:py-3.5 min-[900px]:py-4 lg:py-5 rounded-[12px] font-bold text-sm sm:text-base min-[800px]:text-sm min-[900px]:text-base lg:text-lg border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] sm:shadow-[6px_6px_0px_#0f172a] min-[800px]:shadow-[4px_4px_0px_#0f172a] min-[900px]:shadow-[5px_5px_0px_#0f172a] lg:shadow-[6px_6px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] sm:hover:shadow-[4px_4px_0px_#0f172a] active:translate-y-[4px] sm:active:translate-y-[6px] active:translate-x-[4px] sm:active:translate-x-[6px] active:shadow-none transition-all">
                  How It Works
                </button>
              </Link>
            </div>
          </div>

          {/* Right Hero Graphic - Complex UI Cards */}
          <div 
            className="w-full min-[800px]:w-[440px] min-[800px]:h-[480px] relative flex flex-col items-center min-[800px]:block perspective-1000 mt-8 min-[800px]:mt-0 gap-8 self-center min-[800px]:self-auto min-[800px]:shrink-0 transition-transform duration-300"
            style={
              windowWidth >= 800
                ? {
                    transform: `scale(${Math.min(1, Math.max(0.70, 0.70 + (windowWidth - 800) * 0.00075))})`,
                    transformOrigin: 'center center',
                  }
                : windowWidth < 450
                ? {
                    transform: `scale(${(windowWidth - 32) / 400})`,
                    transformOrigin: 'top center',
                    marginBottom: `${(((windowWidth - 32) / 400) - 1) * 680}px`,
                  }
                : {}
            }
          >
            {/* Sales Dashboard Card */}
            <RevenueCard />

            {/* Notification Card - Flashes continuously */}
            <div className="relative min-[800px]:absolute min-[800px]:top-44 min-[800px]:left-0 w-[280px] max-w-full bg-[#EF4444] text-white border-2 border-slate-900 rounded-[20px] shadow-[8px_8px_0px_#0f172a] z-30 p-5 animate-[flashCard_5s_ease-in-out_infinite] min-[800px]:-rotate-6 transition-all pointer-events-none mx-auto min-[800px]:mx-0">
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
            <TrustScoreCard />
          </div>

        </section>

        {/* RED SLIM BAND */}
        <BrutalMarquee
          className="bg-[#EF4444] border-y-[3px] border-black py-2.5 text-white font-black uppercase text-sm tracking-widest hover:[&>div]:[animation-play-state:paused] cursor-default z-20 relative shadow-[0_4px_0px_#0f172a]"
          speed="slow"
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
            <div className="mb-16 sm:mb-24 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 border-b-2 border-slate-900 pb-8 sm:pb-12">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-slate-900 max-w-2xl leading-[1.05]">
                Supercharge Your Hustle
              </h2>
              <div className="bg-[#E0FF4F] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] p-4 sm:p-6 rounded-[16px] max-w-md">
                <p className="text-base sm:text-lg text-slate-900 font-bold leading-relaxed">
                  Everything you need to launch, manage, and scale your business from your phone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">

              {/* Instant Storefronts - Blue Card */}
              <div className="md:col-span-12 lg:col-span-7 bg-[#4F46E5] border-2 border-slate-900 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] flex flex-col justify-between shadow-[8px_8px_0px_#0f172a] sm:shadow-[12px_12px_0px_#0f172a] relative overflow-hidden group">
                <div className="flex justify-between items-start mb-12 sm:mb-16 relative z-10">
                  <div className="p-3 sm:p-4 bg-[#E0FF4F] border-2 border-slate-900 rounded-[12px] sm:rounded-[16px] shadow-[4px_4px_0px_#0f172a] group-hover:-translate-y-1 transition-transform">
                    <Storefront weight="bold" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900" />
                  </div>
                </div>

                <div className="relative z-10 w-full md:w-[55%] pr-4 flex flex-col items-start">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black mb-4 text-white tracking-tight drop-shadow-md">Instant Storefronts</h3>
                  <p className="text-white/95 text-lg sm:text-xl leading-relaxed font-medium mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Go from zero to selling in 3 minutes. Upload your products, get a link, and start receiving payments seamlessly.
                  </p>
                  <Link to="/signup?intent=start-building" className="inline-block mt-auto bg-white text-[#4F46E5] px-6 sm:px-8 py-3 sm:py-4 rounded-[12px] font-bold text-base border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
                    Start Building Now
                  </Link>
                </div>

                {/* Mini UI Element: Storefront Mockup */}
                <div className="absolute right-[-140px] bottom-[-120px] md:right-[-60px] lg:right-[-80px] md:bottom-[-80px] w-[320px] sm:w-[420px] bg-[#F8FAFC] border-4 border-slate-900 rounded-[24px] shadow-[12px_12px_0px_#0f172a] rotate-[-6deg] group-hover:rotate-[-2deg] transition-transform duration-500 block opacity-20 md:opacity-100 overflow-hidden z-0 pointer-events-none">
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
                    Every sale builds your Trust Score. Unlock business loans and capital as you grow.
                  </p>
                  <Link to="/signup?intent=eligibility" className="inline-block mb-8 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-[12px] font-bold text-base border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
                    Check Eligibility
                  </Link>

                  {/* Mini UI Element: Loan Unlocked */}
                  <div className="bg-white border-2 border-slate-900 rounded-[16px] p-4 shadow-[4px_4px_0px_#0f172a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">Loan Limit</span>
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
                    Open Storefront <ArrowRight weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
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
                            <ShieldCheck weight="fill" className="text-slate-900" /> LOGGED!
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-slate-800">Revenue: +₦30,000<br />Score: +5 PTS 🚀</p>
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
