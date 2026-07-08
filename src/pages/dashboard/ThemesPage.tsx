import React, { useState, useEffect } from 'react';
import { PaintBrushBroad, CheckCircle } from '@phosphor-icons/react';
import { NeoStore } from '../../components/icons/NeoIcons';
import { Business, ThemeConfig } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { useToast } from '../../components/Toast';

const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return '#000000';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('');
  const r = parseInt(hexcolor.substring(0,2),16) || 0;
  const g = parseInt(hexcolor.substring(2,2),16) || 0;
  const b = parseInt(hexcolor.substring(4,2),16) || 0;
  return (((r*299)+(g*587)+(b*114))/1000 >= 128) ? '#000000' : '#ffffff';
};

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

const PRESET_COLORS = ['#E0FF4F', '#FF6666', '#4D9DE0', '#FFD166', '#06D6A0', '#0f172a', '#FFFFFF'];

export default function ThemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTheme, setActiveTheme] = useState<'brutal' | 'modern'>('brutal');
  const [config, setConfig] = useState<ThemeConfig>({
    primaryColor: '#E0FF4F',
    ctaText: 'BUY NOW'
  });
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
          ctaText: 'BUY NOW'
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
  }, [activeTheme, config, business?.id, isLoading]);

  if (!business) return null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-10 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-1 flex items-center gap-3">
            <PaintBrushBroad className="w-8 h-8" weight="fill" /> Storefront Themes
          </h1>
          <p className="text-sm md:text-base font-bold text-slate-500">Customize how your store looks to the world.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer">
          <button className="bg-[#E0FF4F] text-slate-900 px-6 py-3 rounded-[12px] font-bold border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all">
            View Store
          </button>
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        
        {/* Left Column: Theme Selection & Config */}
        <div className="space-y-6 md:space-y-8">
          <section className="glass-panel p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mb-4 sm:mb-6 border-b-2 border-slate-100 pb-4">1. Select Layout</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map(theme => (
                <button 
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id as any)}
                  className={`p-4 rounded-[16px] border-2 text-left transition-all hover:translate-y-[2px] hover:translate-x-[2px] ${activeTheme === theme.id ? 'bg-[#E0FF4F] border-slate-900 text-slate-900 shadow-[4px_4px_0px_#0f172a]' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:shadow-[4px_4px_0px_#0f172a] hover:text-slate-900'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg">{theme.name}</h3>
                    {activeTheme === theme.id && <CheckCircle className="w-6 h-6 text-slate-900" weight="fill" />}
                  </div>
                  <p className="text-sm font-bold opacity-90">{theme.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mb-4 sm:mb-6 border-b-2 border-slate-100 pb-4">2. Customization</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Primary Color</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setConfig({...config, primaryColor: c})}
                      className={`w-10 h-10 rounded-full border-2 border-slate-900 transition-transform ${config.primaryColor === c ? 'shadow-[2px_2px_0px_#0f172a] scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input 
                  type="text" 
                  value={config.primaryColor || ''}
                  onChange={e => setConfig({...config, primaryColor: e.target.value})}
                  className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                  placeholder="#HEX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Call to Action Text</label>
                <input 
                  type="text" 
                  value={config.ctaText || ''}
                  onChange={e => setConfig({...config, ctaText: e.target.value})}
                  className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]"
                  placeholder="e.g. BUY NOW, ADD TO CART"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Live Preview Mockup */}
        <div className="lg:sticky lg:top-24 self-start">
          <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 mb-4 sm:mb-6">Live Preview</h2>
          <div className="border-[6px] border-slate-900 bg-slate-100 aspect-[9/16] max-w-[350px] mx-auto rounded-[48px] p-2 relative shadow-[12px_12px_0px_#0f172a]">
            <div className="w-full h-full bg-white rounded-[36px] overflow-hidden border-[4px] border-slate-900 relative">
              
              {/* Fake Mobile Header */}
              <div className="h-6 flex justify-between items-center px-6 pt-2 mb-2 bg-transparent z-10 relative">
                <div className="text-[11px] font-bold text-slate-900">9:41</div>
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 bg-slate-900 rounded-full" />
                  <div className="w-3.5 h-3.5 bg-slate-900 rounded-full" />
                </div>
              </div>

               {/* STOREFRONT PREVIEW BASED ON THEME */}
               {activeTheme === 'brutal' ? (
                 <div className={`flex flex-col h-full absolute inset-0 pt-8 ${getContrastYIQ(config.primaryColor || '#E0FF4F') === '#000000' ? 'bg-[#FDFBF7] text-slate-900' : 'bg-black text-white'}`}>
                    <div className={`p-4 border-b-[3px] flex justify-between items-center ${getContrastYIQ(config.primaryColor || '#E0FF4F') === '#000000' ? 'border-slate-900' : 'border-white'}`} style={{ backgroundColor: config.primaryColor, color: getContrastYIQ(config.primaryColor || '#E0FF4F') }}>
                       <span className="font-black uppercase text-base truncate max-w-[140px]">{business.businessName}</span>
                       <NeoStore className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                   <div className="p-5 flex-1 flex flex-col gap-5">
                      <div className={`w-full flex-1 min-h-0 border-[3px] relative overflow-hidden rounded-[12px] ${getContrastYIQ(config.primaryColor || '#E0FF4F') === '#000000' ? 'border-slate-900 bg-slate-100 shadow-[4px_4px_0px_#0f172a]' : 'border-white bg-slate-900 shadow-[4px_4px_0px_rgba(255,255,255,1)]'}`}>
                         <div className={`absolute -bottom-2 -right-2 px-3 py-1.5 border-[3px] font-black text-sm bg-[#FF6666] text-slate-900 ${getContrastYIQ(config.primaryColor || '#E0FF4F') === '#000000' ? 'border-slate-900 shadow-[2px_2px_0px_#0f172a]' : 'border-white shadow-[2px_2px_0px_rgba(255,255,255,1)]'}`}>
                           ₦15,000
                         </div>
                      </div>
                      <div>
                        <h3 className="font-black text-xl leading-tight mb-4">Awesome Product</h3>
                        <button className={`w-full py-3.5 border-2 font-black uppercase text-sm rounded-[12px] hover:translate-y-[2px] hover:translate-x-[2px] transition-all ${getContrastYIQ(config.primaryColor || '#E0FF4F') === '#000000' ? 'border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a]' : 'border-white shadow-[4px_4px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_rgba(255,255,255,1)]'}`} style={{ backgroundColor: config.primaryColor, color: getContrastYIQ(config.primaryColor || '#E0FF4F') }}>
                          {config.ctaText || 'Buy Now'}
                        </button>
                      </div>
                   </div>
                </div>
              ) : (
                <div className={`flex flex-col h-full font-sans absolute inset-0 pt-8 ${getContrastYIQ(config.primaryColor || '#10b981') === '#ffffff' ? 'bg-[#0f172a] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
                   <div className={`p-5 flex justify-between items-center border-b ${getContrastYIQ(config.primaryColor || '#10b981') === '#ffffff' ? 'border-slate-700/50' : 'border-slate-100'}`}>
                      <span className="font-bold text-lg truncate max-w-[140px] tracking-tight">{business.businessName}</span>
                      <NeoStore className="w-6 h-6 opacity-50" strokeWidth={1.5} />
                   </div>
                   <div className="p-0 flex-1 flex flex-col">
                      <div className={`w-full flex-1 min-h-[200px] object-cover ${getContrastYIQ(config.primaryColor || '#10b981') === '#ffffff' ? 'bg-slate-800' : 'bg-slate-100'}`} />
                      <div className={`px-5 py-6 border-t ${getContrastYIQ(config.primaryColor || '#10b981') === '#ffffff' ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-100'}`}>
                        <h3 className="font-semibold text-xl mb-1">Premium Product</h3>
                        <p className={`text-base font-medium mb-6 ${getContrastYIQ(config.primaryColor || '#10b981') === '#ffffff' ? 'text-slate-400' : 'text-slate-500'}`}>₦15,000</p>
                        <button className="w-full py-4 rounded-[12px] font-bold text-base text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: config.primaryColor, color: getContrastYIQ(config.primaryColor || '#10b981') }}>
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
