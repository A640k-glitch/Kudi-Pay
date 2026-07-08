import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
import { Logo } from '../../components/Logo';
import { storefrontSchema } from '../../lib/validation/schemas';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

const THEMES = [
  { id: 'classic', name: 'Classic', desc: 'Clean, simple, traditional e-commerce' },
  { id: 'bold', name: 'Editorial', desc: 'Dark background, high contrast, premium streetwear' },
];

export default function StorefrontSetupPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: { theme: 'classic' }
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
    <div className="min-h-screen flex flex-col bg-gray-50 text-[#1E1B4B]">
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none">
        <Logo className="h-7 md:h-8" />
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Step 2 of 2</span>
          <div className="flex gap-1">
            <div className="w-5 h-1.5 rounded-sm bg-[#1E1B4B]" />
            <div className="w-5 h-1.5 rounded-sm bg-[#1E1B4B]" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 max-w-md mx-auto w-full py-4 md:py-12">
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-[#1E1B4B] mb-1.5">Set up storefront</h1>
            <p className="text-xs md:text-sm text-gray-500">Choose your unique link and design theme.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div>
              <Input
                label="Store Link"
                prefix="kudi.ng/store/"
                {...register('storefrontSlug')}
                error={errors.storefrontSlug?.message || (isAvailable === false ? "This link is already taken" : undefined)}
                className="pl-[115px] text-[15px]"
              />
              <div className="mt-3 text-sm">
                {isChecking && <span className="flex items-center text-gray-500"><Loader2 className="w-4 h-4 mr-1.5 animate-spin"/> Checking availability...</span>}
                {!isChecking && isAvailable === true && <span className="flex items-center text-[#059669] font-bold"><Check className="w-4 h-4 mr-1.5"/> Available!</span>}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-bold text-[#1E1B4B] block mb-3 uppercase tracking-widest">Select Theme</label>
              <div className="grid grid-cols-1 gap-3">
                {THEMES.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => setValue('theme', t.id as any)}
                    className={`relative p-5 rounded-xl border cursor-pointer transition-all ${selectedTheme === t.id ? 'border-[#1E1B4B] bg-indigo-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#1E1B4B] text-[15px]">{t.name}</span>
                      {selectedTheme === t.id && <div className="w-5 h-5 rounded-full bg-[#1E1B4B] flex items-center justify-center text-white"><Check className="w-3 h-3"/></div>}
                    </div>
                    <p className="text-sm text-gray-500">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 h-12 text-sm font-semibold rounded-xl bg-[#1E1B4B] text-white hover:bg-[#111827] transition-colors shadow-sm" disabled={isAvailable === false} isLoading={isSubmitting}>
              Create storefront &rarr;
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
