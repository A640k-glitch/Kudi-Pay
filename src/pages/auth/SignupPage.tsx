import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
import { Logo } from '../../components/Logo';
import { signupSchema } from '../../lib/validation/schemas';
import { authService } from '../../lib/services/authService';

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Save password temporarily in sessionStorage for simulation
      sessionStorage.setItem('aza_temp_password', data.password);
      await authService.sendOTP(data.phone);
      navigate('/verify');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6 md:mb-8">
          <Link to="/">
            <Logo className="h-7 md:h-8" />
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-5 md:p-8 border border-gray-200 shadow-sm">
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-[#1E1B4B] mb-1.5">Create your store</h1>
            <p className="text-xs md:text-sm text-gray-500">Start selling in under a minute</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              type="tel"
              label="Phone Number"
              placeholder="e.g. 08031234567"
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Input
              type="password"
              label="Password"
              placeholder="Create a password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" className="w-full h-12 text-sm font-semibold rounded-xl bg-[#1E1B4B] text-white hover:bg-[#111827] transition-colors mt-2 shadow-sm" isLoading={isLoading}>
              Send OTP
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 md:pt-6 border-t border-gray-100">
            <p className="text-xs md:text-sm text-gray-500">
              Already have a store?{' '}
              <Link to="/login" className="font-semibold text-[#1E1B4B] hover:text-[#312E81] transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-6 md:mt-8 text-center">
          <p className="text-[10px] md:text-xs text-gray-400">Secure infrastructure provided by Kudi</p>
        </div>
      </div>
    </div>
  );
}
