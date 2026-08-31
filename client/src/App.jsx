import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import CategoryList from './components/categories/CategoryList';
import ProductList from './components/products/ProductList';
import PurchaseList from './components/purchases/PurchaseList';
import SalesList from './components/sales/SalesList';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={
            token ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <CategoryList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ProductList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/purchases" element={
            <ProtectedRoute>
              <Layout>
                <PurchaseList />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute>
              <Layout>
                <SalesList />
              </Layout>
            </ProtectedRoute>
          } />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;