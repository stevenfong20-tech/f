import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LanguageProvider } from '@/lib/LanguageContext';
import Layout from '@/components/Layout';
import SupplierDashboard from '@/pages/SupplierDashboard';
import OrdersPage from '@/pages/OrdersPage';
import ProductsPage from '@/pages/ProductsPage';
import BranchesPage from '@/pages/BranchesPage';
import NewOrderPage from '@/pages/NewOrderPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import SettingsPage from '@/pages/SettingsPage';
import { Toaster as Sonner } from 'sonner';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, redirectToLogin, setRedirectToLogin } = useAuth();

  if (redirectToLogin) {
    setRedirectToLogin(false);
    return <Navigate to="/login" replace />;
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const isSupplier = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        {isSupplier ? (
          <>
            <Route path="/" element={<SupplierDashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<NewOrderPage />} />
            <Route path="/new-order" element={<NewOrderPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        )}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <Sonner richColors position="top-right" />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
