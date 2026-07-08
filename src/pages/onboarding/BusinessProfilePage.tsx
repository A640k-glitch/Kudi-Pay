import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/FormInputs';
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
    <div className="min-h-screen flex flex-col bg-gray-50 text-[#1E1B4B]">
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none">
        <Logo className="h-7 md:h-8" />
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Step 1 of 2</span>
          <div className="flex gap-1">
            <div className="w-5 h-1.5 rounded-sm bg-[#1E1B4B]" />
            <div className="w-5 h-1.5 rounded-sm bg-gray-200" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 max-w-md mx-auto w-full py-4 md:py-12">
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-[#1E1B4B] mb-1.5">Business Identity</h1>
            <p className="text-xs md:text-sm text-gray-500">Provide details to generate your storefront.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="relative w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs font-medium text-center px-2">Upload Logo</span>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">Store Logo (Optional)</p>
            </div>

            <div>
              <Input
                label="Business Name"
                placeholder="e.g. Adeeze Fashion House"
                {...register('businessName')}
                error={errors.businessName?.message}
              />
              <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                Your link: <span className="text-[#1E1B4B] font-bold">kudi.ng/store/{liveSlug}</span>
              </p>
            </div>

            <Select
              label="Category"
              options={CATEGORIES}
              {...register('category')}
              error={errors.category?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="State"
                options={NIGERIAN_STATES}
                {...register('state')}
                error={errors.state?.message}
              />

              <Select
                label="LGA"
                options={selectedState ? LGAS_BY_STATE[selectedState] || [] : []}
                {...register('lga')}
                disabled={!selectedState}
                error={errors.lga?.message}
              />
            </div>

            <Button type="submit" className="w-full mt-4 h-12 text-sm font-semibold rounded-xl bg-[#1E1B4B] text-white hover:bg-[#111827] transition-colors shadow-sm">
              Create storefront &rarr;
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
