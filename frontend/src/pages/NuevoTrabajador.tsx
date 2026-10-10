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
        <div className="page-head">
          <div className="page-back">
            <button className="btn-icon" onClick={() => navigate('/trabajadores')} id="btn-back" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">Nuevo trabajador</h1>
              <p className="page-sub" style={{ marginTop: 2 }}>Al guardar podrás crear el contrato de inmediato.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ maxWidth: 'var(--size-form)' }}>
          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="form-section">
            <div className="form-section-title"><span className="num">1</span>Datos personales</div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="nombres">Nombres<span className="req">*</span></label>
                <input id="nombres" type="text" placeholder="Ej: Carlos Andrés" value={form.nombres} onChange={e => set('nombres', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="apellidos">Apellidos<span className="req">*</span></label>
                <input id="apellidos" type="text" placeholder="Ej: González Pérez" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} required />
              </div>
              <div className="field input-mono">
                <label htmlFor="rut">RUT<span className="req">*</span></label>
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
                <label htmlFor="fecha-nac">Fecha de nacimiento<span className="req">*</span></label>
                <input id="fecha-nac" type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} required max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field">
                <label htmlFor="sexo">Sexo<span className="req">*</span></label>
                <select id="sexo" value={form.sexo} onChange={e => set('sexo', e.target.value as 'M' | 'F')}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="field form-full">
                <label htmlFor="direccion">Dirección<span className="req">*</span></label>
                <input id="direccion" type="text" placeholder="Av. Principal 123, Curicó" value={form.direccion} onChange={e => set('direccion', e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/trabajadores')}>
              Cancelar
            </button>
            <button id="btn-guardar" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Guardando...</> : 'Guardar y crear contrato'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
