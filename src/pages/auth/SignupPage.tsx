import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BrutalButton from '../../components/ui/BrutalButton';
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
      sessionStorage.setItem('coda_temp_password', data.password);
      await authService.sendOTP(data.phone);
      navigate('/verify');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E0FF4F] items-center justify-center p-4 md:p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6 md:mb-8 hover:scale-105 transition-transform">
          <Link to="/">
            <Logo className="h-10" />
          </Link>
        </div>
        
        <div className="bg-white border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -right-4 bg-[#FF6666] border-[3px] border-black font-black uppercase px-3 py-1 text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-6 text-white">
            START
          </div>

          <div className="mb-6 md:mb-8 text-left border-b-[4px] border-black pb-4">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-1.5 leading-none">Create<br/>Store.</h1>
            <p className="text-sm font-bold text-gray-700 uppercase">Sell online in 60 seconds</p>
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

            <BrutalButton type="submit" className="w-full h-14 mt-4 text-base" isLoading={isLoading}>
              SEND OTP &rarr;
            </BrutalButton>
          </form>

          <div className="mt-8 pt-6 border-t-[4px] border-black text-center">
            <p className="text-sm font-bold uppercase text-black">
              Already a merchant?{' '}
              <Link to="/login" className="text-[#4D9DE0] underline decoration-[3px] hover:bg-[#E0FF4F] hover:text-black transition-colors px-1">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
