/**
 * Sección "Asistente de visita": formulario del cliente y ficha de la IA, en dos pestañas.
 * Va antes de los 6 pasos de la cotización (el técnico visita el sitio y luego se cotiza).
 * La pestaña de la ficha siempre se puede abrir: sin ficha muestra qué falta y permite generarla.
 */
import { Aviso, Boton, Insignia, Pestanas } from '../components/ui.jsx';
import { REGISTRO } from '../pasos.js';
import { useSolicitud } from '../estado/contexto.js';
import { validarFormulario } from '../formulario/solicitud.js';
import FormularioCliente, { EstadoIa } from './FormularioCliente.jsx';
import FichaVisita from './FichaVisita.jsx';

// Lo que exige el formulario para generar la ficha (mismas claves que validarFormulario).
const REQUISITOS = [
  { nombre: 'Empresa o entidad', claves: ['empresa'] },
  { nombre: 'Teléfono o correo', claves: ['telefono', 'correo'] },
  { nombre: 'Dirección', claves: ['direccion'] },
  { nombre: 'Tipo de lugar', claves: ['tipologia', 'tipologiaOtro'] },
  { nombre: 'Tamaño (m² o rango)', claves: ['m2'] },
  { nombre: 'Pisos y baños (si se indican, números enteros)', claves: ['pisos', 'banos'] },
  { nombre: 'Áreas del lugar', claves: ['areas'] },
  { nombre: 'Horario del servicio', claves: ['horario'] },
  { nombre: 'Frecuencia', claves: ['frecuencia'] },
  { nombre: 'Nivel de limpieza', claves: ['nivelLimpieza'] }
];

const CONTENIDO_FICHA = [
  ['Resumen', 'Qué pide el cliente, en pocas líneas.'],
  ['Configuración inicial', 'Tipo de lugar, turnos, pasadas, maquinaria y tamaño, con su nivel de confianza.'],
  ['Zonas propuestas', 'Cada área con su riesgo, tráfico y protocolo de limpieza.'],
  ['Contradicciones', 'Lo que no cuadra en la solicitud y cómo aclararlo en el sitio.'],
  ['Verificar en la visita', 'Lista para marcar mientras el técnico recorre el lugar.'],
  ['Preguntas y qué llevar', 'Preguntas para el cliente y material para la visita.']
];

function FichaPendiente() {
  const { formulario, documento, generarFicha, estado, error, setVista, ia } = useSolicitud();
  const errores = validarFormulario(formulario);
  const faltan = REQUISITOS.filter((r) => r.claves.some((c) => errores[c]));
  const generando = estado === 'generando';

  return (
    <div className="ficha">
      <Aviso
        tono={faltan.length ? 'aviso' : 'ok'}
        titulo={faltan.length ? `Faltan ${faltan.length} dato${faltan.length === 1 ? '' : 's'} del formulario para generar la ficha` : 'El formulario está completo: ya puedes generar la ficha'}
        acciones={
          faltan.length ? (
            <Boton variante="primario" onClick={() => setVista('formulario')}>
              Completar el formulario
            </Boton>
          ) : (
            <Boton variante="primario" onClick={() => generarFicha()} disabled={generando}>
              {generando ? 'Generando ficha…' : ia.configurado ? 'Generar ficha con IA' : 'Generar ficha de visita'}
            </Boton>
          )
        }
      >
        {generando ? 'El asistente está preparando la ficha…' : 'La ficha se arma con los datos del formulario y, si lo adjuntas, con el pliego del cliente.'}
      </Aviso>

      {estado === 'error' && (
        <Aviso tono="error" titulo="No se pudo generar la ficha" acciones={<Boton variante="secundario" onClick={() => generarFicha({ modo: 'demo' })}>Generar en modo demostración</Boton>}>
          {error}
        </Aviso>
      )}

      <div className="ficha__rejilla">
        <section className="ficha__seccion">
          <div className="ficha__titulo-fila">
            <h3>Datos del formulario</h3>
            <BotonRegistro variante="secundario" />
            <Insignia tono={faltan.length ? 'aviso' : 'ok'}>
              {REQUISITOS.length - faltan.length} de {REQUISITOS.length} listos
            </Insignia>
          </div>
          <ul className="ficha__lista ficha__requisitos">
            {REQUISITOS.map((r) => {
              const mensaje = r.claves.map((c) => errores[c]).find(Boolean);
              return (
                <li key={r.nombre}>
                  <Insignia tono={mensaje ? 'aviso' : 'ok'}>{mensaje ? 'Falta' : 'Listo'}</Insignia>
                  <span>
                    <strong>{r.nombre}</strong>
                    {mensaje && <span className="texto-suave ficha__porque">{mensaje}</span>}
                  </span>
                </li>
              );
            })}
            <li>
              <Insignia tono={documento?.base64 ? 'ok' : 'neutro'}>{documento?.base64 ? 'Adjunto' : 'Opcional'}</Insignia>
              <span>
                <strong>Pliego o requerimiento</strong>
                <span className="texto-suave ficha__porque">{documento?.nombre ?? 'Sin documento: la ficha se arma solo con el formulario.'}</span>
              </span>
            </li>
          </ul>
        </section>

        <section className="ficha__seccion">
          <div className="ficha__titulo-fila">
            <h3>Qué tendrá la ficha</h3>
            <EstadoIa />
          </div>
          <ul className="ficha__lista ficha__lista--avisos ficha__lista--neutra">
            {CONTENIDO_FICHA.map(([titulo, texto]) => (
              <li key={titulo}>
                <strong>{titulo}</strong>
                <span className="texto-suave">{texto}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Abre el registro detallado del formulario en una ventana nueva del navegador. */
export function BotonRegistro({ variante = 'fantasma' }) {
  return (
    <Boton variante={variante} href={`#/app/${REGISTRO.id}`} target="_blank" rel="opener" className="boton--registro">
      Ver registro detallado ↗
    </Boton>
  );
}

export default function AsistenteVisita() {
  const { ficha, vista, setVista, estado } = useSolicitud();
  const pestana = vista === 'ficha' ? 'ficha' : 'formulario';

  const pestanas = [
    { valor: 'formulario', etiqueta: '1. Formulario del cliente', deshabilitada: estado === 'generando' },
    { valor: 'ficha', etiqueta: ficha ? '2. Ficha de visita' : '2. Ficha de visita (sin generar)' }
  ];

  return (
    <section className="panel">
      <div className="visita__cabecera">
        <div>
          <h2>{pestana === 'ficha' ? 'Ficha previa a la visita' : 'Formulario del cliente'}</h2>
          <p className="panel__desc">
            {pestana === 'ficha'
              ? 'Lo que el técnico necesita saber antes de ir: supuestos, contradicciones, qué medir y qué preguntar.'
              : 'Datos aproximados del cliente y, si tiene, su pliego. Con ellos el asistente prepara la ficha para la visita.'}
          </p>
        </div>
        <div className="visita__pestanas">
          <Pestanas etiqueta="Asistente de visita" opciones={pestanas} valor={pestana} alCambiar={setVista} />
          <BotonRegistro />
        </div>
      </div>
      {pestana === 'formulario' ? <FormularioCliente /> : ficha ? <FichaVisita /> : <FichaPendiente />}
    </section>
  );
}
