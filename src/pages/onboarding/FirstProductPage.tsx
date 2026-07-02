import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input, Textarea, Toggle } from '../../components/FormInputs';
import { useToast } from '../../components/Toast';
import { productSchema } from '../../lib/validation/schemas';
import { productService } from '../../lib/services/productService';
import { businessService } from '../../lib/services/businessService';
import { authService } from '../../lib/services/authService';

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
    // We navigate to dashboard and trigger celebration modal via query param or state
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
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col px-6 pt-12 max-w-md mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add your first product</h1>
          <p className="text-gray-500">You can always edit this or add more later.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative w-full aspect-square max-h-48 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm font-medium text-center">Tap to add photo</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={onImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <Input
            label="Product Name"
            placeholder="e.g. Vintage Denim Jacket"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Price (₦)"
            type="number"
            placeholder="0"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Tell customers about this product..."
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="border-t border-gray-100 pt-4 mt-2">
            <Toggle
              label="Track stock?"
              checked={trackStock}
              onChange={(c) => setValue('trackStock', c)}
            />
            {trackStock && (
              <div className="mt-3">
                <Input
                  type="number"
                  placeholder="How many do you have?"
                  {...register('stockCount', { valueAsNumber: true })}
                  error={errors.stockCount?.message}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Add Product & Finish
            </Button>
            <button 
              type="button" 
              onClick={finishOnboarding}
              className="text-gray-500 font-medium py-3 hover:text-gray-900 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
