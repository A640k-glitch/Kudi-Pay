import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '../../components/Button';
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
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-xl">
          <Store className="w-6 h-6" />
          CODA
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify your number</h1>
          <p className="text-gray-500">We sent a 6-digit code to your phone. For testing, use <span className="font-mono font-bold text-gray-900">123456</span>.</p>
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
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border focus:outline-none transition-colors
                  ${error ? 'border-destructive focus:border-destructive animate-shake' : 'border-gray-300 focus:border-primary'}
                `}
              />
            ))}
          </div>

          {error && <p className="text-destructive text-sm text-center">Incorrect code. Please try again.</p>}

          <Button 
            className="w-full" 
            isLoading={isLoading} 
            disabled={!code.every(d => d !== '')}
            onClick={() => verifyCode(code.join(''))}
          >
            Verify
          </Button>

          <div className="text-center mt-4">
            {countdown > 0 ? (
              <p className="text-gray-500 text-sm">Resend code in {countdown}s</p>
            ) : (
              <button 
                onClick={() => setCountdown(30)} 
                className="text-primary font-medium text-sm hover:underline"
              >
                Resend code
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
