import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, FileText, Building2, Sprout, Plus, ClipboardList, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/trabajadores', label: 'Trabajadores', icon: Users },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/ficha-packing', label: 'Ficha packing', icon: ClipboardList },
  { to: '/fundos', label: 'Empresas', icon: Building2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-dot">
            <Sprout size={20} />
          </div>
          Alberto
        </div>

        <nav className="header-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-right">
          <button
            id="btn-nuevo-contrato-header"
            className="btn btn-primary btn-sm hide-sm"
            onClick={() => navigate('/contratos/nuevo')}
          >
            <Plus size={16} /> Nuevo contrato
          </button>
          <button
            id="logout-btn"
            className="btn-icon"
            onClick={() => { logout(); navigate('/login'); }}
            aria-label="Salir"
            title="Salir"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div>{children}</div>

      <nav className="mobile-nav">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={24} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
