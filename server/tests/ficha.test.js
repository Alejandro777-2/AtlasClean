// Reglas de zonas, lenguaje legible, requisitos del pliego y "lista para agendar".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { protocoloPara } from '../../src/config/reglasZonas.js';
import { legible } from '../textoLegible.js';
import { normalizarFicha } from '../esquemaFicha.js';
import { generarFichaDemo } from '../fichaDemo.js';
import { revisarListoParaVisita } from '../asistenteVisita.js';

const hospital = { tipologia: 'general_healthcare', nivelLimpieza: 'profundo' };

test('protocolo por área: "profundo" no convierte todo en alto nivel', () => {
  assert.equal(protocoloPara({ ...hospital, area: 'criticas' }), 'hospital_grade');
  assert.equal(protocoloPara({ ...hospital, area: 'hospitalizacion' }), 'clinical_intermediate');
  assert.equal(protocoloPara({ ...hospital, area: 'banos' }), 'clinical_intermediate');
  assert.equal(protocoloPara({ ...hospital, area: 'atencion_publico' }), 'clinical_intermediate');
  assert.equal(protocoloPara({ ...hospital, area: 'cocina_comedor' }), 'food_safe');
  assert.equal(protocoloPara({ ...hospital, area: 'oficinas' }), 'clinical_intermediate');
  assert.equal(protocoloPara({ ...hospital, area: 'externas' }), 'standard');
  assert.equal(protocoloPara({ area: 'criticas', nivelLimpieza: 'leve', tipologia: 'general_healthcare' }), 'hospital_grade');
  assert.equal(protocoloPara({ area: 'oficinas', nivelLimpieza: 'leve', tipologia: 'corporate_office' }), 'standard');
  assert.equal(protocoloPara({ area: 'banos', nivelLimpieza: 'leve', tipologia: 'general_healthcare' }), 'clinical_intermediate');
  assert.equal(protocoloPara({ area: 'bodegas', nivelLimpieza: 'medio', tipologia: 'industrial_logistics', comentarios: 'piso con aceite' }), 'industrial_degreaser');
});

test('los códigos internos se cambian por palabras', () => {
  assert.equal(legible('Frecuencia varias_al_dia con 24_7.'), 'Frecuencia varias veces al día con 24/7.');
  assert.equal(legible("El cliente puso 'no_sabe' como tipo."), 'El cliente puso «aún no lo sé» como tipo.');
  assert.equal(legible('Coincide con el rango 2000_5000 del formulario.'), 'Coincide con el rango 2.000 a 5.000 m² del formulario.');
  assert.equal(legible('Protocolo hospital_grade obligatorio.'), 'Protocolo desinfección de alto nivel obligatorio.');
  assert.equal(legible('Riesgo de banos y criticas.'), 'Riesgo de baños y críticas.');
  assert.equal(legible('Texto normal sin códigos: manual y estándar.'), 'Texto normal sin códigos: manual y estándar.');
});

test('zona con código y descripción mezclados se separa', () => {
  const cruda = generarFichaDemo({ ...hospital, areas: ['criticas'], horario: ['24_7'], contacto: {} });
  cruda.configuracionInicial.zonasPropuestas = [
    { area: 'criticas (quirófanos, central de esterilización y UCI, piso 2, 730 m²)', riesgo: 5, trafico: 'medium', protocolo: 'hospital_grade', confianza: 'alta', motivo: 'Área crítica: hospital_grade obligatorio.' },
    { area: 'emergencia (planta baja, 380 m²)', riesgo: 4, trafico: 'extreme', protocolo: 'hospital_grade', confianza: 'media', motivo: 'x' },
    { area: 'hospitalizacion', nombre: 'Hospitalización, pisos 3 y 4', m2: 1540, riesgo: 4, trafico: 'medium', protocolo: 'clinical_intermediate', confianza: 'alta', motivo: 'x' }
  ];
  const [a, b, c] = normalizarFicha(cruda).ficha.configuracionInicial.zonasPropuestas;
  assert.equal(a.area, 'criticas');
  assert.equal(a.nombre, 'quirófanos, central de esterilización y UCI, piso 2');
  assert.equal(a.m2, 730);
  assert.equal(a.motivo, 'Área crítica: desinfección de alto nivel obligatorio.');
  assert.equal(b.area, 'otra');
  assert.match(b.nombre, /emergencia/);
  assert.equal(c.m2, 1540);
});

test('requisitos del pliego por módulo: se normalizan y se recortan', () => {
  const cruda = generarFichaDemo({ ...hospital, areas: ['criticas'], horario: ['24_7'], contacto: {} });
  cruda.requisitosDelDocumento = {
    personal: { resumen: 'Mín. 22 operarios + 2 supervisores', detalles: [{ texto: 'Personal mínimo: 22 operarios y 2 supervisores.', pagina: 3, cita: 'Personal mínimo exigido: 22 operarios y 2 supervisores' }] },
    equipos: { resumen: '', detalles: [{ texto: '2 fregadoras, 2 aspiradoras y 1 nebulizador', pagina: 3 }] },
    costos: { resumen: 'Referencial: USD 186.400 sin IVA, pago mensual contra informe aprobado por el administrador', detalles: [] }
  };
  const r = normalizarFicha(cruda).ficha.requisitosDelDocumento;
  assert.equal(r.personal.detalles[0].pagina, 3);
  assert.equal(r.equipos.resumen, '2 fregadoras, 2 aspiradoras y 1 nebulizador');
  assert.ok(r.costos.resumen.length <= 60);
  assert.deepEqual(r.insumos, { resumen: '', detalles: [] });
  assert.deepEqual(r.propuesta, { resumen: '', detalles: [] });
});

test('"lista para agendar" sigue una regla fija y el aviso nunca queda vacío', () => {
  const { ficha } = normalizarFicha(generarFichaDemo({ ...hospital, areas: ['criticas'], horario: ['24_7'], contacto: {} }));
  const conTodo = { tipologia: 'general_healthcare', direccion: 'Av. 1', contacto: { telefono: '099' } };
  const a = revisarListoParaVisita({ ...ficha, listoParaVisita: false, camposFaltantes: [] }, conTodo);
  assert.equal(a.ficha.listoParaVisita, true);
  assert.equal(a.problemas.length, 1);
  const b = revisarListoParaVisita({ ...ficha, listoParaVisita: true, camposFaltantes: [] }, { tipologia: 'general_healthcare', contacto: {} });
  assert.equal(b.ficha.listoParaVisita, false);
  assert.deepEqual(b.ficha.camposFaltantes, ['Dirección del lugar', 'Un teléfono o correo de contacto']);
});

import { aplicarDesdeDocumento, normalizarDesdeDocumento, valorLegible } from '../../src/formulario/desdeDocumento.js';
import { FORMULARIO_VACIO } from '../../src/formulario/solicitud.js';
import { completarSecciones } from '../asistenteVisita.js';

test('datos del formulario desde el documento: valida y descarta lo inválido', () => {
  const r = normalizarDesdeDocumento([
    { campo: 'contactoNombre', valor: 'Ing. Paola Benítez', pagina: 1, cita: 'Ing. Paola Benítez' },
    { campo: 'telefono', valor: '02 600 0000', pagina: 1 },
    { campo: 'correo', valor: 'no-es-correo', pagina: 1 },
    { campo: 'tipoCliente', valor: 'publico', pagina: 1 },
    { campo: 'm2', valor: '3.850 m²', pagina: 1 },
    { campo: 'banos', valor: '38', pagina: 1 },
    { campo: 'areas', valor: 'criticas, banos, oficinas, hospitalizacion, cocina_comedor', pagina: 2 },
    { campo: 'afluencia', valor: 'muy_alta', pagina: 1 },
    { campo: 'insumosPropios', valor: 'no', pagina: 3 },
    { campo: 'campoRaro', valor: 'x' }
  ]);
  const por = Object.fromEntries(r.map((d) => [d.campo, d.valor]));
  assert.equal(por.m2, '3850');
  assert.deepEqual(por.areas, ['criticas', 'banos', 'oficinas', 'cocina_comedor']);
  assert.equal(por.correo, undefined);
  assert.equal(por.campoRaro, undefined);
  assert.equal(r.length, 8);
});

test('solo llena campos vacíos; en áreas agrega las que faltan; no pisa lo del cliente', () => {
  const formulario = { ...FORMULARIO_VACIO, empresa: 'Hospital', telefono: '0999999999', areas: ['criticas'] };
  const datos = normalizarDesdeDocumento([
    { campo: 'telefono', valor: '02 600 0000', pagina: 1 },
    { campo: 'contactoNombre', valor: 'Ing. Paola Benítez', pagina: 1 },
    { campo: 'areas', valor: 'criticas,banos,oficinas', pagina: 2 },
    { campo: 'm2', valor: '3850', pagina: 1 }
  ]);
  const { formulario: nuevo, aplicados } = aplicarDesdeDocumento(formulario, datos);
  assert.equal(nuevo.telefono, '0999999999');
  assert.equal(nuevo.contactoNombre, 'Ing. Paola Benítez');
  assert.deepEqual(nuevo.areas, ['criticas', 'banos', 'oficinas']);
  assert.equal(nuevo.m2, '3850');
  assert.deepEqual(aplicados.map((a) => a.campo), ['contactoNombre', 'areas', 'm2']);
  assert.equal(valorLegible('areas', ['banos', 'oficinas']), 'Baños, Oficinas');
  assert.equal(valorLegible('m2', '3850'), '3.850 m²');
});

test('si la IA deja vacías las secciones del técnico, se completan con las reglas base', () => {
  const solicitud = { tipologia: 'general_healthcare', areas: ['criticas'], horario: ['24_7'], contacto: { telefono: '1' }, direccion: 'x' };
  const { ficha } = normalizarFicha(generarFichaDemo(solicitud));
  const vacia = { ...ficha, verificarEnVisita: [], preguntasParaElCliente: [] };
  const r = completarSecciones(vacia, solicitud, { nombre: 'p.pdf' });
  assert.ok(r.ficha.verificarEnVisita.length > 0);
  assert.ok(r.ficha.preguntasParaElCliente.length > 0);
  assert.ok(!JSON.stringify(r.ficha.verificarEnVisita).includes('modo demostración'));
  assert.match(r.problemas[0], /Verificar en la visita, Preguntas/);
});
