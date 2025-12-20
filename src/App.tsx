import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Collaborators } from './pages/Collaborators';
import { JoinBusiness } from './pages/JoinBusiness';

import { StatusBar, Style } from '@capacitor/status-bar';
import { DataProvider, useData } from './context/DataContext';
import { StorageService } from './services/StorageService';
import { NotificationProvider } from './context/NotificationContext';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { BusinessSetup } from './pages/BusinessSetup';
import { Products } from './pages/Products';
import { AddEditProduct } from './pages/AddEditProduct';
import { AddSale } from './pages/AddSale';
import { SalesHistory } from './pages/History';
import { Settings } from './pages/Settings';
import { BackupSettings } from './pages/BackupSettings';
import { HowItWorks } from './pages/HowItWorks';
import { Expenses } from './pages/Expenses';
import { TaxCalculator } from './pages/TaxCalculator';
import { CompanyProfile } from './pages/CompanyProfile';
import { TransactionPin } from './pages/TransactionPin';
import { DataConsolidationModal } from './components/ui/DataConsolidationModal';
import { ExpenseCategories } from './pages/ExpenseCategories';
import { Notifications } from './pages/Notifications';
import { NotificationSettings } from './pages/NotificationSettings';
import { ExpenseAdvice } from './pages/ExpenseAdvice';
import { AddBusiness } from './pages/AddBusiness';
import { UpgradePage } from './pages/UpgradePage';

import { Login } from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DialogProvider } from './context/DialogContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { GoogleOAuthProvider } from '@react-oauth/google';

function AppRoutes() {
  const { business } = useData();
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Configure Status Bar
    const configStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Light }); // Light = Dark Text
        await StatusBar.setBackgroundColor({ color: '#ffffff' }); // Blended with white background
      } catch (e) {
        console.warn('Status Bar not available');
      }
    };
    configStatusBar();

    // Handle Hardware Back Button
    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        const isHome = location.pathname === '/';
        if (!isHome) {
          navigate('/');
        } else {
          CapacitorApp.exitApp();
        }
      }
    });

    return () => {
      backListener.then(handle => handle.remove());
    }
  }, [navigate, location]);

  // Onboarding Guard: Only skip if explicitly persisted or current business is complete
  const onboardingPersisted = StorageService.load('app_onboarding_completed', false);
  const isLoginPage = location.pathname === '/login';

  if (!business.onboardingCompleted && !onboardingPersisted && !isLoginPage) {
    if (showSetup) {
      return <BusinessSetup onComplete={() => {
        StorageService.save('app_onboarding_completed', true);
        window.location.reload();
      }} />;
    }
    return <Onboarding onComplete={() => setShowSetup(true)} />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/notifications/settings" element={<NotificationSettings />} />
        <Route path="/advice/expense-reduction" element={<ExpenseAdvice />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddEditProduct />} />
        <Route path="/products/edit/:id" element={<AddEditProduct />} />
        <Route path="/add-sale" element={<AddSale />} />
        <Route path="/add-business" element={<AddBusiness />} />
        <Route path="/history" element={<SalesHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/backup" element={<BackupSettings />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/settings/tax-calculator" element={<TaxCalculator />} />
        <Route path="/settings/company-profile" element={<CompanyProfile />} />
        <Route path="/settings/transaction-pin" element={<TransactionPin />} />
        <Route path="/settings/expense-categories" element={<ExpenseCategories />} />
        <Route path="/settings/guide" element={<HowItWorks />} />
        <Route path="/collaborators" element={<Collaborators />} />
        <Route path="/join-business" element={<JoinBusiness />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DataConsolidationModal />
    </>
  );
}

function App() {
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      // console.warn('⚠️ VITE_GOOGLE_CLIENT_ID is missing...'); // Suppressed
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== "") ? import.meta.env.VITE_GOOGLE_CLIENT_ID : "740425791784-9fjocgu3er172e39uohspf1udq6e0are.apps.googleusercontent.com"}>
      <ErrorBoundary>
        <ToastProvider>
          <DialogProvider>
            <AuthProvider>
              <DataProvider>
                <NotificationProvider>
                  <HashRouter>
                    <AppRoutes />
                  </HashRouter>
                </NotificationProvider>
              </DataProvider>
            </AuthProvider>
          </DialogProvider>
        </ToastProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
