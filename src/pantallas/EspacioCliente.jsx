/**
 * ESPACIO DEL CLIENTE (#/cliente/<sección>), sin login.
 * Se entra desde la landing (tarjeta «Cotizar» → «Continuar»).
 * Usa la misma distribución que la plataforma (barra lateral marino + barra superior + contenido),
 * pero solo con lo que el cliente necesita: su solicitud (formulario y ficha con IA), el registro de sus datos
 * y los pasos de su cotización en versión para el cliente (sin precios, costos internos ni márgenes).
 * El cotizador completo queda en la plataforma del equipo (#/app, con login).
 */
import { useEffect } from 'react';
import { AtlasLogo } from '../components/ui.jsx';
import Recorrido from '../components/Recorrido.jsx';
import { PASOS_CLIENTE } from '../pasos.js';
import { useSolicitud } from '../estado/contexto.js';
import ContenidoCliente, { EstadoFicha } from './ContenidoCliente.jsx';
import PasoCliente from './PasoCliente.jsx';

const SECCIONES_SOLICITUD = [
  { id: 'visita', nombre: 'Tu solicitud', icono: 'IA', descripcion: 'Describe el lugar y, si tienes, sube tu pliego. El asistente prepara la visita técnica.' },
  { id: 'registro', nombre: 'Registro de tus datos', icono: '≡', descripcion: 'Todos los datos que nos diste, con su estado. Se actualiza solo al editar el formulario.' }
];

// Enlaces antiguos: el presupuesto previo se quitó (el precio llega en la propuesta, tras la visita).
const ALIAS = { presupuesto: 'propuesta', costos: 'propuesta' };

export default function EspacioCliente({ seccion }) {
  const id = ALIAS[seccion] ?? seccion;
  const indicePaso = PASOS_CLIENTE.findIndex((p) => p.id === id);
  const paso = indicePaso >= 0 ? PASOS_CLIENTE[indicePaso] : null;
  const actual = paso ?? SECCIONES_SOLICITUD.find((s) => s.id === id) ?? SECCIONES_SOLICITUD[0];
  const { vista, ficha, documento } = useSolicitud();

  // Recorrido: paso 2 («Tu formulario») mientras llena su solicitud; paso 3 («Visita técnica») cuando ya
  // envió los datos y tiene la ficha con las recomendaciones (y en los pasos de la cotización).
  const enFormulario = actual.id === 'visita' ? vista !== 'ficha' : !ficha;
  const pasoRecorrido = ficha && !enFormulario ? 2 : 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [actual.id, vista]);

  return (
    <div className="plataforma">
      <aside className="lateral">
        <a href="#/" className="lateral__marca" aria-label="Atlas, volver a la portada">
          <AtlasLogo height={32} />
        </a>
        <nav className="lateral__nav" aria-label="Tu espacio">
          <div className="lateral__grupo">
            <p className="lateral__rotulo">Tu solicitud</p>
            <ol className="lateral__pasos">
              {SECCIONES_SOLICITUD.map((s) => (
                <li key={s.id}>
                  <a href={`#/cliente/${s.id}`} className="lateral__paso" aria-current={s.id === actual.id ? 'page' : undefined}>
                    <span className="lateral__num lateral__num--ia" aria-hidden="true">
                      {s.icono}
                    </span>
                    {s.nombre}
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <div className="lateral__grupo">
            <p className="lateral__rotulo">Tu cotización paso a paso</p>
            <ol className="lateral__pasos">
              {PASOS_CLIENTE.map((p, i) => (
                <li key={p.id}>
                  <a href={`#/cliente/${p.id}`} className="lateral__paso" aria-current={p.id === actual.id ? 'page' : undefined}>
                    <span className="lateral__num">{i + 1}</span>
                    {p.nombre}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <div className="lateral__pie">
          <a href="#/" className="lateral__volver">
            ← Volver a la portada
          </a>
          <a href="#/login" className="lateral__equipo">
            ¿Eres del equipo Atlas? Ingresar
          </a>
        </div>
      </aside>

      <header className="superior">
        <div>
          <p className="antetitulo">{paso ? `Paso ${indicePaso + 1} de ${PASOS_CLIENTE.length} · Tu cotización` : 'Antes de la visita · Atlas'}</p>
          <h1>{actual.nombre}</h1>
          <p className="superior__desc">{actual.descripcion}</p>
        </div>
        <EstadoFicha />
      </header>

      <main className="contenido">
        <section className="panel recorrido-panel" aria-label="Tu recorrido">
          <Recorrido actual={pasoRecorrido} modo={documento ? 'documento' : 'formulario'} />
        </section>
        {paso ? (
          <section className="panel aportes-ficha" aria-label={paso.nombre}>
            <PasoCliente paso={paso} />
          </section>
        ) : (
          <ContenidoCliente seccion={actual.id} />
        )}
      </main>
    </div>
  );
}
