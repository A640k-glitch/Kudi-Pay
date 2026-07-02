import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { useCartStore } from '../../lib/store';

export default function StoreLayout() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cartItemCount = useCartStore(state => state.getItemCount());

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const b = await businessService.getBusinessBySlug(slug);
      setBusiness(b);
      setIsLoading(false);
      
      if (b) {
        document.title = `${b.businessName} - Powered by CODA`;
      }
    }
    load();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 animate-pulse"></div>;

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-sm">The store you are looking for doesn't exist or has been removed.</p>
        <Link to="/" className="text-primary font-medium hover:underline">Create your own store</Link>
      </div>
    );
  }

  // Theme styles applied to the outer wrapper
  const theme = business.theme || 'classic';
  const themeClasses: Record<string, string> = {
    classic: 'bg-[#FAFAF8] text-gray-900',
    bold: 'bg-[#0f0f0f] text-white', // Dark background
    minimal: 'bg-white text-gray-900',
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${themeClasses[theme] || themeClasses.classic}`}>
      {/* Dynamic Theme Colors */}
      <style>{`
        :root {
          --store-primary: ${theme === 'bold' ? '#F5A623' : '#0F9D58'};
          --store-bg: ${theme === 'bold' ? '#0f0f0f' : theme === 'minimal' ? '#ffffff' : '#FAFAF8'};
          --store-card: ${theme === 'bold' ? '#1a1a1a' : '#ffffff'};
          --store-text: ${theme === 'bold' ? '#ffffff' : '#1A1A1A'};
          --store-text-muted: ${theme === 'bold' ? '#a1a1aa' : '#6b7280'};
          --store-border: ${theme === 'bold' ? '#27272a' : '#f3f4f6'};
        }
      `}</style>

      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ borderColor: 'var(--store-border)', backgroundColor: 'color-mix(in srgb, var(--store-bg) 80%, transparent)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={`/store/${slug}`} className="flex items-center gap-2.5">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.businessName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ backgroundColor: 'var(--store-primary)' }}>
                {business.businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold tracking-tight" style={{ color: 'var(--store-text)' }}>{business.businessName}</span>
          </Link>

          <Link to={`/store/${slug}/cart`} className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: 'var(--store-primary)' }}>
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto">
        <Outlet context={{ business }} />
      </main>
      
      <footer className="py-8 text-center text-sm" style={{ color: 'var(--store-text-muted)' }}>
        <a href="/" className="hover:underline">Powered by CODA</a>
      </footer>
    </div>
  );
}
