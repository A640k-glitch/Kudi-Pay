import React, { useState, useEffect } from 'react';
import { Check, Palette } from 'lucide-react';
import { NeoStore } from '../../components/icons/NeoIcons';
import { Business, ThemeConfig } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';

const THEMES = [
  { 
    id: 'brutal', 
    name: 'Neo-Brutal', 
    desc: 'Vibrant, high-contrast, playful. Best for youth brands, tech, and creative products.',
  },
  { 
    id: 'modern', 
    name: 'Modern Minimal', 
    desc: 'Clean, professional, e-commerce standard. Let your products do the talking.',
  }
];

const PRESET_COLORS = ['#E0FF4F', '#FF6666', '#4D9DE0', '#FFD166', '#06D6A0', '#000000', '#FFFFFF'];

export default function ThemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTheme, setActiveTheme] = useState<'brutal' | 'modern'>('brutal');
  const [config, setConfig] = useState<ThemeConfig>({
    primaryColor: '#E0FF4F',
    secondaryColor: '#FF6666',
    ctaText: 'Buy Now'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        
        // Fix any weird legacy theme strings
        const validTheme = ['brutal', 'modern'].includes(b.theme || '') ? b.theme : 'brutal';
        setActiveTheme(validTheme as any);
        
        setConfig(b.themeConfig || {
          primaryColor: '#E0FF4F',
          secondaryColor: '#FF6666',
          ctaText: 'Buy Now'
        });
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Auto-save and broadcast changes dynamically
  useEffect(() => {
    if (!business || isLoading) return;

    const saveChanges = async () => {
      try {
        await businessService.updateBusiness(business.id, { 
          theme: activeTheme,
          themeConfig: config
        });
        
        const channel = new BroadcastChannel('theme_updates');
        channel.postMessage({ type: 'theme_changed', slug: business.storefrontSlug, theme: activeTheme, themeConfig: config });
        channel.close();
      } catch (e) {
        console.error('Failed to auto-save theme', e);
      }
    };

    const timer = setTimeout(saveChanges, 500); // debounce auto-save
    return () => clearTimeout(timer);
  }, [activeTheme, config, business?.id]);

  if (!business) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-10">
      <header className="mb-8 flex items-center justify-between border-b-[3px] border-black pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-black mb-2 flex items-center gap-2">
            <Palette className="w-8 h-8" strokeWidth={3} /> Storefront Themes
          </h1>
          <p className="text-lg font-bold text-gray-700">Customize how your store looks to the world.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer">
          <Button className="border-[3px] border-black bg-[#E0FF4F] text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all font-black uppercase">
            View Store
          </Button>
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Theme Selection & Config */}
        <div className="space-y-8">
          <section className="bg-white border-[4px] border-black p-4 sm:p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl sm:text-2xl font-black uppercase mb-4 sm:mb-6 border-b-[4px] border-black pb-4">1. Select Layout</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {THEMES.map(theme => (
                <button 
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id as any)}
                  className={`p-4 border-[3px] border-black text-left transition-all ${activeTheme === theme.id ? 'bg-black text-white shadow-[4px_4px_0px_rgba(224,255,79,1)] scale-105' : 'bg-white hover:bg-gray-100 shadow-[4px_4px_0px_rgba(0,0,0,1)]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black uppercase">{theme.name}</h3>
                    {activeTheme === theme.id && <Check className="w-5 h-5 text-[#E0FF4F]" strokeWidth={4} />}
                  </div>
                  <p className="text-sm font-bold opacity-90">{theme.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white border-[3px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-xl font-black uppercase mb-6 border-b-[3px] border-black pb-2">2. Customization</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black uppercase mb-2">Primary Color</label>
                <div className="flex gap-2 mb-2">
                  {PRESET_COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setConfig({...config, primaryColor: c})}
                      className={`w-8 h-8 border-[3px] border-black ${config.primaryColor === c ? 'shadow-[2px_2px_0px_rgba(0,0,0,1)] scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input 
                  type="text" 
                  value={config.primaryColor || ''}
                  onChange={e => setConfig({...config, primaryColor: e.target.value})}
                  className="w-full border-[3px] border-black p-2 font-bold uppercase"
                  placeholder="#HEX"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-2">Secondary / Accent Color</label>
                <div className="flex gap-2 mb-2">
                  {PRESET_COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setConfig({...config, secondaryColor: c})}
                      className={`w-8 h-8 border-[3px] border-black ${config.secondaryColor === c ? 'shadow-[2px_2px_0px_rgba(0,0,0,1)] scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input 
                  type="text" 
                  value={config.secondaryColor || ''}
                  onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                  className="w-full border-[3px] border-black p-2 font-bold uppercase"
                  placeholder="#HEX"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase mb-2">Call to Action Text</label>
                <input 
                  type="text" 
                  value={config.ctaText || ''}
                  onChange={e => setConfig({...config, ctaText: e.target.value})}
                  className="w-full border-[3px] border-black p-2 font-bold uppercase"
                  placeholder="e.g. BUY NOW, ADD TO CART"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Live Preview Mockup */}
        <div className="sticky top-24">
          <h2 className="text-xl font-black uppercase mb-4">Live Preview</h2>
          <div className="border-[4px] border-black bg-gray-200 aspect-[9/16] max-w-[350px] mx-auto rounded-[40px] p-2 relative shadow-[10px_10px_0px_rgba(0,0,0,1)]">
            <div className="w-full h-full bg-white rounded-[30px] overflow-hidden border-[3px] border-black relative">
              
              {/* Fake Mobile Header */}
              <div className="h-6 flex justify-between items-center px-4 pt-1 mb-2">
                <div className="text-[10px] font-bold">9:41</div>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-black rounded-full" />
                  <div className="w-3 h-3 bg-black rounded-full" />
                </div>
              </div>

              {/* STOREFRONT PREVIEW BASED ON THEME */}
              {activeTheme === 'brutal' ? (
                <div className="flex flex-col h-full bg-[#FDFBF7]">
                   <div className="p-3 border-b-[3px] border-black flex justify-between items-center" style={{ backgroundColor: config.primaryColor }}>
                      <span className="font-black uppercase text-sm truncate max-w-[120px]">{business.businessName}</span>
                      <NeoStore className="w-5 h-5" strokeWidth={2.5} />
                   </div>
                   <div className="p-4 flex-1">
                      <div className="w-full h-32 border-[3px] border-black bg-gray-100 mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative">
                         <div className="absolute -bottom-3 -right-3 px-2 py-1 border-[3px] border-black font-black text-xs uppercase" style={{ backgroundColor: config.secondaryColor }}>
                           ₦15,000
                         </div>
                      </div>
                      <h3 className="font-black uppercase text-lg leading-tight mb-4">Awesome Product</h3>
                      <button className="w-full py-2 border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: config.primaryColor }}>
                        {config.ctaText || 'Buy Now'}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col h-full bg-white font-sans">
                   <div className="p-4 flex justify-between items-center border-b border-gray-100">
                      <span className="font-bold text-base truncate max-w-[120px] tracking-tight">{business.businessName}</span>
                      <NeoStore className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                   </div>
                   <div className="p-0 flex-1">
                      <div className="w-full h-48 bg-gray-100 mb-4 object-cover" />
                      <div className="px-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">Premium Product</h3>
                        <p className="text-gray-500 text-sm mb-4">₦15,000</p>
                        <button className="w-full py-3 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90" style={{ backgroundColor: config.primaryColor }}>
                          {config.ctaText || 'Add to Cart'}
                        </button>
                      </div>
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
