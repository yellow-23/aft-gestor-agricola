import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Building2, ArrowRight, Plus, ChevronRight, Download } from 'lucide-react';
import { getTrabajadores, getContratos, getFundos, downloadPdf } from '../api/client';
import type { Trabajador, Contrato, Fundo } from '../api/types';
import { Layout } from '../components/Layout';

type Tipo = 'todos' | 'contrato' | 'ds44' | 'reglamento' | 'epp';

export function DashboardPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getTrabajadores().then(r => setTrabajadores(r.data)),
      getContratos().then(r => setContratos(r.data)),
      getFundos().then(r => setFundos(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const recientes = contratos.slice(0, 3);
  const mesActual = contratos.filter(c => {
    const d = new Date(c.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const handlePdf = async (c: Contrato, tipo: Tipo) => {
    const nombre = `${c.trabajador.apellidos}_${c.trabajador.nombres}`.replace(/ /g, '_');
    const files = { todos: `Documentos_${nombre}.zip`, contrato: `Contrato_${nombre}.pdf`, ds44: `DSN44_${nombre}.pdf`, reglamento: `Reglamento_${nombre}.pdf`, epp: `EPP_${nombre}.pdf` };
    setDownloading(`${c.id}-${tipo}`);
    try { await downloadPdf(c.id, tipo, files[tipo]); }
    finally { setDownloading(null); }
  };

  const pills: { tipo: Exclude<Tipo, 'todos'>; label: string }[] = [
    { tipo: 'contrato', label: 'Contrato' }, { tipo: 'ds44', label: 'DS44' },
    { tipo: 'reglamento', label: 'Reglamento' }, { tipo: 'epp', label: 'EPP' },
  ];

  return (
    <Layout>
      <main className="page">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="page-title">Panel central</h1>
          </div>
        </div>

        <div className="bento">
          <div className="bento-5 stack" style={{ gap: 12 }}>
            <button id="cta-nuevo-contrato" className="card-hero" onClick={() => navigate('/contratos/nuevo')}>
              <span className="card-hero-icon"><Plus size={24} /></span>
              <span>
                <span className="card-hero-title" style={{ display: 'block' }}>Nuevo contrato</span>
                <span className="card-hero-sub" style={{ display: 'block', marginTop: 4 }}>
                  Ingresa un trabajador y genera los 4 documentos legales al tiro.
                </span>
              </span>
              <span className="card-hero-cta">Comenzar <ArrowRight size={20} /></span>
            </button>

            <Link to="/trabajadores/nuevo" className="card" style={{ padding: '16px 18px' }}>
              <span className="stat-icon green" style={{ margin: 0 }}><Users size={20} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700 }}>Nuevo trabajador</span>
                <span className="contract-meta">Registrar sin contrato</span>
              </span>
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="bento-7 stats-grid">
            <div className="card stat">
              <div className="stat-icon green"><Users size={20} /></div>
              <div className="stat-num">{loading ? '–' : trabajadores.length}</div>
              <div className="stat-label">Trabajadores activos</div>
            </div>
            <div className="card stat">
              <div className="stat-icon amber"><Building2 size={20} /></div>
              <div className="stat-num">{loading ? '–' : fundos.length}</div>
              <div className="stat-label">Empresas</div>
            </div>
            <div className="card stat">
              <div className="stat-icon cyan"><FileText size={20} /></div>
              <div className="stat-num">{loading ? '–' : contratos.length}</div>
              <div className="stat-label">Contratos</div>
              <span className="badge badge-cyan" style={{ alignSelf: 'flex-start' }}>{mesActual} este mes</span>
            </div>
          </div>

          <div className="bento-12">
            <div className="row" style={{ justifyContent: 'space-between', margin: '12px 0' }}>
              <h2 className="section-title">Contratos recientes</h2>
              <Link to="/contratos" className="btn btn-ghost btn-sm" id="ver-todos-contratos">
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className="loading-state"><div className="spinner" /> Cargando...</div>
            ) : recientes.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><FileText size={24} /></div>
                <h3>Sin contratos aún</h3>
                <p>Crea el primer contrato para que aparezca aquí.</p>
              </div>
            ) : (
              <div className="contracts-list">
                {recientes.map(c => (
                  <article key={c.id} className="contract-card">
                    <div className="avatar" aria-hidden="true">{c.trabajador.nombres[0]}{c.trabajador.apellidos[0]}</div>
                    <div className="contract-info">
                      <div className="contract-name">{c.trabajador.nombre_completo}</div>
                      <div className="contract-meta">
                        {c.fundo.nombre} · {c.actividad} · {new Date(c.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <div className="contract-amount">${c.sueldo.toLocaleString('es-CL')}</div>
                    <div className="contract-pdfs">
                      <button className="pdf-pill pdf-pill-all" disabled={!!downloading} onClick={() => handlePdf(c, 'todos')}>
                        {downloading === `${c.id}-todos` ? <span className="spinner" /> : <Download size={16} />} Todos
                      </button>
                      {pills.map(p => (
                        <button key={p.tipo} className="pdf-pill" disabled={!!downloading} onClick={() => handlePdf(c, p.tipo)}>
                          {downloading === `${c.id}-${p.tipo}` ? <span className="spinner" /> : null}{p.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
