// Prueba de los cálculos de precios. Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPlanes, formatoMoneda, formatoPorcentaje, CONFIG_PLANES } from './planes.js';

test('precio por mes y ahorro se derivan del total', () => {
  const [mensual, semestral, anual] = calcularPlanes();
  assert.equal(mensual.porMes, 49);
  assert.equal(mensual.ahorro, 0);
  assert.equal(semestral.porMes, 249 / 6);
  assert.ok(Math.abs(semestral.ahorro - 45 / 294) < 1e-12); // 6 × 49 = 294
  assert.ok(Math.abs(anual.ahorro - 139 / 588) < 1e-12); // 12 × 49 = 588
  assert.equal(anual.href, '/registro?plan=anual');
});

test('formato es-EC', () => {
  assert.equal(formatoMoneda(49), '$49');
  assert.equal(formatoMoneda(249 / 6), '$41,50');
  assert.equal(formatoMoneda(449 / 12), '$37,42');
  assert.equal(formatoMoneda(1249), '$1.249');
  assert.equal(formatoPorcentaje(139 / 588), '24%');
});

test('sin plan mensual no hay ahorro que calcular', () => {
  const sinMensual = { ...CONFIG_PLANES, planes: CONFIG_PLANES.planes.filter((p) => p.meses > 1) };
  assert.ok(calcularPlanes(sinMensual).every((p) => p.ahorro === 0));
});
