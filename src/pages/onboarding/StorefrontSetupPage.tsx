import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import BrutalButton from '../../components/ui/BrutalButton';
import { Logo } from '../../components/Logo';
import { storefrontSchema } from '../../lib/validation/schemas';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

const THEMES = [
  { id: 'light', name: 'Light Mode', desc: 'Clean, elegant, Shopify-inspired aesthetic' },
  { id: 'modern', name: 'Dark Mode', desc: 'A soft, minimal, newspaper-like dark UI with elegant typography.' },
];

export default function StorefrontSetupPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: { theme: 'light' }
  });

  const slug = watch('storefrontSlug');
  const selectedTheme = watch('theme');

  useEffect(() => {
    const stored = sessionStorage.getItem('kudi_onboarding_business');
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
    setSubmitError(null);
    try {
      const stored = sessionStorage.getItem('kudi_onboarding_business');
      const businessData = stored ? JSON.parse(stored) : {};
      const phone = authService.getCurrentPhone();
      const password = sessionStorage.getItem('kudi_temp_password') || '';

      if (!phone) throw new Error("No session");

      await businessService.createBusiness({
        ...businessData,
        ...data,
        ownerPhone: phone,
        password,
      });

      sessionStorage.removeItem('kudi_onboarding_business');
      sessionStorage.removeItem('kudi_temp_password');
      navigate('/onboarding/first-product');
    } catch (err: any) {
      console.error('[StorefrontSetup] Error:', err);
      setSubmitError(err?.message || 'Something went wrong. Check the console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] text-black font-sans selection:bg-[#E0FF4F] selection:text-black">
      <header className="sticky top-0 p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none border-b-[4px] border-black bg-white shadow-[0px_4px_0px_rgba(0,0,0,1)] z-50">
        <Logo className="h-8" />
        <button 
          type="button"
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center bg-white border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all z-10 font-bold text-xl"
          aria-label="Cancel"
        >
          X
        </button>
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
                  kudi.com/store/
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

            {submitError && (
              <div className="flex items-start gap-3 p-4 border-[4px] border-red-500 bg-red-50 text-red-700 font-bold">
                <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <BrutalButton type="submit" className="w-full mt-4 h-16 text-xl" disabled={isAvailable === false} isLoading={isSubmitting}>
              Create storefront &rarr;
            </BrutalButton>
          </form>
        </div>
      </main>
    </div>
  );
}
