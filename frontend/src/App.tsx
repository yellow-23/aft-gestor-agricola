import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { TrabajadoresPage } from './pages/Trabajadores';
import { NuevoTrabajadorPage } from './pages/NuevoTrabajador';
import { ContratosPage } from './pages/Contratos';
import { NuevoContratoPage } from './pages/NuevoContrato';
import { FundosPage } from './pages/Fundos';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 12, color: 'var(--text-muted)'
    }}>
      <div className="spinner" />
      Cargando...
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/trabajadores" element={<PrivateRoute><TrabajadoresPage /></PrivateRoute>} />
      <Route path="/trabajadores/nuevo" element={<PrivateRoute><NuevoTrabajadorPage /></PrivateRoute>} />
      <Route path="/contratos" element={<PrivateRoute><ContratosPage /></PrivateRoute>} />
      <Route path="/contratos/nuevo" element={<PrivateRoute><NuevoContratoPage /></PrivateRoute>} />
      <Route path="/fundos" element={<PrivateRoute><FundosPage /></PrivateRoute>} />
      <Route path="/fundos/nuevo" element={<PrivateRoute><FundosPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
