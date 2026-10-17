/**
 * REGISTRO DE SOLICITUDES EN EXCEL (módulo del cliente).
 *
 * Al pulsar «Generar ficha con IA», los datos del formulario del cliente se guardan como una FILA en un Excel
 * de plantilla dentro de la carpeta del proyecto (por defecto `registros/solicitudes_clientes.xlsx`).
 * - Cada dato del formulario es una COLUMNA (mismos nombres que el registro del formulario).
 * - Lo que el cliente no dio, ni aparece en su pliego, queda como «Falta dato» (celda resaltada), para que el
 *   equipo lo complete en el Excel después de la visita técnica.
 * - Una solicitud es una sola fila (columna «ID de solicitud»): si el cliente vuelve a generar la ficha, se
 *   actualiza esa fila, y las celdas que el equipo ya completó a mano no se pisan con «Falta dato».
 * - Si el Excel está abierto (Windows lo bloquea), la fila queda en `solicitudes_pendientes.jsonl` y se escribe
 *   la próxima vez que se pueda guardar.
 */
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { BLOQUES_REGISTRO, CAMPO_DE_FILA } from '../src/formulario/registro.js';
import { FORMULARIO_VACIO } from '../src/formulario/solicitud.js';

export const FALTA_DATO = 'Falta dato';
const HOJA = 'Solicitudes';
const ARCHIVO_POR_DEFECTO = path.join('registros', 'solicitudes_clientes.xlsx');

// Columnas: datos de control, luego cada dato del formulario (en su orden) y al final lo del equipo.
const CAMPOS = BLOQUES_REGISTRO.flatMap((b) => b.campos.map((c) => ({ ...c, bloque: b.titulo })));
const COLUMNAS_CONTROL = [
  { clave: 'id', titulo: 'ID de solicitud', ancho: 22 },
  { clave: 'creada', titulo: 'Fecha de registro', ancho: 19 },
  { clave: 'actualizada', titulo: 'Última actualización', ancho: 19 },
  { clave: 'documento', titulo: 'Pliego adjunto', ancho: 28 },
  { clave: 'ficha', titulo: 'Estado de la ficha', ancho: 18 }
];
const COLUMNAS_EQUIPO = [{ clave: 'observaciones', titulo: 'Observaciones de la visita (equipo)', ancho: 40 }];
export const COLUMNAS = [
  ...COLUMNAS_CONTROL,
  ...CAMPOS.map((c) => ({ clave: c.id, titulo: c.dato, ancho: c.id === 'comentarios' ? 40 : 24, esDato: true })),
  { clave: 'delPliego', titulo: 'Datos tomados del pliego', ancho: 36 },
  ...COLUMNAS_EQUIPO
];

const COLOR = { cabecera: 'FF0E2748', textoCabecera: 'FFFFFFFF', falta: 'FFFCEBC2', textoFalta: 'FF8A5A00', pliego: 'FFE2F1FA' };

/** Formulario recibido del navegador, solo con los campos conocidos y del tipo esperado. */
export function limpiarFormulario(f = {}) {
  const limpio = {};
  for (const [clave, inicial] of Object.entries(FORMULARIO_VACIO)) {
    const v = f?.[clave];
    limpio[clave] = Array.isArray(inicial) ? (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []) : typeof v === 'string' ? v.slice(0, 2000) : '';
  }
  return limpio;
}

const fecha = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Arma la fila de una solicitud.
 * @param {{ id: string, formulario: object, desdeDocumento?: {campo:string,pagina?:number}[], documentoNombre?: string|null, fichaEstado?: string }} datos
 */
export function armarFila({ id, formulario, desdeDocumento = [], documentoNombre = null, fichaEstado = '' }) {
  const f = limpiarFormulario(formulario);
  const origen = Object.fromEntries((Array.isArray(desdeDocumento) ? desdeDocumento : []).filter((d) => d && typeof d.campo === 'string').map((d) => [d.campo, d]));
  const valores = {};
  const delPliego = {};
  for (const c of CAMPOS) {
    const v = String(c.valor(f) ?? '').trim();
    // El rango es la alternativa a los m²: si dio los m², no le falta el rango.
    valores[c.id] = v || (c.id === 'rango' && f.m2.trim() ? 'No aplica (indicó los m²)' : FALTA_DATO);
    const doc = origen[CAMPO_DE_FILA[c.id] ?? c.id];
    if (v && doc) delPliego[c.id] = doc.pagina ? `pág. ${doc.pagina}` : 'del pliego';
  }
  return {
    id: String(id),
    valores,
    delPliego,
    documento: documentoNombre ? String(documentoNombre).slice(0, 200) : 'Sin pliego',
    ficha: fichaEstado || 'Sin generar',
    resumenPliego: CAMPOS.filter((c) => delPliego[c.id]).map((c) => `${c.dato} (${delPliego[c.id]})`).join(' · ') || 'Ninguno'
  };
}

function estilarCabecera(hoja) {
  const fila = hoja.getRow(1);
  fila.height = 30;
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: COLOR.textoCabecera } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.cabecera } };
    celda.alignment = { vertical: 'middle', wrapText: true };
  });
}

function hojaNueva(libro) {
  const hoja = libro.addWorksheet(HOJA, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
  hoja.columns = COLUMNAS.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho }));
  estilarCabecera(hoja);
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNAS.length } };
  hoja.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  return hoja;
}

/** Busca la columna de cada título en la cabecera (por si el equipo movió o agregó columnas). Agrega las que falten. */
function mapaColumnas(hoja) {
  const mapa = {};
  const cabecera = hoja.getRow(1);
  cabecera.eachCell((celda, n) => {
    const titulo = String(celda.value ?? '').trim();
    const col = COLUMNAS.find((c) => c.titulo === titulo);
    if (col) mapa[col.clave] = n;
  });
  let ultima = cabecera.cellCount;
  for (const c of COLUMNAS) {
    if (mapa[c.clave]) continue;
    ultima += 1;
    cabecera.getCell(ultima).value = c.titulo;
    hoja.getColumn(ultima).width = c.ancho;
    mapa[c.clave] = ultima;
  }
  estilarCabecera(hoja);
  return mapa;
}

const esVacio = (v) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === FALTA_DATO;
const textoCelda = (v) => (v && typeof v === 'object' ? (v.richText ? v.richText.map((t) => t.text).join('') : v.text ?? v.result ?? '') : v ?? '');

function escribirFila(hoja, mapa, fila, ahora) {
  const colId = mapa.id;
  let n = 0;
  hoja.eachRow((r, i) => {
    if (i > 1 && String(textoCelda(r.getCell(colId).value)).trim() === fila.id) n = i;
  });
  const nueva = !n;
  if (nueva) n = Math.max(hoja.rowCount, 1) + 1;
  const r = hoja.getRow(n);
  const poner = (clave, valor) => {
    r.getCell(mapa[clave]).value = valor;
  };

  poner('id', fila.id);
  if (nueva || esVacio(textoCelda(r.getCell(mapa.creada).value))) poner('creada', fila.creada ?? ahora);
  poner('actualizada', ahora);
  poner('documento', fila.documento);
  poner('ficha', fila.ficha);
  poner('delPliego', fila.resumenPliego);

  for (const c of CAMPOS) {
    const celda = r.getCell(mapa[c.id]);
    const valor = fila.valores[c.id];
    // El cliente no tiene el dato: si el equipo ya lo completó a mano, se respeta.
    if (valor === FALTA_DATO && !nueva && !esVacio(textoCelda(celda.value))) continue;
    celda.value = valor;
    const falta = valor === FALTA_DATO;
    celda.fill = falta ? { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.falta } } : fila.delPliego[c.id] ? { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.pliego } } : undefined;
    celda.font = falta ? { italic: true, color: { argb: COLOR.textoFalta } } : undefined;
    if (fila.delPliego[c.id]) celda.note = `Tomado del pliego (${fila.delPliego[c.id]})`;
    else if (celda.note) celda.note = '';
  }
  r.alignment = { vertical: 'top', wrapText: true };
  r.commit();
  return { fila: n, nueva };
}

/** Ruta del Excel: ATLAS_EXCEL_SOLICITUDES en .env, o registros/solicitudes_clientes.xlsx dentro del proyecto. */
export function rutaExcel(env = {}, raiz = process.cwd()) {
  const r = (env.ATLAS_EXCEL_SOLICITUDES ?? '').trim();
  return path.resolve(raiz, r || ARCHIVO_POR_DEFECTO);
}

const rutaPendientes = (archivo) => path.join(path.dirname(archivo), 'solicitudes_pendientes.jsonl');

function leerPendientes(archivo) {
  try {
    return fs
      .readFileSync(rutaPendientes(archivo), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

/**
 * Guarda (o actualiza) la fila de una solicitud. Devuelve { ok, archivo, fila, nueva, pendiente? }.
 * Nunca lanza: si no se puede escribir (Excel abierto), deja la fila en espera y devuelve ok: false.
 */
export async function guardarSolicitud(datos, { archivo } = {}) {
  const destino = archivo ?? rutaExcel();
  const ahora = fecha();
  const fila = { ...armarFila(datos), creada: datos.creada ?? ahora };
  const enEspera = leerPendientes(destino).filter((p) => p.id !== fila.id);
  try {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const libro = new ExcelJS.Workbook();
    let hoja;
    if (fs.existsSync(destino)) {
      await libro.xlsx.readFile(destino);
      hoja = libro.getWorksheet(HOJA) ?? hojaNueva(libro);
    } else {
      libro.creator = 'Atlas · Asistente de visita';
      hoja = hojaNueva(libro);
    }
    const mapa = mapaColumnas(hoja);
    for (const p of enEspera) escribirFila(hoja, mapa, p, p.actualizada ?? ahora);
    const resultado = escribirFila(hoja, mapa, fila, ahora);
    await libro.xlsx.writeFile(destino);
    fs.rmSync(rutaPendientes(destino), { force: true });
    return { ok: true, archivo: destino, ...resultado };
  } catch (e) {
    try {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      const lineas = [...enEspera, { ...fila, actualizada: ahora }].map((p) => JSON.stringify(p)).join('\n') + '\n';
      fs.writeFileSync(rutaPendientes(destino), lineas, 'utf8');
    } catch {
      /* sin más opciones: se informa abajo */
    }
    const bloqueado = ['EBUSY', 'EPERM', 'EACCES'].includes(e.code);
    return {
      ok: false,
      archivo: destino,
      pendiente: true,
      error: bloqueado ? 'El Excel está abierto o bloqueado: ciérralo; la fila se guardará en el próximo registro.' : `No se pudo escribir el Excel: ${e.message}`
    };
  }
}
