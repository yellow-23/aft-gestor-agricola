import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { getTrabajadores, deleteTrabajador } from '../api/client';
import type { Trabajador } from '../api/types';
import { Layout } from '../components/Layout';

export function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const cargar = (q?: string) => {
    setLoading(true);
    getTrabajadores(q || undefined)
      .then(r => setTrabajadores(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuscar(e.target.value);
    cargar(e.target.value);
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    setDeleting(id);
    try {
      await deleteTrabajador(id);
      cargar(buscar);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Layout>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Trabajadores</h1>
            <p className="page-sub">{trabajadores.length} registrado{trabajadores.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search" style={{ width: 260 }}>
              <Search size={14} />
              <input
                id="buscar-trabajador"
                type="text"
                placeholder="Nombre o RUT..."
                value={buscar}
                onChange={handleSearch}
              />
            </div>
            <Link to="/trabajadores/nuevo" className="btn btn-primary" id="btn-nuevo-trabajador">
              <Plus size={14} /> Nuevo
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ marginTop: 48 }}><div className="spinner" /> Cargando...</div>
        ) : trabajadores.length === 0 ? (
          <div className="empty" style={{ marginTop: 24 }}>
            <div className="empty-icon"><Users size={24} /></div>
            <h3>{buscar ? 'Sin resultados' : 'Sin trabajadores'}</h3>
            <p>{buscar ? `Nada para "${buscar}"` : 'Registra el primer trabajador para comenzar.'}</p>
            {!buscar && (
              <Link to="/trabajadores/nuevo" className="btn btn-primary" style={{ marginTop: 4 }}>
                <Plus size={14} /> Agregar
              </Link>
            )}
          </div>
        ) : (
          <div className="workers-grid">
            {trabajadores.map(t => (
              <div key={t.id} className="worker-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className={`worker-avatar ${t.sexo === 'F' ? 'f' : ''}`}>
                    {t.nombres[0]}{t.apellidos[0]}
                  </div>
                  <div>
                    <div className="worker-name">{t.nombre_completo}</div>
                    <div className="worker-rut">{t.rut}</div>
                  </div>
                </div>

                <div className="worker-meta">
                  <span className={`badge ${t.nacionalidad === 'Chilena' ? 'badge-green' : 'badge-amber'}`}>
                    {t.nacionalidad}
                  </span>
                  <span className="badge badge-cyan">
                    {t.sexo === 'M' ? 'Masculino' : 'Femenino'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>📍</span> {t.direccion}
                </div>

                <div className="worker-actions">
                  <Link
                    to={`/contratos/nuevo?trabajador=${t.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    title="Crear contrato"
                    id={`btn-contrato-${t.id}`}
                  >
                    <ChevronRight size={13} /> Contrato
                  </Link>
                  <Link to={`/trabajadores/${t.id}/editar`} className="btn-icon" title="Editar">
                    <Pencil size={14} />
                  </Link>
                  <button
                    className="btn-icon"
                    title="Desactivar"
                    onClick={() => handleDelete(t.id, t.nombre_completo)}
                    disabled={deleting === t.id}
                    id={`btn-delete-${t.id}`}
                  >
                    {deleting === t.id
                      ? <div className="spinner" style={{ width: 14, height: 14 }} />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
