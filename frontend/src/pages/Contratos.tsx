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
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Contratos</h1>
            <p className="page-sub">{filtrados.length} contrato{filtrados.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search" style={{ width: 260 }}>
              <Search size={14} />
              <input
                id="buscar-contrato"
                placeholder="Trabajador, fundo, faena..."
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
              />
            </div>
            <Link to="/contratos/nuevo" className="btn btn-primary" id="btn-nuevo-contrato">
              <Plus size={14} /> Nuevo
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ marginTop: 48 }}><div className="spinner" /> Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty" style={{ marginTop: 24 }}>
            <div className="empty-icon"><FileText size={24} /></div>
            <h3>Sin contratos</h3>
            <p>Crea el primer contrato para generar los documentos legales.</p>
            <Link to="/contratos/nuevo" className="btn btn-primary" style={{ marginTop: 4 }}>
              <Plus size={14} /> Crear contrato
            </Link>
          </div>
        ) : (
          <div className="contracts-list">
            {filtrados.map(c => (
              <div key={c.id} className="contract-card">
                <div className="contract-avatar">
                  {c.trabajador.nombres[0]}{c.trabajador.apellidos[0]}
                </div>

                <div className="contract-info">
                  <div className="contract-name">{c.trabajador.nombre_completo}</div>
                  <div className="contract-meta">
                    <span className="badge badge-green" style={{ marginRight: 6 }}>{c.actividad}</span>
                    {c.fundo.nombre} ·{' '}
                    {new Date(c.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-CL')} ·{' '}
                    <strong>${c.sueldo.toLocaleString('es-CL')}</strong>
                  </div>
                </div>

                {/* PDF PILLS */}
                <div className="contract-pdfs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    id={`pdf-zip-${c.id}`}
                    className="pdf-pill pdf-pill-all"
                    onClick={() => handlePdf(c, 'todos')}
                    disabled={!!downloading}
                    title="Descargar todo en ZIP"
                  >
                    {downloading === `${c.id}-todos`
                      ? <div className="spinner" style={{ width: 12, height: 12 }} />
                      : <><Archive size={11} /> ZIP</>}
                  </button>
                  {(['contrato', 'ds44', 'reglamento', 'epp'] as const).map(tipo => {
                    const labels = { contrato: 'CT', ds44: 'DS44', reglamento: 'RI', epp: 'EPP' };
                    return (
                      <button
                        key={tipo}
                        id={`pdf-${tipo}-${c.id}`}
                        className="pdf-pill"
                        onClick={() => handlePdf(c, tipo)}
                        disabled={!!downloading}
                        title={tipo}
                      >
                        {downloading === `${c.id}-${tipo}`
                          ? <div className="spinner" style={{ width: 12, height: 12 }} />
                          : <><Download size={11} /> {labels[tipo]}</>}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn-icon"
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  id={`btn-delete-contrato-${c.id}`}
                >
                  {deleting === c.id
                    ? <div className="spinner" style={{ width: 14, height: 14 }} />
                    : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
