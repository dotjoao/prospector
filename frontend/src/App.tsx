import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
