import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, LogOut, Trash2, ShieldAlert, CheckCircle2, Loader2, ArrowLeft, ArrowRight, CreditCard, Sparkles, Building, Landmark, ChevronRight, Lock } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import BrutalButton from '../../components/ui/BrutalButton';
import { Modal } from '../../components/Modal';
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-10 animate-fade-in text-black">
      <header className="mb-8 border-b-[4px] border-black pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Account</h1>
          <p className="font-bold text-gray-700">Manage your security and identity.</p>
        </div>
        <div className="w-16 h-16 bg-[#E0FF4F] border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3">
          <User className="w-8 h-8" strokeWidth={3} />
        </div>
      </header>

      <div className="space-y-6">
        {/* Phone card */}
        <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <p className="font-black uppercase text-sm mb-2 text-gray-500">Registered Phone Number</p>
          <div className="flex items-center gap-4">
            <p className="text-2xl md:text-3xl font-black tracking-widest">{maskPhone(phone)}</p>
          </div>
        </div>

        {/* KYC Tier card */}
        <div className={`border-[4px] border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          business.kycTier === 1
            ? 'bg-[#06D6A0]'
            : 'bg-[#FFD166]'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)] -rotate-3">
              {business.kycTier === 1
                ? <ShieldCheck className="w-6 h-6" strokeWidth={3} />
                : <ShieldAlert className="w-6 h-6" strokeWidth={3} />}
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black uppercase mb-1">
                {business.kycTier === 1 ? 'Tier 1 Verified' : 'Unverified'}
              </p>
              <p className="font-bold text-sm">
                {business.kycTier === 1
                  ? 'Payments and credit unlocked'
                  : 'Basic selling limits apply'}
              </p>
            </div>
          </div>
          {business.kycTier === 0 && (
            <BrutalButton color="#FFFFFF" onClick={() => setIsVerificationOpen(true)} className="whitespace-nowrap">
              Verify Now
            </BrutalButton>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="bg-white border-[4px] border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-gray-100 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-gray-200 border-[3px] border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
              <LogOut className="w-5 h-5" strokeWidth={3} />
            </div>
            <span className="text-lg font-black uppercase">Log Out</span>
          </button>
          
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-[#FF6666] text-black border-[4px] border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center">
              <Trash2 className="w-5 h-5" strokeWidth={3} />
            </div>
            <span className="text-lg font-black uppercase">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Verification Flow Modal */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center sm:p-4">
          <div className="bg-[#4D9DE0] border-0 sm:border-[4px] border-black shadow-none sm:shadow-[12px_12px_0px_rgba(0,0,0,1)] w-full sm:max-w-xl h-full sm:h-auto min-h-screen sm:min-h-0 p-4 sm:p-6 md:p-10 flex flex-col relative animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-8 border-b-[4px] border-black pb-4 bg-white px-4 py-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Logo className="h-8" />
              {verifyStep < 5 && (
                <button 
                  onClick={() => setIsVerificationOpen(false)} 
                  className="font-black uppercase flex items-center gap-2 hover:underline decoration-4 underline-offset-4"
                >
                  Cancel <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                </button>
              )}
            </div>

            <div className="bg-white border-[4px] border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex-1 flex flex-col justify-center">
              {verifyStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="w-16 h-16 bg-[#E0FF4F] border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 -rotate-6">
                    <ShieldCheck className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-black uppercase mb-4">Verify Identity</h2>
                  <p className="font-bold text-gray-700 mb-8">
                    Confirm your identity to unlock customer payments, increase selling limits, and activate credit features.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    {[
                      { icon: CreditCard, title: 'Accept Online Payments', desc: 'Card, transfer, & mobile money' },
                      { icon: Sparkles, title: 'Unlock Business Credit', desc: 'Low-interest overdrafts' },
                      { icon: Building, title: 'Build Store Trust', desc: 'Verified seller badge' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 border-[3px] border-black bg-gray-50 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <div className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center shrink-0">
                          <item.icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="font-black uppercase text-sm">{item.title}</h4>
                          <p className="text-xs font-bold text-gray-500 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <BrutalButton className="w-full text-lg h-14" onClick={() => setVerifyStep(2)}>
                    Get Started <ArrowRight className="w-5 h-5 ml-2" strokeWidth={3} />
                  </BrutalButton>
                </div>
              )}

              {verifyStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-[#FFD166] border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 rotate-3">
                    <Landmark className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-black uppercase mb-4">Enter BVN</h2>
                  <p className="font-bold text-gray-700 mb-8">
                    Bank Verification Number to verify your full name and DOB.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block font-black uppercase text-sm mb-2">BVN (11 Digits)</label>
                      <input 
                        type="text"
                        placeholder="00000000000" 
                        value={bvn}
                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        maxLength={11}
                        className="w-full border-[4px] border-black p-4 text-2xl font-black tracking-[0.2em] text-center outline-none focus:bg-[#E0FF4F] transition-colors"
                      />
                    </div>
                    
                    <div className="bg-[#FF6666] text-white border-[3px] border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-1 font-bold text-sm">
                      <span className="font-black uppercase block mb-1">Tip!</span>
                      Retrieve your BVN by dialing *565*0#
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <BrutalButton color="#FFFFFF" className="flex-1" onClick={() => setVerifyStep(1)} disabled={isVerifying}>
                        Back
                      </BrutalButton>
                      <BrutalButton 
                        className="flex-[2]" 
                        disabled={!isBvnValid || isVerifying}
                        onClick={() => {
                          setIsVerifying(true);
                          setTimeout(() => { setIsVerifying(false); setVerifyStep(3); }, 1200);
                        }}
                      >
                        {isVerifying ? 'Verifying...' : 'Continue'}
                      </BrutalButton>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-[#4D9DE0] text-white border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6 -rotate-3">
                    <User className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-black uppercase mb-4">Enter NIN</h2>
                  <p className="font-bold text-gray-700 mb-8">
                    National Identity Number as secondary verification.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block font-black uppercase text-sm mb-2">NIN (11 Digits)</label>
                      <input 
                        type="text"
                        placeholder="00000000000" 
                        value={nin}
                        onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        maxLength={11}
                        className="w-full border-[4px] border-black p-4 text-2xl font-black tracking-[0.2em] text-center outline-none focus:bg-[#E0FF4F] transition-colors"
                      />
                    </div>
                    
                    <div className="bg-gray-100 border-[3px] border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-1 font-bold text-sm">
                      <span className="font-black uppercase block mb-1">Tip!</span>
                      Dial *346# to check your NIN.
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <BrutalButton color="#FFFFFF" className="flex-1" onClick={() => setVerifyStep(2)} disabled={isVerifying}>
                        Back
                      </BrutalButton>
                      <BrutalButton 
                        className="flex-[2]" 
                        disabled={!isNinValid || isVerifying}
                        onClick={() => {
                          setIsVerifying(true);
                          setTimeout(() => { setIsVerifying(false); setVerifyStep(4); }, 1200);
                        }}
                      >
                        {isVerifying ? 'Verifying...' : 'Continue'}
                      </BrutalButton>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-black text-white border-[4px] border-white shadow-[4px_4px_0px_rgba(224,255,79,1)] flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-black uppercase mb-4">Consent</h2>
                  <p className="font-bold text-gray-700 mb-8">
                    Final confirmation.
                  </p>
                  
                  <div className="space-y-6">
                    <label className="flex items-start gap-4 p-4 border-[4px] border-black bg-[#E0FF4F] shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 mt-1 accent-black"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="font-bold text-sm leading-relaxed">
                        I authorize Kudi to verify my identity against the central database. All information is accurate. Read Privacy Policy.
                      </span>
                    </label>
                    
                    <div className="flex gap-4 pt-4">
                      <BrutalButton color="#FFFFFF" className="flex-1" onClick={() => setVerifyStep(3)} disabled={isVerifying}>
                        Back
                      </BrutalButton>
                      <BrutalButton 
                        className="flex-[2]" 
                        disabled={!consent || isVerifying}
                        onClick={handleVerifySubmit}
                      >
                        {isVerifying ? 'Verifying...' : 'Submit'}
                      </BrutalButton>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 5 && (
                <div className="animate-in zoom-in-95 duration-500 text-center flex flex-col items-center py-8">
                  <div className="w-24 h-24 bg-[#06D6A0] border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-8 rotate-6">
                    <CheckCircle2 className="w-12 h-12" strokeWidth={3} />
                  </div>
                  <h2 className="text-4xl font-black uppercase mb-4">Verified!</h2>
                  <span className="inline-block bg-black text-[#E0FF4F] font-black uppercase px-4 py-2 border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-2 mb-8">
                    Tier 1 Status
                  </span>
                  <p className="font-bold text-lg mb-8 max-w-sm mx-auto">
                    You can now accept bank transfers and request loans!
                  </p>
                  <BrutalButton 
                    className="w-full h-16 text-xl" 
                    onClick={() => { setIsVerificationOpen(false); setVerifyStep(1); }}
                  >
                    Done
                  </BrutalButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout & Delete Modals */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="p-6 bg-white border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center">
          <h3 className="text-2xl font-black uppercase mb-4">Log out?</h3>
          <p className="font-bold mb-8">You will need to verify your phone number to log back in.</p>
          <div className="flex gap-4">
            <BrutalButton color="#FFFFFF" className="flex-1" onClick={() => setIsLogoutModalOpen(false)}>Cancel</BrutalButton>
            <BrutalButton className="flex-1" onClick={handleLogout}>Log Out</BrutalButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="p-6 bg-[#FF6666] border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-16 h-16 bg-white border-[4px] border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <Trash2 className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black uppercase mb-4 text-black">Delete Account?</h3>
          <p className="font-bold mb-6 text-black">This action cannot be undone. All data will be lost.</p>
          
          <div className="mb-6 text-left">
            <label className="block font-black uppercase text-sm mb-2 text-black">Type DELETE to confirm</label>
            <input 
              className="w-full border-[4px] border-black p-4 font-black uppercase outline-none focus:bg-[#E0FF4F] transition-colors"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-4">
            <BrutalButton color="#FFFFFF" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</BrutalButton>
            <BrutalButton 
              className="flex-1 bg-black text-white hover:bg-gray-800"
              disabled={deleteConfirm !== 'DELETE'}
              onClick={handleDelete}
            >
              Confirm
            </BrutalButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
