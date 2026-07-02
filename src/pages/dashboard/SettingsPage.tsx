import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ExternalLink } from 'lucide-react';
import { Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/FormInputs';
import { businessSchema, storefrontSchema } from '../../lib/validation/schemas';
import { useToast } from '../../components/Toast';

const combinedSchema = z.object({
  businessName: businessSchema.shape.businessName,
  category: businessSchema.shape.category,
  state: businessSchema.shape.state,
  lga: businessSchema.shape.lga,
  storefrontSlug: storefrontSchema.shape.storefrontSlug,
  theme: storefrontSchema.shape.theme,
});

type SettingsFormValues = z.infer<typeof combinedSchema>;

const NIGERIAN_STATES = [{ label: 'Lagos', value: 'lagos' }, { label: 'Abuja (FCT)', value: 'fct' }];
const LGAS_BY_STATE: Record<string, { label: string, value: string }[]> = {
  lagos: [{ label: 'Ikeja', value: 'ikeja' }, { label: 'Surulere', value: 'surulere' }],
  fct: [{ label: 'AMAC', value: 'amac' }, { label: 'Bwari', value: 'bwari' }],
};
const CATEGORIES = [{ label: 'Fashion & Clothing', value: 'Fashion' }, { label: 'Food & Beverages', value: 'Food & Beverages' }, { label: 'Other', value: 'Other' }];
const THEMES = [
  { id: 'classic', name: 'Classic', desc: 'Clean, simple, traditional' },
  { id: 'bold', name: 'Bold', desc: 'Dark background, high contrast' },
  { id: 'minimal', name: 'Minimal', desc: 'Lots of whitespace, elegant' },
];

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(combinedSchema),
  });

  const selectedState = watch('state');
  const slug = watch('storefrontSlug');
  const selectedTheme = watch('theme');

  useEffect(() => {
    async function load() {
      const phone = authService.getCurrentPhone();
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        reset({
          businessName: b.businessName,
          category: b.category,
          state: b.state,
          lga: b.lga,
          storefrontSlug: b.storefrontSlug,
          theme: b.theme,
        });
      }
    }
    load();
  }, [reset]);

  useEffect(() => {
    if (!business || slug === business.storefrontSlug) {
      setIsAvailable(null);
      return;
    }
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
  }, [slug, business, errors.storefrontSlug]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (isAvailable === false || !business) return;
    
    setIsSubmitting(true);
    try {
      await businessService.updateBusiness(business.id, data);
      addToast('Settings updated successfully', 'success');
      reset(data); // Reset isDirty state
    } catch (err) {
      addToast('Failed to update settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) return null;

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto pb-24 md:pb-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-500">Manage your business profile and storefront design.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
          <Button variant="secondary" size="small">
            Preview Store <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Business Profile */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Business Profile</h2>
          <div className="space-y-4">
            <Input label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
            <Select label="Category" options={CATEGORIES} {...register('category')} error={errors.category?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="State" options={NIGERIAN_STATES} {...register('state')} error={errors.state?.message} />
              <Select label="LGA" options={selectedState ? LGAS_BY_STATE[selectedState] || [] : []} {...register('lga')} error={errors.lga?.message} />
            </div>
          </div>
        </section>

        {/* Storefront */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Storefront Details</h2>
          <div className="space-y-6">
            <div>
              <Input
                label="Store Link"
                prefix="coda.ng/store/"
                {...register('storefrontSlug')}
                error={errors.storefrontSlug?.message || (isAvailable === false ? "This link is already taken" : undefined)}
                className="pl-[115px]"
              />
              {isChecking && <span className="text-sm text-gray-500 mt-1 block">Checking availability...</span>}
              {!isChecking && isAvailable === true && <span className="text-sm text-primary mt-1 block">Available!</span>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">Theme</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {THEMES.map((t) => {
                  const isLocked = business.kycTier < 2 && t.id !== 'classic';
                  return (
                    <div 
                      key={t.id}
                      onClick={() => !isLocked && setValue('theme', t.id as any, { shouldDirty: true })}
                      className={`relative p-4 rounded-xl border-2 transition-all ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : 'cursor-pointer'} ${selectedTheme === t.id && !isLocked ? 'border-primary bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">{t.name}</span>
                        {selectedTheme === t.id && !isLocked && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white"><Check className="w-3 h-3"/></div>}
                      </div>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                      {isLocked && <div className="mt-2 text-xs font-medium text-orange-600">Requires Tier 2</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {isDirty && (
          <div className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 flex items-center gap-4 z-40 w-[90%] max-w-md">
            <span className="font-medium text-sm text-gray-700 flex-1">You have unsaved changes</span>
            <Button type="button" variant="ghost" onClick={() => reset()} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isAvailable === false}>Save</Button>
          </div>
        )}
      </form>
    </div>
  );
}
