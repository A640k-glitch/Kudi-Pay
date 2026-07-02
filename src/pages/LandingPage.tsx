import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, ShieldCheck, Zap, Smartphone, CheckCircle2, TrendingUp, CreditCard } from 'lucide-react';
import { Button } from '../components/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tighter">
            CODA
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Log In
            </Link>
            <Link to="/signup">
              <Button className="h-11 px-6 rounded-full font-medium" variant="primary">
                Create Store
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Launch your store in 5 minutes. <br className="hidden lg:block"/>
              <span className="text-primary">Grow it with CODA Banking.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              The complete platform for Nigerian businesses. Create a storefront, accept payments, and build credit — all from your phone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-lg h-14 px-8 rounded-full" variant="primary">
                  Start Selling Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No coding required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Setup in 5 mins
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Bank-grade security
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-amber-50 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80" 
              alt="CODA Storefront and Payment" 
              className="w-full h-auto rounded-[2.5rem] shadow-2xl border-4 border-white object-cover aspect-[4/3] lg:aspect-square"
            />
          </div>
        </section>

        {/* Trust / Stats Bar */}
        <section className="bg-gray-900 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xl md:text-2xl font-medium text-white tracking-wide">
              Join <span className="text-primary font-bold">10,000+</span> Nigerian businesses powering their growth with CODA.
            </p>
          </div>
        </section>

        {/* How It Works (Bento Box Layout) */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
              <p className="text-lg text-gray-500">Everything you need to sell online, beautifully simplified.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-primary mb-8">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Create your storefront</h3>
                <p className="text-gray-500 leading-relaxed">
                  Sign up with your phone number and pick a name. Upload your products and set prices instantly.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-8">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Share on WhatsApp & Social</h3>
                <p className="text-gray-500 leading-relaxed">
                  Get a custom link for your store. Share it on WhatsApp, Instagram, or anywhere your customers are.
                </p>
              </div>
              
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow md:col-span-1 sm:col-span-2">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-8">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Receive orders & payments</h3>
                <p className="text-gray-500 leading-relaxed">
                  Customers can browse and check out smoothly. You receive the order details and payment directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NEW SECTION: Grow Into Banking */}
        <section className="px-6 py-24 max-w-7xl mx-auto w-full flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              More than just a store. <br />
              <span className="text-primary">It's your financial foundation.</span>
            </h2>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              As you sell on CODA, you automatically build a verifiable business history. Unlock access to business loans, higher transaction limits, and premium banking features designed specifically for growing merchants.
            </p>
            <ul className="space-y-5 text-left max-w-md mx-auto lg:mx-0">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Build Credit Automatically</h4>
                  <p className="text-sm text-gray-500 mt-1">Every sale counts towards your CODA credit score.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Business Loans</h4>
                  <p className="text-sm text-gray-500 mt-1">Access capital to buy inventory and grow your business.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-gray-100 rounded-[3rem] transform -rotate-3 scale-105 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1580519542036-ed47f3e42d0c?auto=format&fit=crop&w=1000&q=80" 
              alt="CODA Banking and Finance" 
              className="w-full h-auto rounded-[2.5rem] shadow-xl border-4 border-white object-cover aspect-[4/3] lg:aspect-square"
            />
          </div>
        </section>
      </main>

      {/* Dark Footer */}
      <footer className="bg-gray-950 text-gray-300 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* CTA Banner inside Footer */}
          <div className="bg-primary rounded-[2.5rem] p-10 md:p-16 text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to start your journey?</h2>
            <Link to="/signup">
              <Button className="h-14 px-10 rounded-full font-bold text-primary bg-white hover:bg-gray-50 transition-colors border-0">
                Create Your Store
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="text-white font-bold text-2xl tracking-tighter mb-6">CODA</div>
              <p className="text-gray-400 max-w-sm">
                Empowering Nigerian small businesses with the tools to sell online and grow their financial future.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Storefront</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Payments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Banking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Loans</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">KYC/AML Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CODA Marketplace. All rights reserved.</p>
            <p className="mt-4 md:mt-0">Made for Nigerian Businesses</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
