// PARÁMETROS DEL PRESUPUESTO PREVIO (Ecuador)
// Es configuración de negocio, no código: el equipo debe revisar y ajustar los valores marcados como ejemplo.
// El presupuesto previo es una ORIENTACIÓN para el cliente (un rango), nunca la cotización final:
// la cotización real la calcula el módulo de cotización con las medidas de la visita.

export const PARAMETROS_PRESUPUESTO = {
  // ── Legales (verificados oct. 2026; revisar cada año) ──
  sbu: 482, // Salario básico unificado 2026 (USD/mes), Ministerio del Trabajo
  aportePatronalIess: 0.1115, // 11,15 % aporte patronal IESS
  fondosReserva: 0.0833, // 8,33 % desde el segundo año (se incluye para no subestimar)
  vacaciones: 1 / 24, // 15 días al año
  decimoTercero: 1 / 12, // un sueldo al año, prorrateado
  // El décimo cuarto es un SBU al año por trabajador (se prorratea en el cálculo).
  recargoNocturno: 0.25, // 25 % sobre la hora nocturna (19:00 a 06:00)
  iva: 0.15, // IVA vigente en 2026

  // ── Operación (VALORES DE EJEMPLO: ajustar con datos reales de la empresa) ──
  horasPorTurno: 8,
  // m² que limpia una persona en un turno, según el protocolo de la zona
  rendimientoM2PorTurno: { standard: 1100, food_safe: 700, clinical_intermediate: 600, hospital_grade: 400, industrial_degreaser: 800 },
  // Cada pasada extra en el día suma este porcentaje de trabajo (los repasos son más rápidos que la primera limpieza)
  cargaPorPasadaExtra: 0.4,
  // Turnos de presencia y días de servicio por semana según el régimen
  regimenes: {
    diurno_5d: { turnos: 1, turnosNocturnos: 0, diasSemana: 5 },
    diurno_6d: { turnos: 1, turnosNocturnos: 0, diasSemana: 6 },
    extended_16h_7d: { turnos: 2, turnosNocturnos: 0.5, diasSemana: 7 },
    continuous_24_7: { turnos: 3, turnosNocturnos: 1, diasSemana: 7 }
  },
  diasLaborablesPorPersona: 5, // cada persona trabaja 5 días; servir 6 o 7 días exige relevos
  operariosPorSupervisor: 15,
  costoSupervisorFactor: 1.5, // un supervisor cuesta 1,5 veces un operario
  uniformesYEppMensual: 18, // USD por persona al mes
  insumosM2Mensual: { standard: 0.12, food_safe: 0.18, clinical_intermediate: 0.22, hospital_grade: 0.35, industrial_degreaser: 0.25 },
  equiposMensual: { manual: 60, semi_mechanized: 220, heavy_mechanized: 650 }, // depreciación y mantenimiento, USD/mes
  gastosAdministrativos: 0.1,
  utilidad: 0.12,

  // ── Rango que se muestra al cliente ──
  rango: { bajo: 0.85, alto: 1.2 }, // -15 % / +20 %
  rangoAmplio: { bajo: 0.8, alto: 1.3 }, // cuando los m² son aproximados o faltan datos
  redondeo: 50 // los montos se redondean a 50 USD para no aparentar exactitud
};
