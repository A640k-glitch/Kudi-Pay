import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';

export default function TrustScoreInfoPage() {
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
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E1B4B] tracking-tight mb-6">
            The Kudi Trust Score
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your verifiable business reputation. Built automatically as you trade, designed to unlock financial opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <BarChart3 className="w-10 h-10 text-indigo-600 mb-6" />
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-3">Automated Growth</h3>
            <p className="text-gray-600 leading-relaxed">
              You don't need to manually build your score. Every storefront sale, every logged expense, and every completed KYC tier automatically feeds into our algorithmic trust engine.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mb-6" />
            <h3 className="text-2xl font-bold text-[#1E1B4B] mb-3">Bank-Grade Verification</h3>
            <p className="text-gray-600 leading-relaxed">
              Because your score is tied directly to real revenue and BVN/NIN verified identities, financial institutions trust it. 
              A high Trust Score is your passport to business capital.
            </p>
          </div>
        </div>

        <div className="bg-[#1E1B4B] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start building your score today</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto">Open your store and let your trading history work for you.</p>
          <Link to="/signup">
            <button className="h-12 px-8 bg-white text-[#1E1B4B] rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
