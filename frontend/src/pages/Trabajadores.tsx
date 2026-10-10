import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, Trash2, FileText, MapPin } from 'lucide-react';
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
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Trabajadores</h1>
            <p className="page-sub">{trabajadores.length} registrado{trabajadores.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="row">
            <div className="search" style={{ width: 280 }}>
              <Search size={20} />
              <input
                id="buscar-trabajador"
                type="text"
                placeholder="Nombre o RUT…"
                aria-label="Buscar trabajador"
                value={buscar}
                onChange={handleSearch}
              />
            </div>
            <Link to="/trabajadores/nuevo" className="btn btn-primary" id="btn-nuevo-trabajador">
              <Plus size={20} /> Nuevo
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /> Cargando...</div>
        ) : trabajadores.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Users size={24} /></div>
            <h3>{buscar ? 'Sin resultados' : 'Sin trabajadores'}</h3>
            <p>{buscar ? `Nada para "${buscar}".` : 'Registra el primer trabajador para comenzar.'}</p>
            {!buscar && (
              <Link to="/trabajadores/nuevo" className="btn btn-primary">
                <Plus size={20} /> Agregar trabajador
              </Link>
            )}
          </div>
        ) : (
          <div className="workers-grid">
            {trabajadores.map(t => (
              <article key={t.id} className="worker-card">
                <div className="worker-head">
                  <div className="avatar" aria-hidden="true">{t.nombres[0]}{t.apellidos[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="worker-name">{t.nombre_completo}</div>
                    <div className="worker-rut">{t.rut}</div>
                  </div>
                </div>

                <div className="worker-meta">
                  <span className={`badge ${t.nacionalidad === 'Chilena' ? 'badge-green' : 'badge-amber'}`}>
                    {t.nacionalidad}
                  </span>
                  <span className="badge badge-neutral">{t.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                </div>

                <div className="meta-line"><MapPin size={16} />{t.direccion}</div>

                <div className="worker-actions">
                  <Link
                    to={`/contratos/nuevo?trabajador=${t.id}`}
                    className="btn btn-primary"
                    id={`btn-contrato-${t.id}`}
                  >
                    <FileText size={16} /> Contrato
                  </Link>
                  <button
                    className="btn-icon danger"
                    aria-label={`Desactivar a ${t.nombre_completo}`}
                    title="Desactivar"
                    onClick={() => handleDelete(t.id, t.nombre_completo)}
                    disabled={deleting === t.id}
                    id={`btn-delete-${t.id}`}
                  >
                    {deleting === t.id ? <div className="spinner" /> : <Trash2 size={20} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
