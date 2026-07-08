import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2 } from 'lucide-react';
import BrutalButton from '../../components/ui/BrutalButton';
import { Logo } from '../../components/Logo';
import { storefrontSchema } from '../../lib/validation/schemas';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

const THEMES = [
  { id: 'brutal', name: 'Neo-Brutalism', desc: 'High contrast, bold fonts, raw aesthetic' },
  { id: 'modern', name: 'Modern Minimal', desc: 'Clean, sleek, Shopify-like experience' },
];

export default function StorefrontSetupPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: { theme: 'brutal' }
  });

  const slug = watch('storefrontSlug');
  const selectedTheme = watch('theme');

  useEffect(() => {
    // Auto-suggest slug from session
    const stored = sessionStorage.getItem('coda_onboarding_business');
    if (stored) {
      const { businessName } = JSON.parse(stored);
      if (businessName) {
        const generated = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        setValue('storefrontSlug', generated);
      }
    }
  }, [setValue]);

  useEffect(() => {
    if (!slug || errors.storefrontSlug) {
      setIsAvailable(null);
      return;
    }
    const checkTimer = setTimeout(async () => {
      setIsChecking(true);
      const available = await businessService.checkSlugAvailable(slug);
      setIsAvailable(available);
      setIsChecking(false);
    }, 500);
    return () => clearTimeout(checkTimer);
  }, [slug, errors.storefrontSlug]);

  const onSubmit = async (data: StorefrontFormValues) => {
    if (isAvailable === false) return;
    
    setIsSubmitting(true);
    try {
      const stored = sessionStorage.getItem('coda_onboarding_business');
      const businessData = stored ? JSON.parse(stored) : {};
      const phone = authService.getCurrentPhone();
      
      if (!phone) throw new Error("No session");

      await businessService.createBusiness({
        ...businessData,
        ...data,
        ownerPhone: phone,
      });
      
      sessionStorage.removeItem('coda_onboarding_business');
      navigate('/onboarding/first-product');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-black font-sans selection:bg-[#E0FF4F] selection:text-black">
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none border-b-[4px] border-black bg-white shadow-[0px_4px_0px_rgba(0,0,0,1)] z-10">
        <Logo className="h-8" />

      </header>

      <main className="flex-1 flex flex-col justify-center px-4 max-w-lg mx-auto w-full py-8 md:py-12 animate-fade-in">
        <div className="bg-white p-6 md:p-10 border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          
          <div className="mb-8 border-b-[4px] border-black pb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Setup Store</h1>
            <p className="font-bold text-gray-600 uppercase text-sm">Choose your unique link and design theme.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div>
              <label className="block font-black uppercase text-sm mb-2">Store Link</label>
              <div className="flex items-stretch border-[4px] border-black focus-within:bg-[#E0FF4F] transition-colors bg-white">
                <span className="flex items-center px-4 font-black uppercase bg-gray-100 border-r-[4px] border-black shrink-0">
                  kudi.ng/store/
                </span>
                <input
                  type="text"
                  {...register('storefrontSlug')}
                  className="w-full p-4 font-bold outline-none bg-transparent"
                />
              </div>
              
              {errors.storefrontSlug && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.storefrontSlug.message}</p>}
              {!errors.storefrontSlug && isAvailable === false && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">This link is already taken</p>}
              
              <div className="mt-2 text-sm font-black uppercase">
                {isChecking && <span className="flex items-center text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Checking...</span>}
                {!isChecking && isAvailable === true && <span className="flex items-center text-[#06D6A0]"><Check className="w-5 h-5 mr-1" strokeWidth={3}/> Available!</span>}
              </div>
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Select Theme</label>
              <div className="grid grid-cols-1 gap-4">
                {THEMES.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => setValue('theme', t.id as any)}
                    className={`relative p-5 border-[4px] border-black cursor-pointer transition-all ${selectedTheme === t.id ? 'bg-[#E0FF4F] shadow-[4px_4px_0px_rgba(0,0,0,1)] -translate-y-1' : 'bg-white hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black uppercase text-lg">{t.name}</span>
                      {selectedTheme === t.id && (
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white border-[2px] border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                          <Check className="w-5 h-5" strokeWidth={3}/>
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-gray-700">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <BrutalButton type="submit" className="w-full mt-4 h-16 text-xl" disabled={isAvailable === false} isLoading={isSubmitting}>
              Create storefront &rarr;
            </BrutalButton>
          </form>
        </div>
      </main>
    </div>
  );
}
