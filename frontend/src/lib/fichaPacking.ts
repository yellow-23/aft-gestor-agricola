import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from 'pdf-lib';

export type Ficha = Record<(typeof KEYS)[number], string>;

const W = 612, H = 792, MAXPX = 2000; // hoja Carta
const ROWS = [['Packing:', 'packing'], ['Nombre:', 'nombre'], ['Apellidos:', 'apellidos'], ['Género:', 'genero'],
  ['Nacionalidad:', 'nacionalidad'], ['Fecha de ingreso:', 'ingreso'], ['Faena o puesto de trabajo:', 'faena'],
  ['Dirección:', 'direccion'], ['AFP:', 'afp'], ['Teléfono:', 'telefono'], ['Correo:', 'correo']] as const;
export const KEYS = [...ROWS.map(r => r[1]), 'observaciones'] as const;

const bad = (f: File) => () => { throw new Error(`No se pudo leer "${f.name}"`); };

// Cualquier imagen que el navegador decodifique -> JPEG liviano (también corrige la rotación EXIF).
async function toJpeg(file: File) {
  const bmp = await createImageBitmap(file).catch(bad(file));
  const k = Math.min(1, MAXPX / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.88));
  return blob!.arrayBuffer();
}

function fit(page: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number) {
  const k = Math.min(w / img.width, h / img.height);
  page.drawImage(img, { x: x + (w - img.width * k) / 2, y: y + (h - img.height * k) / 2, width: img.width * k, height: img.height * k });
}

function wrap(font: { widthOfTextAtSize(t: string, s: number): number }, text: string, size: number, maxW: number) {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let cur = '';
    for (const w of para.split(/\s+/)) {
      const t = cur ? cur + ' ' + w : w;
      if (cur && font.widthOfTextAtSize(t, size) > maxW) { lines.push(cur); cur = w; } else cur = t;
    }
    lines.push(cur);
  }
  return lines;
}

async function drawFicha(pdf: PDFDocument, v: Ficha) {
  const page = pdf.addPage([W, H]);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const known = new Set(reg.getCharacterSet());
  const safe = (s: string) => [...s].map(c => /[\r\n]/.test(c) || known.has(c.codePointAt(0)!) ? c : '?').join('');
  const center = (t: string, f: typeof bold, size: number, y: number) =>
    page.drawText(t, { x: (W - f.widthOfTextAtSize(t, size)) / 2, y, size, font: f });

  center('FICHA DE INSCRIPCIÓN - PACKING', bold, 16, H - 70);
  center('Datos personales y laborales', ital, 10, H - 92);

  const X = 51, LW = 153, VW = 346, grey = rgb(.718, .718, .718);
  let y = H - 110;
  for (const [label, key] of ROWS) {
    const lines = wrap(reg, safe(v[key]), 11, VW - 16);
    const h = Math.max(26, lines.length * 14 + 12);
    y -= h;
    page.drawRectangle({ x: X, y, width: LW, height: h, color: rgb(.949, .949, .949), borderColor: grey, borderWidth: .75 });
    page.drawRectangle({ x: X + LW, y, width: VW, height: h, borderColor: grey, borderWidth: .75 });
    page.drawText(label, { x: X + 6, y: y + h - 17, size: 11, font: bold });
    lines.forEach((l, i) => page.drawText(l, { x: X + LW + 8, y: y + h - 17 - i * 14, size: 11, font: reg }));
  }

  y -= 24;
  page.drawText('Observaciones:', { x: X, y, size: 11, font: bold });
  const obs = wrap(reg, safe(v.observaciones), 11, W - 2 * X);
  // ponytail: una sola hoja; observaciones de más de ~20 líneas se salen de la página
  for (let i = 0; i < Math.max(3, obs.length); i++) {
    y -= 22;
    page.drawLine({ start: { x: X, y: y - 3 }, end: { x: W - X, y: y - 3 }, thickness: .75, color: rgb(0, 0, 0) });
    if (obs[i]) page.drawText(obs[i], { x: X, y, size: 11, font: reg });
  }
}

async function addCarnet(pdf: PDFDocument, front?: File, back?: File) {
  const page = pdf.addPage([W, H]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = H - 48;
  for (const [label, file] of [['CARNET - FRENTE', front], ['CARNET - REVERSO', back]] as const) {
    if (!file) continue;
    page.drawText(label, { x: 51, y: y - 11, size: 11, font });
    fit(page, await pdf.embedJpg(await toJpeg(file)), 51, y - 330, 510, 310);
    y -= 350;
  }
}

async function addFile(pdf: PDFDocument, file: File) {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    const src = await PDFDocument.load(await file.arrayBuffer()).catch(bad(file));
    (await pdf.copyPages(src, src.getPageIndices())).forEach(p => pdf.addPage(p));
  } else {
    fit(pdf.addPage([W, H]), await pdf.embedJpg(await toJpeg(file)), 36, 36, W - 72, H - 72);
  }
}

// Ficha + carnet frente/reverso + AFP + otro documento, en ese orden. Todo en el navegador.
export async function generarFichaPacking(
  v: Ficha,
  files: { frente?: File; reverso?: File; afpdoc: File[]; otro: File[] },
) {
  const pdf = await PDFDocument.create();
  await drawFicha(pdf, v);
  if (files.frente || files.reverso) await addCarnet(pdf, files.frente, files.reverso);
  for (const f of [...files.afpdoc, ...files.otro]) await addFile(pdf, f);
  const name = `Ficha_${v.apellidos}_${v.nombre}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\W+/g, '_') + '.pdf';
  return { name, pages: pdf.getPageCount(), blob: new Blob([await pdf.save() as BlobPart], { type: 'application/pdf' }) };
}
