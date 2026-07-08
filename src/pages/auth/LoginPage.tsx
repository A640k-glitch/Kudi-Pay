import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../../components/Logo';
import { loginSchema } from '../../lib/validation/schemas';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';

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
    <div className="min-h-screen flex flex-col bg-slate-50 items-center justify-center p-4 md:p-6 selection:bg-[#E0FF4F] selection:text-slate-900">
      <div className="w-full max-w-[440px] relative">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all z-10"
          aria-label="Go back"
        >
          <ArrowLeft weight="bold" className="w-5 h-5 text-slate-900" />
        </button>
        <div className="flex justify-center mb-8 hover:scale-105 transition-transform">
          <Link to="/">
            <Logo className="h-8 text-slate-900" />
          </Link>
        </div>
        
        <div className="bg-white border-2 border-slate-900 p-8 sm:p-10 shadow-[8px_8px_0px_#0f172a] rounded-[24px] relative">
          <div className="mb-8 text-left border-b-2 border-slate-100 pb-6">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-base font-medium text-slate-600">Access your store and ledger securely.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div>
              <label className="block font-bold text-slate-900 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="08031234567"
                {...register('phone')}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3.5 font-medium outline-none transition-colors shadow-sm focus:shadow-[4px_4px_0px_#E0FF4F]"
              />
              {errors.phone?.message && <span className="text-sm font-bold text-red-600 mt-2 block">{errors.phone?.message}</span>}
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••"
                {...register('password')}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3.5 font-medium outline-none transition-colors shadow-sm focus:shadow-[4px_4px_0px_#E0FF4F]"
              />
              {errors.password?.message && <span className="text-sm font-bold text-red-600 mt-2 block">{errors.password?.message}</span>}
            </div>
            
            {errorMsg && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-[12px] text-red-600 font-bold text-sm shadow-[2px_2px_0px_#EF4444]">
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 mt-2 rounded-[12px] font-bold text-lg shadow-[4px_4px_0px_#E0FF4F] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'Entering Vault...' : 'Enter Vault'} <ArrowRight weight="bold" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-600">
              No store yet?{' '}
              <Link to="/signup" className="text-[#4F46E5] underline decoration-2 hover:bg-[#E0FF4F] hover:text-slate-900 transition-colors px-1 py-0.5 rounded">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
