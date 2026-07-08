import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BrutalButton from '../../components/ui/BrutalButton';
import { Logo } from '../../components/Logo';
import { authService } from '../../lib/services/authService';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    <div className="min-h-screen flex flex-col bg-[#4D9DE0] items-center justify-center p-4 md:p-6 selection:bg-[#E0FF4F] selection:text-black">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6 md:mb-8 hover:scale-105 transition-transform">
          <Link to="/">
            <Logo className="h-10" />
          </Link>
        </div>
        
        <div className="bg-white border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-4 -right-4 bg-[#FFD166] border-[3px] border-black font-black uppercase px-3 py-1 text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-3 text-black">
            SECURE
          </div>

          <div className="mb-6 md:mb-8 text-left border-b-[4px] border-black pb-4">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-1.5 leading-none">Verify<br/>Device.</h1>
            <p className="text-sm font-bold text-gray-700 uppercase">
              Use <span className="bg-[#E0FF4F] px-1 border border-black">123456</span> for testing
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-2">
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
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black border-[3px] focus:outline-none transition-transform
                    ${error ? 'border-red-500 bg-red-100 text-red-600 shadow-[2px_2px_0px_rgba(220,38,38,1)]' : 'border-black focus:bg-[#E0FF4F] shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:shadow-[4px_4px_0px_rgba(0,0,0,1)]'}
                  `}
                />
              ))}
            </div>

            {error && <div className="p-2 bg-red-100 border-[3px] border-black text-black font-bold text-sm text-center -rotate-1">Incorrect code. Please try again.</div>}

            <BrutalButton 
              className="w-full h-14 mt-2 text-base" 
              isLoading={isLoading} 
              disabled={!code.every(d => d !== '')}
              onClick={() => verifyCode(code.join(''))}
            >
              VERIFY NOW &rarr;
            </BrutalButton>

            <div className="text-center pt-4 border-t-[4px] border-black">
              {countdown > 0 ? (
                <p className="text-gray-700 font-bold uppercase text-xs">Resend code in {countdown}s</p>
              ) : (
                <button 
                  onClick={() => setCountdown(30)} 
                  className="text-black font-black uppercase text-xs underline decoration-[3px] hover:bg-[#E0FF4F] transition-colors px-1"
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
