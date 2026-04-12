import { useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, MapPin, X } from 'lucide-react';
import { getFundos, createFundo, deleteFundo, updateFundo } from '../api/client';
import type { Fundo } from '../api/types';
import { Layout } from '../components/Layout';

interface FundoForm {
  nombre: string; direccion: string; representante_legal: string;
  nombre_empresa: string; rut_empresa: string;
}
const defaultForm: FundoForm = {
  nombre: '', direccion: '',
  nombre_empresa: '', rut_empresa: '',
  representante_legal: ''
};

export function FundosPage() {
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fundo | null>(null);
  const [form, setForm] = useState<FundoForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    getFundos().then(r => setFundos(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const abrirModal = (f?: Fundo) => {
    setEditando(f || null);
    setForm(f ? { nombre: f.nombre, direccion: f.direccion, representante_legal: f.representante_legal || '', nombre_empresa: f.nombre_empresa, rut_empresa: f.rut_empresa } : defaultForm);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      editando ? await updateFundo(editando.id, form) : await createFundo(form);
      setShowModal(false); cargar();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try { await deleteFundo(id); cargar(); }
    catch (err: any) { alert(err.response?.data?.detail || 'No se puede eliminar'); }
  };

  return (
    <Layout>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 className="page-title">Empresas</h1>
            <p className="page-sub">Empresas y lugares donde van los trabajadores</p>
          </div>
          <button className="btn btn-primary" onClick={() => abrirModal()} id="btn-nuevo-fundo">
            <Plus size={14} /> Nueva empresa
          </button>
        </div>

        {loading ? (
          <div className="loading-state" style={{ marginTop: 48 }}><div className="spinner" /> Cargando...</div>
        ) : fundos.length === 0 ? (
          <div className="empty" style={{ marginTop: 24 }}>
            <div className="empty-icon"><Building2 size={24} /></div>
            <h3>Sin empresas</h3>
            <p>Crea la primera empresa/lugar de trabajo para poder asignar trabajadores.</p>
            <button className="btn btn-primary" onClick={() => abrirModal()} style={{ marginTop: 12 }}>
              <Plus size={14} /> Crear empresa
            </button>
          </div>
        ) : (
          <div className="fundos-grid">
            {fundos.map(f => (
              <div key={f.id} className="fundo-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="fundo-icon"><Building2 size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="fundo-name">{f.nombre}</div>
                    <div className="fundo-detail"><MapPin size={11} /> {f.direccion}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="fundo-detail"><span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Empresa:</span> {f.nombre_empresa}</div>
                  <div className="fundo-detail" style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--text-2)', fontWeight: 600, fontFamily: 'inherit' }}>RUT:</span> {f.rut_empresa}</div>
                  {f.representante_legal && <div className="fundo-detail"><span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Rep. legal:</span> {f.representante_legal}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-icon" onClick={() => abrirModal(f)} title="Editar" id={`btn-edit-fundo-${f.id}`}><Pencil size={14} /></button>
                  <button className="btn-icon" onClick={() => handleDelete(f.id, f.nombre)} title="Eliminar" id={`btn-del-fundo-${f.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editando ? 'Editar empresa' : 'Nueva empresa'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                <div className="field">
                  <label htmlFor="f-nombre">Lugar de trabajo / Nombre interno *</label>
                  <input id="f-nombre" type="text" placeholder="Ej: Fundo Los Almendros / Faena Central" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
                </div>
                <div className="field">
                  <label htmlFor="f-dir">Dirección *</label>
                  <input id="f-dir" type="text" placeholder="Camino Los Vilos km 5, Curicó" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} required />
                </div>
                <div className="field">
                  <label htmlFor="f-rep">Representante legal</label>
                  <input id="f-rep" type="text" value={form.representante_legal} onChange={e => setForm(f => ({ ...f, representante_legal: e.target.value }))} />
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="f-emp">Nombre empresa</label>
                    <input id="f-emp" type="text" value={form.nombre_empresa} onChange={e => setForm(f => ({ ...f, nombre_empresa: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label htmlFor="f-rut">RUT empresa</label>
                    <input id="f-rut" type="text" value={form.rut_empresa} onChange={e => setForm(f => ({ ...f, rut_empresa: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button id="btn-guardar-fundo" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" /> Guardando...</> : '✓ Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
