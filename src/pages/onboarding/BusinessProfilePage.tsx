import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BrutalButton from '../../components/ui/BrutalButton';
import { Logo } from '../../components/Logo';
import { businessSchema } from '../../lib/validation/schemas';

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

type BusinessFormValues = z.infer<typeof businessSchema>;

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
  });

  const selectedState = watch('state');
  const businessName = watch('businessName');

  // Compute live slug preview
  const liveSlug = businessName
    ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : 'brand-name';

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          setLogoPreview(base64String);
          setValue('logoUrl', base64String);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: BusinessFormValues) => {
    sessionStorage.setItem('coda_onboarding_business', JSON.stringify(data));
    navigate('/onboarding/storefront');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-black font-sans selection:bg-[#E0FF4F] selection:text-black">
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none border-b-[4px] border-black bg-white shadow-[0px_4px_0px_rgba(0,0,0,1)] z-10">
        <Logo className="h-8" />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 max-w-lg mx-auto w-full py-8 md:py-12 animate-fade-in">
        <div className="bg-white p-6 md:p-10 border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#FF6666] border-[3px] border-black rounded-full" />
          <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-[#4D9DE0] border-[3px] border-black" />

          <div className="mb-8 border-b-[4px] border-black pb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Business Identity</h1>
            <p className="font-bold text-gray-600 uppercase text-sm">Provide details to generate your storefront.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="relative w-32 h-32 bg-[#E0FF4F] border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-black font-black uppercase text-sm text-center px-4">Upload Logo</span>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Store Logo (Optional)</p>
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Adeeze Fashion House"
                {...register('businessName')}
                className="w-full border-[4px] border-black p-4 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
              />
              {errors.businessName && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.businessName.message}</p>}
              <p className="text-sm font-bold mt-2 bg-gray-100 border-[3px] border-black p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                Your link: <span className="font-black text-[#4D9DE0]">kudi.ng/store/{liveSlug}</span>
              </p>
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Category</label>
              <select
                {...register('category')}
                className="w-full border-[4px] border-black p-4 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none bg-white cursor-pointer"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-black uppercase text-sm mb-2">State</label>
                <select
                  {...register('state')}
                  className="w-full border-[4px] border-black p-4 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none bg-white cursor-pointer"
                >
                  <option value="">State</option>
                  {NIGERIAN_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.state && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.state.message}</p>}
              </div>

              <div>
                <label className="block font-black uppercase text-sm mb-2">LGA</label>
                <select
                  {...register('lga')}
                  disabled={!selectedState}
                  className="w-full border-[4px] border-black p-4 font-bold uppercase outline-none focus:bg-[#E0FF4F] transition-colors appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">LGA</option>
                  {selectedState && LGAS_BY_STATE[selectedState]?.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                {errors.lga && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.lga.message}</p>}
              </div>
            </div>

            <BrutalButton type="submit" className="w-full mt-4 h-16 text-xl">
              Create storefront &rarr;
            </BrutalButton>
          </form>
        </div>
      </main>
    </div>
  );
}
