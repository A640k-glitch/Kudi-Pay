import React, { useState, useEffect } from 'react';
import { PaintBrushBroad, CheckCircle } from '@phosphor-icons/react';
import { Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';

const THEMES = [
  {
    id: 'light',
    name: 'Light Mode',
    desc: 'Clean, elegant, Shopify-inspired theme. Perfect for boutique and premium stores.',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    desc: 'Clean, professional, e-commerce standard. Let your products do the talking.',
  },
];

export default function ThemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTheme, setActiveTheme] = useState<'light' | 'modern'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        const raw = b.theme as string;
        const valid: 'light' | 'modern' = raw === 'brutal' || raw === 'light' ? 'light' : 'modern';
        setActiveTheme(valid);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Auto-save + broadcast on theme change
  useEffect(() => {
    if (!business || isLoading) return;
    const timer = setTimeout(async () => {
      try {
        await businessService.updateBusiness(business.id, { theme: activeTheme });
        const ch = new BroadcastChannel('theme_updates');
        ch.postMessage({ type: 'theme_changed', slug: business.storefrontSlug, theme: activeTheme });
        ch.close();
      } catch (e) {
        console.error('Failed to auto-save theme', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTheme, business?.id, isLoading]);

  if (!business) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-slate-900">

      {/* Header */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-1 flex items-center gap-3">
            <PaintBrushBroad className="w-8 h-8" weight="fill" />
            Storefront Themes
          </h1>
          <p className="text-sm md:text-base font-bold text-slate-500">
            Choose how your store looks to the world.
          </p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer">
          <button className="bg-[#E0FF4F] text-slate-900 px-6 py-3 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all whitespace-nowrap">
            Visit Store
          </button>
        </a>
      </header>

      {/* Theme selectors — centered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mx-auto">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => setActiveTheme(theme.id as 'light' | 'modern')}
            className={`p-5 rounded-[16px] border-2 text-left transition-all hover:translate-y-[2px] hover:translate-x-[2px] ${
              activeTheme === theme.id
                ? 'bg-[#E0FF4F] border-slate-900 text-slate-900 shadow-[4px_4px_0px_#0f172a]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:shadow-[4px_4px_0px_#0f172a] hover:text-slate-900'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-lg">{theme.name}</h3>
              {activeTheme === theme.id && (
                <CheckCircle className="w-6 h-6 text-slate-900 shrink-0" weight="fill" />
              )}
            </div>
            <p className="text-sm font-bold opacity-80">{theme.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
