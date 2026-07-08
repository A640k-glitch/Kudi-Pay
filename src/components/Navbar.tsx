import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Button } from './Button';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return cn(
      "text-sm font-medium transition-colors hover:text-accent",
      isActive 
        ? "text-accent font-semibold" 
        : "text-slate-600"
    );
  };

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 transition-all duration-300",
      scrolled ? "py-4" : "py-6"
    )}>
      <div className="max-container px-4 sm:px-6">
        <nav className="mx-auto flex w-full items-center justify-between glass-panel px-6 py-3 rounded-2xl">
          <div className="flex items-center gap-10">
            <Link to="/" className="transform hover:scale-105 transition-transform">
              <Logo className="h-7 text-primary" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/product/storefronts" className={getLinkClass("/product/storefronts")}>Storefronts</Link>
              <Link to="/product/loans" className={getLinkClass("/product/loans")}>Loans</Link>
              <Link to="/product/trust-score" className={getLinkClass("/product/trust-score")}>Trust Score</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-medium text-slate-600 hover:text-primary transition-colors px-3 py-2">Log In</Link>
            <Link to="/signup">
              <Button variant="accent" size="small" className="rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};
