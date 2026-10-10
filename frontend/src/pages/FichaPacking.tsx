import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, ClipboardList, FileText, Upload, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { createTrabajador, getTrabajadores } from '../api/client';
import type { Trabajador } from '../api/types';
import { generarFichaPacking, KEYS, type Ficha } from '../lib/fichaPacking';

const hoy = () => new Date().toLocaleDateString('en-CA');
const ls = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };
const empty = (): Ficha => ({
  ...Object.fromEntries(KEYS.map(k => [k, ''])) as Ficha,
  ingreso: hoy(), packing: ls('packing'), faena: ls('faena'),
});

const peso = (n: number) => n > 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`;

interface DropProps {
  id: string; label: string; title: string; hint: string; icon: React.ReactNode;
  accept: string; multiple?: boolean; files: File[]; onFiles: (f: File[]) => void;
}

function FileDrop({ id, label, title, hint, icon, accept, multiple, files, onFiles }: DropProps) {
  const first = files[0];
  const thumb = useMemo(() => (first && first.type.startsWith('image/') ? URL.createObjectURL(first) : ''), [first]);
  useEffect(() => () => { if (thumb) URL.revokeObjectURL(thumb); }, [thumb]);

  return (
    <div className="field">
      <span id={`${id}-label`} style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
      {first ? (
        <div className="file-drop filled">
          {thumb
            ? <img className="file-thumb" src={thumb} alt="Vista previa" />
            : <div className="file-drop-icon"><FileText size={22} /></div>}
          <div style={{ minWidth: 0 }}>
            <div className="file-drop-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {files.length === 1 ? first.name : `${files.length} archivos`}
            </div>
            <div className="file-drop-sub">
              {files.length === 1 ? peso(first.size) : files.map(f => f.name).join(', ')}
            </div>
          </div>
          <button type="button" className="btn-icon file-remove" aria-label="Quitar archivo" onClick={() => onFiles([])}>
            <X size={20} />
          </button>
        </div>
      ) : (
        <label className="file-drop">
          <input id={id} type="file" accept={accept} multiple={multiple} aria-labelledby={`${id}-label`}
            onChange={e => onFiles([...(e.target.files ?? [])])} />
          <div className="file-drop-icon">{icon}</div>
          <div>
            <div className="file-drop-title">{title}</div>
            <div className="file-drop-sub">{hint}</div>
          </div>
        </label>
      )}
    </div>
  );
}

export function FichaPackingPage() {
  const [v, setV] = useState<Ficha>(empty);
  const [frente, setFrente] = useState<File[]>([]);
  const [reverso, setReverso] = useState<File[]>([]);
  const [afpdoc, setAfpdoc] = useState<File[]>([]);
  const [otro, setOtro] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [existentes, setExistentes] = useState<Trabajador[]>([]);
  const [sel, setSel] = useState(''); // id del trabajador ya guardado, '' = nuevo
  const [rut, setRut] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { getTrabajadores().then(r => setExistentes(r.data)).catch(() => {}); }, []);

  const elegir = (id: string) => {
    setSel(id);
    const t = existentes.find(x => String(x.id) === id);
    if (!t) return;
    setRut(t.rut); setNacimiento(t.fecha_nacimiento);
    setV(f => ({ ...f, nombre: t.nombres, apellidos: t.apellidos, nacionalidad: t.nacionalidad,
      direccion: t.direccion, genero: t.sexo === 'F' ? 'Femenino' : 'Masculino' }));
  };
  const set = (k: keyof Ficha, val: string) => setV(f => ({ ...f, [k]: val }));

  const text = (k: keyof Ficha, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, full = false) => (
    <div className={`field${full ? ' form-full' : ''}`}>
      <label htmlFor={k}>{label}{extra.required && <span className="req">*</span>}</label>
      <input id={k} value={v[k]} onChange={e => set(k, e.target.value)} {...extra} />
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setMsg('');
    try {
      const t = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()])) as Ficha;
      t.ingreso = t.ingreso.split('-').reverse().join('/');
      const { name, pages, blob } = await generarFichaPacking(t, {
        frente: frente[0], reverso: reverso[0], afpdoc, otro,
      });
      if (!sel) { // PDF ya armado sin errores: recién ahora se guarda el trabajador
        const r = await createTrabajador({ nombres: t.nombre, apellidos: t.apellidos, rut: rut.trim(),
          nacionalidad: t.nacionalidad || 'Chilena', direccion: t.direccion,
          fecha_nacimiento: nacimiento, sexo: t.genero === 'Femenino' ? 'F' : 'M' });
        setExistentes(x => [...x, r.data]); setSel(String(r.data.id));
      }
      Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name }).click();
      try { localStorage.setItem('packing', v.packing); localStorage.setItem('faena', v.faena); } catch { /* sin storage */ }
      setMsg(`Listo: ${name} (${pages} páginas)`);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail ?? (err instanceof Error ? err.message : 'No se pudo generar el PDF.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setV(empty()); setSel(''); setRut(''); setNacimiento('');
    setFrente([]); setReverso([]); setAfpdoc([]); setOtro([]); setMsg(''); setError('');
  };

  // Progreso derivado: cada sección se marca completa según lo ingresado.
  const done = [
    !!sel || (!!rut.trim() && !!nacimiento),
    !!v.nombre.trim() && !!v.apellidos.trim(),
    frente.length + reverso.length + afpdoc.length + otro.length > 0,
  ];
  const active = done.findIndex(d => !d);
  const labels = ['Trabajador', 'Datos', 'Adjuntos'];

  return (
    <Layout>
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Ficha packing</h1>
            <p className="page-sub">Un solo PDF con ficha, carnet, AFP y otro documento. Se arma en tu navegador; no se sube nada.</p>
          </div>
        </div>

        <form onSubmit={submit} className="stack" style={{ maxWidth: 'var(--size-form)' }}>
          <ol className="steps" aria-label="Secciones">
            {labels.map((label, i) => (
              <li key={label} className={`step ${done[i] ? 'done' : i === active ? 'active' : ''}`}
                aria-current={i === active ? 'step' : undefined}>
                <span className="step-bubble">{done[i] ? <Check size={18} /> : i + 1}</span>
                <span className="step-label">{label}</span>
              </li>
            ))}
          </ol>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <section className="form-section">
            <div className="form-section-title"><span className="num">1</span>Trabajador</div>
            <div className="form-grid">
              <div className="field form-full">
                <label htmlFor="sel">Trabajador ya registrado</label>
                <select id="sel" value={sel} onChange={e => elegir(e.target.value)}>
                  <option value="">Nuevo trabajador (se guarda al generar)</option>
                  {existentes.map(t => <option key={t.id} value={t.id}>{t.apellidos}, {t.nombres} · {t.rut}</option>)}
                </select>
              </div>
              <div className="field input-mono">
                <label htmlFor="rut">RUT<span className="req">*</span></label>
                <input id="rut" value={rut} onChange={e => setRut(e.target.value)} placeholder="12.345.678-9" required disabled={!!sel} />
              </div>
              <div className="field">
                <label htmlFor="nacimiento">Fecha de nacimiento<span className="req">*</span></label>
                <input id="nacimiento" type="date" value={nacimiento} onChange={e => setNacimiento(e.target.value)} required disabled={!!sel} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-title"><span className="num">2</span>Datos personales y laborales</div>
            <div className="form-grid">
              {text('packing', 'Packing', {}, true)}
              {text('nombre', 'Nombre', { required: true })}
              {text('apellidos', 'Apellidos', { required: true })}
              <div className="field">
                <label htmlFor="genero">Género{!sel && <span className="req">*</span>}</label>
                <select id="genero" value={v.genero} required={!sel} onChange={e => set('genero', e.target.value)}>
                  <option value=""></option><option>Masculino</option><option>Femenino</option>
                </select>
              </div>
              {text('nacionalidad', 'Nacionalidad', { list: 'nac' })}
              {text('ingreso', 'Fecha de ingreso', { type: 'date' })}
              {text('faena', 'Faena o puesto de trabajo')}
              {text('direccion', 'Dirección', {}, true)}
              {text('afp', 'AFP', { list: 'afps' })}
              {text('telefono', 'Teléfono', { type: 'tel' })}
              {text('correo', 'Correo', { type: 'email' }, true)}
              <div className="field form-full">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea id="observaciones" rows={3} value={v.observaciones} onChange={e => set('observaciones', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-title"><span className="num">3</span>Documentos a adjuntar</div>
            <div className="form-grid">
              <FileDrop id="frente" label="Carnet · frente" title="Sacar foto del frente" hint="Toca para tomar foto o elegir archivo"
                icon={<Camera size={22} />} accept="image/*" files={frente} onFiles={setFrente} />
              <FileDrop id="reverso" label="Carnet · reverso" title="Sacar foto del reverso" hint="Toca para tomar foto o elegir archivo"
                icon={<Camera size={22} />} accept="image/*" files={reverso} onFiles={setReverso} />
              <div className="form-full">
                <FileDrop id="afpdoc" label="AFP (PDF o foto)" title="Subir documento AFP" hint="PDF o foto, puedes elegir varios"
                  icon={<Upload size={22} />} accept="application/pdf,image/*" multiple files={afpdoc} onFiles={setAfpdoc} />
              </div>
              <div className="form-full">
                <FileDrop id="otro" label="Otro documento (opcional)" title="Subir otro documento" hint="PDF o foto, puedes elegir varios"
                  icon={<Upload size={22} />} accept="application/pdf,image/*" multiple files={otro} onFiles={setOtro} />
              </div>
            </div>
          </section>

          {msg && <div className="alert alert-success" role="status"><Check size={20} />{msg}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary btn-lg" onClick={reset}>Limpiar</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Generando...</> : <><ClipboardList size={20} /> Generar PDF</>}
            </button>
          </div>
        </form>

        <datalist id="nac">{['Chilena', 'Venezolana', 'Haitiana', 'Peruana', 'Boliviana', 'Colombiana', 'Argentina', 'Ecuatoriana'].map(n => <option key={n} value={n} />)}</datalist>
        <datalist id="afps">{['Capital', 'Cuprum', 'Habitat', 'Modelo', 'PlanVida', 'ProVida', 'Uno'].map(n => <option key={n} value={n} />)}</datalist>
      </main>
    </Layout>
  );
}
