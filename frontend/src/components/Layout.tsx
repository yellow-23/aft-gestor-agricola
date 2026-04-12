import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, FileText, Building2, Sprout, Plus } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/trabajadores', label: 'Trabajadores', icon: Users },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/fundos', label: 'Empresas', icon: Building2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* TOP HEADER */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-dot">
            <Sprout size={16} color="#020c07" />
          </div>
          Alberto
        </div>

        <nav className="header-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-right">
          <button
            id="btn-nuevo-contrato-header"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/contratos/nuevo')}
          >
            <Plus size={13} /> Nuevo contrato
          </button>
          <button
            id="logout-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate('/login'); }}
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="fade">
        {children}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
