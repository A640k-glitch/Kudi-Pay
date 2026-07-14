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
    name: 'Dark Mode',
    desc: 'A soft, minimal, newspaper-like dark UI with elegant typography.',
    previewImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
  },
];

export default function ThemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTheme, setActiveTheme] = useState<'light' | 'modern'>('light');
  const [heroLabel, setHeroLabel] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
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
        setHeroLabel(b.themeConfig?.heroLabel || '');
        setHeroHeading(b.themeConfig?.heroHeading || '');
        setHeroSubheading(b.themeConfig?.heroSubheading || '');
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
        const themeConfig = {
          ...business.themeConfig,
          heroLabel: heroLabel.trim() || undefined,
          heroHeading: heroHeading.trim() || undefined,
          heroSubheading: heroSubheading.trim() || undefined
        };
        await businessService.updateBusiness(business.id, { theme: activeTheme, themeConfig });
        const ch = new BroadcastChannel('theme_updates');
        ch.postMessage({ type: 'theme_changed', slug: business.storefrontSlug, theme: activeTheme, themeConfig });
        ch.close();
      } catch (e) {
        console.error('Failed to auto-save theme', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [activeTheme, heroLabel, heroHeading, heroSubheading, business?.id, isLoading]);

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

      {/* Hero Customization */}
      <div className="mt-12 bg-white border-2 border-slate-200 rounded-[16px] p-6 max-w-xl mx-auto shadow-sm">
        <h2 className="text-xl font-display font-black text-slate-900 mb-6">Hero Section Content</h2>
        
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Label Text</label>
              <span className="text-xs text-slate-400 font-medium">{heroLabel.length}/20</span>
            </div>
            <input
              type="text"
              value={heroLabel}
              onChange={(e) => setHeroLabel(e.target.value.slice(0, 20))}
              placeholder="e.g. New Arrivals"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-base font-semibold focus:border-slate-900 focus:ring-0 outline-none transition-all placeholder:font-normal"
            />
            <p className="text-xs text-slate-500 mt-1.5">Small pill text above the main heading.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Main Heading</label>
              <span className="text-xs text-slate-400 font-medium">{heroHeading.length}/50</span>
            </div>
            <input
              type="text"
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value.slice(0, 50))}
              placeholder="e.g. Glow Naturally, Every Single Day."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-base font-semibold focus:border-slate-900 focus:ring-0 outline-none transition-all placeholder:font-normal"
            />
            <p className="text-xs text-slate-500 mt-1.5">The large title text. Keep it punchy.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Subheading / Description</label>
              <span className="text-xs text-slate-400 font-medium">{heroSubheading.length}/120</span>
            </div>
            <textarea
              value={heroSubheading}
              onChange={(e) => setHeroSubheading(e.target.value.slice(0, 120))}
              rows={3}
              placeholder="e.g. Discover our curated collection of premium skincare essentials formulated for radiant, healthy skin."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-base font-medium focus:border-slate-900 focus:ring-0 outline-none transition-all resize-none placeholder:font-normal"
            />
            <p className="text-xs text-slate-500 mt-1.5">A short sentence supporting the main heading.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
