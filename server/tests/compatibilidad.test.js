// Compatibilidad con modelos que no admiten ciertos parámetros (p. ej. tool_choice forzado o temperature).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { crearManejadorAsistente } from '../asistenteVisita.js';
import { generarFichaDemo } from '../fichaDemo.js';

const SOLICITUD = { empresa: 'X', tipologia: 'corporate_office', areas: ['oficinas'], horario: ['diurno'], contacto: { telefono: '1' }, direccion: 'Calle 1' };
const FICHA = generarFichaDemo(SOLICITUD);
const fetchOriginal = globalThis.fetch;
let escenario;
let pedidos;
let base;
let servidor;

const respuesta = (cuerpo, estado = 200) => new Response(JSON.stringify(cuerpo), { status: estado });
const rechazo = (mensaje) => respuesta({ type: 'error', error: { type: 'invalid_request_error', message: mensaje } }, 400);
const conHerramienta = { content: [{ type: 'tool_use', id: 't1', name: 'registrar_ficha_visita', input: FICHA }], stop_reason: 'tool_use', usage: { input_tokens: 10, output_tokens: 5 } };

before(async () => {
  globalThis.fetch = async (url, opciones) => {
    if (!String(url).startsWith('https://api.anthropic.com')) return fetchOriginal(url, opciones);
    const cuerpo = JSON.parse(opciones.body);
    pedidos.push(cuerpo);
    return escenario(cuerpo, pedidos.length);
  };
  const h = crearManejadorAsistente({ ANTHROPIC_API_KEY: 'prueba', ATLAS_MODELO_IA: 'modelo-de-prueba' });
  servidor = http.createServer((q, r) => h(q, r, () => r.end()));
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => {
  globalThis.fetch = fetchOriginal;
  servidor.close();
});

const generar = async () => {
  pedidos = [];
  const r = await fetchOriginal(`${base}/api/asistente-visita`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitud: SOLICITUD }) });
  return { estado: r.status, datos: await r.json() };
};

test('si el modelo no admite tool_choice forzado, reintenta con "auto" y lo recuerda', async () => {
  escenario = (c) => (c.tool_choice.type === 'tool' ? rechazo('tool_choice: type "tool" and "any" are not supported for this model.') : respuesta(conHerramienta));
  const r = await generar();
  assert.equal(r.estado, 200);
  assert.equal(r.datos.meta.origen, 'ia');
  assert.deepEqual(pedidos.map((p) => p.tool_choice.type), ['tool', 'auto']);
  const otra = await generar();
  assert.equal(otra.estado, 200);
  assert.equal(pedidos.length, 1, 'la segunda vez ya no repite el intento fallido');
});

test('si el modelo no admite temperature, la quita', async () => {
  escenario = (c) => ('temperature' in c ? rechazo('temperature is not supported for this model') : respuesta(conHerramienta));
  const r = await generar();
  assert.equal(r.estado, 200);
});

test('si responde la ficha como texto JSON, también sirve', async () => {
  escenario = () => respuesta({ content: [{ type: 'text', text: '```json\n' + JSON.stringify(FICHA) + '\n```' }], stop_reason: 'end_turn' });
  const r = await generar();
  assert.equal(r.estado, 200);
  assert.ok(r.datos.ficha.resumen);
});

test('si responde sin la ficha, le recuerda usar la herramienta una vez', async () => {
  escenario = (_, n) => (n === 1 ? respuesta({ content: [{ type: 'text', text: 'Claro, aquí va.' }], stop_reason: 'end_turn' }) : respuesta(conHerramienta));
  const r = await generar();
  assert.equal(r.estado, 200);
  assert.equal(pedidos.length, 2);
  assert.equal(pedidos[1].messages.length, 3);
});

test('un 400 de otro tipo se muestra sin reintentos infinitos', async () => {
  escenario = () => rechazo('messages: el contenido no es válido');
  const r = await generar();
  assert.equal(r.estado, 400);
  assert.match(r.datos.error, /no es válido/);
  assert.equal(pedidos.length, 1);
});
