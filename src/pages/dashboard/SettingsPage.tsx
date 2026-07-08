import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink } from 'lucide-react';
import { Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import BrutalButton from '../../components/ui/BrutalButton';
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

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const { register, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(combinedSchema),
  });

  const selectedState = watch('state');
  const slug = watch('storefrontSlug');

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
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32 selection:bg-[#E0FF4F] selection:text-black">
      <header className="mb-8 flex items-end justify-between border-b-[4px] border-black pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase mb-1">Settings</h1>
          <p className="text-sm md:text-base font-bold text-gray-700 uppercase">Manage your profile & link.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
          <BrutalButton>
            PREVIEW <ExternalLink className="w-4 h-4 ml-2 inline" />
          </BrutalButton>
        </a>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Profile */}
        <section className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase mb-6 border-b-[3px] border-black pb-2 text-black">Profile</h2>
          <div className="space-y-6">
            <div>
              <label className="block font-black uppercase text-xs mb-2">Business Name</label>
              <input type="text" {...register('businessName')} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors" />
              {errors.businessName?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.businessName?.message}</span>}
              <p className="text-xs font-black uppercase text-gray-500 mt-2">
                Note: You can only change your name once every 30 days.
              </p>
            </div>
            
            <div>
              <label className="block font-black uppercase text-xs mb-2">Category</label>
              <select {...register('category')} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none cursor-pointer">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.category?.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-black uppercase text-xs mb-2">State</label>
                <select {...register('state')} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none cursor-pointer">
                  {NIGERIAN_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.state?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.state?.message}</span>}
              </div>
              <div>
                <label className="block font-black uppercase text-xs mb-2">LGA</label>
                <select {...register('lga')} className="w-full border-[3px] border-black p-3 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none cursor-pointer">
                  {selectedState ? LGAS_BY_STATE[selectedState]?.map(l => <option key={l.value} value={l.value}>{l.label}</option>) : <option value="">SELECT</option>}
                </select>
                {errors.lga?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.lga?.message}</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Storefront */}
        <section className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase mb-6 border-b-[3px] border-black pb-2 text-black">Storefront Link</h2>
          <div>
            <label className="block font-black uppercase text-xs mb-2">Store Link</label>
            <div className="flex">
              <span className="bg-[#E0FF4F] border-[3px] border-r-0 border-black p-3 font-black uppercase">kudi.ng/store/</span>
              <input type="text" {...register('storefrontSlug')} className="flex-1 border-[3px] border-black p-3 font-bold lowercase outline-none focus:bg-[#E0FF4F] transition-colors" />
            </div>
            {errors.storefrontSlug?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.storefrontSlug?.message}</span>}
            {isAvailable === false && !errors.storefrontSlug && <span className="text-xs font-bold text-[#FF6666] mt-1 block uppercase">This link is taken</span>}
            {isChecking && <span className="text-xs font-bold text-gray-500 mt-1 block uppercase">Checking...</span>}
            {!isChecking && isAvailable === true && <span className="text-xs font-bold text-[#4D9DE0] mt-1 block uppercase">Available!</span>}
          </div>
        </section>

        {isDirty && (
          <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-black border-[4px] border-black shadow-[8px_8px_0px_rgba(224,255,79,1)] p-4 flex flex-col md:flex-row items-center gap-4 z-40 w-[90%] max-w-md">
            <span className="font-black uppercase text-sm text-[#E0FF4F] flex-1 text-center md:text-left">Unsaved changes!</span>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="button" onClick={() => reset()} disabled={isSubmitting} className="flex-1 font-black uppercase text-sm border-[3px] border-black bg-white text-black py-2 px-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all">
                CANCEL
              </button>
              <BrutalButton type="submit" isLoading={isSubmitting} disabled={isAvailable === false} className="flex-1">
                SAVE
              </BrutalButton>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
