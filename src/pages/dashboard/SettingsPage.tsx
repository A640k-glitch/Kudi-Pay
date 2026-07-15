import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Business } from '../../lib/types';
import { authService } from '../../lib/services/authService';
import { businessService, getDefaultHeroImageUrl, getDefaultThemeConfig } from '../../lib/services/businessService';
import { businessSchema, storefrontSchema } from '../../lib/validation/schemas';
import { useToast } from '../../components/Toast';

const combinedSchema = z.object({
  businessName: businessSchema.shape.businessName,
  category: businessSchema.shape.category,
  state: businessSchema.shape.state,
  lga: businessSchema.shape.lga,
  storefrontSlug: storefrontSchema.shape.storefrontSlug,
  theme: storefrontSchema.shape.theme.optional(),
  logoUrl: z.string().nullable().optional(),
});

type SettingsFormValues = z.infer<typeof combinedSchema>;

const NIGERIAN_STATES = [
  { label: 'Lagos', value: 'lagos' },
  { label: 'Abuja (FCT)', value: 'fct' },
  { label: 'Rivers', value: 'rivers' },
  { label: 'Oyo', value: 'oyo' },
  { label: 'Kano', value: 'kano' },
];

const LGAS_BY_STATE: Record<string, { label: string, value: string }[]> = {
  lagos: [{ label: 'Ikeja', value: 'ikeja' }, { label: 'Surulere', value: 'surulere' }, { label: 'Eti-Osa', value: 'eti-osa' }],
  fct: [{ label: 'AMAC', value: 'amac' }, { label: 'Bwari', value: 'bwari' }],
  rivers: [{ label: 'Port Harcourt', value: 'port-harcourt' }, { label: 'Obio/Akpor', value: 'obio-akpor' }],
  oyo: [{ label: 'Ibadan North', value: 'ibadan-north' }, { label: 'Ibadan South West', value: 'ibadan-south-west' }],
  kano: [{ label: 'Kano Municipal', value: 'kano-municipal' }, { label: 'Tarauni', value: 'tarauni' }],
};

const CATEGORIES = [
  { label: 'Fashion & Clothing', value: 'Fashion' },
  { label: 'Food & Beverages', value: 'Food & Beverages' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Services', value: 'Services' },
  { label: 'Health & Beauty', value: 'Beauty' },
  { label: 'Other', value: 'Other' },
];

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
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
          logoUrl: b.logoUrl,
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
      const updates: Partial<Business> = { ...data };

      if (business.category !== data.category && business.themeConfig) {
        const prevDefaults = getDefaultThemeConfig(business.category);
        const newDefaults = getDefaultThemeConfig(data.category);
        const prevHeroImage = getDefaultHeroImageUrl(business.category);
        const newHeroImage = getDefaultHeroImageUrl(data.category);

        const tc = { ...business.themeConfig };

        const allImages = [
          '/images/heroes/hero_fashion.png',
          '/images/heroes/hero_food.png',
          '/images/heroes/hero_electronics.png',
          '/images/heroes/hero_services.png',
          '/images/heroes/hero_beauty.png',
          '/images/heroes/hero_other.png',
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAei2SCO828A82z9Nk8QNfFG7OaW_4XjTjOH-FkL-c719S45Y3t7z0pk4ORAE3EHBU2kGj_RqeUA8JZ7wu8A1PhozLhrANtFNBm82qZu82WAGc3yUrfAGE6SFAYFEfkuJI4QPh8tAKzitoqE866ICR3Rlih1IBwvJl5wMIBuVzuN_FML0QGmA5dTMI5scAxa_dhmnSLesA7M7RmcF2HsOsV5ZVPBgDEBVw3IEn83Kd4rDOjANhyi3hKZawQZ94mQRz65W7WwEUnob4'
        ];

        if (allImages.includes(tc.heroImageUrl) || tc.heroImageUrl === prevHeroImage) {
          tc.heroImageUrl = newHeroImage;
        }

        const allConfigs = [
          getDefaultThemeConfig('Fashion'),
          getDefaultThemeConfig('Food & Beverages'),
          getDefaultThemeConfig('Electronics'),
          getDefaultThemeConfig('Services'),
          getDefaultThemeConfig('Beauty'),
          getDefaultThemeConfig('Other')
        ];

        if (allConfigs.some(c => c.heroHeading === tc.heroHeading) || tc.heroHeading === prevDefaults.heroHeading) {
          tc.heroHeading = newDefaults.heroHeading;
        }
        if (allConfigs.some(c => c.heroSubheading === tc.heroSubheading) || tc.heroSubheading === prevDefaults.heroSubheading) {
          tc.heroSubheading = newDefaults.heroSubheading;
        }
        if (allConfigs.some(c => c.heroLabel === tc.heroLabel) || tc.heroLabel === prevDefaults.heroLabel) {
          tc.heroLabel = newDefaults.heroLabel;
        }
        if (allConfigs.some(c => c.ctaText === tc.ctaText) || tc.ctaText === prevDefaults.ctaText || tc.ctaText === 'Add to Bag' || tc.ctaText === 'Book Now') {
          tc.ctaText = newDefaults.ctaText;
        }

        updates.themeConfig = tc;
      }

      const updated = await businessService.updateBusiness(business.id, updates);
      if (updated) {
        setBusiness(updated);
        reset({
          businessName: updated.businessName,
          category: updated.category,
          state: updated.state,
          lga: updated.lga,
          storefrontSlug: updated.storefrontSlug,
          theme: updated.theme,
          logoUrl: updated.logoUrl,
        });
      }
      addToast('Settings updated successfully', 'success');
      
      const channel = new BroadcastChannel('business_updates');
      channel.postMessage({ 
        type: 'business_updated', 
        slug: updated?.storefrontSlug || data.storefrontSlug || business.storefrontSlug,
        business: updated 
      });
      channel.close();
    } catch (err) {
      addToast('Failed to update settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!business) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-8 flex items-end justify-between border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-1">Settings</h1>
          <p className="text-sm md:text-base font-bold text-slate-500">Manage your profile & link.</p>
        </div>
        <a href={`/store/${business.storefrontSlug}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
          <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-[12px] shadow-[4px_4px_0px_#0f172a] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center">
            Preview <ArrowSquareOut className="w-4 h-4 ml-2" weight="bold" />
          </button>
        </a>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Profile */}
        <section className="glass-panel p-6 md:p-8">
          <h2 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-2">
            Profile
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block font-bold text-slate-700 text-sm mb-3">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-900 overflow-hidden flex items-center justify-center relative shadow-[2px_2px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#0f172a] transition-all group">
                  {watch('logoUrl') ? (
                    <img src={watch('logoUrl')} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-slate-400 text-xl">{watch('businessName')?.[0]?.toUpperCase() || '?'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Edit</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setValue('logoUrl', reader.result as string, { shouldDirty: true });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Upload a logo</p>
                  <p className="font-bold text-slate-500 text-xs mt-1">Recommended size: 256x256px.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-sm mb-2">Business Name</label>
              <input type="text" {...register('businessName')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F]" placeholder="Your Business Name" />
              {errors.businessName?.message && <span className="text-xs font-bold text-[#FF6666] mt-2 block">{errors.businessName?.message}</span>}
              <p className="text-xs font-bold text-slate-500 mt-2">
                Note: You can only change your name once every 30 days.
              </p>
            </div>
            
            <div>
              <label className="block font-bold text-slate-700 text-sm mb-2">Category</label>
              <select {...register('category')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F] bg-white appearance-none cursor-pointer">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category?.message && <span className="text-xs font-bold text-[#FF6666] mt-2 block">{errors.category?.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 text-sm mb-2">State</label>
                <select {...register('state')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F] bg-white appearance-none cursor-pointer">
                  {NIGERIAN_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.state?.message && <span className="text-xs font-bold text-[#FF6666] mt-2 block">{errors.state?.message}</span>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-sm mb-2">LGA</label>
                <select {...register('lga')} className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-bold text-slate-900 outline-none transition-all focus:shadow-[4px_4px_0px_#E0FF4F] bg-white appearance-none cursor-pointer">
                  {selectedState ? LGAS_BY_STATE[selectedState]?.map(l => <option key={l.value} value={l.value}>{l.label}</option>) : <option value="">Select LGA</option>}
                </select>
                {errors.lga?.message && <span className="text-xs font-bold text-[#FF6666] mt-2 block">{errors.lga?.message}</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Storefront */}
        <section className="glass-panel p-6 md:p-8">
          <h2 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-2">
            Storefront Link
          </h2>
          <div>
            <label className="block font-bold text-slate-700 text-sm mb-2">Store Link</label>
            <div className="flex rounded-[12px] overflow-hidden border-2 border-slate-200 focus-within:border-slate-900 focus-within:shadow-[4px_4px_0px_#E0FF4F] transition-all">
              <span className="bg-slate-50 text-slate-500 px-4 py-3 font-bold border-r-2 border-slate-200 flex items-center">kudi.com/store/</span>
              <input type="text" {...register('storefrontSlug')} className="flex-1 px-4 py-3 bg-white font-bold text-slate-900 lowercase outline-none w-full min-w-0" />
            </div>
            {errors.storefrontSlug?.message && <span className="text-xs font-bold text-[#FF6666] mt-2 block">{errors.storefrontSlug?.message}</span>}
            {isAvailable === false && !errors.storefrontSlug && <span className="text-xs font-bold text-[#FF6666] mt-2 block">This link is taken</span>}
            {isChecking && <span className="text-xs font-bold text-slate-500 mt-2 block">Checking...</span>}
            {!isChecking && isAvailable === true && <span className="text-xs font-bold text-[#10B981] mt-2 block">Available!</span>}
          </div>
        </section>

        {isDirty && (
          <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 glass-panel p-4 flex flex-col md:flex-row items-center gap-4 z-40 w-[90%] max-w-md">
            <span className="font-bold text-sm text-slate-700 flex-1 text-center md:text-left">You have unsaved changes</span>
            <div className="flex gap-2 w-full md:w-auto">
              <button type="button" onClick={() => reset()} disabled={isSubmitting} className="flex-1 py-3 px-6 bg-white text-slate-900 font-bold rounded-[12px] border-2 border-slate-200 hover:border-slate-900 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isAvailable === false || isSubmitting} className="flex-1 py-3 px-6 bg-slate-900 text-white font-bold rounded-[12px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
        
        {Object.keys(errors).length > 0 && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-4 rounded z-50 shadow-lg">
            <p className="font-bold">Validation Errors:</p>
            <pre className="text-xs">{JSON.stringify(errors, null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
}
