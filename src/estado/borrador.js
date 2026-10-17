// Borrador guardado en el navegador. Si el formato no es el esperado (versión anterior o datos dañados), se ignora.
import { FORMULARIO_VACIO } from '../formulario/solicitud.js';

export const CLAVE_BORRADOR = 'atlas:solicitud:v1';

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const esFicha = (f) =>
  esObjeto(f) &&
  esObjeto(f.configuracionInicial) &&
  Array.isArray(f.configuracionInicial.zonasPropuestas) &&
  ['verificarEnVisita', 'preguntasParaElCliente', 'llevarALaVisita', 'contradicciones', 'camposFaltantes', 'datosDelDocumento'].every((k) => Array.isArray(f[k]));

export function leerBorrador() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_BORRADOR) ?? 'null');
    if (!esObjeto(g)) return {};
    const formulario = {};
    if (esObjeto(g.formulario)) {
      for (const [clave, inicial] of Object.entries(FORMULARIO_VACIO)) {
        const v = g.formulario[clave];
        if (Array.isArray(inicial) ? Array.isArray(v) : typeof v === 'string') formulario[clave] = v;
      }
    }
    const ficha = esFicha(g.ficha) ? g.ficha : null;
    return {
      formulario,
      ficha,
      meta: ficha && esObjeto(g.meta) ? g.meta : null,
      verificados: ficha && Array.isArray(g.verificados) ? g.verificados.filter(Number.isInteger) : [],
      desdeDocumento: Array.isArray(g.desdeDocumento) ? g.desdeDocumento.filter((d) => esObjeto(d) && typeof d.campo === 'string') : [],
      documentoNombre: typeof g.documentoNombre === 'string' ? g.documentoNombre : null,
      documentoTamano: Number.isFinite(g.documentoTamano) ? g.documentoTamano : null
    };
  } catch {
    return {};
  }
}

export function guardarBorrador(datos) {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
  } catch {
    /* almacenamiento no disponible: se sigue sin borrador */
  }
}
