import {
  COSTOS_PERSONAL_BASE,
  NIVELES_RIESGO,
  NIVELES_TRAFICO,
  CATALOGO_MAQUINARIA
} from '../config/negocio.js';

/**
 * Calcula en tiempo real todos los costos directos, margen y precio de venta unitario.
 * Maneja estados vacíos (cuando el usuario inicia con formulario en blanco).
 */
export function calcularCostosLevantamiento(formulario) {
  const m2Total = parseFloat(formulario.m2_total) || 0;
  const operarios = Math.max(0, parseInt(formulario.operarios, 10) || 0);
  const especialistas = Math.max(0, parseInt(formulario.especialistas, 10) || 0);
  const supervisores = Math.max(0, parseInt(formulario.supervisores, 10) || 0);
  const margenPct = Math.min(60, Math.max(5, parseFloat(formulario.margen_rentabilidad) || 20));

  // 1. Factor de turno y horario
  let factorTurno = 1.0;
  const turnosLower = (formulario.turnos || '').toLowerCase();
  if (turnosLower.includes('24/7') || turnosLower.includes('rotativo')) {
    factorTurno = 1.35;
  } else if (turnosLower.includes('nocturno') && turnosLower.includes('matutino')) {
    factorTurno = 1.18;
  } else if (turnosLower.includes('nocturno')) {
    factorTurno = 1.25;
  } else if (turnosLower.includes('vespertino')) {
    factorTurno = 1.05;
  }

  // Costo Mano de Obra
  const baseOp = COSTOS_PERSONAL_BASE.operario.baseMensual;
  const baseEsp = COSTOS_PERSONAL_BASE.especialista.baseMensual;
  const baseSup = COSTOS_PERSONAL_BASE.supervisor.baseMensual;

  const costoPersonalBase = (operarios * baseOp) + (especialistas * baseEsp) + (supervisores * baseSup);
  const costoManoObra = Math.round((costoPersonalBase * factorTurno) * 100) / 100;

  // 2. Factor Insumos por Riesgo y Tráfico
  const riesgoInfo = (formulario.riesgo_sanitario && NIVELES_RIESGO[formulario.riesgo_sanitario])
    ? NIVELES_RIESGO[formulario.riesgo_sanitario]
    : { factorInsumoM2: 0, colorPano: 'Sin definir', tono: 'neutro', descripcion: 'Selecciona un nivel de riesgo' };

  const traficoInfo = (formulario.trafico_peatonal && NIVELES_TRAFICO[formulario.trafico_peatonal])
    ? NIVELES_TRAFICO[formulario.trafico_peatonal]
    : { factor: 1.0, desgaste: 'Estándar' };
  
  let factorFrecuencia = 1.0;
  const frecLower = (formulario.frecuencia || '').toLowerCase();
  if (frecLower.includes('interdiaria')) factorFrecuencia = 0.70;
  else if (frecLower.includes('semanal')) factorFrecuencia = 0.40;
  else if (frecLower.includes('quincenal')) factorFrecuencia = 0.25;
  else if (frecLower.includes('mensual')) factorFrecuencia = 0.15;

  const costoInsumos = (m2Total > 0 && riesgoInfo.factorInsumoM2 > 0)
    ? Math.round((m2Total * riesgoInfo.factorInsumoM2 * traficoInfo.factor * factorFrecuencia) * 100) / 100
    : 0.0;

  // 3. Costo Maquinaria
  const maquinasSeleccionadas = Array.isArray(formulario.maquinaria) ? formulario.maquinaria : [];
  let costoMaquinaria = 0.0;
  maquinasSeleccionadas.forEach((maqNombre) => {
    const maqObj = CATALOGO_MAQUINARIA.find((m) => m.nombre === maqNombre || maqNombre.toLowerCase().includes(m.id));
    if (maqObj) {
      costoMaquinaria += maqObj.costoMensual;
    } else {
      costoMaquinaria += 90.0;
    }
  });
  costoMaquinaria = Math.round(costoMaquinaria * 100) / 100;

  // 4. Costo Directo Total
  const costoDirectoTotal = Math.round((costoManoObra + costoInsumos + costoMaquinaria) * 100) / 100;

  // 5. Precio de Venta Total según Margen
  let precioOfertaFinal = 0.0;
  let margenBrutoDolares = 0.0;
  let costoUnitarioM2 = 0.0;
  let costoDirectoUnitarioM2 = 0.0;

  if (costoDirectoTotal > 0) {
    const margenDecimal = margenPct / 100.0;
    const divisor = Math.max(0.01, 1 - margenDecimal);
    precioOfertaFinal = Math.round((costoDirectoTotal / divisor) * 100) / 100;
    margenBrutoDolares = Math.round((precioOfertaFinal - costoDirectoTotal) * 100) / 100;
    if (m2Total > 0) {
      costoUnitarioM2 = Math.round((precioOfertaFinal / m2Total) * 1000) / 1000;
      costoDirectoUnitarioM2 = Math.round((costoDirectoTotal / m2Total) * 1000) / 1000;
    }
  }

  return {
    costoManoObra,
    costoInsumos,
    costoMaquinaria,
    costoDirectoTotal,
    margenPct,
    margenBrutoDolares,
    precioOfertaFinal,
    costoUnitarioM2,
    costoDirectoUnitarioM2,
    m2Total,
    factorTurno,
    riesgoInfo
  };
}
