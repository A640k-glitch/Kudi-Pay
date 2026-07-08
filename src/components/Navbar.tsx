import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import BrutalButton from './ui/BrutalButton';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return cn(
      "text-base font-black uppercase tracking-wider px-2 py-1 border-[3px] transition-colors",
      isActive 
        ? "bg-black text-[#E0FF4F] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" 
        : "text-black border-transparent hover:border-black"
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-0">
      <nav className="mx-auto flex w-full items-center justify-between border-b-[4px] border-black bg-[#E0FF4F] px-6 py-4 shadow-[0px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-12">
          <Link to="/" className="transform hover:-rotate-2 transition-transform">
            <Logo className="h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/product/storefronts" className={getLinkClass("/product/storefronts")}>Storefronts</Link>
            <Link to="/product/loans" className={getLinkClass("/product/loans")}>Loans</Link>
            <Link to="/product/trust-score" className={getLinkClass("/product/trust-score")}>Trust Score</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-base font-black uppercase tracking-wider text-black hover:underline px-3 py-2">Log In</Link>
          <Link to="/signup">
            <BrutalButton color="#FF6666" className="py-2.5 px-6 text-sm">
              Get Started
            </BrutalButton>
          </Link>
        </div>
      </nav>
    </header>
  );
};
