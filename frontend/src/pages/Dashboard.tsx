import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Building2, ArrowRight, Plus } from 'lucide-react';
import { getTrabajadores, getContratos, getFundos } from '../api/client';
import type { Trabajador, Contrato, Fundo } from '../api/types';
import { Layout } from '../components/Layout';

export function DashboardPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <Layout>
      <div className="page">
        {/* HEADING */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="page-title">
            Pan<span style={{ color: 'var(--green)' }}>el</span> central
          </h1>
        </div>

        {/* BENTO */}
        <div className="bento">

          {/* CTA Nuevo contrato - grande */}
          <div className="bento-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              id="cta-nuevo-contrato"
              className="card-hero"
              style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 20, border: 'none', width: '100%', flex: 1 }}
              onClick={() => navigate('/contratos/nuevo')}
            >
              <div style={{ background: 'var(--green-glow)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>Nuevo contrato</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                  Ingresa un trabajador y genera los 4 documentos legales al tiro
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                Comenzar <ArrowRight size={14} />
              </div>
            </button>

            <Link to="/trabajadores/nuevo" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div className="stat-icon green"><Users size={16} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Nuevo trabajador</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Registrar sin contrato</div>
              </div>
              <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
          </div>

          {/* Stats */}
          <div className="bento-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="stat-icon green" style={{ marginBottom: 12 }}><Users size={18} /></div>
              <div className="stat-num green">{loading ? '–' : trabajadores.length}</div>
              <div className="stat-label">Trabajadores activos</div>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <div className="stat-icon amber" style={{ marginBottom: 12 }}><Building2 size={18} /></div>
              <div className="stat-num amber">{loading ? '–' : fundos.length}</div>
              <div className="stat-label">Empresas</div>
            </div>
          </div>

          {/* Stat grande contratos */}
          <div className="bento-3">
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', marginBottom: 12 }}><FileText size={18} /></div>
                <div className="stat-num cyan" style={{ fontSize: 52 }}>{loading ? '–' : contratos.length}</div>
                <div className="stat-label">Contratos totales</div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span className="badge badge-cyan">{mesActual} este mes</span>
              </div>
            </div>
          </div>

          {/* Últimos contratos */}
          <div className="bento-12">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>Contratos recientes</h2>
              <Link to="/contratos" className="btn btn-ghost btn-sm" id="ver-todos-contratos">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="loading-state"><div className="spinner" /> Cargando...</div>
            ) : recientes.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><FileText size={24} /></div>
                <h3>Sin contratos aún</h3>
                <p>Crea el primer contrato para que aparezca aquí</p>
              </div>
            ) : (
              <div className="contracts-list">
                {recientes.map(c => (
                  <div key={c.id} className="contract-card">
                    <div className="contract-avatar">
                      {c.trabajador.nombres[0]}{c.trabajador.apellidos[0]}
                    </div>
                    <div className="contract-info">
                      <div className="contract-name">{c.trabajador.nombre_completo}</div>
                      <div className="contract-meta">
                        {c.fundo.nombre} · {c.actividad} ·{' '}
                        {new Date(c.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <span className="badge badge-green">${c.sueldo.toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
