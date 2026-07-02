import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
import { storefrontSchema } from '../../lib/validation/schemas';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

const THEMES = [
  { id: 'classic', name: 'Classic', desc: 'Clean, simple, traditional' },
  { id: 'bold', name: 'Bold', desc: 'Dark background, high contrast' },
  { id: 'minimal', name: 'Minimal', desc: 'Lots of whitespace, elegant' },
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
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-500">Step 2 of 2</div>
        <div className="flex gap-1">
          <div className="w-8 h-2 rounded-full bg-primary" />
          <div className="w-8 h-2 rounded-full bg-primary" />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set up your storefront</h1>
          <p className="text-gray-500">Choose your unique link and design.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <div>
            <Input
              label="Your Store Link"
              prefix="coda.ng/store/"
              {...register('storefrontSlug')}
              error={errors.storefrontSlug?.message || (isAvailable === false ? "This link is already taken" : undefined)}
              className="pl-[115px]" // Make room for prefix
            />
            <div className="mt-2 text-sm">
              {isChecking && <span className="flex items-center text-gray-500"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Checking availability...</span>}
              {!isChecking && isAvailable === true && <span className="flex items-center text-primary"><Check className="w-4 h-4 mr-1"/> Available!</span>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">Select a Theme</label>
            <div className="grid grid-cols-1 gap-3">
              {THEMES.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => setValue('theme', t.id as any)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTheme === t.id ? 'border-primary bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{t.name}</span>
                    {selectedTheme === t.id && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-3 h-3"/></div>}
                  </div>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isAvailable === false} isLoading={isSubmitting}>
            Create My Store
          </Button>
        </form>
      </main>
    </div>
  );
}
