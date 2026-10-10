import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, Lock, User, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Sprout size={34} />
          </div>
          <div>
            <h1>Alberto</h1>
            <p>Sistema de contratación agrícola</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="login-username">Usuario</label>
            <div className="input-icon">
              <User size={20} />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="input-icon">
              <Lock size={20} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner" /> Ingresando...</> : <>Ingresar <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className="login-foot">Acceso privado · AFT Servicios SpA</p>
      </div>
    </div>
  );
}
