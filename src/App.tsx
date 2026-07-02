import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authService } from './lib/services/authService';

// Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyPage from './pages/auth/VerifyPage';

// Onboarding Pages
import BusinessProfilePage from './pages/onboarding/BusinessProfilePage';
import StorefrontSetupPage from './pages/onboarding/StorefrontSetupPage';
import FirstProductPage from './pages/onboarding/FirstProductPage';

// Dashboard Pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import ProductsPage from './pages/dashboard/ProductsPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AccountPage from './pages/dashboard/AccountPage';

// Storefront Pages
import StoreLayout from './pages/store/StoreLayout';
import StoreHomePage from './pages/store/StoreHomePage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import ConfirmationPage from './pages/store/ConfirmationPage';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
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
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        {/* Storefront */}
        <Route path="/store/:slug" element={<StoreLayout />}>
          <Route index element={<StoreHomePage />} />
          <Route path="cart" element={<CartPage />} />
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
