import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/FormInputs';
import { signupSchema } from '../../lib/validation/schemas';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';

type LoginFormValues = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Mock check if business exists for login warning
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
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl">
          <Store className="w-6 h-6" />
          CODA
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500">Log in to manage your store.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            type="tel"
            label="Phone Number"
            placeholder="08012345678"
            {...register('phone')}
            error={errors.phone?.message}
          />
          
          {errorMsg && (
            <div className="p-4 rounded-xl bg-orange-50 text-accent-dark text-sm">
              {errorMsg} <Link to="/signup" className="font-semibold underline">Create a store?</Link>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Continue
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create a store
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
