/**
 * Estado del formulario del cliente, del documento adjunto y de la ficha de visita.
 * Se guarda un borrador en el navegador para no perder datos al recargar (el documento no, por tamaño).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContextoSolicitud } from './contexto.js';
import { FORMULARIO_VACIO, aSolicitud } from '../formulario/solicitud.js';
import { DOCUMENTO } from '../config/opciones.js';
import { CLAVE_BORRADOR, guardarBorrador, leerBorrador } from './borrador.js';
import { aplicarDesdeDocumento } from '../formulario/desdeDocumento.js';

/** ID de la solicitud (una fila del Excel de solicitudes): SOL-AAAAMMDD-XXXX. */
function nuevoIdSolicitud() {
  const d = new Date();
  const dia = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const azar = (globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2)).replace(/-/g, '').slice(0, 6).toUpperCase();
  return `SOL-${dia}-${azar}`;
}

/**
 * Guarda la solicitud como una fila del Excel de plantilla (server/registroExcel.js). No bloquea al cliente:
 * si falla (servidor apagado, Excel abierto), solo se avisa en la consola; el servidor deja la fila en espera.
 */
function registrarEnExcel(datos) {
  return fetch('/api/asistente-visita/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
    .then((r) => r.json().catch(() => ({})))
    .then((r) => {
      if (!r.ok) console.warn('[atlas] La solicitud no se guardó todavía en el Excel:', r.error ?? 'sin respuesta');
    })
    .catch(() => console.warn('[atlas] No se pudo guardar la solicitud en el Excel (servidor local no disponible).'));
}

function leerArchivoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
  });
}

export default function ProveedorSolicitud({ children }) {
  const [borrador] = useState(leerBorrador);
  const [formulario, setFormulario] = useState({ ...FORMULARIO_VACIO, ...borrador.formulario });
  // Del documento solo se recuerda el nombre: el contenido hay que volver a adjuntarlo tras recargar.
  const [documento, setDocumento] = useState(borrador.documentoNombre ? { nombre: borrador.documentoNombre, tamano: borrador.documentoTamano, base64: null } : null);
  const [ficha, setFicha] = useState(borrador.ficha ?? null);
  const [meta, setMeta] = useState(borrador.meta ?? null);
  const [verificados, setVerificados] = useState(borrador.verificados ?? []);
  // Campos del formulario que se completaron con el documento (con su página). Se guarda para el registro.
  const [desdeDocumento, setDesdeDocumento] = useState(borrador.desdeDocumento ?? []);
  const [formularioAntes, setFormularioAntes] = useState(null); // para «Deshacer» (solo en esta sesión)
  // ID de la solicitud: su fila en el Excel de solicitudes. Se conserva en el borrador; «Empezar de nuevo» crea otro.
  const [idSolicitud, setIdSolicitud] = useState(() => borrador.idSolicitud ?? nuevoIdSolicitud());
  // "#/app/visita/formulario" (botón "Empezar una cotización") abre siempre la pestaña del formulario.
  const [vista, setVista] = useState(() => (window.location.hash.endsWith('/formulario') || !borrador.ficha ? 'formulario' : 'ficha'));
  const [estado, setEstado] = useState('inactivo'); // inactivo | generando | error
  const [error, setError] = useState(null);
  const [ia, setIa] = useState({ cargando: true, configurado: false, modelo: null, agente: null });
  // Pliego subido desde la landing que la IA está leyendo (para avisarlo en el formulario).
  const [leyendoPliego, setLeyendoPliego] = useState(false);

  // Último formulario: lo que la IA encuentra en el documento se aplica sobre lo que la persona tenga AHORA,
  // aunque haya escrito mientras la IA leía.
  const ultimoFormulario = useRef(formulario);
  const ultimoDesdeDocumento = useRef(desdeDocumento);
  useEffect(() => {
    ultimoFormulario.current = formulario;
    ultimoDesdeDocumento.current = desdeDocumento;
  }, [formulario, desdeDocumento]);

  // Cambios que llegan de otra ventana (p. ej. el registro abierto aparte): se aplican sin volver a guardarlos.
  const desdeOtraVentana = useRef(false);
  useEffect(() => {
    const alCambiarOtraVentana = (e) => {
      if (e.key !== CLAVE_BORRADOR) return;
      const b = leerBorrador();
      desdeOtraVentana.current = true;
      setFormulario({ ...FORMULARIO_VACIO, ...b.formulario });
      setFicha(b.ficha ?? null);
      setMeta(b.meta ?? null);
      setVerificados(b.verificados ?? []);
      setDesdeDocumento(b.desdeDocumento ?? []);
      if (b.idSolicitud) setIdSolicitud(b.idSolicitud);
      setDocumento((d) => (b.documentoNombre ? (d?.nombre === b.documentoNombre ? d : { nombre: b.documentoNombre, tamano: b.documentoTamano, base64: null }) : null));
    };
    window.addEventListener('storage', alCambiarOtraVentana);
    return () => window.removeEventListener('storage', alCambiarOtraVentana);
  }, []);

  useEffect(() => {
    if (desdeOtraVentana.current) {
      desdeOtraVentana.current = false;
      return;
    }
    guardarBorrador({ formulario, ficha, meta, verificados, desdeDocumento, idSolicitud, documentoNombre: documento?.nombre ?? null, documentoTamano: documento?.tamano ?? null });
  }, [formulario, ficha, meta, verificados, documento, desdeDocumento, idSolicitud]);

  useEffect(() => {
    let vigente = true;
    fetch('/api/asistente-visita/estado')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((d) => vigente && setIa({ cargando: false, configurado: Boolean(d.configurado), modelo: d.modelo, agente: d.agente }))
      .catch(() => vigente && setIa({ cargando: false, configurado: false, modelo: null, agente: null, sinServidor: true }));
    return () => {
      vigente = false;
    };
  }, []);

  const cambiar = useCallback((campo, valor) => {
    setFormulario((f) => ({ ...f, [campo]: valor }));
    // Si la persona corrige un dato que vino del documento, deja de marcarse como «del documento».
    setDesdeDocumento((d) => (d.some((x) => x.campo === campo) ? d.filter((x) => x.campo !== campo) : d));
  }, []);
  const cambiarVarios = useCallback((cambios) => setFormulario((f) => ({ ...f, ...cambios })), []);

  /** Valida y lee el archivo. Devuelve { doc } o { error }. */
  const leerDocumento = async (archivo) => {
    const tipo = archivo.type || (archivo.name.toLowerCase().endsWith('.txt') ? 'text/plain' : '');
    if (!DOCUMENTO.tiposMime.includes(tipo)) return { error: 'Solo se pueden analizar archivos PDF o de texto (.txt).' };
    if (archivo.size > DOCUMENTO.limiteMb * 1024 * 1024) return { error: `El archivo supera los ${DOCUMENTO.limiteMb} MB.` };
    try {
      return { doc: { nombre: archivo.name, tamano: archivo.size, mediaType: tipo, base64: await leerArchivoBase64(archivo) } };
    } catch (e) {
      return { error: e.message };
    }
  };

  /** Devuelve un mensaje de error o null si el archivo se adjuntó. */
  const adjuntarDocumento = useCallback(async (archivo) => {
    if (!archivo) return null;
    const { doc, error: e } = await leerDocumento(archivo);
    if (doc) setDocumento(doc);
    return e ?? null;
  }, []);

  const quitarDocumento = useCallback(() => setDocumento(null), []);

  /**
   * Genera la ficha. Opciones: modo ('demo'), doc (documento recién leído, antes de que el estado se actualice),
   * vistaFinal (a qué pestaña ir al terminar; por defecto la ficha) y registrar (guardar la solicitud en el Excel;
   * sí al pulsar «Generar ficha», no en la lectura automática del pliego subido en la landing).
   * Lo que falte en el formulario y en el pliego queda en el Excel como «Falta dato».
   */
  const generarFicha = useCallback(
    async ({ modo, doc = documento, vistaFinal = 'ficha', registrar = true } = {}) => {
      const registro = (formularioFinal, aplicados, fichaEstado) =>
        registrar && registrarEnExcel({ id: idSolicitud, formulario: formularioFinal, desdeDocumento: aplicados, documentoNombre: doc?.nombre ?? null, fichaEstado });
      setEstado('generando');
      setError(null);
      try {
        const cuerpo = {
          solicitud: aSolicitud(ultimoFormulario.current),
          documento: doc?.base64 ? { nombre: doc.nombre, mediaType: doc.mediaType, base64: doc.base64 } : null,
          modo
        };
        const r = await fetch('/api/asistente-visita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(datos.error ?? `Error ${r.status} al generar la ficha.`);
        setFicha(datos.ficha);
        // Completa los campos vacíos del formulario con lo que la IA encontró en el documento.
        const actual = ultimoFormulario.current;
        const { formulario: completado, aplicados } = aplicarDesdeDocumento(actual, datos.ficha.formularioDesdeDocumento ?? []);
        // Los datos que ya vinieron del pliego antes (y el cliente no cambió) siguen marcados como «del documento».
        const nuevos = new Set(aplicados.map((d) => d.campo));
        const delDocumento = [...ultimoDesdeDocumento.current.filter((d) => !nuevos.has(d.campo)), ...aplicados];
        setDesdeDocumento(delDocumento);
        setFormularioAntes(aplicados.length ? actual : null);
        if (aplicados.length) setFormulario(completado);
        setMeta({ ...datos.meta, generada: new Date().toISOString(), conDocumento: Boolean(cuerpo.documento) });
        setVerificados([]);
        setVista(vistaFinal);
        setEstado('inactivo');
        registro(aplicados.length ? completado : actual, delDocumento, datos.ficha.listoParaVisita ? 'Lista para agendar' : 'Faltan datos');
        return true;
      } catch (e) {
        setError(e.message === 'Failed to fetch' ? 'No hay conexión con el servidor local. Inicia la app con "npm run dev".' : e.message);
        setEstado('error');
        // Aunque la ficha falle, los datos del cliente quedan en el Excel.
        registro(ultimoFormulario.current, ultimoDesdeDocumento.current, 'Error al generar la ficha');
        return false;
      }
    },
    [documento, idSolicitud]
  );

  /**
   * Pliego subido desde la landing: se adjunta a la solicitud y la IA lo lee para llenar los campos vacíos del
   * formulario. Se queda en el formulario para que el cliente revise y complete lo que falte.
   * Devuelve un mensaje de error (archivo no válido) o null.
   */
  const leerPliegoDesdeLanding = useCallback(
    async (archivo) => {
      if (!archivo) return null;
      const { doc, error: e } = await leerDocumento(archivo);
      if (!doc) return e;
      setDocumento(doc);
      setVista('formulario');
      setLeyendoPliego(true);
      generarFicha({ doc, vistaFinal: 'formulario', registrar: false }).finally(() => setLeyendoPliego(false));
      return null;
    },
    [generarFicha]
  );

  const alternarVerificado = useCallback((indice) => setVerificados((v) => (v.includes(indice) ? v.filter((i) => i !== indice) : [...v, indice])), []);

  const deshacerDesdeDocumento = useCallback(() => {
    if (formularioAntes) setFormulario(formularioAntes);
    setDesdeDocumento([]);
    setFormularioAntes(null);
  }, [formularioAntes]);

  const reiniciar = useCallback(() => {
    setFormulario(FORMULARIO_VACIO);
    setDocumento(null);
    setFicha(null);
    setMeta(null);
    setVerificados([]);
    setDesdeDocumento([]);
    setFormularioAntes(null);
    setIdSolicitud(nuevoIdSolicitud());
    setVista('formulario');
    setEstado('inactivo');
    setError(null);
  }, []);

  const valor = {
    formulario,
    cambiar,
    cambiarVarios,
    documento,
    adjuntarDocumento,
    quitarDocumento,
    leerPliegoDesdeLanding,
    leyendoPliego,
    ficha,
    meta,
    verificados,
    alternarVerificado,
    desdeDocumento,
    puedeDeshacerDocumento: Boolean(formularioAntes),
    deshacerDesdeDocumento,
    vista,
    setVista,
    estado,
    error,
    generarFicha,
    reiniciar,
    ia
  };
  return <ContextoSolicitud.Provider value={valor}>{children}</ContextoSolicitud.Provider>;
}
