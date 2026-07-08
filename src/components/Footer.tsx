import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './Button';

interface FooterProps {
  ctaHeading?: string;
  ctaButton?: string;
}

export const Footer: React.FC<FooterProps> = ({
  ctaHeading = 'Ready to start your journey?',
  ctaButton = 'Create Your Store',
}) => {
  return (
    <footer className="bg-white border-t-4 border-slate-900">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 pt-16 md:pt-20 pb-10 flex flex-col gap-16">
        
        {/* Full-width Internal CTA Block */}
        <div className="relative overflow-hidden px-8 py-12 md:px-14 md:py-16 flex flex-col items-center justify-center text-center gap-8 rounded-[32px] border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] bg-slate-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E0FF4F]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F46E5]/20 rounded-full blur-3xl" />
          
          <h2 className="text-3xl md:text-5xl font-display font-black text-white leading-tight tracking-tight relative z-10">
            {ctaHeading}
          </h2>
          <Link to="/signup" className="relative z-10">
            <button className="flex items-center gap-3 font-bold text-lg px-8 py-4 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_#E0FF4F] bg-[#E0FF4F] text-slate-900 hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-2 active:translate-x-2 active:shadow-none transition-all">
              {ctaButton}
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-5 md:col-span-1">
            <Logo className="h-8 text-slate-900" />
            <p className="text-sm font-bold text-slate-600 max-w-xs leading-relaxed">
              Commerce and credit. Built for modern merchants. Effortless, instant, and transparent.
            </p>
          </div>

          <nav className="flex flex-col gap-4">
            <p className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Product</p>
            <Link to="/product/storefronts" className="text-sm font-bold text-slate-600 hover:text-[#4F46E5] hover:underline underline-offset-4 transition-all">Storefronts</Link>
            <Link to="/product/trust-score" className="text-sm font-bold text-slate-600 hover:text-[#4F46E5] hover:underline underline-offset-4 transition-all">Trust Score</Link>
            <Link to="/product/loans" className="text-sm font-bold text-slate-600 hover:text-[#4F46E5] hover:underline underline-offset-4 transition-all">Business Loans</Link>
          </nav>

          <nav className="flex flex-col gap-4">
            <p className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Company</p>
            {['About', 'Blog', 'Careers', 'Contact', 'Privacy', 'Terms'].map(l => (
              <Link key={l} to="/" className="text-sm font-bold text-slate-600 hover:text-[#4F46E5] hover:underline underline-offset-4 transition-all">{l}</Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between border-t-4 border-slate-900 pt-6">
          <p className="text-sm font-bold text-slate-900">© {new Date().getFullYear()} Kudi.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="p-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full text-slate-900 hover:bg-[#E0FF4F] transition-all">
            <ChevronUp className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </div>
    </footer>
  );
};
