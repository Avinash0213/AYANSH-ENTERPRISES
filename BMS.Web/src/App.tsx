import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Renewals from './pages/Renewals';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import SataraVisits from './pages/SataraVisits';
import Layout from './components/Layout';

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { isAuthenticated, can, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/customers" replace /> : <Login />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/renewals" element={<ProtectedRoute permission="RENEWAL_VIEW"><Renewals /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute permission="PAYMENT_VIEW"><Payments /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute permission="REPORT_VIEW"><Reports /></ProtectedRoute>} />
      <Route path="/satara-visits" element={<ProtectedRoute permission="SATARA_VIEW"><SataraVisits /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute permission="USER_VIEW"><UsersPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
