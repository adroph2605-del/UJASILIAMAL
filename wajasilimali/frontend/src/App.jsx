import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useBranch } from './contexts/BranchContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Debtors from './pages/Debtors';
import Admin from './pages/Admin';
import Branches from './pages/Branches';
import Terms from './pages/Terms';
import OfflineBanner from './components/OfflineBanner';
import { useTranslation } from 'react-i18next';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Ukibadilisha duka (branchId), key inabadilika → React inapakia ukurasa upya.
 * Hivyo Dashboard / Stoki / POS / Madeni hupata data ya duka hilo — bila refetch ngumu.
 */
function AppLayout({ children }) {
  const { branchId } = useBranch();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineBanner />
      <Navbar />
      <main key={branchId ?? 'no-branch'}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <AppLayout>
              <Inventory />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <AppLayout>
              <POS />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/debtors"
        element={
          <PrivateRoute>
            <AppLayout>
              <Debtors />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/branches"
        element={
          <PrivateRoute>
            <AppLayout>
              <Branches />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AppLayout>
              <Admin />
            </AppLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
