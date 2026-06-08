import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';

// Import Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Warehouses } from './pages/Warehouses';
import { InventoryPage } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Reports } from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route wrapper with Role Authorization
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold">Tizim holati tekshirilmoqda...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // If not authorized, redirect to main dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Login route */}
              <Route path="/login" element={<Login />} />

              {/* Main App Layout containing protected sub-routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard: accessible by all roles */}
                <Route
                  index
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Products: Admin and Warehouse Manager */}
                <Route
                  path="products"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <Products />
                    </ProtectedRoute>
                  }
                />

                {/* Warehouses: Admin and Warehouse Manager */}
                <Route
                  path="warehouses"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <Warehouses />
                    </ProtectedRoute>
                  }
                />

                {/* Inventory: Admin and Warehouse Manager */}
                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* Sales & Orders: Admin and Seller */}
                <Route
                  path="sales"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
                      <Sales />
                    </ProtectedRoute>
                  }
                />

                {/* Reports: Admin, Warehouse Manager, Seller */}
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'SELLER']}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch all redirect to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
