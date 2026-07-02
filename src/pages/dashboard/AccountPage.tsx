import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, LogOut, Trash2, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../../lib/services/authService';
import { businessService } from '../../lib/services/businessService';
import { Business } from '../../lib/types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/FormInputs';
import { useToast } from '../../components/Toast';

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
      if (b) setBusiness(b);
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
    return p.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** ****');
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
    <div className="p-3 md:p-4 max-w-2xl mx-auto pb-24 md:pb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Account</h1>
        <p className="text-gray-500">Manage your account and security.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-0.5">Phone Number</div>
            <div className="font-semibold text-gray-900 text-lg">{maskPhone(phone)}</div>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 shadow-sm ${business.kycTier === 1 ? 'bg-gradient-to-br from-green-50 to-white border-green-200' : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${business.kycTier === 1 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {business.kycTier === 1 ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {business.kycTier === 1 ? 'Tier 1 — Verified' : 'Tier 0 — Unverified'}
                </h3>
                <p className="text-sm text-gray-500">
                  {business.kycTier === 1 ? 'You can accept payments and build credit.' : 'Basic selling limits apply.'}
                </p>
              </div>
            </div>
          </div>
          
          {business.kycTier === 0 ? (
            <div className="border-t border-orange-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Verify your identity to unlock payments and credit features.
              </p>
              <Button onClick={() => setIsVerificationOpen(true)} className="w-full sm:w-auto shrink-0">Start Verification</Button>
            </div>
          ) : (
            <div className="border-t border-green-100 pt-4 flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Verified
            </div>
          )}
        </div>

        <div className="pt-8 space-y-4">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left font-medium shadow-sm"
          >
            <span className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-400" />
              Log Out
            </span>
          </button>

          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors text-left font-medium text-destructive shadow-sm"
          >
            <span className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </span>
          </button>
        </div>
      </div>

      {/* Verification Flow Modal */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-12 flex flex-col min-h-screen">
            <div className="flex items-center justify-between mb-6">
              <div className="text-primary font-bold text-2xl tracking-tight">CODA</div>
              {verifyStep < 5 && (
                <button onClick={() => setIsVerificationOpen(false)} className="text-gray-400 hover:text-gray-600 font-medium">Cancel</button>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {verifyStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Let's verify your identity</h2>
                  <p className="text-lg text-gray-600 mb-6">To keep your money safe and unlock payments, we need to confirm who you are. This only takes a couple of minutes.</p>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <span className="text-gray-700">Accept payments directly from customers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <span className="text-gray-700">Start building your credit score</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                      <span className="text-gray-700">Get eligible for business loans as you grow</span>
                    </li>
                  </ul>
                  <Button className="w-full h-12 text-lg" onClick={() => setVerifyStep(2)}>Continue</Button>
                </div>
              )}

              {verifyStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter your BVN</h2>
                  <p className="text-gray-600 mb-6">We use this to verify your identity. It does not give us access to your bank account.</p>
                  
                  <div className="space-y-6">
                    <Input 
                      label="Bank Verification Number" 
                      placeholder="11-digit BVN" 
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                    />
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      💡 Tip: You can find your BVN by dialing <strong>*565*0#</strong> from your bank-registered phone number.
                    </p>
                    
                    <Button 
                      className="w-full h-12" 
                      disabled={!isBvnValid || isVerifying}
                      onClick={() => {
                        setIsVerifying(true);
                        setTimeout(() => {
                          setIsVerifying(false);
                          setVerifyStep(3);
                        }, 1500);
                      }}
                    >
                      {isVerifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying with your bank...</> : 'Continue'}
                    </Button>
                  </div>
                </div>
              )}

              {verifyStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter your NIN</h2>
                  <p className="text-gray-600 mb-6">Almost done. We need your National Identity Number as required by law.</p>
                  
                  <div className="space-y-6">
                    <Input 
                      label="National Identity Number" 
                      placeholder="11-digit NIN" 
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                    />
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      💡 Tip: Found on your NIN slip or National ID card.
                    </p>
                    
                    <Button 
                      className="w-full h-12" 
                      disabled={!isNinValid || isVerifying}
                      onClick={() => {
                        setIsVerifying(true);
                        setTimeout(() => {
                          setIsVerifying(false);
                          setVerifyStep(4);
                        }, 1500);
                      }}
                    >
                      {isVerifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirming your identity...</> : 'Continue'}
                    </Button>
                  </div>
                </div>
              )}

              {verifyStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Step</h2>
                  <p className="text-gray-600 mb-6">Please review and consent to complete verification.</p>
                  
                  <div className="space-y-8">
                    <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        I consent to CODA verifying my identity using my BVN and NIN for account verification and regulatory compliance purposes. I have read and agree to the <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                      </div>
                    </label>
                    
                    <Button 
                      className="w-full h-12" 
                      disabled={!consent || isVerifying}
                      onClick={handleVerifySubmit}
                    >
                      {isVerifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Completing verification...</> : 'Complete Verification'}
                    </Button>
                  </div>
                </div>
              )}

              {verifyStep === 5 && (
                <div className="animate-in zoom-in-95 duration-500 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">You're verified!</h2>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 text-green-700 font-semibold mb-6">
                    Tier 1 — Verified
                  </div>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Your identity has been confirmed. You are now ready to accept payments and start building your business credit.
                  </p>
                  <Button 
                    className="w-full h-12" 
                    onClick={() => {
                      setIsVerificationOpen(false);
                      setVerifyStep(1);
                    }}
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout & Delete Modals */}
      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)}>
        <div className="py-4 text-center">
          <h3 className="text-xl font-bold mb-2">Log out?</h3>
          <p className="text-gray-500 mb-6">You will need to verify your phone number to log back in.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="py-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-destructive flex items-center justify-center mb-4 mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-center mb-2">Delete Account?</h3>
          <p className="text-gray-500 text-center mb-6">This action cannot be undone. Your storefront and all products will be permanently removed.</p>
          
          <div className="mb-6">
            <Input 
              label="Type DELETE to confirm" 
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              className="flex-1" 
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
