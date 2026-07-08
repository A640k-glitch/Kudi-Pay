import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BrutalButton from '../../components/ui/BrutalButton';
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
    <div className="min-h-screen flex flex-col bg-[#FF6666] items-center justify-center p-4 md:p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6 md:mb-8 hover:scale-105 transition-transform">
          <Link to="/">
            <Logo className="h-10" />
          </Link>
        </div>
        
        <div className="bg-white border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -right-4 bg-[#E0FF4F] border-[3px] border-black font-black uppercase px-3 py-1 text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-6">
            LOGIN
          </div>

          <div className="mb-6 md:mb-8 text-left border-b-[4px] border-black pb-4">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-1.5 leading-none">Welcome<br/>Back.</h1>
            <p className="text-sm font-bold text-gray-700 uppercase">Manage your store & ledger</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="block font-black uppercase text-xs mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="08031234567"
                {...register('phone')}
                className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
              />
              {errors.phone?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.phone?.message}</span>}
            </div>

            <div>
              <label className="block font-black uppercase text-xs mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••"
                {...register('password')}
                className="w-full border-[3px] border-black p-3 font-bold outline-none focus:bg-[#E0FF4F] transition-colors"
              />
              {errors.password?.message && <span className="text-xs font-bold text-red-600 mt-1 block uppercase">{errors.password?.message}</span>}
            </div>
            
            {errorMsg && (
              <div className="p-3 bg-red-100 border-[3px] border-black text-black font-bold text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] -rotate-1">
                <span>{errorMsg}</span>
              </div>
            )}

            <BrutalButton type="submit" className="w-full h-14 mt-4 text-base" isLoading={isLoading}>
              ENTER VAULT &rarr;
            </BrutalButton>
          </form>

          <div className="mt-8 pt-6 border-t-[4px] border-black text-center">
            <p className="text-sm font-bold uppercase text-black">
              No store yet?{' '}
              <Link to="/signup" className="text-[#4D9DE0] underline decoration-[3px] hover:bg-[#E0FF4F] hover:text-black transition-colors px-1">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
