import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Archive, Download, FileText, Plus } from 'lucide-react';
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
              : <><Archive size={20} /> Descargar todo (ZIP)</>}
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
                    ? <div className="spinner" />
                    : <><Download size={16} /> PDF</>}
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/contratos')}>Ver contratos</button>
            <button className="btn btn-primary" onClick={() => navigate('/trabajadores/nuevo')}><Plus size={20} /> Otro trabajador</button>
          </div>
        </div>
      </div>
    </Layout>
  );

  // ─── FORM ──────────────────────────────────────────────────────────────────
  const stepTitle = { 1: 'Trabajador y empresa', 2: 'Detalles de la faena', 3: 'EPP a entregar' }[step];
  return (
    <Layout>
      <main className="page">
        <div className="page-head">
          <div className="page-back">
            <button className="btn-icon" onClick={() => navigate(-1)} id="btn-back" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">Nuevo contrato</h1>
              <p className="page-sub" style={{ marginTop: 2 }}>Paso {step} de 3 · {stepTitle}</p>
            </div>
          </div>
        </div>

        <div className="stack" style={{ maxWidth: 'var(--size-form)' }}>
          <ol className="steps" aria-label="Pasos del contrato">
            {[
              { n: 1 as Step, label: 'Partes' },
              { n: 2 as Step, label: 'Faena' },
              { n: 3 as Step, label: 'EPP' },
            ].map(({ n, label }) => (
              <li key={n} className={`step ${step === n ? 'active' : step > n ? 'done' : ''}`} aria-current={step === n ? 'step' : undefined}>
                <span className="step-bubble">{step > n ? <Check size={18} /> : n}</span>
                <span className="step-label">{label}</span>
              </li>
            ))}
          </ol>

          {loadingData ? (
            <div className="loading-state"><div className="spinner" /> Cargando...</div>
          ) : (
            <>
              {error && <div className="login-error" role="alert">{error}</div>}

              {step === 1 && (
                <>
                  <section className="form-section">
                    <div className="form-section-title"><span className="num">1</span>Trabajador y empresa</div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="sel-trabajador">Trabajador<span className="req">*</span></label>
                        <select id="sel-trabajador" value={form.trabajador_id} onChange={e => set('trabajador_id', e.target.value)} required>
                          <option value="">Seleccionar…</option>
                          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre_completo} — {t.rut}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="sel-fundo">Empresa o fundo<span className="req">*</span></label>
                        <select id="sel-fundo" value={form.fundo_id} onChange={e => set('fundo_id', e.target.value)} required>
                          <option value="">Seleccionar…</option>
                          {fundos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                        </select>
                        {fundos.length === 0 && (
                          <span className="error">Aún no hay empresas. <a href="/fundos" style={{ textDecoration: 'underline' }}>Crea una</a></span>
                        )}
                      </div>
                      <div className="field">
                        <label htmlFor="fecha-ingreso">Fecha de ingreso<span className="req">*</span></label>
                        <input id="fecha-ingreso" type="date" value={form.fecha_ingreso} onChange={e => set('fecha_ingreso', e.target.value)} required />
                      </div>
                      <div className="field input-mono">
                        <label htmlFor="sueldo">Sueldo mensual<span className="req">*</span></label>
                        <input id="sueldo" type="number" value={form.sueldo} onChange={e => set('sueldo', Number(e.target.value))} required min={510000} step={1000} />
                      </div>
                    </div>
                  </section>
                  <div className="form-actions">
                    <button type="button" className="btn btn-primary btn-lg" disabled={!form.trabajador_id || !form.fundo_id} onClick={() => setStep(2)}>
                      Siguiente <ArrowRight size={20} />
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <section className="form-section">
                    <div className="form-section-title"><span className="num">2</span>Detalles de la faena</div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="actividad">Actividad / faena<span className="req">*</span></label>
                        <input id="actividad" type="text" placeholder="Ej: Poda 2025, Cosecha uva" value={form.actividad} onChange={e => set('actividad', e.target.value)} required />
                      </div>
                      <div className="field">
                        <label htmlFor="horario">Horario<span className="req">*</span></label>
                        <input id="horario" type="text" placeholder="Ej: Lunes a Sábado, 08:00 a 17:00" value={form.horario} onChange={e => set('horario', e.target.value)} required />
                      </div>
                    </div>
                  </section>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)}><ArrowLeft size={20} /> Volver</button>
                    <button type="button" className="btn btn-primary btn-lg" disabled={!form.actividad || !form.horario} onClick={() => setStep(3)}>
                      Siguiente <ArrowRight size={20} />
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <section className="form-section">
                    <div className="form-section-title"><span className="num">3</span>EPP a entregar</div>
                    <p className="contract-meta" style={{ marginTop: -6 }}>Marca lo que se entrega hoy. Aparece en el Acta de entrega EPP.</p>
                    <div className="epp-chips" role="group" aria-label="EPP a entregar">
                      {EPP_BASE.map(e => {
                        const on = selectedEpp.includes(e);
                        return (
                          <button key={e} type="button" className={`epp-chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleEpp(e)}>
                            <span className="tick"><Check size={14} /></span>{e}
                          </button>
                        );
                      })}
                    </div>
                    <div className="field">
                      <label htmlFor="epp-extra">EPP adicional <span style={{ fontWeight: 400, color: 'var(--text-2)' }}>(uno por línea)</span></label>
                      <textarea
                        id="epp-extra"
                        placeholder={'Ej: Arnés de seguridad\nProtector auditivo'}
                        value={eppExtra}
                        onChange={e => setEppExtra(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </section>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(2)}><ArrowLeft size={20} /> Volver</button>
                    <button id="btn-crear-contrato" type="button" className="btn btn-primary btn-lg" disabled={loading} onClick={handleSubmit}>
                      {loading ? <><span className="spinner" /> Creando...</> : <><FileText size={20} /> Crear contrato</>}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
