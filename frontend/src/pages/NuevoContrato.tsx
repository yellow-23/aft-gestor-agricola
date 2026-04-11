import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Archive, Download } from 'lucide-react';
import { createContrato, getTrabajadores, getFundos, downloadPdf } from '../api/client';
import type { Trabajador, Fundo } from '../api/types';
import { Layout } from '../components/Layout';

const EPP_BASE = [
  'Sombrero / jocky de trabajo',
  'Guantes de cuero o nitrilo',
  'Zapatos de seguridad',
  'Chaleco reflectante',
  'Mascarilla antipolvo KN95',
  'Lentes de seguridad',
];

type Step = 1 | 2 | 3;

export function NuevoContratoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trabajadorParam = searchParams.get('trabajador');

  const [step, setStep] = useState<Step>(1);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contratoId, setContratoId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedEpp, setSelectedEpp] = useState<string[]>(EPP_BASE.slice(0, 4));
  const [eppExtra, setEppExtra] = useState('');

  const [form, setForm] = useState({
    trabajador_id: trabajadorParam || '',
    fundo_id: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    actividad: '',
    horario: 'Lunes a Sábado, 08:00 a 17:00 hrs.',
    sueldo: 510000,
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      getTrabajadores().then(r => setTrabajadores(r.data)),
      getFundos().then(r => setFundos(r.data)),
    ]).finally(() => setLoadingData(false));
  }, []);

  const toggleEpp = (e: string) =>
    setSelectedEpp(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);

  const allEpp = [...selectedEpp, ...(eppExtra ? eppExtra.split('\n').filter(Boolean) : [])].join(', ');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await createContrato({
        ...form,
        trabajador_id: Number(form.trabajador_id),
        fundo_id: Number(form.fundo_id),
        sueldo: Number(form.sueldo),
        epp_entregado: allEpp,
      });
      setContratoId(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (tipo: 'todos' | 'contrato' | 'ds44' | 'reglamento' | 'epp', fn: string) => {
    if (!contratoId) return;
    setDownloading(tipo);
    try { await downloadPdf(contratoId, tipo, fn); }
    finally { setDownloading(null); }
  };

  const trabajador = trabajadores.find(t => t.id === Number(form.trabajador_id));
  const nombre = trabajador ? `${trabajador.apellidos}_${trabajador.nombres}`.replace(/ /g, '_') : 'trabajador';

  // ─── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (contratoId) return (
    <Layout>
      <div className="page">
        <div className="success-card">
          <div className="success-header">
            <div className="success-check"><CheckCircle size={28} /></div>
            <h2 className="success-title">Contrato creado</h2>
            <p className="success-sub">
              {trabajador?.nombre_completo} · {form.actividad}<br />
              Descarga los documentos para imprimir y firmar
            </p>
          </div>

          <button
            id="btn-download-all"
            className="btn btn-primary btn-lg"
            style={{ justifyContent: 'center' }}
            onClick={() => handleDownload('todos', `Documentos_${nombre}.zip`)}
            disabled={!!downloading}
          >
            {downloading === 'todos'
              ? <><div className="spinner" /> Generando...</>
              : <><Archive size={18} /> Descargar todo (ZIP)</>}
          </button>

          <div className="pdf-download-list">
            {([
              { tipo: 'contrato' as const, label: '1. Contrato de trabajo por faena', file: `Contrato_${nombre}.pdf` },
              { tipo: 'ds44' as const, label: '2. Declaración jurada D.S. N°44', file: `DSN44_${nombre}.pdf` },
              { tipo: 'reglamento' as const, label: '3. Registro entrega Reglamento Interno', file: `Reglamento_${nombre}.pdf` },
              { tipo: 'epp' as const, label: '4. Acta entrega EPP', file: `EPP_${nombre}.pdf` },
            ]).map(({ tipo, label, file }) => (
              <div key={tipo} className="pdf-download-item">
                <span className="pdf-download-label">{label}</span>
                <button
                  id={`btn-pdf-${tipo}`}
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDownload(tipo, file)}
                  disabled={!!downloading}
                >
                  {downloading === tipo
                    ? <div className="spinner" style={{ width: 14, height: 14 }} />
                    : <><Download size={13} /> PDF</>}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/contratos')}>Ver contratos</button>
            <button className="btn btn-primary" onClick={() => navigate('/trabajadores/nuevo')}>+ Otro trabajador</button>
          </div>
        </div>
      </div>
    </Layout>
  );

  // ─── FORM ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn-icon" onClick={() => navigate(-1)} id="btn-back">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 24 }}>Nuevo contrato</h1>
            <p className="page-sub">Rellena los datos para generar los documentos legales</p>
          </div>
        </div>

        {/* STEPS */}
        <div className="steps" style={{ marginTop: 28, maxWidth: 500 }}>
          {[
            { n: 1 as Step, label: 'Partes' },
            { n: 2 as Step, label: 'Faena' },
            { n: 3 as Step, label: 'EPP' },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className={`step ${step === n ? 'active' : step > n ? 'done' : ''}`}>
              <div className="step-bubble">{step > n ? '✓' : n}</div>
              <div className="step-label">{label}</div>
              {i < arr.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {loadingData ? (
          <div className="loading-state" style={{ marginTop: 48 }}><div className="spinner" /> Cargando...</div>
        ) : (
          <div style={{ maxWidth: 680, marginTop: 24 }}>
            {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* STEP 1: PARTES */}
            {step === 1 && (
              <div className="form-section">
                <div className="form-section-title">Trabajador y fundo</div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="sel-trabajador">Trabajador *</label>
                    <select id="sel-trabajador" value={form.trabajador_id} onChange={e => set('trabajador_id', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre_completo} — {t.rut}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="sel-fundo">Fundo / empresa *</label>
                    <select id="sel-fundo" value={form.fundo_id} onChange={e => set('fundo_id', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {fundos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                    </select>
                    {fundos.length === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--red)' }}>
                        Sin fundos. <a href="/fundos" style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Crea uno</a>
                      </span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="fecha-ingreso">Fecha de ingreso *</label>
                    <input id="fecha-ingreso" type="date" value={form.fecha_ingreso} onChange={e => set('fecha_ingreso', e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="sueldo">Sueldo mensual *</label>
                    <input id="sueldo" type="number" value={form.sueldo} onChange={e => set('sueldo', Number(e.target.value))} required min={510000} step={1000} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button" className="btn btn-primary"
                    disabled={!form.trabajador_id || !form.fundo_id}
                    onClick={() => setStep(2)}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: FAENA */}
            {step === 2 && (
              <div className="form-section">
                <div className="form-section-title">Detalles de la faena</div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="actividad">Actividad / Faena *</label>
                    <input id="actividad" type="text" placeholder="Ej: Poda 2025, Cosecha uva" value={form.actividad} onChange={e => set('actividad', e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="horario">Horario *</label>
                    <input id="horario" type="text" placeholder="Ej: Lunes a Sábado, 08:00 a 17:00" value={form.horario} onChange={e => set('horario', e.target.value)} required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Volver</button>
                  <button type="button" className="btn btn-primary" disabled={!form.actividad || !form.horario} onClick={() => setStep(3)}>
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EPP */}
            {step === 3 && (
              <div className="form-section">
                <div className="form-section-title">EPP a entregar</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                  Selecciona los elementos de protección personal
                </p>
                <div className="epp-chips">
                  {EPP_BASE.map(e => (
                    <button
                      key={e} type="button"
                      className={`epp-chip ${selectedEpp.includes(e) ? 'on' : ''}`}
                      onClick={() => toggleEpp(e)}
                    >
                      {selectedEpp.includes(e) ? '✓ ' : ''}{e}
                    </button>
                  ))}
                </div>
                <div className="field" style={{ marginTop: 12 }}>
                  <label htmlFor="epp-extra">EPP adicional (uno por línea)</label>
                  <textarea
                    id="epp-extra"
                    placeholder="Ej: Arnés de seguridad&#10;Protector auditivo"
                    value={eppExtra}
                    onChange={e => setEppExtra(e.target.value)}
                    rows={3}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Volver</button>
                  <button
                    id="btn-crear-contrato"
                    type="button"
                    className="btn btn-primary"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? <><div className="spinner" /> Creando...</> : '📄 Crear contrato'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
