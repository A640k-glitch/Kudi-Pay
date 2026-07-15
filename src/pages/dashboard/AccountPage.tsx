import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, SignOut, Trash, WarningCircle, CheckCircle, ArrowRight, CreditCard, Sparkle, Buildings, Bank, LockKey } from '@phosphor-icons/react';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { bankAccountService } from '../../lib/services/bankAccountService';
import { businessVerificationService } from '../../lib/services/businessVerificationService';
import { Business, BankAccount } from '../../lib/types';
import { Modal } from '../../components/Modal';

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = authService.getCurrentPhone();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Verification Flow State
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verifyStep, setVerifyStep] = useState(1);
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Bank Link State
  const [isBankLinkOpen, setIsBankLinkOpen] = useState(false);
  const [bankCode, setBankCode] = useState('058'); // Default GTBank
  const [accountNumber, setAccountNumber] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    async function load() {
      if (!phone) return;
      const b = await businessService.getBusinessByPhone(phone);
      if (b) {
        setBusiness(b);
        const acc = await bankAccountService.getAccount(b.id);
        setBankAccount(acc);
      }
      setIsLoading(false);
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

  const handleDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      await businessService.requestDeleteOTP();
      setDeleteStep(2);
    } catch (err: any) {
      alert("Failed to send OTP. " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!business) return;
    setIsDeleting(true);
    try {
      await businessService.deleteBusiness(business.id, deleteOtp);
      authService.logout();
      navigate('/');
    } catch (err: any) {
      alert("Verification failed. " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!business) return;
    setIsVerifying(true);
    try {
      // Simulate real API calls via the adapter
      await businessVerificationService.verifyBVN(bvn);
      await businessVerificationService.verifyNIN(nin);
      if (rcNumber) {
        await businessVerificationService.verifyCACNumber(rcNumber, business.id);
      }

      await businessService.updateBusiness(business.id, { kycTier: rcNumber ? 3 : 2 });
      setBusiness({ ...business, kycTier: rcNumber ? 3 : 2 });
      setVerifyStep(6);
    } catch (err) {
      alert("Verification failed. Check your details.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !accountNumber) return;
    setIsLinking(true);
    try {
      const acc = await bankAccountService.linkAccount(business.id, bankCode);
      setBankAccount(acc);
      setIsBankLinkOpen(false);
      
      // Auto-sync initial transactions
      await bankAccountService.syncTransactions(business.id);
      
    } catch (err) {
      alert("Failed to link bank account. " + (err as Error).message);
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading || !business) return null;

  const isBvnValid = /^\d{11}$/.test(bvn);
  const isNinValid = /^\d{11}$/.test(nin) || /^[A-Za-z0-9]{16}$/.test(nin);

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-2xl mx-auto pb-32 md:pb-10 animate-fade-in text-slate-900 selection:bg-[#E0FF4F] selection:text-slate-900">
      <header className="mb-8 border-b-2 border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-2">Account</h1>
          <p className="font-bold text-slate-500">Manage your security and identity.</p>
        </div>
        <div className="w-16 h-16 bg-[#E0FF4F] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center rotate-3">
          <User className="w-8 h-8 text-slate-900" weight="bold" />
        </div>
      </header>

      <div className="space-y-6">
        {/* Phone card */}
        <div className="glass-panel p-3 sm:p-4">
          <p className="font-bold text-sm mb-2 text-slate-500">Registered Phone Number</p>
          <div className="flex items-center gap-4">
            <p className="text-2xl md:text-3xl font-display font-black tracking-widest">{maskPhone(phone)}</p>
          </div>
        </div>

        {/* Bank Connection Card */}
        <div className={`p-4 rounded-[24px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col gap-4 ${
          bankAccount ? 'bg-[#10B981] text-white' : 'bg-white'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 border-2 border-slate-900 rounded-[12px] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0f172a] -rotate-3 ${bankAccount ? 'bg-white' : 'bg-slate-100'}`}>
                 <Bank className={`w-6 h-6 ${bankAccount ? 'text-[#10B981]' : 'text-slate-400'}`} weight="fill" />
              </div>
              <div>
                <p className={`text-xl md:text-2xl font-display font-black mb-1 ${bankAccount ? 'text-white' : 'text-slate-900'}`}>
                  {bankAccount ? 'Bank Connected' : 'No Bank Connected'}
                </p>
                <p className={`font-bold text-sm ${bankAccount ? 'text-white' : 'text-slate-500'}`}>
                  {bankAccount 
                    ? `${bankAccount.institution} • ****${bankAccount.accountNumber.slice(-4)}`
                    : 'Link your business account to automate scoring.'}
                </p>
              </div>
            </div>
            {!bankAccount && (
              <button 
                onClick={() => setIsBankLinkOpen(true)} 
                className="whitespace-nowrap px-6 py-3 bg-[#E0FF4F] text-slate-900 font-bold rounded-[12px] shadow-[4px_4px_0px_#0f172a] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
              >
                Link Account
              </button>
            )}
          </div>

          {/* Expanded Bank Summary when linked */}
          {bankAccount && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-white/40 mt-2">
              <div className="bg-slate-900 border-2 border-slate-900 rounded-[12px] p-3 shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                <p className="text-xs font-bold text-slate-300 mb-1">Account Name</p>
                <p className="font-black text-white text-sm truncate">{bankAccount.accountName}</p>
              </div>
              <div className="bg-slate-900 border-2 border-slate-900 rounded-[12px] p-3 shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                <p className="text-xs font-bold text-slate-300 mb-1">Balance</p>
                <p className="font-black text-white text-sm">₦{bankAccount.balance.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900 border-2 border-slate-900 rounded-[12px] p-3 shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                <p className="text-xs font-bold text-slate-300 mb-1">Account Number</p>
                <p className="font-black text-white text-sm tracking-widest">{bankAccount.accountNumber}</p>
              </div>
              <div className="bg-slate-900 border-2 border-slate-900 rounded-[12px] p-3 shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
                <p className="text-xs font-bold text-slate-300 mb-1">Last Synced</p>
                <p className="font-black text-white text-sm">{new Date(bankAccount.lastSyncedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
          )}
        </div>

        {/* KYC Tier card */}
        <div className={`p-3 sm:p-4 rounded-[24px] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          business.kycTier > 1
            ? 'bg-[#E0FF4F]'
            : 'bg-[#FFD166]'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white border-2 border-slate-900 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm rotate-3">
              {business.kycTier > 1
                ? <ShieldCheck className="w-6 h-6 text-[#10B981]" weight="fill" />
                : <WarningCircle className="w-6 h-6 text-[#F59E0B]" weight="fill" />}
            </div>
            <div>
              <p className="text-xl md:text-2xl font-display font-black mb-1 text-slate-900">
                {business.kycTier > 1 ? `Tier ${business.kycTier} Verified` : 'Tier 1 (Unverified)'}
              </p>
              <p className="font-bold text-sm text-slate-700">
                {business.kycTier > 1
                  ? 'Identity and business verified.'
                  : 'Basic selling limits apply.'}
              </p>
            </div>
          </div>
          {business.kycTier < 2 && (
            <button 
              onClick={() => setIsVerificationOpen(true)} 
              className="whitespace-nowrap px-6 py-3 bg-white text-slate-900 font-bold rounded-[12px] shadow-[4px_4px_0px_#0f172a] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
            >
              Verify Identity
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="pt-6">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full bg-[#FF6666] text-white rounded-[24px] border-2 border-slate-900 p-3 sm:p-4 shadow-[4px_4px_0px_#0f172a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#0f172a] transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Trash className="w-5 h-5 text-white" weight="fill" />
            </div>
            <span className="text-lg font-bold">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Bank Link Modal */}
      <Modal isOpen={isBankLinkOpen} onClose={() => setIsBankLinkOpen(false)} theme="brutal">
        <div className="p-4 sm:p-6">
          <div className="w-16 h-16 bg-[#E0FF4F] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center mb-6 -rotate-3">
            <Bank className="w-8 h-8 text-slate-900" weight="fill" />
          </div>
          <h2 className="text-3xl font-display font-black mb-3">Link Bank Account</h2>
          <p className="font-bold text-slate-500 mb-8 leading-relaxed">
            Connect your primary business account. We use Mono open banking to securely read your transactions and build your trust score.
          </p>

          <form onSubmit={handleLinkBank} className="space-y-6">
            <div>
               <label className="block font-bold text-slate-700 text-sm mb-2">Select Bank</label>
               <select 
                  value={bankCode} 
                  onChange={e => setBankCode(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-[12px] p-4 font-bold outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] transition-all appearance-none bg-white"
               >
                 <option value="058">GTBank</option>
                 <option value="033">UBA</option>
                 <option value="057">Zenith Bank</option>
                 <option value="044">Access Bank</option>
                 <option value="999">Kuda Bank</option>
               </select>
            </div>

            <div>
               <label className="block font-bold text-slate-700 text-sm mb-2">Account Number (10 Digits)</label>
               <input 
                  type="text"
                  placeholder="0000000000" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="w-full border-2 border-slate-200 rounded-[12px] p-4 text-2xl font-black tracking-widest outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] transition-all"
               />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-4 flex gap-3 items-start">
               <LockKey className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
               <p className="text-xs font-bold text-slate-500 leading-relaxed">We use 256-bit encryption. We only request read-only access to compute your score. We cannot move your money.</p>
            </div>

            <button 
              type="submit"
              disabled={accountNumber.length !== 10 || isLinking}
              className="w-full h-14 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50" 
            >
              {isLinking ? 'Securely Linking...' : 'Connect Bank Account'}
            </button>
          </form>
        </div>
      </Modal>

      {/* Verification Flow Modal */}
      <Modal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} theme="brutal">
        <div className="p-2 sm:p-6 flex flex-col justify-center">
              {verifyStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="w-16 h-16 bg-[#E0FF4F] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center mb-6 -rotate-6">
                    <ShieldCheck className="w-8 h-8 text-slate-900" weight="fill" />
                  </div>
                  <h2 className="text-3xl font-display font-black mb-3">Verify Identity</h2>
                  <p className="font-bold text-slate-500 mb-8 leading-relaxed">
                    Confirm your identity to unlock customer payments, increase selling limits, and activate credit features.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    {[
                      { icon: CreditCard, title: 'Accept Online Payments', desc: 'Card, transfer, & mobile money' },
                      { icon: Sparkle, title: 'Unlock Business Credit', desc: 'Low-interest loans' },
                      { icon: Buildings, title: 'Build Store Trust', desc: 'Verified seller badge' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 border border-slate-200 bg-white rounded-[16px] shadow-sm">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                          <item.icon className="w-5 h-5 text-slate-700" weight="fill" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                          <p className="text-xs font-medium text-slate-500 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="w-full h-14 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center" 
                    onClick={() => setVerifyStep(2)}
                  >
                    Get Started <ArrowRight className="w-5 h-5 ml-2" weight="bold" />
                  </button>
                </div>
              )}

              {verifyStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-[#FFD166] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center mb-6 rotate-3">
                    <User className="w-8 h-8 text-slate-900" weight="fill" />
                  </div>
                  <h2 className="text-3xl font-display font-black mb-3">Enter BVN</h2>
                  <p className="font-bold text-slate-500 mb-8 leading-relaxed">
                    Bank Verification Number to verify your full name and DOB.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block font-bold text-slate-700 text-sm mb-2">BVN (11 Digits)</label>
                      <input 
                        type="text"
                        placeholder="00000000000" 
                        value={bvn}
                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        maxLength={11}
                        className="w-full border-2 border-slate-200 rounded-[16px] p-4 text-2xl font-black tracking-[0.2em] text-center outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] transition-all"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 transition-colors" onClick={() => setVerifyStep(1)}>Back</button>
                      <button 
                        className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 transition-all disabled:opacity-50" 
                        disabled={!isBvnValid}
                        onClick={() => setVerifyStep(3)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-[#4D9DE0] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center mb-6 -rotate-3">
                    <User className="w-8 h-8 text-white" weight="fill" />
                  </div>
                  <h2 className="text-3xl font-display font-black mb-3">Enter NIN</h2>
                  <p className="font-bold text-slate-500 mb-8 leading-relaxed">
                    National Identity Number or vNIN (16 chars).
                  </p>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block font-bold text-slate-700 text-sm mb-2">NIN or vNIN</label>
                      <input 
                        type="text"
                        placeholder="00000000000" 
                        value={nin}
                        onChange={(e) => setNin(e.target.value.slice(0, 16))}
                        className="w-full border-2 border-slate-200 rounded-[16px] p-4 text-2xl font-black tracking-[0.2em] text-center outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] transition-all uppercase"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 transition-colors" onClick={() => setVerifyStep(2)}>Back</button>
                      <button 
                        className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 transition-all disabled:opacity-50" 
                        disabled={!isNinValid}
                        onClick={() => setVerifyStep(4)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-[#B388FF] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-[16px] flex items-center justify-center mb-6 -rotate-3">
                    <Buildings className="w-8 h-8 text-white" weight="fill" />
                  </div>
                  <h2 className="text-3xl font-display font-black mb-3">Business Reg (Optional)</h2>
                  <p className="font-bold text-slate-500 mb-8 leading-relaxed">
                    Enter your CAC Registration Number to unlock Tier 3 limits. You can skip this for now.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block font-bold text-slate-700 text-sm mb-2">CAC Number (RC or BN)</label>
                      <input 
                        type="text"
                        placeholder="RC1234567" 
                        value={rcNumber}
                        onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                        className="w-full border-2 border-slate-200 rounded-[16px] p-4 text-2xl font-black tracking-widest text-center outline-none focus:border-slate-900 focus:shadow-[4px_4px_0px_#E0FF4F] transition-all uppercase"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 transition-colors" onClick={() => setVerifyStep(5)}>Skip</button>
                      <button 
                        className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 transition-all disabled:opacity-50" 
                        disabled={!rcNumber || rcNumber.length < 5}
                        onClick={() => setVerifyStep(5)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 5 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="w-16 h-16 bg-slate-900 border-2 border-slate-200 shadow-sm rounded-[16px] flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-[#E0FF4F]" weight="fill" />
                  </div>
                  <h2 className="text-3xl font-display font-black mb-3">Consent</h2>
                  <p className="font-bold text-slate-500 mb-8">
                    Final confirmation.
                  </p>
                  
                  <div className="space-y-6">
                    <label className="flex items-start gap-4 p-4 border-2 border-slate-900 bg-white shadow-sm rounded-[16px] cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 mt-0.5 accent-slate-900 rounded-[6px]"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="font-medium text-sm leading-relaxed text-slate-700">
                        I authorize Kudi to verify my identity against the central database using Dojah. All information is accurate. Read <a href="#" className="underline font-bold text-slate-900">Privacy Policy</a>.
                      </span>
                    </label>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 transition-colors" 
                        onClick={() => setVerifyStep(4)} 
                        disabled={isVerifying}
                      >
                        Back
                      </button>
                      <button 
                        className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0" 
                        disabled={!consent || isVerifying}
                        onClick={handleVerifySubmit}
                      >
                        {isVerifying ? 'Verifying...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {verifyStep === 6 && (
                <div className="animate-in zoom-in-95 duration-500 text-center flex flex-col items-center py-8">
                  <div className="w-24 h-24 bg-[#E0FF4F] border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-[24px] flex items-center justify-center mb-8 rotate-6">
                    <CheckCircle className="w-12 h-12 text-slate-900" weight="fill" />
                  </div>
                  <h2 className="text-4xl font-display font-black mb-4 text-slate-900">Verified!</h2>

                  <p className="font-bold text-lg mb-10 max-w-sm mx-auto text-slate-600 leading-relaxed">
                    You can now accept bank transfers and request loans!
                  </p>
                  <button 
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" 
                    onClick={() => { setIsVerificationOpen(false); setVerifyStep(1); }}
                  >
                    Done
                  </button>
                </div>
              )}
        </div>
      </Modal>

      {/* Logout & Delete Modals */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="p-8 bg-white border-2 border-slate-900 rounded-[32px] shadow-[8px_8px_0px_#0f172a] text-center max-w-sm mx-auto">
          <h3 className="text-2xl font-display font-black mb-4">Log out?</h3>
          <p className="font-bold text-slate-500 mb-8 leading-relaxed">You will need to verify your phone number to log back in.</p>
          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-[16px] border-2 border-slate-200 hover:border-slate-900 transition-colors" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
            <button className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_#E0FF4F] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#E0FF4F] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteStep(1); setDeleteConfirm(''); setDeleteOtp(''); }}>
        <div className="p-8 bg-[#FF6666] border-2 border-slate-900 rounded-[32px] shadow-[8px_8px_0px_#0f172a] text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Trash className="w-8 h-8 text-slate-900" weight="fill" />
          </div>
          
          {deleteStep === 1 ? (
            <>
              <h3 className="text-2xl font-display font-black mb-4 text-white">Delete Account?</h3>
              <p className="font-bold mb-8 text-white/90 leading-relaxed">This action cannot be undone. All data will be lost.</p>
              
              <div className="mb-8 text-left">
                <label className="block font-bold text-white text-sm mb-2">Type DELETE to confirm</label>
                <input 
                  className="w-full border-2 border-white rounded-[16px] p-4 font-black uppercase outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)] bg-white/10 text-white placeholder-white/30 transition-all"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-white/20 text-white font-bold rounded-[16px] border-2 border-transparent hover:bg-white/30 transition-colors" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button 
                  className="flex-1 py-4 bg-[#E0FF4F] text-slate-900 font-bold rounded-[16px] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  onClick={handleDeleteRequest}
                >
                  {isDeleting ? '...' : 'Confirm'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-display font-black mb-4 text-white">Verify Deletion</h3>
              <p className="font-bold mb-8 text-white/90 leading-relaxed">Enter the 6-digit code sent to your phone to permanently delete your account.</p>
              
              <div className="mb-8 text-left">
                <label className="block font-bold text-white text-sm mb-2">OTP Code</label>
                <input 
                  type="text"
                  maxLength={6}
                  className="w-full border-2 border-white rounded-[16px] p-4 text-center tracking-[0.5em] font-black outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.2)] bg-white/10 text-white placeholder-white/30 transition-all"
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-white/20 text-white font-bold rounded-[16px] border-2 border-transparent hover:bg-white/30 transition-colors" onClick={() => { setIsDeleteModalOpen(false); setDeleteStep(1); }}>Cancel</button>
                <button 
                  className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-[16px] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] border-2 border-slate-900 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                  disabled={deleteOtp.length !== 6 || isDeleting}
                  onClick={handleDeleteConfirm}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
