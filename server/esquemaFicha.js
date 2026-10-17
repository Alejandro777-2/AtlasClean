/**
 * ESQUEMA DE LA FICHA PREVIA A LA VISITA
 * Es el mismo formato de salida que pide el prompt del agente. Se usa para:
 *  1. Forzar a Claude a responder con esta forma (herramienta con input_schema).
 *  2. Revisar y normalizar la respuesta antes de mostrarla (normalizarFicha).
 * Si cambia el formato en el prompt, hay que cambiarlo aquí también.
 */
import { AREAS_MOTOR } from '../src/config/reglasZonas.js';
import { fichaLegible } from './textoLegible.js';
import { CAMPOS_DESDE_DOCUMENTO, normalizarDesdeDocumento } from '../src/formulario/desdeDocumento.js';

export const REGIMENES = ['diurno_5d', 'diurno_6d', 'extended_16h_7d', 'continuous_24_7'];
export const MAQUINARIAS = ['manual', 'semi_mechanized', 'heavy_mechanized'];
export const PROTOCOLOS = ['standard', 'food_safe', 'clinical_intermediate', 'hospital_grade', 'industrial_degreaser'];
export const TRAFICOS = ['low', 'medium', 'high', 'extreme'];
export const CONFIANZAS = ['alta', 'media', 'baja'];
export const PRIORIDADES = ['alta', 'media', 'baja'];
export const TIPOLOGIAS = ['hospital_critical', 'general_healthcare', 'food_court_retail', 'corporate_office', 'industrial_logistics', 'educational_campus'];
export { AREAS_MOTOR as AREAS } from '../src/config/reglasZonas.js';

/** Módulos de la cotización (pasos 2 a 6) para los que se anotan los requisitos del pliego. */
export const MODULOS = ['personal', 'insumos', 'equipos', 'costos', 'propuesta'];

const texto = { type: 'string' };
const confianza = { type: 'string', enum: CONFIANZAS };
const numeroONulo = { type: ['number', 'null'] };
const requisitosModulo = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Máximo 45 caracteres, en palabras simples. Vacío si el documento no dice nada de este módulo.' },
    detalles: {
      type: 'array',
      items: { type: 'object', properties: { texto: texto, pagina: { type: ['integer', 'null'] }, cita: texto }, required: ['texto', 'pagina'] }
    }
  },
  required: ['resumen', 'detalles']
};
const supuesto = (valor) => ({ type: 'object', properties: { valor, confianza, motivo: texto }, required: ['valor', 'confianza', 'motivo'] });

export const ESQUEMA_FICHA = {
  type: 'object',
  properties: {
    resumen: texto,
    configuracionInicial: {
      type: 'object',
      properties: {
        tipologia: supuesto({ type: 'string', enum: TIPOLOGIAS }),
        regimenSugerido: supuesto({ type: 'string', enum: REGIMENES }),
        pasadasSugeridas: supuesto({ type: 'integer', minimum: 1, maximum: 8 }),
        maquinariaSugerida: supuesto({ type: 'string', enum: MAQUINARIAS }),
        tamanoReferencia: {
          type: 'object',
          properties: { m2: { type: ['number', 'null'] }, esAproximado: { type: 'boolean' }, motivo: texto },
          required: ['m2', 'esAproximado', 'motivo']
        },
        zonasPropuestas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string', enum: AREAS_MOTOR, description: 'Categoría del motor (código). El nombre real va en "nombre".' },
              nombre: { type: 'string', description: 'Cómo llama el cliente o el documento a esta zona, con ubicación si se sabe. Ej.: "Emergencia, planta baja".' },
              m2: numeroONulo,
              riesgo: { type: 'integer', minimum: 1, maximum: 5 },
              trafico: { type: 'string', enum: TRAFICOS },
              protocolo: { type: 'string', enum: PROTOCOLOS },
              confianza,
              motivo: texto
            },
            required: ['area', 'nombre', 'm2', 'riesgo', 'trafico', 'protocolo', 'confianza', 'motivo']
          }
        }
      },
      required: ['tipologia', 'regimenSugerido', 'pasadasSugeridas', 'maquinariaSugerida', 'tamanoReferencia', 'zonasPropuestas']
    },
    estimacionPrevia: texto,
    contradicciones: {
      type: 'array',
      items: { type: 'object', properties: { descripcion: texto, camposInvolucrados: { type: 'array', items: texto }, comoResolverEnVisita: texto }, required: ['descripcion', 'comoResolverEnVisita'] }
    },
    verificarEnVisita: {
      type: 'array',
      items: { type: 'object', properties: { punto: texto, porQue: texto, prioridad: { type: 'string', enum: PRIORIDADES } }, required: ['punto', 'porQue', 'prioridad'] }
    },
    preguntasParaElCliente: { type: 'array', items: texto },
    llevarALaVisita: { type: 'array', items: texto },
    datosDelDocumento: {
      type: 'array',
      items: { type: 'object', properties: { campo: texto, valor: texto, pagina: { type: ['integer', 'null'] }, cita: texto }, required: ['campo', 'valor'] }
    },
    formularioDesdeDocumento: {
      type: 'array',
      description: 'Datos del formulario del cliente que aparecen en el documento (aunque el cliente no los haya llenado). Valor con los códigos del formulario.',
      items: {
        type: 'object',
        properties: {
          campo: { type: 'string', enum: Object.keys(CAMPOS_DESDE_DOCUMENTO) },
          valor: { type: 'string', description: 'Códigos del formulario; para areas y horario, varios códigos separados por coma; números solo con dígitos.' },
          pagina: { type: ['integer', 'null'] },
          cita: texto
        },
        required: ['campo', 'valor', 'pagina']
      }
    },
    requisitosDelDocumento: {
      type: 'object',
      description: 'Lo que el documento exige para cada módulo de la cotización. Solo datos del documento, nunca cálculos.',
      properties: Object.fromEntries(MODULOS.map((m) => [m, requisitosModulo])),
      required: MODULOS
    },
    notasComerciales: texto,
    camposFaltantes: { type: 'array', items: texto },
    listoParaVisita: { type: 'boolean' }
  },
  required: [
    'resumen',
    'configuracionInicial',
    'estimacionPrevia',
    'contradicciones',
    'verificarEnVisita',
    'preguntasParaElCliente',
    'llevarALaVisita',
    'datosDelDocumento',
    'requisitosDelDocumento',
    'formularioDesdeDocumento',
    'notasComerciales',
    'camposFaltantes',
    'listoParaVisita'
  ]
};

// Orden de salida: lo que viene del documento va primero, para que nunca quede fuera si la respuesta es larga.
const ORDEN = ['resumen', 'datosDelDocumento', 'formularioDesdeDocumento', 'requisitosDelDocumento', 'configuracionInicial', 'contradicciones', 'verificarEnVisita', 'preguntasParaElCliente', 'llevarALaVisita', 'estimacionPrevia', 'notasComerciales', 'camposFaltantes', 'listoParaVisita'];
ESQUEMA_FICHA.properties = Object.fromEntries(ORDEN.map((k) => [k, ESQUEMA_FICHA.properties[k]]));
ESQUEMA_FICHA.required = ORDEN;

const LIMITES = { verificarEnVisita: 8, preguntasParaElCliente: 5, contradicciones: 6 };

const cadena = (v, porDefecto = '') => (typeof v === 'string' ? v.trim() : v == null ? porDefecto : String(v));
const lista = (v) => (Array.isArray(v) ? v : []);
const deLista = (v, permitidos, porDefecto) => (permitidos.includes(v) ? v : porDefecto);
const entero = (v, min, max, porDefecto) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : porDefecto;
};

/** Si la IA mezcló código y descripción ("criticas (quirófanos, piso 2)"), los separa. */
function separarArea(z) {
  const area = cadena(z?.area);
  const m = /^([a-z_]+)\s*[(:,-]\s*(.+?)\)?\s*$/.exec(area);
  if (!m || !AREAS_MOTOR.includes(m[1])) return z;
  // Si los m² venían dentro del texto ("…, 730 m²"), se pasan a su columna.
  const metros = /([\d.]+)\s*m(?:²|2)(?![a-z])/i.exec(m[2]);
  const m2 = z?.m2 ?? (metros ? Number(metros[1].replace(/\./g, '')) : null);
  const nombre = cadena(z?.nombre) || (metros && z?.m2 == null ? m[2].replace(metros[0], '').replace(/[,\s]+$/, '') : m[2]);
  return { ...z, area: m[1], nombre, m2 };
}

function normalizarSupuesto(s, permitidos, porDefecto, problemas, nombre) {
  const valor = s?.valor;
  const valido = permitidos ? permitidos.includes(valor) : valor != null;
  if (!valido) problemas.push(`${nombre}: valor no válido (${JSON.stringify(valor)}); se usó ${JSON.stringify(porDefecto)}.`);
  return {
    valor: valido ? valor : porDefecto,
    confianza: valido ? deLista(s?.confianza, CONFIANZAS, 'baja') : 'baja',
    motivo: cadena(s?.motivo)
  };
}

/**
 * Revisa la ficha que devolvió la IA y la deja con la forma exacta que espera la pantalla.
 * Corrige lo que puede (valores fuera de lista, listas demasiado largas) y lo informa en `problemas`.
 * Lanza un error si falta lo esencial.
 */
export function normalizarFicha(f) {
  if (!f || typeof f !== 'object') throw new Error('La IA no devolvió una ficha.');
  if (!f.configuracionInicial || typeof f.configuracionInicial !== 'object') throw new Error('La ficha no trae la configuración inicial.');
  const problemas = [];
  const c = f.configuracionInicial;

  const configuracionInicial = {
    tipologia: normalizarSupuesto(c.tipologia, TIPOLOGIAS, 'corporate_office', problemas, 'tipologia'),
    regimenSugerido: normalizarSupuesto(c.regimenSugerido, REGIMENES, 'diurno_5d', problemas, 'regimenSugerido'),
    pasadasSugeridas: { ...normalizarSupuesto(c.pasadasSugeridas, null, 1, problemas, 'pasadasSugeridas') },
    maquinariaSugerida: normalizarSupuesto(c.maquinariaSugerida, MAQUINARIAS, 'semi_mechanized', problemas, 'maquinariaSugerida'),
    tamanoReferencia: {
      m2: Number.isFinite(Number(c.tamanoReferencia?.m2)) && c.tamanoReferencia?.m2 !== null ? Number(c.tamanoReferencia.m2) : null,
      esAproximado: c.tamanoReferencia?.esAproximado !== false,
      motivo: cadena(c.tamanoReferencia?.motivo)
    },
    zonasPropuestas: lista(c.zonasPropuestas).map(separarArea).map((z) => ({
      area: deLista(z?.area, AREAS_MOTOR, 'otra'),
      nombre: cadena(z?.nombre) || (AREAS_MOTOR.includes(z?.area) ? '' : cadena(z?.area)),
      m2: Number.isFinite(Number(z?.m2)) && z?.m2 !== null && z?.m2 !== '' && Number(z.m2) > 0 ? Number(z.m2) : null,
      riesgo: entero(z?.riesgo, 1, 5, 2),
      trafico: deLista(z?.trafico, TRAFICOS, 'medium'),
      protocolo: deLista(z?.protocolo, PROTOCOLOS, 'standard'),
      confianza: deLista(z?.confianza, CONFIANZAS, 'baja'),
      motivo: cadena(z?.motivo)
    }))
  };
  configuracionInicial.pasadasSugeridas.valor = entero(configuracionInicial.pasadasSugeridas.valor, 1, 8, 1);

  const recortar = (nombre, valores) => {
    if (valores.length > LIMITES[nombre]) problemas.push(`${nombre}: se recortó a ${LIMITES[nombre]} elementos.`);
    return valores.slice(0, LIMITES[nombre]);
  };

  const ficha = {
    resumen: cadena(f.resumen) || 'Sin resumen.',
    configuracionInicial,
    estimacionPrevia: cadena(f.estimacionPrevia) || 'pendiente: se calcula con el motor tras la visita',
    contradicciones: recortar(
      'contradicciones',
      lista(f.contradicciones)
        .filter((x) => cadena(x?.descripcion))
        .map((x) => ({ descripcion: cadena(x.descripcion), camposInvolucrados: lista(x.camposInvolucrados).map((v) => cadena(v)), comoResolverEnVisita: cadena(x.comoResolverEnVisita) }))
    ),
    verificarEnVisita: recortar(
      'verificarEnVisita',
      lista(f.verificarEnVisita)
        .filter((x) => cadena(x?.punto))
        .map((x) => ({ punto: cadena(x.punto), porQue: cadena(x.porQue), prioridad: deLista(x.prioridad, PRIORIDADES, 'media') }))
    ),
    preguntasParaElCliente: recortar('preguntasParaElCliente', lista(f.preguntasParaElCliente).map((v) => cadena(v)).filter(Boolean)),
    llevarALaVisita: lista(f.llevarALaVisita).map((v) => cadena(v)).filter(Boolean),
    datosDelDocumento: lista(f.datosDelDocumento)
      .filter((x) => cadena(x?.campo))
      .map((x) => ({ campo: cadena(x.campo), valor: cadena(x.valor), pagina: Number.isInteger(x.pagina) ? x.pagina : null, cita: cadena(x.cita) })),
    requisitosDelDocumento: Object.fromEntries(
      MODULOS.map((m) => {
        const r = f.requisitosDelDocumento?.[m];
        const detalles = lista(r?.detalles)
          .filter((d) => cadena(d?.texto))
          .slice(0, 6)
          .map((d) => ({ texto: cadena(d.texto), pagina: Number.isInteger(d.pagina) ? d.pagina : null, cita: cadena(d.cita) }));
        let resumen = cadena(r?.resumen);
        if (!resumen && detalles.length) resumen = detalles[0].texto;
        if (resumen.length > 60) resumen = `${resumen.slice(0, 57).trimEnd()}…`;
        return [m, { resumen, detalles }];
      })
    ),
    formularioDesdeDocumento: normalizarDesdeDocumento(f.formularioDesdeDocumento),
    notasComerciales: cadena(f.notasComerciales),
    camposFaltantes: lista(f.camposFaltantes).map((v) => cadena(v)).filter(Boolean),
    listoParaVisita: f.listoParaVisita === true
  };
  return { ficha: fichaLegible(ficha), problemas };
}
