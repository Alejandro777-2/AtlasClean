/**
 * FICHA EN MODO DEMOSTRACIÓN (sin IA)
 * Aplica, con código, las mismas reglas que el prompt del agente: traducción a la configuración
 * del motor, contradicciones, puntos a verificar y preguntas. Sirve para:
 *  - mostrar la app funcionando sin API key,
 *  - tener una respuesta de respaldo predecible.
 * No lee documentos: si hay uno adjunto, lo marca como pendiente de revisar.
 */
import { protocoloPara, RIESGO_POR_AREA } from '../src/config/reglasZonas.js';

const NOMBRE_PROTOCOLO = { hospital_grade: 'desinfección de alto nivel', clinical_intermediate: 'desinfección intermedia', food_safe: 'productos de grado alimentario', standard: 'limpieza estándar', industrial_degreaser: 'desengrase industrial' };

const NOMBRE_AREA = {
  oficinas: 'oficinas',
  banos: 'baños',
  criticas: 'áreas críticas',
  cocina_comedor: 'cocina o comedor',
  bodegas: 'bodegas',
  externas: 'áreas externas',
  aulas: 'aulas',
  atencion_publico: 'atención al público',
  hospitalizacion: 'hospitalización',
  otra: 'esta zona'
};
const NOMBRE_TIPOLOGIA = {
  hospital_critical: 'área crítica hospitalaria',
  general_healthcare: 'hospitalización general o clínica',
  food_court_retail: 'centro comercial o patio de comidas',
  corporate_office: 'oficinas o edificio público',
  industrial_logistics: 'planta industrial o bodega',
  educational_campus: 'centro educativo'
};
const TIPOLOGIAS = Object.keys(NOMBRE_TIPOLOGIA);
const TRAFICO = { baja: 'low', media: 'medium', alta: 'high', muy_alta: 'extreme' };
const REFERENCIA_RANGO = { menos_500: 300, '500_2000': 1200, '2000_5000': 3500, mas_5000: 6000 };
const REGIMEN_DEFECTO = {
  hospital_critical: 'continuous_24_7',
  general_healthcare: 'continuous_24_7',
  food_court_retail: 'extended_16h_7d',
  corporate_office: 'diurno_5d',
  educational_campus: 'diurno_5d',
  industrial_logistics: 'diurno_6d'
};
const ES_SALUD = (t) => t === 'hospital_critical' || t === 'general_healthcare';

export function generarFichaDemo(solicitud = {}, documento = null) {
  const s = solicitud;
  const areas = Array.isArray(s.areas) ? s.areas : [];
  const horario = Array.isArray(s.horario) ? s.horario : [];
  const tieneCriticas = areas.includes('criticas');
  const contradicciones = [];
  const verificar = [];
  const preguntas = [];

  // 1. Tipología
  let tipologia;
  if (TIPOLOGIAS.includes(s.tipologia)) tipologia = { valor: s.tipologia, confianza: 'alta', motivo: 'Indicada por el cliente en el formulario.' };
  else {
    const valor = tieneCriticas ? 'hospital_critical' : areas.includes('cocina_comedor') ? 'food_court_retail' : areas.includes('aulas') ? 'educational_campus' : areas.includes('bodegas') || areas.includes('externas') ? 'industrial_logistics' : 'corporate_office';
    tipologia = { valor, confianza: 'baja', motivo: s.tipologia === 'otro' ? `El cliente indicó "${s.tipologiaOtro || 'otro'}"; se usa la tipología más parecida según sus áreas.` : 'No se indicó; se deduce de las áreas.' };
  }
  const t = tipologia.valor;

  // 2. Régimen
  let regimen;
  if (horario.includes('24_7')) regimen = { valor: 'continuous_24_7', confianza: 'alta', motivo: 'El cliente pidió cobertura 24/7.' };
  else if (horario.includes('diurno') && horario.includes('nocturno')) {
    regimen = { valor: 'extended_16h_7d', confianza: 'media', motivo: 'Servicio diurno y nocturno sin 24/7: se aproxima con dos turnos.' };
    preguntas.push('¿Cuál es el horario exacto del servicio y qué días de la semana?');
  } else if (horario.includes('diurno') && horario.includes('fines_de_semana')) {
    regimen = { valor: 'diurno_6d', confianza: 'media', motivo: 'Servicio diurno con fines de semana.' };
    preguntas.push('¿El servicio incluye domingos?');
  } else if (horario.includes('diurno')) regimen = { valor: 'diurno_5d', confianza: 'alta', motivo: 'Servicio diurno de lunes a viernes.' };
  else if (horario.includes('nocturno')) {
    regimen = { valor: 'extended_16h_7d', confianza: 'baja', motivo: 'El motor no tiene un régimen solo nocturno: se usa una aproximación.' };
    contradicciones.push({ descripcion: 'El servicio solo nocturno no existe como régimen en el motor de Atlas.', camposInvolucrados: ['horario'], comoResolverEnVisita: 'Confirmar el horario exacto para elegir el régimen más cercano.' });
  } else regimen = { valor: REGIMEN_DEFECTO[t], confianza: 'baja', motivo: 'No se indicó horario; se usa el habitual de la tipología.' };

  // 3. Pasadas por día
  let pasadas;
  if (s.frecuencia === 'varias_al_dia') pasadas = { valor: tieneCriticas ? 3 : 2, confianza: 'media', motivo: tieneCriticas ? 'Varias pasadas al día con áreas críticas.' : 'Varias pasadas al día.' };
  else if (s.frecuencia === 'diaria') pasadas = { valor: 1, confianza: 'alta', motivo: 'Una pasada diaria.' };
  else if (s.frecuencia === 'algunos_dias') {
    pasadas = { valor: 1, confianza: 'baja', motivo: 'El cliente pidió algunos días por semana.' };
    contradicciones.push({ descripcion: 'El cliente pidió limpieza solo algunos días, pero el motor asume servicio diario.', camposInvolucrados: ['frecuencia'], comoResolverEnVisita: 'Confirmar qué días exactos y ajustar el régimen.' });
  } else pasadas = { valor: 1, confianza: 'baja', motivo: 'No se indicó frecuencia.' };

  // 4. Tamaño de referencia
  const m2 = Number(s.tamano?.m2);
  const tamano = Number.isFinite(m2) && m2 > 0
    ? { m2, esAproximado: true, motivo: 'Dato del cliente: confirmar midiendo en la visita.' }
    : REFERENCIA_RANGO[s.tamano?.rango]
      ? { m2: REFERENCIA_RANGO[s.tamano.rango], esAproximado: true, motivo: 'Valor de referencia del rango indicado: aproximado, medir en visita.' }
      : { m2: null, esAproximado: true, motivo: 'El cliente no indicó el tamaño.' };

  // 5. Maquinaria
  const grande = (tamano.m2 ?? 0) >= 2000;
  let maquinaria;
  if (grande && (areas.includes('bodegas') || areas.includes('externas') || areas.includes('atencion_publico'))) maquinaria = { valor: 'heavy_mechanized', confianza: 'media', motivo: 'Superficie grande con áreas amplias.' };
  else if (s.tamano?.rango === 'menos_500' || (tamano.m2 && tamano.m2 < 500)) maquinaria = { valor: 'manual', confianza: 'media', motivo: 'Superficie pequeña.' };
  else maquinaria = { valor: 'semi_mechanized', confianza: 'media', motivo: 'Nivel estándar de las fichas SERCOP.' };
  if (s.recursosPropios?.maquinaria === true) {
    maquinaria.motivo += ' El cliente tiene maquinaria propia.';
    verificar.push({ punto: 'Revisar el estado y tipo de la maquinaria del cliente', porQue: 'Si es propia, no se cotiza su costo, pero debe servir para el rendimiento esperado.', prioridad: 'media' });
  }

  // 6. Zonas propuestas
  const trafico = TRAFICO[s.afluencia] ?? 'medium';
  const listaAreas = areas.length ? areas : ['otra'];
  const zonas = listaAreas.map((area) => {
    const protocolo = protocoloPara({ area, nivelLimpieza: s.nivelLimpieza, tipologia: t, comentarios: s.comentarios });
    return {
      area,
      nombre: '',
      m2: null,
      riesgo: RIESGO_POR_AREA[area] ?? 2,
      trafico,
      protocolo,
      confianza: areas.length && s.afluencia ? 'media' : 'baja',
      motivo:
        area === 'criticas'
          ? 'Las áreas críticas siempre llevan desinfección de alto nivel.'
          : `Riesgo habitual de ${NOMBRE_AREA[area] ?? 'esta zona'}; con limpieza ${s.nivelLimpieza ?? 'sin especificar'} corresponde ${NOMBRE_PROTOCOLO[protocolo]}.`
    };
  });

  // 7. Contradicciones
  if (tieneCriticas && (s.nivelLimpieza === 'leve' || s.nivelLimpieza === 'medio')) contradicciones.push({ descripcion: `Tiene áreas críticas pero pidió limpieza ${s.nivelLimpieza}: las áreas críticas requieren desinfección de alto nivel.`, camposInvolucrados: ['areas', 'nivelLimpieza'], comoResolverEnVisita: 'Explicar al cliente el protocolo obligatorio en áreas críticas y medir esas áreas por separado.' });
  if (ES_SALUD(t) && !horario.includes('24_7')) contradicciones.push({ descripcion: 'Es un establecimiento de salud sin cobertura 24/7.', camposInvolucrados: ['tipologia', 'horario'], comoResolverEnVisita: 'Confirmar si necesita cobertura nocturna o 24/7.' });
  if (s.afluencia === 'muy_alta' && (s.frecuencia === 'algunos_dias' || s.frecuencia === 'diaria')) contradicciones.push({ descripcion: 'Afluencia muy alta con una sola pasada diaria o menos.', camposInvolucrados: ['afluencia', 'frecuencia'], comoResolverEnVisita: 'Observar el nivel de suciedad en horas pico y proponer más pasadas.' });
  if (tieneCriticas && ['corporate_office', 'educational_campus', 'industrial_logistics'].includes(t)) contradicciones.push({ descripcion: `Marcó áreas críticas en un sitio de tipo ${NOMBRE_TIPOLOGIA[t]}.`, camposInvolucrados: ['areas', 'tipologia'], comoResolverEnVisita: 'Confirmar qué son esas áreas (laboratorio, enfermería, sala limpia).' });
  if (s.tamano?.rango === 'menos_500' && ((s.pisos ?? 0) >= 4 || (s.banos ?? 0) >= 10)) contradicciones.push({ descripcion: 'El tamaño indicado parece pequeño para la cantidad de pisos o baños.', camposInvolucrados: ['tamano', 'pisos', 'banos'], comoResolverEnVisita: 'Medir el área total piso por piso.' });
  if (s.tamano?.rango === 'mas_5000' && s.pisos === 1 && (s.banos ?? 0) > 0 && s.banos <= 2) contradicciones.push({ descripcion: 'El tamaño indicado parece grande para un solo piso con pocos baños.', camposInvolucrados: ['tamano', 'pisos', 'banos'], comoResolverEnVisita: 'Confirmar qué superficies se incluyen (parqueaderos, patios).' });
  if (s.recursosPropios?.insumos === true && s.nivelLimpieza === 'profundo') contradicciones.push({ descripcion: 'El cliente aporta sus insumos y pide limpieza profunda.', camposInvolucrados: ['recursosPropios', 'nivelLimpieza'], comoResolverEnVisita: 'Revisar que sus productos tengan registro sanitario y sirvan para desinfección de alto nivel.' });
  if (s.tipoCliente === 'publico' && !documento && !(s.comentarios ?? '').trim()) {
    contradicciones.push({ descripcion: 'Cliente público sin documento ni detalle del proceso de compra.', camposInvolucrados: ['tipoCliente'], comoResolverEnVisita: 'Pedir el pliego o los términos de referencia.' });
    preguntas.push('¿La contratación será por catálogo electrónico del SERCOP o por un proceso con presupuesto referencial?');
  }

  // 8. Puntos a verificar (los de mayor impacto primero)
  if (tieneCriticas) verificar.unshift({ punto: 'Medir los m² exactos de las áreas críticas', porQue: 'Requieren más personal y desinfección de alto nivel; cambian mucho el precio.', prioridad: 'alta' });
  verificar.push({ punto: 'Medir el área total por zona', porQue: tamano.m2 ? 'El tamaño del formulario es aproximado.' : 'El cliente no indicó el tamaño.', prioridad: 'alta' });
  verificar.push({ punto: 'Confirmar horario y días de servicio', porQue: 'Define los turnos y el recargo nocturno.', prioridad: 'alta' });
  verificar.push({ punto: 'Contar baños y puntos de agua', porQue: 'Cambian el consumo de insumos y el tiempo de limpieza.', prioridad: 'media' });
  verificar.push({ punto: 'Identificar el tipo de piso predominante', porQue: 'Define la maquinaria y los productos.', prioridad: 'media' });
  if (ES_SALUD(t) || tieneCriticas) verificar.push({ punto: 'Preguntar quién gestiona los desechos peligrosos', porQue: 'En salud los retira un gestor autorizado; no debe cotizarse por error.', prioridad: 'media' });
  if (s.recursosPropios?.insumos === true) verificar.push({ punto: 'Revisar los insumos que aporta el cliente', porQue: 'Deben tener registro sanitario y ser adecuados al protocolo.', prioridad: 'media' });
  if (documento) verificar.push({ punto: `Revisar el documento adjunto (${documento.nombre ?? 'archivo'})`, porQue: 'En modo demostración el documento no se analiza.', prioridad: 'alta' });

  // 9. Preguntas generales
  preguntas.push('¿Hay horarios en los que no se puede limpiar o zonas de acceso restringido?');
  preguntas.push('¿Qué tan satisfecho está con el servicio actual y qué le gustaría mejorar?');

  // 10. Faltantes y notas
  const faltantes = [];
  if (!TIPOLOGIAS.includes(s.tipologia) && s.tipologia !== 'otro') faltantes.push('Tipo de infraestructura');
  if (!(s.direccion ?? '').trim()) faltantes.push('Dirección del lugar');
  if (!(s.contacto?.telefono ?? '').trim() && !(s.contacto?.correo ?? '').trim()) faltantes.push('Teléfono o correo de contacto');

  const notas = {
    publico: 'Cliente público: el precio no puede superar el presupuesto referencial y, si compra por catálogo electrónico del SERCOP, el precio por m² está fijado. Aplican garantías y la retención del 100 % del IVA. Validar con un especialista en contratación pública.',
    privado: 'Cliente privado: el precio, la forma de pago y las garantías se negocian.',
    no_sabe: 'Confirmar si el cliente es público o privado: cambian las reglas del precio.'
  }[s.tipoCliente] ?? '';

  const llevar = ['Medidor de distancias (metro láser o cinta)', 'Lista de chequeo de zonas', 'Planos del lugar, si el cliente los tiene'];
  if (tieneCriticas || ES_SALUD(t)) llevar.push('Equipo de protección para ingresar a áreas de salud');

  const nombreSitio = NOMBRE_TIPOLOGIA[t];
  const resumen = [
    `${(s.empresa ?? '').trim() || 'El cliente'} solicita limpieza para ${nombreSitio}${s.ciudad ? ` en ${s.ciudad}` : ''}.`,
    tamano.m2 ? `Tamaño de referencia: unos ${tamano.m2.toLocaleString('es-EC')} m² (aproximado).` : 'No indicó el tamaño.',
    `Espera una limpieza ${s.nivelLimpieza ?? 'sin especificar'} con ${pasadas.valor} pasada(s) al día.`,
    contradicciones.length ? `Hay ${contradicciones.length} punto(s) a aclarar en la visita.` : 'No se detectaron contradicciones.'
  ].join(' ');

  return {
    resumen,
    configuracionInicial: { tipologia, regimenSugerido: regimen, pasadasSugeridas: pasadas, maquinariaSugerida: maquinaria, tamanoReferencia: tamano, zonasPropuestas: zonas },
    estimacionPrevia: 'pendiente: se calcula con el motor tras la visita',
    contradicciones: contradicciones.slice(0, 6),
    verificarEnVisita: verificar.slice(0, 8),
    preguntasParaElCliente: preguntas.slice(0, 5),
    llevarALaVisita: llevar,
    datosDelDocumento: [],
    formularioDesdeDocumento: [],
    requisitosDelDocumento: Object.fromEntries(['personal', 'insumos', 'equipos', 'costos', 'propuesta'].map((m) => [m, { resumen: '', detalles: [] }])),
    notasComerciales: notas,
    camposFaltantes: faltantes,
    listoParaVisita: faltantes.length === 0
  };
}
