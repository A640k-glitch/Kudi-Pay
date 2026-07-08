import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { authService } from '../../lib/services/authService';
import { ShieldCheck, ArrowRight, ArrowLeft } from '@phosphor-icons/react';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // If the user is already authenticated, redirect them out of the verify page
    if (authService.getCurrentPhone()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(false);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '')) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (fullCode: string) => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await authService.verifyOTP(fullCode);
      if (res.success) {
        if (res.isNewUser) {
          navigate('/onboarding/business');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(true);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(true);
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
        
        <div className="bg-white border-2 border-slate-900 p-8 sm:p-10 shadow-[8px_8px_0px_#0f172a] rounded-[24px] relative">
          <div className="absolute -top-4 -right-4 bg-[#E0FF4F] border-2 border-slate-900 font-bold px-4 py-2 text-sm shadow-[4px_4px_0px_#0f172a] rounded-[12px] rotate-3 text-slate-900 flex items-center gap-2">
            <ShieldCheck weight="bold" className="w-4 h-4" /> SECURE
          </div>

          <div className="mb-8 text-left border-b-2 border-slate-100 pb-6">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Verify Device</h1>
            <p className="text-sm font-medium text-slate-600">
              Use <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-900">123456</span> for testing
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-[12px] border-2 focus:outline-none transition-all shadow-sm
                    ${error ? 'border-red-500 bg-red-50 text-red-600 focus:shadow-[4px_4px_0px_#EF4444]' : 'border-slate-200 focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F]'}
                  `}
                />
              ))}
            </div>

            {error && <div className="p-4 bg-red-50 border-2 border-red-500 rounded-[12px] text-red-600 font-bold text-sm shadow-[2px_2px_0px_#EF4444]">Incorrect code. Please try again.</div>}

            <button 
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 mt-2 rounded-[12px] font-bold text-lg shadow-[4px_4px_0px_#E0FF4F] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading || !code.every(d => d !== '')}
              onClick={() => verifyCode(code.join(''))}
            >
              {isLoading ? 'Verifying...' : 'Verify Now'} <ArrowRight weight="bold" />
            </button>

            <div className="text-center pt-6 border-t-2 border-slate-100">
              {countdown > 0 ? (
                <p className="text-slate-500 font-medium text-sm">Resend code in <span className="font-bold text-slate-900">{countdown}s</span></p>
              ) : (
                <button 
                  onClick={() => setCountdown(30)} 
                  className="text-slate-900 font-bold text-sm underline decoration-2 hover:bg-[#E0FF4F] transition-colors px-2 py-1 rounded"
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
