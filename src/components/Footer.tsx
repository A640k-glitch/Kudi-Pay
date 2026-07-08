import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, Mail, ChevronUp } from 'lucide-react';
import { Logo } from './Logo';
import BrutalButton from './ui/BrutalButton';

interface FooterProps {
  ctaHeading?: string;
  ctaButton?: string;
}

export const Footer: React.FC<FooterProps> = ({
  ctaHeading = 'Ready to start your journey?',
  ctaButton = 'Create Your Store',
}) => {
  return (
    <footer className="bg-black text-white border-t-[4px] border-black">
      <div className="mx-auto max-w-[1100px] px-6 lg:px-8 pt-16 md:pt-20 pb-10 flex flex-col gap-16">
        
        {/* Full-width Internal CTA Block */}
        <div className="relative overflow-hidden bg-[#4D9DE0] border-[4px] border-white shadow-[8px_8px_0px_rgba(255,255,255,1)] px-8 py-12 md:px-14 md:py-16 flex flex-col items-center justify-center text-center gap-8 transform rotate-1 hover:rotate-0 transition-transform">
          <h2 className="text-4xl md:text-5xl font-black text-black uppercase leading-tight tracking-tight">
            {ctaHeading}
          </h2>
          <Link to="/signup" className="relative z-10">
            <BrutalButton color="#E0FF4F" className="text-xl px-10 py-5">
              {ctaButton}
            </BrutalButton>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-5 md:col-span-1">
            <Logo className="h-8" whiteText />
            <p className="text-base font-bold text-gray-300 max-w-56 uppercase tracking-wide">
              Commerce and credit. Built for Nigerian merchants.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" aria-label="Twitter" className="p-2 bg-white border-2 border-black text-black hover:bg-[#FFD166] transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" aria-label="Instagram" className="p-2 bg-white border-2 border-black text-black hover:bg-[#FF6666] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" aria-label="YouTube" className="p-2 bg-white border-2 border-black text-black hover:bg-[#FF6666] transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          <nav className="flex flex-col gap-4">
            <p className="text-sm font-black uppercase tracking-widest text-[#E0FF4F] mb-2">Product</p>
            <Link to="/product/storefronts" className="text-base font-bold text-white hover:text-[#4D9DE0] hover:underline transition-colors">Storefronts</Link>
            <Link to="/product/trust-score" className="text-base font-bold text-white hover:text-[#FFD166] hover:underline transition-colors">Trust Score</Link>
            <Link to="/product/loans" className="text-base font-bold text-white hover:text-[#FF6666] hover:underline transition-colors">Business Loans</Link>
          </nav>

          <nav className="flex flex-col gap-4">
            <p className="text-sm font-black uppercase tracking-widest text-[#E0FF4F] mb-2">Company</p>
            {['About', 'Blog', 'Careers', 'Contact', 'Privacy', 'Terms'].map(l => (
              <Link key={l} to="/" className="text-base font-bold text-white hover:underline transition-colors">{l}</Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between border-t-4 border-white pt-6">
          <p className="text-sm font-bold uppercase tracking-wider text-white">© {new Date().getFullYear()} Kudi.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="p-2 bg-white border-2 border-black text-black hover:bg-[#E0FF4F] shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_rgba(255,255,255,1)] hover:translate-y-1 hover:translate-x-1 transition-all">
            <ChevronUp className="w-6 h-6" />
          </button>
        </div>
      </div>
    </footer>
  );
};
