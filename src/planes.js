/**
 * Configuración de los planes de precios (sección "Planes" de la landing).
 * Único sitio donde se escriben precios y textos comerciales: el precio por mes y el % de ahorro
 * se calculan a partir de aquí.
 *
 * VALORES PROVISIONALES: los precios son de ejemplo hasta que el equipo confirme los reales.
 * Mientras `preciosProvisionales` sea true, la sección muestra la etiqueta "Precios de ejemplo".
 * Los textos marcados [CONFIRMAR] no se muestran (null) o deben validarse antes de publicar.
 */
export const CONFIG_PLANES = {
  preciosProvisionales: true,
  moneda: 'USD',
  locale: 'es-EC',
  // Destino de los botones. No hay registro ni pagos implementados todavía.
  rutaPlan: (id) => `/registro?plan=${id}`,
  // [CONFIRMAR] ¿Existe prueba gratuita? Si es true, el botón dice "Empezar prueba gratis".
  pruebaGratis: false,
  // [CONFIRMAR] Textos de la nota inferior. null = no se muestra.
  notaIva: null, // p. ej. 'Incluyen IVA.' o 'No incluyen IVA.'
  notaPermanencia: null, // p. ej. 'Sin permanencia · Cancela cuando quieras.'
  // [CONFIRMAR] Que todas las funciones estén en todos los planes y que no haya límites.
  subtitulo: 'Todas las funciones en todos los planes. Elige el periodo que mejor te convenga.',
  funciones: [
    '6 pasos guiados',
    'Personal, insumos y equipos calculados',
    'Subir pliego con IA',
    'Propuesta lista para el cliente',
    'Seguimiento de aprobación con historial de cambios'
  ],
  planes: [
    { id: 'mensual', nombre: 'Mensual', meses: 1, total: 49, cobro: 'cada mes' },
    { id: 'semestral', nombre: 'Semestral', meses: 6, total: 249, cobro: 'cada 6 meses' },
    { id: 'anual', nombre: 'Anual', meses: 12, total: 449, cobro: 'al año', destacado: true, etiqueta: 'Mejor valor' }
  ]
};

/** Plan con sus derivados: precio por mes y ahorro (0–1) frente a pagar el plan mensual. */
export function calcularPlanes(config = CONFIG_PLANES) {
  const mensual = config.planes.find((p) => p.meses === 1);
  return config.planes.map((p) => ({
    ...p,
    porMes: p.total / p.meses,
    ahorro: mensual && p.meses > 1 ? 1 - p.total / (mensual.total * p.meses) : 0,
    href: config.rutaPlan(p.id)
  }));
}

/** $49 · $41,50 · $1.249 (sin decimales si el valor es entero). */
export const formatoMoneda = (valor, config = CONFIG_PLANES) =>
  new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.moneda,
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(valor);

export const formatoPorcentaje = (valor, config = CONFIG_PLANES) => new Intl.NumberFormat(config.locale, { style: 'percent', maximumFractionDigits: 0 }).format(valor);
