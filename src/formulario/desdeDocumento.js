// Datos del formulario que la IA encontró en el documento del cliente.
// Se validan aquí (servidor y navegador usan la misma regla) y se aplican solo a los campos VACÍOS:
// lo que escribió el cliente nunca se pisa. En áreas se agregan las que falten.
import { AFLUENCIAS, AREAS, FRECUENCIAS, HORARIOS, NIVELES_LIMPIEZA, TIPOLOGIAS, TIPOS_CLIENTE } from '../config/opciones.js';

const valores = (lista) => lista.map((o) => o.valor);
const texto = (v) => String(v ?? '').trim();
const entero = (v) => {
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return Number.isInteger(n) && n >= 0 && String(v).match(/\d/) ? String(n) : null;
};
const codigos = (v, permitidos) => {
  const lista = (Array.isArray(v) ? v : String(v ?? '').split(/[,;|]/)).map((x) => texto(x)).filter((x) => permitidos.includes(x));
  return lista.length ? [...new Set(lista)] : null;
};
const deLista = (permitidos) => (v) => (permitidos.includes(texto(v)) ? texto(v) : null);
const siNo = (v) => {
  const t = texto(v).toLowerCase();
  return t === 'si' || t === 'sí' || t === 'true' ? 'si' : t === 'no' || t === 'false' ? 'no' : null;
};

/** Campos que se pueden llenar desde el documento: etiqueta para mostrar y cómo validar el valor. */
export const CAMPOS_DESDE_DOCUMENTO = {
  empresa: { etiqueta: 'Empresa o entidad', validar: (v) => texto(v) || null },
  contactoNombre: { etiqueta: 'Persona de contacto', validar: (v) => texto(v) || null },
  telefono: { etiqueta: 'Teléfono', validar: (v) => (/\d{6,}/.test(texto(v).replace(/\D/g, '')) ? texto(v) : null) },
  correo: { etiqueta: 'Correo', validar: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(v)) ? texto(v) : null) },
  tipoCliente: { etiqueta: 'Tipo de cliente', validar: deLista(valores(TIPOS_CLIENTE).filter((v) => v !== 'no_sabe')) },
  direccion: { etiqueta: 'Dirección', validar: (v) => texto(v) || null },
  ciudad: { etiqueta: 'Ciudad', validar: (v) => texto(v) || null },
  tipologia: { etiqueta: 'Tipo de lugar', validar: deLista(valores(TIPOLOGIAS).filter((v) => v !== 'otro')) },
  m2: { etiqueta: 'Metros cuadrados', validar: (v) => (Number(entero(v)) > 0 ? entero(v) : null) },
  pisos: { etiqueta: 'Número de pisos', validar: entero },
  banos: { etiqueta: 'Número de baños', validar: entero },
  areas: { etiqueta: 'Áreas', validar: (v) => codigos(v, valores(AREAS)), lista: true },
  afluencia: { etiqueta: 'Afluencia de personas', validar: deLista(valores(AFLUENCIAS)) },
  horario: { etiqueta: 'Horario del servicio', validar: (v) => codigos(v, valores(HORARIOS)), lista: true },
  frecuencia: { etiqueta: 'Frecuencia de limpieza', validar: deLista(valores(FRECUENCIAS)) },
  nivelLimpieza: { etiqueta: 'Nivel de limpieza', validar: deLista(valores(NIVELES_LIMPIEZA)) },
  maquinariaPropia: { etiqueta: '¿Tiene maquinaria propia?', validar: siNo },
  insumosPropios: { etiqueta: '¿Aporta sus propios insumos?', validar: siNo }
};

/** Deja solo los datos válidos (uno por campo, el primero). Devuelve [{ campo, valor, pagina, cita }]. */
export function normalizarDesdeDocumento(lista) {
  const vistos = new Set();
  const salida = [];
  for (const d of Array.isArray(lista) ? lista : []) {
    const def = CAMPOS_DESDE_DOCUMENTO[d?.campo];
    if (!def || vistos.has(d.campo)) continue;
    const valor = def.validar(d.valor);
    if (valor == null) continue;
    vistos.add(d.campo);
    salida.push({ campo: d.campo, valor, pagina: Number.isInteger(d.pagina) ? d.pagina : null, cita: texto(d.cita) });
  }
  return salida;
}

const vacio = (v) => (Array.isArray(v) ? v.length === 0 : texto(v) === '');

/**
 * Aplica al formulario los datos del documento sin pisar lo que ya llenó el cliente.
 * Devuelve { formulario, aplicados: [{ campo, valor, pagina, cita, agregado? }] }.
 */
export function aplicarDesdeDocumento(formulario, datos) {
  const nuevo = { ...formulario };
  const aplicados = [];
  for (const d of datos ?? []) {
    if (!(d.campo in nuevo)) continue;
    const actual = nuevo[d.campo];
    if (vacio(actual)) {
      nuevo[d.campo] = d.valor;
      aplicados.push(d);
    } else if (d.campo === 'areas') {
      const faltan = d.valor.filter((a) => !actual.includes(a));
      if (faltan.length) {
        nuevo.areas = [...actual, ...faltan];
        aplicados.push({ ...d, valor: faltan, agregado: true });
      }
    }
  }
  return { formulario: nuevo, aplicados };
}

const ETIQUETAS_VALOR = Object.fromEntries(
  [...TIPOS_CLIENTE, ...TIPOLOGIAS, ...AREAS, ...AFLUENCIAS, ...HORARIOS, ...FRECUENCIAS, ...NIVELES_LIMPIEZA].map((o) => [o.valor, o.etiqueta.replace(/\s*\(.*\)$/, '')])
);

/** Valor para mostrar a una persona: "Áreas: Baños, Oficinas", "m²: 3.850", "Sí". */
export function valorLegible(campo, valor) {
  if (Array.isArray(valor)) return valor.map((v) => ETIQUETAS_VALOR[v] ?? v).join(', ');
  if (campo === 'm2') return `${Number(valor).toLocaleString('es-EC')} m²`;
  if (valor === 'si') return 'Sí';
  if (valor === 'no') return 'No';
  return ETIQUETAS_VALOR[valor] ?? valor;
}
