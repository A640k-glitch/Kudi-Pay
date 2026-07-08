import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Banknote, TrendingUp } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';

export default function BusinessLoansInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/"><Logo className="h-8" /></Link>
          <Link to="/signup">
            <button className="px-5 py-2 bg-[#1E1B4B] text-white text-sm font-semibold rounded-lg hover:bg-[#111827] transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E1B4B] tracking-tight mb-6">
            Business Loans & Overdrafts
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Capital that scales with your ambition. Stop waiting in queues and start accessing instant credit based on your actual business performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <Banknote className="w-10 h-10 text-emerald-600 mb-6" />
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-3">Instant Disbursement</h3>
            <p className="text-gray-600 leading-relaxed">
              Once your Trust Score reaches the required threshold, credit facilities unlock automatically. 
              Request an overdraft and receive the funds in your wallet instantly. No paperwork, no hassle.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <TrendingUp className="w-10 h-10 text-indigo-600 mb-6" />
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-3">Fair, Data-Driven Limits</h3>
            <p className="text-gray-600 leading-relaxed">
              Your loan limits grow as your business grows. Because Kudi tracks your storefront sales and ledger entries, 
              we can offer highly competitive rates tailored exactly to your revenue capabilities.
            </p>
          </div>
        </div>

        <div className="bg-[#1E1B4B] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Unlock Capital Faster</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto">The sooner you start selling with Kudi, the sooner your Trust Score unlocks capital.</p>
          <Link to="/signup">
            <button className="h-12 px-8 bg-white text-[#1E1B4B] rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
              Open Your Storefront <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
