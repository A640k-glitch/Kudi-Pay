import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../../components/Logo';
import { signupSchema } from '../../lib/validation/schemas';
import { authService } from '../../lib/services/authService';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Save password temporarily in sessionStorage for simulation
      sessionStorage.setItem('kudi_temp_password', data.password);
      await authService.sendOTP(data.phone);
      navigate('/verify');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'Account already exists or failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] items-center justify-center p-4 md:p-6 selection:bg-[#E0FF4F] selection:text-slate-900">
      <div className="w-full max-w-[440px] relative">
        <button 
          type="button"
          onClick={() => navigate('/')}
          className="absolute right-0 top-0 w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all z-10 font-bold"
          aria-label="Cancel"
        >
          X
        </button>

        <div className="flex justify-center mb-8 hover:scale-105 transition-transform">
          <Link to="/">
            <Logo className="h-8 text-slate-900" />
          </Link>
        </div>
        
        <div className="bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-[8px_8px_0px_#0f172a] rounded-[24px] relative">
          <div className="mb-6 text-left border-b-2 border-slate-100 pb-5">
            {new URLSearchParams(location.search).get('intent') === 'eligibility' ? (
              <>
                <h1 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Check Eligibility</h1>
                <p className="text-base font-medium text-slate-600">See how much credit you qualify for.</p>
              </>
            ) : new URLSearchParams(location.search).get('intent') === 'open-storefront' ? (
              <>
                <h1 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Open Storefront</h1>
                <p className="text-base font-medium text-slate-600">Start selling directly from WhatsApp.</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Create Store</h1>
                <p className="text-base font-medium text-slate-600">Sell online in 60 seconds.</p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="block font-bold text-slate-900 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="08031234567"
                {...register('phone')}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-medium outline-none transition-colors shadow-sm focus:shadow-[4px_4px_0px_#E0FF4F]"
              />
              {errors.phone?.message && <span className="text-sm font-bold text-red-600 mt-2 block">{errors.phone?.message}</span>}
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-sm mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••"
                {...register('password')}
                className="w-full border-2 border-slate-200 focus:border-slate-900 rounded-[12px] p-3 font-medium outline-none transition-colors shadow-sm focus:shadow-[4px_4px_0px_#E0FF4F]"
              />
              {errors.password?.message && <span className="text-sm font-bold text-red-600 mt-2 block">{errors.password?.message}</span>}
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border-2 border-red-500 rounded-[12px] text-red-600 font-bold text-sm shadow-[2px_2px_0px_#EF4444]">
                <span>{errorMsg}</span>
                {errorMsg.includes('exists') && (
                  <Link to="/login" className="underline ml-2">Log In Here</Link>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#E0FF4F] text-slate-900 px-6 py-3 mt-2 rounded-[12px] font-bold text-base border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'Sending OTP...' : 'Continue'} <ArrowRight weight="bold" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-600">
              Already a merchant?{' '}
              <Link to="/login" className="text-[#4F46E5] underline decoration-2 hover:bg-[#E0FF4F] hover:text-slate-900 transition-colors px-1 py-0.5 rounded">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
