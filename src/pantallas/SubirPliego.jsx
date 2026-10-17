/**
 * Panel "Subir pliego con IA" de la tarjeta Cotizar.
 * Estados de la zona: reposo, arrastrando, cargando, éxito y error.
 * «Continuar» lleva al formulario del cliente (#/cliente, sin login) con el pliego adjunto; ahí el
 * Asistente de visita (IA) lo lee y llena los campos vacíos (leerPliegoDesdeLanding).
 * Además, el archivo se envía, sin esperar, al backend de análisis (POST /api/analizar-documento) y
 * sus datos quedan en sessionStorage para la plataforma del equipo. Si el backend no está, no pasa nada.
 */
import { useId, useRef, useState } from 'react';
import { Boton } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { DOCUMENTO } from '../config/opciones.js';

// Lo que la IA del Asistente de visita sabe leer (PDF o texto) y el límite de tamaño, en la configuración.
const FORMATOS = DOCUMENTO.tiposAceptados.split(',');
const TEXTO_FORMATOS = `PDF o TXT · hasta ${DOCUMENTO.limiteMb} MB`;

const EXTRAE = [
  { texto: 'Metraje', icono: <path d="M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2" /> },
  { texto: 'Riesgo', icono: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM12 8v4M12 15.5h0" /> },
  {
    texto: 'Personal sugerido',
    icono: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 14.2a4.5 4.5 0 0 1 5 4.8" />
      </>
    )
  }
];

const Icono = ({ tam = 16, children }) => (
  <svg viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const formatoTamano = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const extension = (nombre) => (nombre.includes('.') ? nombre.slice(nombre.lastIndexOf('.')).toLowerCase() : '');

/** Copia para la plataforma del equipo: no bloquea ni muestra error si el backend no está corriendo. */
function enviarAlBackend(file) {
  const formData = new FormData();
  formData.append('file', file);
  fetch('/api/analizar-documento', { method: 'POST', body: formData })
    .then((resp) => (resp.ok ? resp.json() : null))
    .then((json) => json?.datos && sessionStorage.setItem('atlas_datos_ia_precargados', JSON.stringify(json.datos)))
    .catch(() => {});
}

export default function SubirPliego() {
  const { leerPliegoDesdeLanding } = useSolicitud();
  const [estado, setEstado] = useState('reposo'); // reposo | cargando | exito | error
  const [arrastrando, setArrastrando] = useState(false);
  const [archivo, setArchivo] = useState(null); // { nombre, tamano }
  const [error, setError] = useState(null); // { motivo, reintentable }
  const inputRef = useRef(null);
  const ultimoArchivo = useRef(null);
  const idError = useId();

  const abrirSelector = () => inputRef.current?.click();

  const procesar = async (file) => {
    if (!file) return;
    if (!FORMATOS.includes(extension(file.name))) {
      setError({ motivo: `Formato no permitido (${extension(file.name) || 'sin extensión'}). Usa ${TEXTO_FORMATOS}.`, reintentable: false });
      setEstado('error');
      return;
    }
    if (file.size > DOCUMENTO.limiteMb * 1024 * 1024) {
      setError({ motivo: `El archivo supera los ${DOCUMENTO.limiteMb} MB.`, reintentable: false });
      setEstado('error');
      return;
    }
    ultimoArchivo.current = file;
    setArchivo({ nombre: file.name, tamano: file.size });
    setError(null);
    setEstado('exito');
    enviarAlBackend(file);
  };

  const quitar = () => {
    sessionStorage.removeItem('atlas_datos_ia_precargados');
    ultimoArchivo.current = null;
    setArchivo(null);
    setEstado('reposo');
  };

  // Fallo al leer el archivo: reintenta con el mismo. Formato o tamaño no permitido: abre el selector.
  const reintentar = () => {
    if (error?.reintentable && ultimoArchivo.current) procesar(ultimoArchivo.current);
    else abrirSelector();
  };

  // Adjunta el pliego a la solicitud, la IA empieza a leerlo y se pasa al formulario del cliente.
  const continuar = async () => {
    if (estado !== 'exito' || !ultimoArchivo.current) return;
    setEstado('cargando');
    const motivo = await leerPliegoDesdeLanding(ultimoArchivo.current);
    if (motivo) {
      setError({ motivo, reintentable: false });
      setEstado('error');
      return;
    }
    window.location.hash = '#/cliente/visita/formulario';
  };

  const alTeclear = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrirSelector();
    }
  };

  const alSoltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    procesar(e.dataTransfer.files[0]);
  };

  const mensajeVivo = { cargando: `Cargando ${archivo?.nombre ?? 'archivo'}`, exito: 'Archivo cargado', error: error?.motivo }[estado] ?? '';
  const seleccionable = estado === 'reposo' || estado === 'error';

  return (
    <>
      <div className="pliego__extrae">
        <span className="pliego__extrae-rotulo">Atlas extrae:</span>
        <ul className="pliego__chips">
          {EXTRAE.map((x) => (
            <li key={x.texto} className="pliego__chip">
              <Icono tam={14}>{x.icono}</Icono>
              {x.texto}
            </li>
          ))}
        </ul>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="visualmente-oculto"
        accept={FORMATOS.join(',')}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          procesar(e.target.files[0]);
          e.target.value = ''; // permite volver a elegir el mismo archivo
        }}
      />

      {seleccionable ? (
        <div
          role="button"
          tabIndex={0}
          className={['zona', arrastrando && 'zona--arrastrando', estado === 'error' && 'zona--error'].filter(Boolean).join(' ')}
          aria-invalid={estado === 'error' || undefined}
          aria-describedby={estado === 'error' ? idError : undefined}
          onClick={abrirSelector}
          onKeyDown={alTeclear}
          onDragEnter={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setArrastrando(false)}
          onDrop={alSoltar}
        >
          <Icono tam={40}>
            <path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17.5 18" />
            <path d="M12 12v8M9 15l3-3 3 3" />
          </Icono>
          <span className="zona__titulo">{arrastrando ? 'Suelta el archivo para subirlo' : 'Arrastra tu pliego aquí o haz clic para elegirlo'}</span>
          <span className="zona__formatos">{TEXTO_FORMATOS}</span>
        </div>
      ) : (
        <div className="zona zona--archivo">
          <div className="archivo">
            <span className="archivo__icono">
              <Icono tam={24}>
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </Icono>
            </span>
            <span className="archivo__datos">
              <span className="archivo__nombre" title={archivo?.nombre}>
                {archivo?.nombre}
              </span>
              <span className="archivo__tamano">{estado === 'cargando' ? `${formatoTamano(archivo?.tamano ?? 0)} · Preparando tu solicitud…` : formatoTamano(archivo?.tamano ?? 0)}</span>
            </span>
            {estado === 'exito' && (
              <>
                <span className="archivo__ok" aria-hidden="true">
                  <Icono tam={18}>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </Icono>
                </span>
                <button type="button" className="archivo__quitar" onClick={quitar}>
                  Quitar
                </button>
              </>
            )}
          </div>
          {estado === 'cargando' && <span className="archivo__progreso" aria-hidden="true" />}
        </div>
      )}

      {estado === 'error' && (
        <div className="zona__mensaje-error">
          <Icono tam={14}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.5h0" />
          </Icono>
          <span>
            <span id={idError}>{error?.motivo}</span>{' '}
            <button type="button" className="zona__reintentar" onClick={reintentar}>
              Intentar de nuevo
            </button>
          </span>
        </div>
      )}

      <p className="visualmente-oculto" aria-live="polite">
        {mensajeVivo}
      </p>

      <p className="pliego__privacidad">
        <Icono tam={14}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </Icono>
        Tu documento se usa solo para esta cotización.
      </p>

      <Boton variante="destacado" className="intake__continuar" aria-disabled={estado !== 'exito'} onClick={continuar}>
        Continuar <span className="intake__flecha" aria-hidden="true">→</span>
      </Boton>
      <p className="intake__nota">Toma unos 2 minutos · Podrás editar después</p>
    </>
  );
}
