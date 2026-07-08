import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, LogOut, Trash2, ShieldAlert, CheckCircle2, Loader2, ArrowLeft, ArrowRight, CreditCard, Sparkles, Building, Landmark, ChevronRight, Lock } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input, Select } from '../../components/FormInputs';
import { useToast } from '../../components/Toast';
import { Logo } from '../../components/Logo';

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = authService.getCurrentPhone();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  // Verification Flow State
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verifyStep, setVerifyStep] = useState(1);
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [consent, setConsent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function load() {
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
      }
    }
    load();
  }, [phone]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verify') === 'true') {
      setIsVerificationOpen(true);
      window.history.replaceState({}, '', '/dashboard/account');
    }
  }, [location]);

  const maskPhone = (p: string | null) => {
    if (!p) return '';
    // Show first 4 chars, mask middle, show last char
    // e.g. 0901 *** ***2
    const digits = p.replace(/\D/g, '');
    if (digits.length < 5) return p;
    const first = digits.slice(0, 4);
    const last = digits.slice(-1);
    return `${first} \u2022\u2022\u2022 \u2022\u2022\u2022${last}`;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleDelete = () => {
    authService.logout();
    navigate('/');
  };

  const handleVerifySubmit = async () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(async () => {
      setIsVerifying(false);
      if (business) {
        await businessService.updateBusiness(business.id, { kycTier: 1 });
        setBusiness({ ...business, kycTier: 1 });
        setVerifyStep(5);
      }
    }, 1500);
  };



  if (!business) return null;

  const isBvnValid = /^\d{11}$/.test(bvn);
  const isNinValid = /^\d{11}$/.test(nin);

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-24 md:pb-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1E1B4B] mb-0.5">Account</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-0.5">Manage your account and security.</p>
      </header>

      <div className="space-y-4">
        {/* Phone card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3.5 px-4 py-3 md:px-5 md:py-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#1E1B4B]/8 flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5 md:w-5 h-5 text-[#1E1B4B]/50" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Phone Number</p>
              <p className="text-[15px] md:text-[17px] font-semibold text-[#1E1B4B] tracking-wide font-mono">{maskPhone(phone)}</p>
            </div>
          </div>
        </div>

        {/* KYC Tier card */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${
          business.kycTier === 1
            ? 'bg-white border-green-100'
            : 'bg-white border-amber-100'
        }`}>
          <div className="flex items-center gap-3.5 px-4 py-3 md:px-5 md:py-4">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${
              business.kycTier === 1 ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              {business.kycTier === 1
                ? <ShieldCheck className="w-4.5 h-4.5 md:w-5 h-5 text-green-600" />
                : <ShieldAlert className="w-4.5 h-4.5 md:w-5 h-5 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-[15px] font-semibold text-[#1E1B4B]">
                {business.kycTier === 1 ? 'Tier 1 — Verified' : 'Tier 0 — Unverified'}
              </p>
              <p className="text-xs md:text-[13px] text-gray-400 mt-0.5">
                {business.kycTier === 1
                  ? 'Payments and credit unlocked'
                  : 'Basic selling limits apply'}
              </p>
            </div>
          </div>
          {business.kycTier === 0 && (
            <div className="border-t border-amber-50 px-4 py-2.5 md:px-5 md:py-3 flex items-center justify-between gap-4">
              <p className="text-xs md:text-[13px] text-gray-500">Verify to unlock payments and credit.</p>
              <button
                onClick={() => setIsVerificationOpen(true)}
                className="shrink-0 h-8 px-3.5 md:h-9 md:px-4 rounded-xl bg-[#312E81] text-white text-xs md:text-[13px] font-semibold hover:bg-[#1E1B4B] transition-colors"
              >
                Verify Now
              </button>
            </div>
          )}
          {business.kycTier === 1 && (
            <div className="border-t border-green-50 px-4 py-2.5 md:px-5 md:py-3 flex items-center gap-2 text-xs md:text-[13px] text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Identity verified
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 md:px-5 md:py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <LogOut className="w-4.5 h-4.5 md:w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm md:text-[15px] font-medium text-[#1E1B4B]">Log Out</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 md:px-5 md:py-4 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="w-4.5 h-4.5 md:w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm md:text-[15px] font-medium text-red-500">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Verification Flow Modal */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-55 bg-gradient-to-br from-[#FAFAF8] via-white to-indigo-50/30 overflow-y-auto flex items-center justify-center p-3 md:p-6" style={{ zIndex: 100 }}>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-xl p-5 md:p-8 flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/30 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
              <Logo className="h-7" />
              {verifyStep < 5 && (
                <button 
                  onClick={() => setIsVerificationOpen(false)} 
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>

            {/* Stepper Progress Bar */}
            {verifyStep < 5 && (
              <div className="flex items-center justify-between mb-8 px-1 select-none">
                {[
                  { label: 'Start', step: 1 },
                  { label: 'BVN', step: 2 },
                  { label: 'NIN', step: 3 },
                  { label: 'Consent', step: 4 }
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        verifyStep === s.step 
                          ? 'bg-[#312E81] text-white shadow-lg shadow-[#312E81]/25 scale-110 ring-4 ring-[#312E81]/10' 
                          : verifyStep > s.step 
                            ? 'bg-[#059669] text-white' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {verifyStep > s.step ? '✓' : s.step}
                      </div>
                      <span className={`text-[9px] font-bold tracking-wider uppercase ${
                        verifyStep === s.step ? 'text-[#312E81]' : 'text-gray-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="flex-1 h-0.5 -mt-4 mx-2 bg-gray-100 relative min-w-[20px]">
                        <div 
                          className="absolute inset-y-0 left-0 bg-[#059669] transition-all duration-500" 
                          style={{ width: verifyStep > s.step ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center">
              {verifyStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-14 h-14 bg-indigo-50 text-[#312E81] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Verify your identity</h2>
                  <p className="text-xs md:text-sm text-gray-500 mb-5 leading-relaxed">
                    Confirm your identity to unlock customer payments, increase selling limits, and activate credit features. This process is fully secure.
                  </p>
                  
                  <div className="space-y-2.5 mb-6">
                    {[
                      { 
                        icon: CreditCard, 
                        title: 'Accept Online Payments', 
                        desc: 'Accept card payments, bank transfers, and mobile money directly from customers.' 
                      },
                      { 
                        icon: Sparkles, 
                        title: 'Unlock Business Credit', 
                        desc: 'Grow your business with access to easy, low-interest overdrafts and loans.' 
                      },
                      { 
                        icon: Building, 
                        title: 'Build Store Trust', 
                        desc: 'Display a verified seller badge to build confidence and boost sales.' 
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3.5 p-3.5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 text-indigo-600">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-905 text-gray-900">{item.title}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full h-12 text-xs font-bold shadow-md shadow-[#312E81]/15" onClick={() => setVerifyStep(2)}>
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {verifyStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <Landmark className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Enter your BVN</h2>
                  <p className="text-xs md:text-sm text-gray-500 mb-5 leading-relaxed">
                    We use your Bank Verification Number to verify your full name and date of birth. This does not grant us access to your accounts.
                  </p>
                  
                  <div className="space-y-5">
                    <div className="relative">
                      <Input 
                        label="Bank Verification Number (11 Digits)" 
                        placeholder="00000000000" 
                        value={bvn}
                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        maxLength={11}
                        className="text-lg font-mono tracking-[0.2em] text-center focus:tracking-[0.2em] placeholder:tracking-normal placeholder:text-center h-12"
                      />
                      <div className="absolute right-4 top-[38px] text-gray-300">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100/50 text-[11px] leading-relaxed text-amber-800">
                      <span className="text-sm shrink-0">💡</span>
                      <p>
                        Quick Tip: You can retrieve your BVN by dialing <strong className="font-bold">*565*0#</strong> from the phone number linked to your bank account.
                      </p>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1 h-12 font-semibold text-xs"
                        onClick={() => setVerifyStep(1)}
                        disabled={isVerifying}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-[2] h-12 font-bold text-xs shadow-md shadow-[#312E81]/15" 
                        disabled={!isBvnValid || isVerifying}
                        onClick={() => {
                          setIsVerifying(true);
                          setTimeout(() => {
                            setIsVerifying(false);
                            setVerifyStep(3);
                          }, 1200);
                        }}
                      >
                        {isVerifying ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                          </span>
                        ) : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <User className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Enter your NIN</h2>
                  <p className="text-xs md:text-sm text-gray-500 mb-5 leading-relaxed">
                    Your National Identity Number is required as secondary verification to secure your account limit.
                  </p>
                  
                  <div className="space-y-5">
                    <div className="relative">
                      <Input 
                        label="National Identity Number (11 Digits)" 
                        placeholder="00000000000" 
                        value={nin}
                        onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        maxLength={11}
                        className="text-lg font-mono tracking-[0.2em] text-center focus:tracking-[0.2em] placeholder:tracking-normal placeholder:text-center h-12"
                      />
                      <div className="absolute right-4 top-[38px] text-gray-300">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 text-[11px] leading-relaxed text-indigo-800">
                      <span className="text-sm shrink-0">💡</span>
                      <p>
                        Tip: You can check your NIN on your National ID Slip, ID Card, or by dialing <strong className="font-bold">*346#</strong>.
                      </p>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1 h-12 font-semibold text-xs"
                        onClick={() => setVerifyStep(2)}
                        disabled={isVerifying}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-[2] h-12 font-bold text-xs shadow-md shadow-[#312E81]/15" 
                        disabled={!isNinValid || isVerifying}
                        onClick={() => {
                          setIsVerifying(true);
                          setTimeout(() => {
                            setIsVerifying(false);
                            setVerifyStep(4);
                          }, 1200);
                        }}
                      >
                        {isVerifying ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                          </span>
                        ) : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Review & Consent</h2>
                  <p className="text-xs md:text-sm text-gray-500 mb-5 leading-relaxed">
                    Confirm your agreement to complete the verification process.
                  </p>
                  
                  <div className="space-y-5">
                    <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-gray-150 cursor-pointer hover:bg-gray-50/50 transition-all duration-200 shadow-sm bg-white">
                      <div className="mt-1">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                      </div>
                      <div className="text-[11px] text-gray-600 leading-relaxed">
                        I hereby authorize Kudi to verify my identity details against the central database using the provided BVN and NIN. I confirm that all information supplied is accurate and true. Read our <a href="#" className="text-indigo-600 hover:underline font-semibold">Privacy Policy</a>.
                      </div>
                    </label>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1 h-12 font-semibold text-xs"
                        onClick={() => setVerifyStep(3)}
                        disabled={isVerifying}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-[2] h-12 font-bold text-xs shadow-md shadow-[#312E81]/15" 
                        disabled={!consent || isVerifying}
                        onClick={handleVerifySubmit}
                      >
                        {isVerifying ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                          </span>
                        ) : 'Submit Verification'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 5 && (
                <div className="animate-in zoom-in-95 duration-500 text-center flex flex-col items-center py-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10 border border-emerald-100">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Identity Verified!</h2>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-5">
                    Tier 1 Status
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                    Your details match perfectly. We have upgraded your storefront limit. You can now accept bank transfers and create loan requests.
                  </p>
                  <Button 
                    className="w-full h-12 text-xs font-bold shadow-md shadow-[#312E81]/15" 
                    onClick={() => {
                      setIsVerificationOpen(false);
                      setVerifyStep(1);
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout & Delete Modals */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="py-2 text-center">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Log out?</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">You will need to verify your phone number to log back in.</p>
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1 h-10 text-xs font-semibold" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 h-10 text-xs font-bold bg-[#1E1B4B] hover:bg-[#111827]" onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="py-2">
          <div className="w-10 h-10 rounded-full bg-red-50 text-destructive flex items-center justify-center mb-3 mx-auto">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-center text-gray-900 mb-1">Delete Account?</h3>
          <p className="text-xs sm:text-sm text-gray-500 text-center mb-5 leading-relaxed">This action cannot be undone. Your storefront and all products will be permanently removed.</p>
          
          <div className="mb-4">
            <Input 
              label="Type DELETE to confirm" 
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1 h-10 text-xs font-semibold" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="flex-1 h-10 text-xs font-bold" 
              disabled={deleteConfirm !== 'DELETE'}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
