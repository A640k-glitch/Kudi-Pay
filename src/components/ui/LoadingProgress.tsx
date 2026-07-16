import React, { useEffect, useState } from 'react';

export default function LoadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate initial progress fast then slow down
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const remaining = 100 - prev;
        return prev + remaining * 0.15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC]">
      {/* Top Brand Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-[#E0FF4F] border-r-2 border-slate-900 transition-all duration-300 ease-out"
          style={{ width: `${progress}%`, boxShadow: '0 0 8px #E0FF4F' }}
        />
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Animated Brand Loader */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Brutal outer border */}
          <div className="absolute inset-0 border-4 border-slate-900 bg-[#E0FF4F] rounded-2xl shadow-[4px_4px_0px_#0f172a] animate-spin [animation-duration:3s]" />
          
          {/* Inner brand symbol */}
          <span className="relative font-display font-black text-3xl text-slate-900 select-none tracking-tight">
            K
          </span>
        </div>

        {/* Text indicators */}
        <div className="text-center">
          <div className="font-display font-bold text-slate-900 tracking-tight text-lg">
            KUDI.NG
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 animate-pulse">
            Loading storefront...
          </div>
        </div>
      </div>
    </div>
  );
}
