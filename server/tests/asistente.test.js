import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { leerAgente } from '../agente.js';
import { normalizarFicha, ESQUEMA_FICHA } from '../esquemaFicha.js';
import { generarFichaDemo } from '../fichaDemo.js';
import { crearManejadorAsistente } from '../asistenteVisita.js';

const SOLICITUD = {
  empresa: 'Clínica Ejemplo',
  contacto: { nombre: null, telefono: '0999999999', correo: null },
  tipoCliente: 'privado',
  direccion: 'Av. Siempre Viva 123',
  ciudad: 'Quito',
  tipologia: 'general_healthcare',
  tamano: { m2: null, rango: '500_2000' },
  areas: ['criticas', 'banos', 'oficinas'],
  pisos: 2,
  banos: 6,
  afluencia: 'alta',
  horario: ['diurno'],
  frecuencia: 'diaria',
  nivelLimpieza: 'leve',
  recursosPropios: { maquinaria: null, insumos: null },
  comentarios: null
};

test('el prompt se lee del archivo del agente, completo y con su modelo', () => {
  const a = leerAgente();
  assert.match(a.prompt, /# SALIDA/);
  assert.match(a.prompt, /continuous_24_7/);
  assert.ok(a.modelo.startsWith('claude-'));
});

test('el esquema exige todas las claves de la salida del prompt', () => {
  const prompt = leerAgente().prompt;
  for (const clave of ESQUEMA_FICHA.required) assert.match(prompt, new RegExp(`"${clave}"`), clave);
});

test('modo demostración: aplica las reglas del prompt (ejemplo del propio prompt)', () => {
  const { ficha } = normalizarFicha(generarFichaDemo(SOLICITUD));
  const z = Object.fromEntries(ficha.configuracionInicial.zonasPropuestas.map((x) => [x.area, x]));
  assert.equal(z.criticas.protocolo, 'hospital_grade');
  assert.equal(z.criticas.riesgo, 5);
  assert.equal(z.banos.riesgo, 3);
  assert.equal(z.oficinas.protocolo, 'standard');
  assert.equal(ficha.configuracionInicial.tamanoReferencia.m2, 1200);
  assert.equal(ficha.configuracionInicial.regimenSugerido.valor, 'diurno_5d');
  assert.ok(ficha.contradicciones.some((c) => /áreas críticas/.test(c.descripcion)));
  assert.ok(ficha.contradicciones.some((c) => /24\/7/.test(c.descripcion)));
  assert.equal(ficha.listoParaVisita, true);
  assert.ok(ficha.llevarALaVisita.some((x) => /protección/.test(x)));
});

test('normalizar corrige valores fuera de lista y recorta listas largas', () => {
  const cruda = generarFichaDemo(SOLICITUD);
  cruda.configuracionInicial.regimenSugerido.valor = 'turno_raro';
  cruda.preguntasParaElCliente = ['1', '2', '3', '4', '5', '6', '7'];
  const { ficha, problemas } = normalizarFicha(cruda);
  assert.equal(ficha.configuracionInicial.regimenSugerido.valor, 'diurno_5d');
  assert.equal(ficha.preguntasParaElCliente.length, 5);
  assert.equal(problemas.length, 2);
  assert.throws(() => normalizarFicha({ resumen: 'x' }), /configuración inicial/);
});

test('faltan dirección y contacto → no está lista para visitar', () => {
  const { ficha } = normalizarFicha(generarFichaDemo({ ...SOLICITUD, direccion: '', contacto: {} }));
  assert.equal(ficha.listoParaVisita, false);
  assert.equal(ficha.camposFaltantes.length, 2);
});

// ── API local ──
let servidor;
let base;
const fetchOriginal = globalThis.fetch;
const llamadas = [];

before(async () => {
  const sinClave = crearManejadorAsistente({});
  const conClave = crearManejadorAsistente({ ANTHROPIC_API_KEY: 'clave-de-prueba' });
  servidor = http.createServer((req, res) => {
    const manejador = req.headers['x-prueba'] === 'con-clave' ? conClave : sinClave;
    manejador(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
  // Simula la API de Claude: devuelve la ficha de demostración como si fuera la IA.
  globalThis.fetch = async (url, opciones) => {
    if (String(url).startsWith('https://api.anthropic.com')) {
      llamadas.push(JSON.parse(opciones.body));
      return new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'registrar_ficha_visita', input: generarFichaDemo(SOLICITUD) }], usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200 });
    }
    return fetchOriginal(url, opciones);
  };
});

after(() => {
  globalThis.fetch = fetchOriginal;
  servidor.close();
});

const post = (cuerpo, conClave = false) =>
  fetchOriginal(`${base}/api/asistente-visita`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(conClave ? { 'x-prueba': 'con-clave' } : {}) }, body: JSON.stringify(cuerpo) });

test('sin clave: estado no configurado y ficha en modo demostración', async () => {
  const estado = await (await fetchOriginal(`${base}/api/asistente-visita/estado`)).json();
  assert.equal(estado.configurado, false);
  const r = await post({ solicitud: SOLICITUD });
  assert.equal(r.status, 200);
  const datos = await r.json();
  assert.equal(datos.meta.origen, 'demo');
  assert.ok(datos.ficha.resumen);
});

test('con clave: envía el prompt del agente, la herramienta forzada y el PDF; devuelve la ficha de la IA', async () => {
  const r = await post({ solicitud: SOLICITUD, documento: { nombre: 'pliego.pdf', mediaType: 'application/pdf', base64: 'JVBERi0xLjQK' } }, true);
  assert.equal(r.status, 200);
  const datos = await r.json();
  assert.equal(datos.meta.origen, 'ia');
  const enviado = llamadas.at(-1);
  assert.match(enviado.system, /Asistente de Visita/);
  assert.equal(enviado.tool_choice.name, 'registrar_ficha_visita');
  assert.equal(enviado.messages[0].content[0].type, 'document');
  assert.ok(!JSON.stringify(enviado).includes('clave-de-prueba'), 'la clave no va en el cuerpo');
});

test('rechaza documentos que no son PDF ni texto', async () => {
  const r = await post({ solicitud: SOLICITUD, documento: { nombre: 'a.docx', mediaType: 'application/msword', base64: 'AAAA' } });
  assert.equal(r.status, 400);
});
