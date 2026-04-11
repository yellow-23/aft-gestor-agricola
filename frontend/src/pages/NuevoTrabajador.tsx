import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createTrabajador } from '../api/client';
import { Layout } from '../components/Layout';

export function NuevoTrabajadorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombres: '', apellidos: '', rut: '',
    nacionalidad: 'Chilena', direccion: '',
    fecha_nacimiento: '', sexo: 'M' as 'M' | 'F',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createTrabajador(form);
      navigate(`/contratos/nuevo?trabajador=${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn-icon" onClick={() => navigate('/trabajadores')} id="btn-back">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 24 }}>Nuevo trabajador</h1>
            <p className="page-sub">Al guardar podrás crear el contrato de inmediato</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 680, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-section">
            <div className="form-section-title">Datos personales</div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="nombres">Nombres *</label>
                <input id="nombres" type="text" placeholder="Ej: Carlos Andrés" value={form.nombres} onChange={e => set('nombres', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="apellidos">Apellidos *</label>
                <input id="apellidos" type="text" placeholder="Ej: González Pérez" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="rut">RUT *</label>
                <input id="rut" type="text" placeholder="12.345.678-9" value={form.rut} onChange={e => set('rut', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="nacionalidad">Nacionalidad</label>
                <select id="nacionalidad" value={form.nacionalidad} onChange={e => set('nacionalidad', e.target.value)}>
                  {['Chilena','Peruana','Boliviana','Colombiana','Venezolana','Argentina','Ecuatoriana','Haitiana','Otra'].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="fecha-nac">Fecha de nacimiento *</label>
                <input id="fecha-nac" type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} required max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field">
                <label htmlFor="sexo">Sexo *</label>
                <select id="sexo" value={form.sexo} onChange={e => set('sexo', e.target.value as 'M' | 'F')}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="field form-full">
                <label htmlFor="direccion">Dirección *</label>
                <input id="direccion" type="text" placeholder="Av. Principal 123, Curicó" value={form.direccion} onChange={e => set('direccion', e.target.value)} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/trabajadores')}>
              Cancelar
            </button>
            <button id="btn-guardar" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Guardando...</> : 'Guardar y crear contrato →'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
