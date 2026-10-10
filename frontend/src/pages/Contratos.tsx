import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Archive, Download, Search } from 'lucide-react';
import { getContratos, deleteContrato, downloadPdf } from '../api/client';
import type { Contrato } from '../api/types';
import { Layout } from '../components/Layout';

export function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const cargar = () => {
    setLoading(true);
    getContratos().then(r => setContratos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = buscar
    ? contratos.filter(c =>
        c.trabajador.nombre_completo.toLowerCase().includes(buscar.toLowerCase()) ||
        c.trabajador.rut.includes(buscar) ||
        c.fundo.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
        c.actividad.toLowerCase().includes(buscar.toLowerCase())
      )
    : contratos;

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contrato?')) return;
    setDeleting(id);
    try { await deleteContrato(id); cargar(); }
    finally { setDeleting(null); }
  };

  const handlePdf = async (c: Contrato, tipo: 'todos' | 'contrato' | 'ds44' | 'reglamento' | 'epp') => {
    const nombre = `${c.trabajador.apellidos}_${c.trabajador.nombres}`.replace(/ /g, '_');
    const files = { todos: `Documentos_${nombre}.zip`, contrato: `Contrato_${nombre}.pdf`, ds44: `DSN44_${nombre}.pdf`, reglamento: `Reglamento_${nombre}.pdf`, epp: `EPP_${nombre}.pdf` };
    const key = `${c.id}-${tipo}`;
    setDownloading(key);
    try { await downloadPdf(c.id, tipo, files[tipo]); }
    finally { setDownloading(null); }
  };

  return (
    <Layout>
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Contratos</h1>
            <p className="page-sub">{filtrados.length} contrato{filtrados.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="row">
            <div className="search" style={{ width: 300 }}>
              <Search size={20} />
              <input
                id="buscar-contrato"
                placeholder="Trabajador, empresa, faena…"
                aria-label="Buscar contrato"
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
              />
            </div>
            <Link to="/contratos/nuevo" className="btn btn-primary" id="btn-nuevo-contrato">
              <Plus size={20} /> Nuevo
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /> Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><FileText size={24} /></div>
            <h3>Sin contratos</h3>
            <p>Crea el primer contrato para generar los documentos legales.</p>
            <Link to="/contratos/nuevo" className="btn btn-primary">
              <Plus size={20} /> Crear contrato
            </Link>
          </div>
        ) : (
          <div className="contracts-list">
            {filtrados.map(c => (
              <article key={c.id} className="contract-card">
                <div className="avatar" aria-hidden="true">
                  {c.trabajador.nombres[0]}{c.trabajador.apellidos[0]}
                </div>

                <div className="contract-info">
                  <div className="contract-name">{c.trabajador.nombre_completo}</div>
                  <div className="contract-meta">
                    {c.fundo.nombre} · {c.actividad} ·{' '}
                    {new Date(c.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-CL')}
                  </div>
                </div>

                <div className="contract-amount">${c.sueldo.toLocaleString('es-CL')}</div>

                <div className="contract-pdfs">
                  <button
                    id={`pdf-zip-${c.id}`}
                    className="pdf-pill pdf-pill-all"
                    onClick={() => handlePdf(c, 'todos')}
                    disabled={!!downloading}
                    title="Descargar todo en ZIP"
                  >
                    {downloading === `${c.id}-todos` ? <span className="spinner" /> : <Archive size={16} />} Todos
                  </button>
                  {(['contrato', 'ds44', 'reglamento', 'epp'] as const).map(tipo => {
                    const labels = { contrato: 'Contrato', ds44: 'DS44', reglamento: 'Reglamento', epp: 'EPP' };
                    return (
                      <button
                        key={tipo}
                        id={`pdf-${tipo}-${c.id}`}
                        className="pdf-pill"
                        onClick={() => handlePdf(c, tipo)}
                        disabled={!!downloading}
                      >
                        {downloading === `${c.id}-${tipo}` ? <span className="spinner" /> : <Download size={16} />} {labels[tipo]}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn-icon danger"
                  aria-label="Eliminar contrato"
                  title="Eliminar"
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  id={`btn-delete-contrato-${c.id}`}
                >
                  {deleting === c.id ? <div className="spinner" /> : <Trash2 size={20} />}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
