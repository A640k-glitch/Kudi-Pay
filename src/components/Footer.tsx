import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, Mail, ChevronUp } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto max-w-[1100px] px-6 lg:px-8 pt-20 md:pt-24 pb-10 flex flex-col gap-12">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-5 md:col-span-1">
            <Logo className="h-8" whiteText />
            <p className="text-sm leading-relaxed text-white/40 max-w-56">
              Commerce and credit, woven together. Built for Nigerian merchants, designed for growth.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Twitter" className="text-white/30 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" aria-label="Instagram" className="text-white/30 hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" aria-label="YouTube" className="text-white/30 hover:text-white transition-colors"><Youtube className="w-4 h-4" /></a>
              <a href="mailto:hello@kudi.ng" className="text-xs text-white/30 hover:text-white transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />hello@kudi.ng</a>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Product</p>
            <Link to="/product/storefronts" className="text-sm text-white/40 hover:text-white transition-colors">Storefronts</Link>
            <Link to="/product/trust-score" className="text-sm text-white/40 hover:text-white transition-colors">Trust Score</Link>
            <Link to="/product/loans" className="text-sm text-white/40 hover:text-white transition-colors">Business Loans</Link>
          </nav>

          <nav className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Company</p>
            {['About', 'Blog', 'Careers', 'Contact', 'Privacy', 'Terms'].map(l => (
              <Link key={l} to="/" className="text-sm text-white/40 hover:text-white transition-colors">{l}</Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Kudi. Made with care in Nigeria.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronUp className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>
    </footer>
  );
};
