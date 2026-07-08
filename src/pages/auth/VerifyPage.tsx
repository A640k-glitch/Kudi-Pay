import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
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
    <div className="min-h-screen flex flex-col bg-gray-50 items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6 md:mb-8">
          <Link to="/">
            <Logo className="h-7 md:h-8" />
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-5 md:p-8 border border-gray-200 shadow-sm">
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-[#1E1B4B] mb-1.5">Verify your number</h1>
            <p className="text-xs md:text-sm text-gray-500">
              We sent a 6-digit code to your phone. Use <span className="font-mono font-semibold text-[#1E1B4B]">123456</span> for testing.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between gap-1.5 sm:gap-2">
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
                  className={`w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border focus:outline-none transition-all
                    ${error ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#1E1B4B] focus:bg-gray-50'}
                  `}
                />
              ))}
            </div>

            {error && <p className="text-red-600 text-xs md:text-sm text-center font-medium">Incorrect code. Please try again.</p>}

            <Button 
              className="w-full h-12 text-sm font-semibold rounded-xl bg-[#1E1B4B] text-white hover:bg-[#111827] transition-colors mt-2 shadow-sm" 
              isLoading={isLoading} 
              disabled={!code.every(d => d !== '')}
              onClick={() => verifyCode(code.join(''))}
            >
              Verify Code
            </Button>

            <div className="text-center pt-1 md:pt-2">
              {countdown > 0 ? (
                <p className="text-gray-500 text-xs md:text-sm">Resend code in {countdown}s</p>
              ) : (
                <button 
                  onClick={() => setCountdown(30)} 
                  className="text-[#1E1B4B] font-semibold text-xs md:text-sm hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-8 text-center">
          <p className="text-[10px] md:text-xs text-gray-400">Secure access provided by Kudi Infrastructure</p>
        </div>
      </div>
    </div>
  );
}
