// Reglas para proponer riesgo y protocolo por zona. Es configuración de negocio:
// si el equipo decide otro criterio, se cambia aquí Y en el prompt del agente (sección "Protocolo por área").
// La usan el modo demostración y las pruebas; la IA recibe la misma tabla escrita en su prompt.

export const TIPOLOGIAS_SALUD = ['hospital_critical', 'general_healthcare'];

/** Categorías de zona que entiende el motor (las del formulario + dos que suelen aparecer en pliegos). */
export const AREAS_MOTOR = ['criticas', 'hospitalizacion', 'banos', 'cocina_comedor', 'atencion_publico', 'aulas', 'oficinas', 'bodegas', 'externas', 'otra'];

export const RIESGO_POR_AREA = { criticas: 5, hospitalizacion: 4, banos: 3, cocina_comedor: 3, aulas: 2, atencion_publico: 2, bodegas: 2, externas: 2, otra: 2, oficinas: 1 };

/**
 * Protocolo por área según el nivel de limpieza pedido.
 * - Áreas críticas: siempre desinfección de alto nivel (regla de seguridad).
 * - Hospitalización: desinfección intermedia (alto nivel solo si es aislamiento: se confirma en la visita).
 * - Cocina o comedor: grado alimentario siempre (contacto con alimentos).
 * - Baños, atención al público, aulas, otras: leve → estándar; medio o profundo → intermedia.
 *   En establecimientos de salud, los baños son mínimo intermedia.
 * - Oficinas: estándar; profundo → intermedia.
 * - Bodegas y externas: estándar; desengrase industrial si hay grasa o aceite en industria.
 */
export function protocoloPara({ area, nivelLimpieza, tipologia, comentarios = '' }) {
  if (area === 'criticas') return 'hospital_grade';
  if (area === 'hospitalizacion') return 'clinical_intermediate';
  if (area === 'cocina_comedor') return 'food_safe';
  if (tipologia === 'food_court_retail' && area === 'atencion_publico' && nivelLimpieza !== 'leve') return 'food_safe';
  if ((area === 'bodegas' || area === 'externas') && tipologia === 'industrial_logistics' && /grasa|aceite/i.test(comentarios ?? '')) return 'industrial_degreaser';
  if (area === 'bodegas' || area === 'externas') return 'standard';
  if (area === 'oficinas') return nivelLimpieza === 'profundo' ? 'clinical_intermediate' : 'standard';
  if (area === 'banos' && TIPOLOGIAS_SALUD.includes(tipologia)) return 'clinical_intermediate';
  return nivelLimpieza === 'medio' || nivelLimpieza === 'profundo' ? 'clinical_intermediate' : 'standard';
}
