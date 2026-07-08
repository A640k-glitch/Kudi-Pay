import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const DocumentTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    let title = 'Kudi';
    
    if (path === '/') {
      title = 'Home - Kudi';
    } else if (path.startsWith('/dashboard/orders')) {
      title = 'Orders - Kudi';
    } else if (path.startsWith('/dashboard/products')) {
      title = 'Products - Kudi';
    } else if (path.startsWith('/dashboard/themes')) {
      title = 'Themes - Kudi';
    } else if (path.startsWith('/dashboard/trust')) {
      title = 'Trust Score - Kudi';
    } else if (path.startsWith('/dashboard/loans')) {
      title = 'Loans - Kudi';
    } else if (path.startsWith('/dashboard/whatsapp')) {
      title = 'Assistant - Kudi';
    } else if (path.startsWith('/dashboard/account')) {
      title = 'Account - Kudi';
    } else if (path.startsWith('/dashboard/settings')) {
      title = 'Settings - Kudi';
    } else if (path.startsWith('/dashboard')) {
      title = 'Dashboard - Kudi';
    } else if (path.startsWith('/store/')) {
      title = 'Checkout - Kudi';
    } else if (path.startsWith('/signup')) {
      title = 'Sign Up - Kudi';
    } else if (path.startsWith('/login')) {
      title = 'Log In - Kudi';
    } else if (path.startsWith('/verify')) {
      title = 'Verify Device - Kudi';
    } else if (path.startsWith('/onboarding/storefront')) {
      title = 'Store Setup - Kudi';
    } else if (path.startsWith('/product/storefronts')) {
      title = 'Instant Storefronts - Kudi';
    } else if (path.startsWith('/product/loans')) {
      title = 'Business Loans - Kudi';
    } else if (path.startsWith('/product/trust-score')) {
      title = 'Trust Score - Kudi';
    } else if (path.startsWith('/onboarding/business')) {
      title = 'Business Identity - Kudi';
    }

    document.title = title;
  }, [location]);

  return null;
};
