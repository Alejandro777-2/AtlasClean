/**
 * API LOCAL DEL ASISTENTE DE VISITA (se monta dentro de Vite: npm run dev / npm run preview)
 *
 *   GET  /api/asistente-visita/estado  → si hay IA configurada (nunca devuelve la clave)
 *   POST /api/asistente-visita         → { solicitud, documento?, modo? } → { ficha, meta }
 *   POST /api/asistente-visita/registro → { id, formulario, desdeDocumento?, documentoNombre?, fichaEstado? }
 *        → guarda la solicitud como una fila del Excel de plantilla (server/registroExcel.js)
 *
 * - El prompt sale del archivo del agente (agentes/…/asistente-de-visita-atlas.md): una sola fuente.
 * - La clave va en el archivo .env (ANTHROPIC_API_KEY), que no se sube a git. Nunca llega al navegador.
 * - Sin clave, o con modo "demo", responde con la ficha de demostración (reglas locales, sin IA).
 * - La respuesta de la IA se fuerza con una herramienta (input_schema) y se revisa con normalizarFicha.
 */
import { leerAgente } from './agente.js';
import { ESQUEMA_FICHA, normalizarFicha } from './esquemaFicha.js';
import { generarFichaDemo } from './fichaDemo.js';
import { guardarSolicitud, rutaExcel } from './registroExcel.js';

const LIMITE_CUERPO = 16 * 1024 * 1024; // ~10 MB de PDF en base64
const LIMITE_TEXTO_DOCUMENTO = 120000;
// Una ficha con pliego puede ser larga: se da margen de respuesta y de tiempo.
const TIEMPO_MAXIMO_MS = 240000;
const MAX_TOKENS_RESPUESTA = 16000;
const REINTENTAR_CON_OTRO_MODELO = [404, 429, 500, 502, 503, 529];
const TIPOS_DOCUMENTO = ['application/pdf', 'text/plain'];
const NOMBRE_HERRAMIENTA = 'registrar_ficha_visita';

const errorHttp = (mensaje, estado) => Object.assign(new Error(mensaje), { estado });

function leerJson(req) {
  return new Promise((resolve, reject) => {
    let tam = 0;
    const partes = [];
    req.on('data', (p) => {
      tam += p.length;
      if (tam > LIMITE_CUERPO) {
        reject(errorHttp('El documento supera el tamaño máximo (10 MB).', 413));
        req.destroy();
      } else partes.push(p);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}'));
      } catch {
        reject(errorHttp('La solicitud no es JSON válido.', 400));
      }
    });
    req.on('error', reject);
  });
}

function responder(res, estado, cuerpo) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(cuerpo));
}

function mensajeErrorClaude(estado, tipo = '', mensaje = '') {
  const m = `${tipo} ${mensaje}`.toLowerCase();
  if (estado === 401) return 'La clave de Claude no es válida. Revisa ANTHROPIC_API_KEY en el archivo .env.';
  if (m.includes('credit balance')) return 'La cuenta de la API de Claude no tiene saldo. Agrega créditos en la consola de Claude.';
  if (estado === 403) return 'La clave de Claude no tiene permiso para usar este modelo.';
  if (estado === 404) return 'El modelo de Claude indicado no está disponible.';
  if (estado === 413) return 'El documento es demasiado grande para la IA. Sube solo las páginas importantes.';
  if (estado === 429) return 'Se alcanzó el límite de uso de Claude. Espera un momento o usa el modo demostración.';
  if (estado >= 500) return 'El servicio de Claude no está disponible en este momento.';
  if (estado === 400) return `Claude rechazó la solicitud: ${mensaje}`;
  return `Error de Claude (${estado}).`;
}

/** Arma el mensaje para la IA con la misma entrada que describe el prompt. */
function construirContenido(solicitud, documento) {
  const contenido = [];
  let textoDocumento = null;
  if (documento?.mediaType === 'application/pdf') {
    contenido.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: documento.base64 }, title: documento.nombre ?? 'documento.pdf' });
    textoDocumento = `Se adjunta el PDF "${documento.nombre ?? 'documento.pdf'}". Úsalo como "documento".`;
  } else if (documento?.mediaType === 'text/plain') {
    textoDocumento = Buffer.from(documento.base64, 'base64').toString('utf8').slice(0, LIMITE_TEXTO_DOCUMENTO);
  }
  const entrada = { solicitud, documento: textoDocumento, estimacionMotor: null };
  contenido.push({ type: 'text', text: `Datos de entrada (JSON):\n${JSON.stringify(entrada, null, 2)}\n\nGenera la ficha previa a la visita y entrégala con la herramienta ${NOMBRE_HERRAMIENTA}.` });
  return contenido;
}

const HERRAMIENTA = { name: NOMBRE_HERRAMIENTA, description: 'Entrega la ficha previa a la visita técnica con el formato exacto indicado.', input_schema: ESQUEMA_FICHA };

// Ajustes que cada modelo no admite (se aprenden del primer error 400 y se recuerdan mientras corre el servidor).
// Ej.: algunos modelos no permiten forzar la herramienta (tool_choice "tool"/"any") ni fijar la temperatura.
const ajustesPorModelo = new Map();

function ajusteParaError(mensaje = '') {
  const m = mensaje.toLowerCase();
  if (m.includes('tool_choice')) return 'herramientaLibre';
  if (m.includes('temperature')) return 'sinTemperatura';
  return null;
}

/** Busca un objeto JSON en un texto (por si el modelo responde la ficha como texto en vez de usar la herramienta). */
function jsonEnTexto(texto = '') {
  const limpio = texto.replace(/```(?:json)?/g, '');
  const a = limpio.indexOf('{');
  const b = limpio.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    const obj = JSON.parse(limpio.slice(a, b + 1));
    return obj && typeof obj === 'object' && obj.configuracionInicial ? obj : null;
  } catch {
    return null;
  }
}

async function pedirAClaude({ clave, modelo, sistema, mensajes, ajustes }) {
  const cuerpo = {
    model: modelo,
    max_tokens: MAX_TOKENS_RESPUESTA,
    system: sistema,
    tools: [HERRAMIENTA],
    tool_choice: ajustes.has('herramientaLibre') ? { type: 'auto' } : { type: 'tool', name: NOMBRE_HERRAMIENTA },
    messages: mensajes
  };
  if (!ajustes.has('sinTemperatura')) cuerpo.temperature = 0;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS)
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const e = errorHttp(mensajeErrorClaude(resp.status, datos?.error?.type, datos?.error?.message), resp.status);
    e.ajuste = resp.status === 400 ? ajusteParaError(datos?.error?.message) : null;
    throw e;
  }
  return datos;
}

const sumarUso = (a, b) => (a && b ? { input_tokens: (a.input_tokens ?? 0) + (b.input_tokens ?? 0), output_tokens: (a.output_tokens ?? 0) + (b.output_tokens ?? 0) } : b ?? a ?? null);

async function llamarClaude({ clave, modelo, sistema, contenido }) {
  const ajustes = ajustesPorModelo.get(modelo) ?? new Set();
  ajustesPorModelo.set(modelo, ajustes);
  let mensajes = [{ role: 'user', content: contenido }];
  let uso = null;

  // Hasta 2 ajustes por parámetros no admitidos + 1 recordatorio si responde sin usar la herramienta.
  for (let intento = 0, recordado = false; intento < 4; intento++) {
    let datos;
    try {
      datos = await pedirAClaude({ clave, modelo, sistema, mensajes, ajustes });
    } catch (e) {
      if (e.ajuste && !ajustes.has(e.ajuste)) {
        ajustes.add(e.ajuste);
        continue;
      }
      throw e;
    }
    uso = sumarUso(uso, datos.usage);
    const bloques = datos.content ?? [];
    const herramienta = bloques.find((c) => c.type === 'tool_use' && c.name === NOMBRE_HERRAMIENTA);
    // Si se cortó por largo, la ficha llega incompleta: se usa, pero se avisa.
    if (herramienta?.input) return { ficha: herramienta.input, uso, cortada: datos.stop_reason === 'max_tokens' };
    const texto = bloques.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    const desdeTexto = jsonEnTexto(texto);
    if (desdeTexto) return { ficha: desdeTexto, uso };
    if (datos.stop_reason === 'max_tokens') throw errorHttp('La respuesta de la IA quedó incompleta (demasiado larga). Intenta de nuevo.', 502);
    if (recordado) break;
    recordado = true;
    mensajes = [...mensajes, { role: 'assistant', content: bloques.length ? bloques : [{ type: 'text', text: '(sin respuesta)' }] }, { role: 'user', content: `Entrega ahora la ficha completa llamando a la herramienta ${NOMBRE_HERRAMIENTA}. No respondas con texto.` }];
  }
  throw errorHttp('Claude no devolvió la ficha en el formato esperado. Intenta de nuevo o usa el modo demostración.', 502);
}

/**
 * "Lista para agendar" se decide con una regla fija (no con el criterio de la IA):
 * hace falta tipo de lugar, dirección y una forma de contacto. Así la insignia y el aviso siempre coinciden.
 */
export function revisarListoParaVisita(ficha, solicitud = {}, conDocumento = false) {
  const faltan = [];
  if (!solicitud.tipologia) faltan.push('Tipo de lugar');
  if (!String(solicitud.direccion ?? '').trim()) faltan.push('Dirección del lugar');
  if (!String(solicitud.contacto?.telefono ?? '').trim() && !String(solicitud.contacto?.correo ?? '').trim()) faltan.push('Un teléfono o correo de contacto');
  const problemas = [];
  const listo = faltan.length === 0;
  if (listo !== ficha.listoParaVisita) problemas.push(listo ? 'La IA marcó la ficha como incompleta, pero tiene tipo de lugar, dirección y contacto: se marcó como lista. Las dudas siguen en «Contradicciones».' : 'Faltan datos obligatorios para agendar la visita.');
  if (conDocumento && ficha.datosDelDocumento.length === 0) problemas.push('La IA no listó los datos del documento; revisa los motivos y las contradicciones, que citan sus páginas.');
  return {
    ficha: { ...ficha, listoParaVisita: listo, camposFaltantes: listo ? [] : ficha.camposFaltantes.length ? ficha.camposFaltantes : faltan },
    problemas
  };
}

/** Si la IA dejó vacías secciones que el técnico necesita, se completan con las reglas base del asistente. */
export function completarSecciones(ficha, solicitud = {}, documento = null) {
  const base = generarFichaDemo(solicitud, documento);
  const faltantes = [
    ['verificarEnVisita', 'Verificar en la visita'],
    ['preguntasParaElCliente', 'Preguntas para el cliente'],
    ['llevarALaVisita', 'Llevar a la visita']
  ].filter(([k]) => ficha[k].length === 0);
  if (!faltantes.length) return { ficha, problemas: [] };
  const completada = { ...ficha };
  for (const [k] of faltantes) completada[k] = base[k].filter((x) => !/modo demostración/i.test(JSON.stringify(x)));
  return { ficha: completada, problemas: [`La IA dejó vacío: ${faltantes.map(([, n]) => n).join(', ')}. Se completó con las reglas base del asistente.`] };
}

function validarEntrada(cuerpo) {
  if (!cuerpo?.solicitud || typeof cuerpo.solicitud !== 'object') throw errorHttp('Falta la solicitud del cliente.', 400);
  const d = cuerpo.documento;
  if (d) {
    if (!TIPOS_DOCUMENTO.includes(d.mediaType)) throw errorHttp('Solo se pueden analizar documentos PDF o de texto (.txt).', 400);
    if (typeof d.base64 !== 'string' || !d.base64) throw errorHttp('El documento llegó vacío.', 400);
  }
}

/**
 * @param {Record<string,string>} env variables del .env (ANTHROPIC_API_KEY, ATLAS_MODELO_IA, ATLAS_EXCEL_SOLICITUDES)
 * @param {string} raiz carpeta del proyecto (donde se crea el Excel de solicitudes)
 */
export function crearManejadorAsistente(env = {}, raiz = process.cwd()) {
  const clave = (env.ANTHROPIC_API_KEY ?? '').trim();

  return async function manejador(req, res, next) {
    const ruta = (req.url ?? '').split('?')[0];

    if (ruta === '/api/asistente-visita/estado' && req.method === 'GET') {
      try {
        const agente = leerAgente();
        return responder(res, 200, { configurado: Boolean(clave), agente: agente.nombre, modelo: env.ATLAS_MODELO_IA?.trim() || agente.modelo });
      } catch (e) {
        return responder(res, 200, { configurado: false, agente: null, modelo: null, error: e.message });
      }
    }

    if (ruta === '/api/asistente-visita/registro' && req.method === 'POST') {
      try {
        const cuerpo = await leerJson(req);
        if (!cuerpo?.id || typeof cuerpo.id !== 'string' || !cuerpo.formulario || typeof cuerpo.formulario !== 'object') throw errorHttp('Faltan el id o el formulario.', 400);
        const resultado = await guardarSolicitud(cuerpo, { archivo: rutaExcel(env, raiz) });
        if (resultado.ok) console.log(`[atlas] Solicitud ${cuerpo.id} guardada en ${resultado.archivo} (fila ${resultado.fila}).`);
        else console.warn(`[atlas] ${resultado.error} (${resultado.archivo})`);
        return responder(res, resultado.ok ? 200 : 202, resultado);
      } catch (e) {
        return responder(res, e.estado ?? 500, { ok: false, error: e.message });
      }
    }

    if (ruta !== '/api/asistente-visita' || req.method !== 'POST') return next();

    try {
      const cuerpo = await leerJson(req);
      validarEntrada(cuerpo);
      const inicio = Date.now();

      if (!clave || cuerpo.modo === 'demo') {
        const { ficha } = revisarListoParaVisita(normalizarFicha(generarFichaDemo(cuerpo.solicitud, cuerpo.documento)).ficha, cuerpo.solicitud);
        return responder(res, 200, {
          ficha,
          meta: { origen: 'demo', motivo: clave ? 'Modo demostración elegido por el usuario.' : 'No hay clave de IA en el archivo .env.', ms: Date.now() - inicio, problemas: [] }
        });
      }

      const agente = leerAgente();
      const modelos = [...new Set([env.ATLAS_MODELO_IA?.trim(), agente.modelo, 'claude-sonnet-5-5'].filter(Boolean))];
      const contenido = construirContenido(cuerpo.solicitud, cuerpo.documento);
      let ultimoError;
      for (const modelo of modelos) {
        try {
          const { ficha: cruda, uso, cortada } = await llamarClaude({ clave, modelo, sistema: agente.prompt, contenido });
          const normalizada = normalizarFicha(cruda);
          const revisada = revisarListoParaVisita(normalizada.ficha, cuerpo.solicitud, Boolean(cuerpo.documento));
          const completada = completarSecciones(revisada.ficha, cuerpo.solicitud, cuerpo.documento);
          const ficha = completada.ficha;
          const problemas = [...(cortada ? ['La respuesta de la IA se cortó por largo y pueden faltar secciones al final. Usa «Volver a generar».'] : []), ...normalizada.problemas, ...revisada.problemas, ...completada.problemas];
          return responder(res, 200, { ficha, meta: { origen: 'ia', agente: agente.nombre, modelo, ms: Date.now() - inicio, uso, problemas } });
        } catch (e) {
          ultimoError = e;
          if (!REINTENTAR_CON_OTRO_MODELO.includes(e.estado) && e.name !== 'TimeoutError') break;
        }
      }
      const estado = ultimoError?.estado ?? 500;
      return responder(res, estado, {
        error: ultimoError?.name === 'TimeoutError' ? 'La IA tardó demasiado en responder. Intenta de nuevo o usa el modo demostración.' : ultimoError?.message ?? 'Error desconocido.',
        codigo: estado === 429 ? 'LIMITE' : 'ERROR_IA'
      });
    } catch (e) {
      return responder(res, e.estado ?? 500, { error: e.message ?? 'Error interno del servidor local.', codigo: 'ERROR_SERVIDOR' });
    }
  };
}

/** Plugin de Vite: monta la API en el servidor de desarrollo y en vista previa. */
export function asistenteVisita(env, raiz) {
  const manejador = crearManejadorAsistente(env, raiz);
  return {
    name: 'atlas-asistente-visita',
    configureServer(servidor) {
      servidor.middlewares.use(manejador);
    },
    configurePreviewServer(servidor) {
      servidor.middlewares.use(manejador);
    }
  };
}
