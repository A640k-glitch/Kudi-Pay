import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/FormInputs';
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
    // Save partial data to sessionStorage to carry to next step
    sessionStorage.setItem('coda_onboarding_business', JSON.stringify(data));
    navigate('/onboarding/storefront');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-500">Step 1 of 2</div>
        <div className="flex gap-1">
          <div className="w-8 h-2 rounded-full bg-primary" />
          <div className="w-8 h-2 rounded-full bg-gray-200" />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your business</h1>
          <p className="text-gray-500">This info helps customers trust you.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm font-medium text-center px-2">Add Logo</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={onLogoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-sm text-gray-500">Optional</p>
          </div>

          <Input
            label="Business Name"
            placeholder="e.g. Ade's Kitchen"
            {...register('businessName')}
            error={errors.businessName?.message}
          />

          <Select
            label="What do you sell?"
            options={CATEGORIES}
            {...register('category')}
            error={errors.category?.message}
          />

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

          <Button type="submit" className="w-full mt-4">
            Continue
          </Button>
        </form>
      </main>
    </div>
  );
}
