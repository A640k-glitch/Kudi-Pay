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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your store</h1>
          <p className="text-gray-500">Enter your phone number to get started.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            type="tel"
            label="Phone Number"
            placeholder="08012345678"
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Continue
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
