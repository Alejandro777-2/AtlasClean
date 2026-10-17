/**
 * ESPACIO DEL CLIENTE (#/cliente/<sección>), sin login.
 * Se entra desde la landing (tarjeta «Cotizar» → «Formulario completo para tu visita»).
 * Usa la misma distribución que la plataforma (barra lateral marino + barra superior + contenido),
 * pero solo con lo que el cliente necesita: formulario y ficha (IA), registro y presupuesto previo con contacto.
 * Los pasos internos del cotizador quedan en la plataforma del equipo (#/app, con login).
 */
import { useEffect } from 'react';
import { AtlasLogo } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import ContenidoCliente, { EstadoFicha } from './ContenidoCliente.jsx';
import PasoCostos from './PasoCostos.jsx';

const SECCIONES_ESPACIO_CLIENTE = [
  { id: 'visita', nombre: 'Tu solicitud', icono: 'IA', descripcion: 'Describe el lugar y, si tienes, sube tu pliego. El asistente prepara la visita técnica.' },
  { id: 'registro', nombre: 'Registro de tus datos', icono: '≡', descripcion: 'Todos los datos que nos diste, con su estado. Se actualiza solo al editar el formulario.' },
  { id: 'presupuesto', nombre: 'Presupuesto previo', icono: '$', descripcion: 'Un rango orientativo del costo mensual y cómo contactarnos. La cotización final se hace tras la visita.' }
];

export default function EspacioCliente({ seccion }) {
  const actual = SECCIONES_ESPACIO_CLIENTE.find((s) => s.id === seccion) ?? SECCIONES_ESPACIO_CLIENTE[0];
  const { vista } = useSolicitud();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [actual.id, vista]);

  return (
    <div className="plataforma">
      <aside className="lateral">
        <a href="#/" className="lateral__marca" aria-label="Atlas, volver a la portada">
          <AtlasLogo height={32} />
        </a>
        <nav aria-label="Tu solicitud">
          <p className="lateral__rotulo">Tu solicitud</p>
          <ol className="lateral__pasos">
            {SECCIONES_ESPACIO_CLIENTE.map((s) => (
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
          <p className="antetitulo">Antes de la visita · Atlas</p>
          <h1>{actual.nombre}</h1>
          <p className="superior__desc">{actual.descripcion}</p>
        </div>
        <EstadoFicha />
      </header>

      <main className="contenido">
        {actual.id === 'presupuesto' ? (
          <section className="panel aportes-ficha">
            <h2>Presupuesto previo</h2>
            <p className="panel__desc">Calculado con los datos de tu solicitud. Es una orientación: el valor final se define después de la visita técnica.</p>
            <PasoCostos />
          </section>
        ) : (
          <ContenidoCliente seccion={actual.id} />
        )}
      </main>
    </div>
  );
}
