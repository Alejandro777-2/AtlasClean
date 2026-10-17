/**
 * PRESUPUESTO PREVIO (orientativo)
 * Calcula un RANGO mensual a partir de la ficha de visita (zonas, m², protocolos, turnos, pasadas).
 * No usa la IA ni gasta tokens. No es la cotización: la real se calcula con las medidas de la visita.
 * Todos los valores salen de src/config/presupuesto.js.
 */
import { PARAMETROS_PRESUPUESTO } from '../config/presupuesto.js';
import { ETIQUETAS } from '../config/opciones.js';

const redondear = (v, paso) => Math.round(v / paso) * paso;

/** Reparte los m² de referencia entre las zonas que no tienen medida (los baños se consideran dentro de otras zonas). */
function m2PorZona(c) {
  const zonas = c.zonasPropuestas.length ? c.zonasPropuestas : [{ area: 'otra', protocolo: 'standard', m2: null }];
  const conM2 = zonas.filter((z) => z.m2 > 0);
  const sinM2 = zonas.filter((z) => !(z.m2 > 0) && z.area !== 'banos');
  const total = c.tamanoReferencia?.m2 ?? 0;
  const restante = Math.max(0, total - conM2.reduce((s, z) => s + z.m2, 0));
  const repartido = sinM2.length && restante > 0 ? restante / sinM2.length : 0;
  return {
    zonas: zonas.map((z) => ({ ...z, m2Calculo: z.m2 > 0 ? z.m2 : z.area === 'banos' ? 0 : repartido })),
    huboReparto: sinM2.length > 0 && repartido > 0
  };
}

/**
 * @param {object} ficha ficha previa a la visita
 * @param {object} [formulario] para saber si el cliente aporta maquinaria o insumos
 * @param {object} [p] parámetros (por defecto, los de configuración)
 */
export function estimarPresupuesto(ficha, formulario = {}, p = PARAMETROS_PRESUPUESTO) {
  const c = ficha?.configuracionInicial;
  if (!c) return { disponible: false, motivo: 'Aún no hay ficha de visita.' };

  const { zonas, huboReparto } = m2PorZona(c);
  const m2Total = zonas.reduce((s, z) => s + z.m2Calculo, 0);
  if (!(m2Total > 0)) return { disponible: false, motivo: 'Falta el tamaño del lugar (m² o rango) para estimar.' };

  const reg = p.regimenes[c.regimenSugerido?.valor] ?? p.regimenes.diurno_5d;
  const pasadas = Math.max(1, c.pasadasSugeridas?.valor ?? 1);
  const factorPasadas = 1 + p.cargaPorPasadaExtra * (pasadas - 1);

  // Personal
  const horasDia = zonas.reduce((s, z) => s + (z.m2Calculo / (p.rendimientoM2PorTurno[z.protocolo] ?? p.rendimientoM2PorTurno.standard)) * p.horasPorTurno, 0) * factorPasadas;
  const puestosPorDia = Math.max(Math.ceil(horasDia / p.horasPorTurno), reg.turnos);
  const operarios = Math.ceil(puestosPorDia * (reg.diasSemana / p.diasLaborablesPorPersona));
  const supervisores = operarios >= 6 ? Math.ceil(operarios / p.operariosPorSupervisor) : 0;

  const costoOperario = p.sbu * (1 + p.aportePatronalIess + p.fondosReserva + p.vacaciones + p.decimoTercero) + p.sbu / 12 + p.uniformesYEppMensual;
  const recargo = operarios * (reg.turnosNocturnos / reg.turnos) * p.sbu * p.recargoNocturno;
  const personal = operarios * costoOperario + recargo;
  const supervision = supervisores * costoOperario * p.costoSupervisorFactor;

  // Insumos y equipos (si el cliente los aporta, solo se considera una parte)
  const insumosPropios = formulario.insumosPropios === 'si';
  const maquinariaPropia = formulario.maquinariaPropia === 'si';
  const insumos = zonas.reduce((s, z) => s + z.m2Calculo * (p.insumosM2Mensual[z.protocolo] ?? p.insumosM2Mensual.standard), 0) * (insumosPropios ? 0.3 : 1);
  const equipos = (p.equiposMensual[c.maquinariaSugerida?.valor] ?? p.equiposMensual.semi_mechanized) * (maquinariaPropia ? 0.3 : 1);

  const directo = personal + supervision + insumos + equipos;
  const gastos = directo * p.gastosAdministrativos;
  const utilidad = (directo + gastos) * p.utilidad;
  const total = directo + gastos + utilidad;

  const amplio = c.tamanoReferencia?.esAproximado !== false || huboReparto;
  const f = amplio ? p.rangoAmplio : p.rango;
  const rango = (v) => ({ bajo: redondear(v * f.bajo, p.redondeo), alto: redondear(v * f.alto, p.redondeo) });

  const conceptos = [
    { id: 'personal', concepto: 'Personal de limpieza', detalle: `≈ ${operarios} persona${operarios === 1 ? '' : 's'}, con cargas de ley${recargo > 0 ? ' y recargo nocturno' : ''}`, valor: personal },
    { id: 'supervision', concepto: 'Supervisión', detalle: supervisores ? `≈ ${supervisores} supervisor${supervisores === 1 ? '' : 'es'}` : 'Por visitas periódicas', valor: supervision },
    { id: 'insumos', concepto: 'Insumos de limpieza', detalle: insumosPropios ? 'El cliente aporta parte de los insumos' : 'Según el protocolo de cada zona', valor: insumos },
    { id: 'equipos', concepto: 'Equipos y maquinaria', detalle: maquinariaPropia ? 'El cliente tiene maquinaria propia' : ETIQUETAS.maquinaria[c.maquinariaSugerida?.valor] ?? '', valor: equipos },
    { id: 'gastos', concepto: 'Gastos administrativos y utilidad', detalle: `${Math.round(p.gastosAdministrativos * 100)} % + ${Math.round(p.utilidad * 100)} %`, valor: gastos + utilidad }
  ].filter((x) => x.valor > 0);

  const mensual = rango(total);
  return {
    disponible: true,
    amplio,
    mensual,
    anual: { bajo: mensual.bajo * 12, alto: mensual.alto * 12 },
    conIva: { bajo: redondear(mensual.bajo * (1 + p.iva), p.redondeo), alto: redondear(mensual.alto * (1 + p.iva), p.redondeo) },
    iva: p.iva,
    desglose: conceptos.map((x) => ({ ...x, ...rango(x.valor) })),
    personas: { operarios, supervisores },
    supuestos: [
      `${Math.round(m2Total).toLocaleString('es-EC')} m² en ${zonas.filter((z) => z.m2Calculo > 0).length} zona(s)${amplio ? ' (medida aproximada)' : ''}`,
      `${ETIQUETAS.regimen[c.regimenSugerido?.valor] ?? 'Turno diurno'} · ${pasadas} pasada${pasadas === 1 ? '' : 's'} al día`,
      `≈ ${operarios} persona${operarios === 1 ? '' : 's'} de limpieza${supervisores ? ` y ${supervisores} supervisor${supervisores === 1 ? '' : 'es'}` : ''}`,
      `Sueldo básico ${p.sbu} USD con cargas de ley (IESS, décimos, vacaciones, fondos de reserva)`
    ]
  };
}

/** "USD 8.400 – 10.900" */
export const textoRango = (r) => `USD ${r.bajo.toLocaleString('es-EC')} – ${r.alto.toLocaleString('es-EC')}`;
