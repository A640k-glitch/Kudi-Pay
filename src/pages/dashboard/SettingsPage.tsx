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
      
      const channel = new BroadcastChannel('theme_updates');
      channel.postMessage({ type: 'theme_changed', slug: data.storefrontSlug || business.storefrontSlug });
      channel.close();
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Settings</h1>
          <p className="text-xs md:text-sm text-gray-500">Manage your business profile and storefront design.</p>
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
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#1E1B4B]">Business Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Input label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
              <p className="text-xs text-amber-600 mt-1.5 font-medium">
                Note: You can only change your business name once every 30 days.
              </p>
            </div>
            <Select label="Category" options={CATEGORIES} {...register('category')} error={errors.category?.message} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="State" options={NIGERIAN_STATES} {...register('state')} error={errors.state?.message} />
              <Select label="LGA" options={selectedState ? LGAS_BY_STATE[selectedState] || [] : []} {...register('lga')} error={errors.lga?.message} />
            </div>
          </div>
        </section>

        {/* Storefront */}
        <section>
          <h2 className="text-lg font-semibold text-[#1E1B4B] mb-4 pb-2 border-b border-gray-100">Storefront Details</h2>
          <div className="space-y-6">
            <div>
              <Input
                label="Store Link"
                prefix="kudi.ng/store/"
                {...register('storefrontSlug')}
                error={errors.storefrontSlug?.message || (isAvailable === false ? "This link is already taken" : undefined)}
                className="pl-[115px]"
              />
              {isChecking && <span className="text-sm text-gray-500 mt-1 block">Checking availability...</span>}
              {!isChecking && isAvailable === true && <span className="text-sm text-emerald-600 mt-1 block">Available!</span>}
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
