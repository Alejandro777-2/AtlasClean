// Formulario del cliente: valores iniciales, validación y conversión a la entrada del Asistente de Visita.

export const FORMULARIO_VACIO = {
  empresa: '',
  contactoNombre: '',
  telefono: '',
  correo: '',
  tipoCliente: '',
  direccion: '',
  ciudad: '',
  tipologia: '',
  tipologiaOtro: '',
  m2: '',
  rango: '',
  areas: [],
  pisos: '',
  banos: '',
  afluencia: '',
  horario: [],
  frecuencia: '',
  nivelLimpieza: '',
  maquinariaPropia: '',
  insumosPropios: '',
  comentarios: ''
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vacio = (v) => String(v ?? '').trim() === '';
const numero = (v) => (vacio(v) ? null : Number(v));

/** Devuelve { campo: mensaje } con lo que falta o está mal. Objeto vacío = todo bien. */
export function validarFormulario(f) {
  const e = {};
  if (vacio(f.empresa)) e.empresa = 'Escribe el nombre de la empresa o entidad.';
  if (vacio(f.telefono) && vacio(f.correo)) e.telefono = 'Deja al menos un teléfono o un correo.';
  if (!vacio(f.correo) && !CORREO.test(f.correo.trim())) e.correo = 'El correo no tiene un formato válido.';
  if (vacio(f.direccion)) e.direccion = 'La dirección es necesaria para planificar la visita.';
  if (vacio(f.tipologia)) e.tipologia = 'Elige el tipo de lugar.';
  if (f.tipologia === 'otro' && vacio(f.tipologiaOtro)) e.tipologiaOtro = 'Describe qué tipo de lugar es.';
  const m2 = numero(f.m2);
  if (m2 !== null && !(m2 > 0)) e.m2 = 'Los metros cuadrados deben ser un número mayor que cero.';
  if (m2 === null && vacio(f.rango)) e.m2 = 'Indica los m² o elige un rango aproximado.';
  for (const campo of ['pisos', 'banos']) {
    const n = numero(f[campo]);
    if (n !== null && !(Number.isInteger(n) && n >= 0)) e[campo] = 'Debe ser un número entero.';
  }
  if (!f.areas.length) e.areas = 'Marca al menos un tipo de área.';
  if (!f.horario.length) e.horario = 'Elige al menos un horario.';
  if (vacio(f.frecuencia)) e.frecuencia = 'Elige la frecuencia.';
  if (vacio(f.nivelLimpieza)) e.nivelLimpieza = 'Elige el nivel de limpieza que espera.';
  return e;
}

const siNo = (v) => (v === 'si' ? true : v === 'no' ? false : null);
const textoONulo = (v) => (vacio(v) ? null : String(v).trim());

/** Convierte el formulario al JSON "solicitud" que describe el prompt del agente. */
export function aSolicitud(f) {
  return {
    empresa: textoONulo(f.empresa),
    contacto: { nombre: textoONulo(f.contactoNombre), telefono: textoONulo(f.telefono), correo: textoONulo(f.correo) },
    tipoCliente: f.tipoCliente || 'no_sabe',
    direccion: textoONulo(f.direccion),
    ciudad: textoONulo(f.ciudad),
    tipologia: f.tipologia || null,
    tipologiaOtro: f.tipologia === 'otro' ? textoONulo(f.tipologiaOtro) : null,
    tamano: { m2: numero(f.m2), rango: f.rango || null },
    areas: f.areas,
    pisos: numero(f.pisos),
    banos: numero(f.banos),
    afluencia: f.afluencia || null,
    horario: f.horario,
    frecuencia: f.frecuencia || null,
    nivelLimpieza: f.nivelLimpieza || null,
    recursosPropios: { maquinaria: siNo(f.maquinariaPropia), insumos: siNo(f.insumosPropios) },
    comentarios: textoONulo(f.comentarios)
  };
}
