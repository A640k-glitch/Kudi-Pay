import React, { useState, useEffect } from 'react';
import { Check, Palette, PackageOpen } from 'lucide-react';
import { Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';

const THEMES = [
  { 
    id: 'classic', 
    name: 'Classic Store', 
    desc: 'A clean, traditional e-commerce layout with structured product grids and a light background.',
    mockup: 'bg-gray-100',
    colors: ['bg-white', 'bg-gray-900', 'bg-gray-100']
  },
  { 
    id: 'bold', 
    name: 'Editorial (Bold)', 
    desc: 'An ultra-premium dark mode aesthetic with large asymmetrical product displays.',
    mockup: 'bg-[#111827]',
    colors: ['bg-[#111827]', 'bg-amber-400', 'bg-white']
  }
];

export default function ThemesPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTheme, setActiveTheme] = useState<string>('classic');
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        setActiveTheme(b.theme || 'classic');
      }
    }
    load();
  }, []);

  const handleSave = async (themeId: string) => {
    if (!business) return;
    setIsSaving(true);
    try {
      await businessService.updateBusiness(business.id, { theme: themeId as any });
      setActiveTheme(themeId);
      addToast('Theme updated successfully', 'success');
      
      const channel = new BroadcastChannel('theme_updates');
      channel.postMessage({ type: 'theme_changed', slug: business.storefrontSlug, theme: themeId });
      channel.close();
    } catch {
      addToast('Failed to update theme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!business) return null;

  return (
    <div className="p-3 md:p-4 max-w-4xl mx-auto pb-6 md:pb-10 overflow-hidden">
      <header className="mb-4 md:mb-6 flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-[#1E1B4B] mb-0.5 flex items-center gap-1.5">
            <Palette className="w-4 h-4 md:w-5 h-5 text-indigo-500" /> Storefront Themes
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500">Choose the look of your customer store.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer" className="hidden xs:block">
          <Button variant="secondary" size="small" className="h-8 text-xs py-1">View Store</Button>
        </a>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.id;
          
          return (
            <div 
              key={theme.id}
              className={`flex flex-col rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 bg-white ${isActive ? 'ring-2 ring-[#1E1B4B] shadow-md' : 'hover:border-gray-300'}`}
            >
              {/* Mockup Area: True Miniature Storefront Previews */}
              <div className={`h-32 sm:h-36 md:h-44 ${theme.id === 'classic' ? 'bg-[#F7F6F2]' : 'bg-[#111827]'} p-2 relative flex flex-col justify-start border-b border-gray-100/10 overflow-hidden select-none`}>
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 bg-[#1E1B4B] text-white text-[7px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm">
                    <Check className="w-2 h-2 text-emerald-400" /> Active
                  </div>
                )}

                {theme.id === 'classic' ? (
                  /* CLASSIC STOREFRONT MINI MOCKUP */
                  <div className="flex-1 flex flex-col justify-between h-full">
                    {/* Header */}
                    <div className="w-full flex items-center justify-between p-1 bg-[#FAFAF8] border-b border-[#E8E6E0] rounded-t-sm">
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-[#059669]" />
                        <div className="text-[5px] font-black text-gray-800 scale-90 origin-left">{business.businessName.substring(0, 8)}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex items-center justify-center bg-[#059669]/10 text-[#059669]">
                        <div className="w-1 h-1 border-t border-r border-current transform rotate-45 translate-x-[-0.5px] scale-50" />
                      </div>
                    </div>
                    {/* Hero */}
                    <div className="p-1.5 bg-white border-b border-gray-200 text-center flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[7px] font-bold text-gray-400 scale-95 mb-0.5">
                        {business.businessName.charAt(0)}
                      </div>
                      <div className="text-[6px] font-bold text-gray-900 leading-none truncate w-full">{business.businessName}</div>
                      <div className="text-[4px] text-gray-400 scale-90 w-full truncate mt-0.5">Authentic products direct from source.</div>
                    </div>
                    {/* Empty State */}
                    <div className="p-1 bg-white border border-gray-200 rounded mx-1 mb-1 text-center flex flex-col items-center justify-center">
                      <PackageOpen className="w-2.5 h-2.5 text-gray-300 mb-0.5" />
                      <div className="text-[5px] font-bold text-gray-900 leading-none">No products yet</div>
                    </div>
                  </div>
                ) : (
                  /* BOLD STOREFRONT MINI MOCKUP */
                  <div className="flex-1 flex flex-col justify-between h-full">
                    {/* Header */}
                    <div className="w-full flex items-center justify-between p-1 bg-[#141414] border-b border-white/5 rounded-t-sm">
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-amber-400" />
                        <div className="text-[5px] font-black text-white scale-90 origin-left">{business.businessName.substring(0, 8)}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex items-center justify-center bg-amber-400/10 text-amber-400">
                        <div className="w-1 h-1 border-t border-r border-current transform rotate-45 translate-x-[-0.5px] scale-50" />
                      </div>
                    </div>
                    {/* Editorial Hero */}
                    <div className="p-1.5 text-left flex flex-col justify-start">
                      <div className="text-[4px] font-bold text-amber-400 uppercase tracking-widest scale-90 origin-left">OFFICIAL STORE</div>
                      <div className="text-[7px] font-black text-white leading-none uppercase truncate mt-0.5">{business.businessName}</div>
                      <div className="text-[4.5px] text-gray-400 border-l border-white/20 pl-0.5 leading-snug mt-1 line-clamp-1 scale-95 origin-left">
                        Curated selection. Designed for the bold.
                      </div>
                    </div>
                    {/* Empty State */}
                    <div className="p-1 bg-white/5 border border-white/10 rounded mx-1 mb-1 text-center flex items-center justify-center backdrop-blur-sm">
                      <div className="text-[5px] font-bold text-white uppercase tracking-wider">Collection Empty</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Details */}
              <div className="p-2.5 md:p-4 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <h3 className="text-xs md:text-sm font-bold text-[#1E1B4B] truncate">{theme.name}</h3>
                    <div className="flex gap-0.5 shrink-0">
                      {theme.colors.map((color, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full border border-gray-200 ${color}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 leading-snug line-clamp-2">
                    {theme.desc}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-50">
                  {isActive ? (
                    <Button className="w-full h-8 text-[10px] md:text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100" disabled>
                      <Check className="w-3.5 h-3.5 mr-1" /> Active
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-8 text-[10px] md:text-xs bg-white text-[#1E1B4B] border border-gray-200 hover:bg-gray-50 shadow-sm"
                      onClick={() => handleSave(theme.id)}
                      isLoading={isSaving}
                    >
                      Apply Theme
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
