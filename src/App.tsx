import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './lib/services/authService';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/dashboard')) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Auth Pages
import LandingPage from './pages/LandingPage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import SignupPage from './pages/auth/SignupPage.tsx';
import VerifyPage from './pages/auth/VerifyPage.tsx';

// Onboarding Pages
import BusinessProfilePage from './pages/onboarding/BusinessProfilePage.tsx';
import StorefrontSetupPage from './pages/onboarding/StorefrontSetupPage.tsx';
import FirstProductPage from './pages/onboarding/FirstProductPage.tsx';

// Dashboard Pages
import DashboardLayout from './pages/dashboard/DashboardLayout.tsx';
import DashboardOverview from './pages/dashboard/DashboardOverview.tsx';
import ProductsPage from './pages/dashboard/ProductsPage.tsx';
import OrdersPage from './pages/dashboard/OrdersPage.tsx';
import SettingsPage from './pages/dashboard/SettingsPage.tsx';
import AccountPage from './pages/dashboard/AccountPage.tsx';
import TrustScorePage from './pages/dashboard/TrustScorePage.tsx';
import LoansPage from './pages/dashboard/LoansPage.tsx';
import WhatsAppBotPage from './pages/dashboard/WhatsAppBotPage.tsx';
import ThemesPage from './pages/dashboard/ThemesPage.tsx';

// Storefront Pages
import StoreLayout from './pages/store/StoreLayout.tsx';
import StoreHomePage from './pages/store/StoreHomePage.tsx';
import CartPage from './pages/store/CartPage.tsx';
import CheckoutPage from './pages/store/CheckoutPage.tsx';
import ConfirmationPage from './pages/store/ConfirmationPage.tsx';

// Product Info Pages
import StorefrontsInfoPage from './pages/product/StorefrontsInfoPage.tsx';
import TrustScoreInfoPage from './pages/product/TrustScoreInfoPage.tsx';
import BusinessLoansInfoPage from './pages/product/BusinessLoansInfoPage.tsx';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const phone = authService.getCurrentPhone();
  const location = useLocation();

  if (!phone) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Product Info Pages */}
        <Route path="/product/storefronts" element={<StorefrontsInfoPage />} />
        <Route path="/product/trust-score" element={<TrustScoreInfoPage />} />
        <Route path="/product/loans" element={<BusinessLoansInfoPage />} />
        
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />

        {/* Onboarding */}
        <Route path="/onboarding/business" element={<ProtectedRoute><BusinessProfilePage /></ProtectedRoute>} />
        <Route path="/onboarding/storefront" element={<ProtectedRoute><StorefrontSetupPage /></ProtectedRoute>} />
        <Route path="/onboarding/first-product" element={<ProtectedRoute><FirstProductPage /></ProtectedRoute>} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="themes" element={<ThemesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="trust" element={<TrustScorePage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="whatsapp" element={<WhatsAppBotPage />} />
        </Route>

        {/* Storefront */}
        <Route path="/store/:slug" element={<StoreLayout />}>
          <Route index element={<StoreHomePage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="confirmation/:orderId" element={<ConfirmationPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-500 mb-8">Page not found</p>
              <a href="/" className="text-primary font-medium hover:underline">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
