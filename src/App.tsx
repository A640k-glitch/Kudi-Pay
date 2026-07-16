import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './lib/services/authService';
import { DocumentTitleUpdater } from './components/DocumentTitleUpdater';
import LoadingProgress from './components/ui/LoadingProgress';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/dashboard')) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Synchronous loading for Landing Page for instant loading
import { LandingPage } from './pages/LandingPage';

// Lazy Load Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const VerifyPage = lazy(() => import('./pages/auth/VerifyPage'));

// Lazy Load Onboarding Pages
const BusinessProfilePage = lazy(() => import('./pages/onboarding/BusinessProfilePage'));
const StorefrontSetupPage = lazy(() => import('./pages/onboarding/StorefrontSetupPage'));
const FirstProductPage = lazy(() => import('./pages/onboarding/FirstProductPage'));

// Lazy Load Dashboard Pages
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'));
const ProductsPage = lazy(() => import('./pages/dashboard/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const AccountPage = lazy(() => import('./pages/dashboard/AccountPage'));
const TrustScorePage = lazy(() => import('./pages/dashboard/TrustScorePage'));
const LoansPage = lazy(() => import('./pages/dashboard/LoansPage'));
const WhatsAppBotPage = lazy(() => import('./pages/dashboard/WhatsAppBotPage'));
const ThemesPage = lazy(() => import('./pages/dashboard/ThemesPage'));

// Lazy Load Storefront Pages
const StoreLayout = lazy(() => import('./pages/store/StoreLayout'));
const StoreHomePage = lazy(() => import('./pages/store/StoreHomePage'));
const CartPage = lazy(() => import('./pages/store/CartPage'));
const CheckoutPage = lazy(() => import('./pages/store/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/store/ConfirmationPage'));

// Lazy Load Product Info Pages
const StorefrontsInfoPage = lazy(() => import('./pages/product/StorefrontsInfoPage').then(m => ({ default: m.StorefrontsInfoPage })));
const TrustScoreInfoPage = lazy(() => import('./pages/product/TrustScoreInfoPage').then(m => ({ default: m.TrustScoreInfoPage })));
const BusinessLoansInfoPage = lazy(() => import('./pages/product/BusinessLoansInfoPage').then(m => ({ default: m.BusinessLoansInfoPage })));

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
      <DocumentTitleUpdater />
      <ScrollToTop />
      <Suspense fallback={<LoadingProgress />}>
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
      </Suspense>
    </Router>
  );
}
