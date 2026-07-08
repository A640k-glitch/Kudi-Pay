import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BrutalButton from '../../components/ui/BrutalButton';
import { Logo } from '../../components/Logo';
import { useToast } from '../../components/Toast';
import { productSchema } from '../../lib/validation/schemas';
import { productService } from '../../lib/services/productService';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';
import { Check } from 'lucide-react';

type ProductFormValues = z.infer<typeof productSchema>;

export default function FirstProductPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { isAvailable: true, trackStock: false }
  });

  const trackStock = watch('trackStock');

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
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
          setImagePreview(base64String);
          setValue('imageUrl', base64String);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const finishOnboarding = () => {
    navigate('/dashboard?celebrate=true');
    addToast("Your store is live!", 'success');
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const phone = authService.getCurrentPhone();
      if (!phone) throw new Error("No session");
      const business = await businessService.getBusinessByPhone(phone);
      if (!business) throw new Error("Business not found");

      await productService.createProduct({
        ...data,
        businessId: business.id,
      });
      
      finishOnboarding();
    } catch (err) {
      console.error(err);
      addToast("Failed to save product", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-black font-sans selection:bg-[#E0FF4F] selection:text-black">
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 select-none border-b-[4px] border-black bg-white shadow-[0px_4px_0px_rgba(0,0,0,1)] z-10">
        <Logo className="h-8" />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 max-w-lg mx-auto w-full py-8 md:py-12 animate-fade-in">
        <div className="bg-white p-6 md:p-10 border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -right-4 w-10 h-10 bg-[#06D6A0] border-[3px] border-black rotate-12 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
             <Check className="w-6 h-6" strokeWidth={3} />
          </div>

          <div className="mb-8 border-b-[4px] border-black pb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">First Product</h1>
            <p className="font-bold text-gray-600 uppercase text-sm">You can always edit this or add more later.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="relative w-full aspect-square max-h-48 bg-[#FFD166] border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                {imagePreview ? (
                  <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-black font-black uppercase text-sm text-center px-4">Tap to add photo</span>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Product Name</label>
              <input
                type="text"
                placeholder="e.g. Vintage Denim Jacket"
                {...register('name')}
                className="w-full border-[4px] border-black p-4 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
              />
              {errors.name && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Price (₦)</label>
              <input
                type="text"
                placeholder="0"
                value={watch('price') !== undefined && !isNaN(watch('price')) ? Number(watch('price')).toLocaleString() : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setValue('price', val ? parseInt(val, 10) : undefined as any, { shouldValidate: true, shouldDirty: true });
                }}
                className="w-full border-[4px] border-black p-4 font-black text-xl outline-none focus:bg-[#E0FF4F] transition-colors"
              />
              {errors.price && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2">Description (Optional)</label>
              <textarea
                placeholder="Tell customers about this product..."
                {...register('description')}
                className="w-full border-[4px] border-black p-4 font-bold outline-none focus:bg-[#E0FF4F] transition-colors resize-none h-24"
              />
              {errors.description && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="border-t-[4px] border-black pt-4">
              <label className="flex items-center gap-4 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={trackStock}
                  onChange={(e) => setValue('trackStock', e.target.checked)}
                  className="w-6 h-6 border-[3px] border-black accent-black"
                />
                <span className="font-black uppercase">Track Stock?</span>
              </label>

              {trackStock && (
                <div>
                  <label className="block font-black uppercase text-sm mb-2">Stock Count</label>
                  <input
                    type="number"
                    placeholder="How many do you have?"
                    {...register('stockCount', { valueAsNumber: true })}
                    className="w-full border-[4px] border-black p-4 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
                  />
                  {errors.stockCount && <p className="text-[#FF6666] font-black uppercase text-xs mt-1">{errors.stockCount.message}</p>}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <BrutalButton type="submit" className="w-full h-16 text-xl" isLoading={isSubmitting}>
                Add Product & Finish
              </BrutalButton>
              <button 
                type="button" 
                onClick={finishOnboarding}
                className="text-sm font-black uppercase py-4 border-[3px] border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
