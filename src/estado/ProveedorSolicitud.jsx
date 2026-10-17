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
  // "#/app/visita/formulario" (botón "Empezar una cotización") abre siempre la pestaña del formulario.
  const [vista, setVista] = useState(() => (window.location.hash.endsWith('/formulario') || !borrador.ficha ? 'formulario' : 'ficha'));
  const [estado, setEstado] = useState('inactivo'); // inactivo | generando | error
  const [error, setError] = useState(null);
  const [ia, setIa] = useState({ cargando: true, configurado: false, modelo: null, agente: null });

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
    guardarBorrador({ formulario, ficha, meta, verificados, desdeDocumento, documentoNombre: documento?.nombre ?? null, documentoTamano: documento?.tamano ?? null });
  }, [formulario, ficha, meta, verificados, documento, desdeDocumento]);

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

  /** Devuelve un mensaje de error o null si el archivo se adjuntó. */
  const adjuntarDocumento = useCallback(async (archivo) => {
    if (!archivo) return null;
    const tipo = archivo.type || (archivo.name.toLowerCase().endsWith('.txt') ? 'text/plain' : '');
    if (!DOCUMENTO.tiposMime.includes(tipo)) return 'Solo se pueden analizar archivos PDF o de texto (.txt).';
    if (archivo.size > DOCUMENTO.limiteMb * 1024 * 1024) return `El archivo supera los ${DOCUMENTO.limiteMb} MB.`;
    try {
      const base64 = await leerArchivoBase64(archivo);
      setDocumento({ nombre: archivo.name, tamano: archivo.size, mediaType: tipo, base64 });
      return null;
    } catch (e) {
      return e.message;
    }
  }, []);

  const quitarDocumento = useCallback(() => setDocumento(null), []);

  const generarFicha = useCallback(
    async ({ modo } = {}) => {
      setEstado('generando');
      setError(null);
      try {
        const cuerpo = {
          solicitud: aSolicitud(formulario),
          documento: documento?.base64 ? { nombre: documento.nombre, mediaType: documento.mediaType, base64: documento.base64 } : null,
          modo
        };
        const r = await fetch('/api/asistente-visita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(datos.error ?? `Error ${r.status} al generar la ficha.`);
        setFicha(datos.ficha);
        // Completa los campos vacíos del formulario con lo que la IA encontró en el documento.
        const { formulario: completado, aplicados } = aplicarDesdeDocumento(formulario, datos.ficha.formularioDesdeDocumento ?? []);
        setDesdeDocumento(aplicados);
        setFormularioAntes(aplicados.length ? formulario : null);
        if (aplicados.length) setFormulario(completado);
        setMeta({ ...datos.meta, generada: new Date().toISOString(), conDocumento: Boolean(cuerpo.documento) });
        setVerificados([]);
        setVista('ficha');
        setEstado('inactivo');
        return true;
      } catch (e) {
        setError(e.message === 'Failed to fetch' ? 'No hay conexión con el servidor local. Inicia la app con "npm run dev".' : e.message);
        setEstado('error');
        return false;
      }
    },
    [formulario, documento]
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
