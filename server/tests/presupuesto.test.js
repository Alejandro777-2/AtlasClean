// Presupuesto previo: rango orientativo calculado con la ficha (sin IA).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimarPresupuesto, textoRango } from '../../src/presupuesto/estimar.js';
import { PARAMETROS_PRESUPUESTO as P } from '../../src/config/presupuesto.js';

const z = (area, m2, protocolo) => ({ area, m2, protocolo });
const ficha = (cambios = {}) => ({
  configuracionInicial: {
    regimenSugerido: { valor: 'diurno_5d' },
    pasadasSugeridas: { valor: 1 },
    maquinariaSugerida: { valor: 'semi_mechanized' },
    tamanoReferencia: { m2: 1200, esAproximado: false },
    zonasPropuestas: [z('oficinas', 1000, 'standard'), z('banos', null, 'clinical_intermediate'), z('cocina_comedor', 200, 'food_safe')],
    ...cambios
  }
});

test('sin ficha o sin tamaño no inventa un monto', () => {
  assert.equal(estimarPresupuesto(null).disponible, false);
  const r = estimarPresupuesto(ficha({ tamanoReferencia: { m2: null, esAproximado: true }, zonasPropuestas: [z('oficinas', null, 'standard')] }));
  assert.equal(r.disponible, false);
  assert.match(r.motivo, /tamaño/);
});

test('da un rango redondeado, nunca una cifra exacta', () => {
  const r = estimarPresupuesto(ficha());
  assert.ok(r.disponible);
  assert.ok(r.mensual.bajo < r.mensual.alto);
  assert.equal(r.mensual.bajo % P.redondeo, 0);
  assert.equal(r.mensual.alto % P.redondeo, 0);
  assert.equal(r.amplio, false);
  assert.ok(r.conIva.bajo > r.mensual.bajo);
  assert.equal(r.anual.alto, r.mensual.alto * 12);
  assert.match(textoRango(r.mensual), /^USD [\d.]+ – [\d.]+$/);
});

test('más cobertura y más exigencia cuestan más', () => {
  const base = estimarPresupuesto(ficha()).mensual.alto;
  assert.ok(estimarPresupuesto(ficha({ regimenSugerido: { valor: 'continuous_24_7' } })).mensual.alto > base);
  assert.ok(estimarPresupuesto(ficha({ pasadasSugeridas: { valor: 3 } })).mensual.alto > base);
  assert.ok(estimarPresupuesto(ficha({ zonasPropuestas: [z('criticas', 1000, 'hospital_grade'), z('cocina_comedor', 200, 'food_safe')] })).mensual.alto > base);
});

test('si el cliente aporta insumos o maquinaria, baja; si el tamaño es aproximado, el rango se abre', () => {
  const base = estimarPresupuesto(ficha());
  const propio = estimarPresupuesto(ficha(), { insumosPropios: 'si', maquinariaPropia: 'si' });
  assert.ok(propio.mensual.alto < base.mensual.alto);
  const aprox = estimarPresupuesto(ficha({ tamanoReferencia: { m2: 1200, esAproximado: true } }));
  assert.equal(aprox.amplio, true);
  assert.ok(aprox.mensual.alto - aprox.mensual.bajo > base.mensual.alto - base.mensual.bajo);
});

test('reparte los m² de referencia entre zonas sin medida', () => {
  const r = estimarPresupuesto(ficha({ zonasPropuestas: [z('oficinas', null, 'standard'), z('banos', null, 'clinical_intermediate')] }));
  assert.ok(r.disponible);
  assert.equal(r.amplio, true);
  assert.match(r.supuestos[0], /1\.200 m² en 1 zona/);
});
