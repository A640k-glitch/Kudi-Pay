import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
import { Logo } from '../../components/Logo';
import { loginSchema } from '../../lib/validation/schemas';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const business = await businessService.getBusinessByPhone(data.phone);
      if (!business) {
        setErrorMsg("We don't recognize this number.");
        setIsLoading(false);
        return;
      }
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
            <h1 className="text-xl md:text-2xl font-bold text-[#1E1B4B] mb-1.5">Welcome back</h1>
            <p className="text-xs md:text-sm text-gray-500">Enter your credentials to manage your store</p>
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
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
            />
            
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-100 flex items-start gap-2">
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-sm font-semibold rounded-xl bg-[#1E1B4B] text-white hover:bg-[#111827] transition-colors mt-2 shadow-sm" isLoading={isLoading}>
              Log in securely
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 md:pt-6 border-t border-gray-100">
            <p className="text-xs md:text-sm text-gray-500">
              Don't have a store yet?{' '}
              <Link to="/signup" className="font-semibold text-[#1E1B4B] hover:text-[#312E81] transition-colors">
                Create one for free
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-6 md:mt-8 text-center">
          <p className="text-[10px] md:text-xs text-gray-400">Secure access provided by Kudi Infrastructure</p>
        </div>
      </div>
    </div>
  );
}
