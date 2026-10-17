/**
 * Sección "Cómo funciona": maestro-detalle en escritorio (tarjetas conectadas a la izquierda,
 * panel a la derecha) y acordeón en móvil (<900px).
 * Avance automático: la barra de progreso de la tarjeta activa dura 6 s y, al terminar, pasa al
 * siguiente paso; se pausa con el cursor o el foco dentro y desaparece al elegir un paso a mano.
 * Sin avance en móvil ni con prefers-reduced-motion.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Boton, Ola } from '../components/ui.jsx';
import Particulas from '../components/Particulas.jsx';
import { PASOS } from '../pasos.js';

const numero = (i) => String(i + 1).padStart(2, '0');

function useMedia(consulta) {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(mq.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [consulta]);
  return coincide;
}

function Detalle({ paso, i, conCabecera }) {
  return (
    <>
      {conCabecera && (
        <>
          <span className="como__marca" aria-hidden="true">
            {numero(i)}
          </span>
          <span className="como__det-num">{numero(i)}</span>
          <h3 className="como__det-titulo">{paso.nombre}</h3>
        </>
      )}
      <p className="como__det-desc">{paso.descripcion}</p>
      <ul className="como__vinetas">
        {paso.vinetas.map((v) => (
          <li key={v}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {v}
          </li>
        ))}
      </ul>
      <Boton variante="destacado" href="#cotizar">
        Empezar una cotización
      </Boton>
    </>
  );
}

export default function ComoFunciona() {
  const movil = useMedia('(max-width: 900px)');
  const reducir = useMedia('(prefers-reduced-motion: reduce)');
  const [activo, setActivo] = useState(0); // en móvil puede ser -1 (acordeón cerrado)
  const [manual, setManual] = useState(false);
  const [hover, setHover] = useState(false);
  const [focoDentro, setFocoDentro] = useState(false);
  const pestanas = useRef([]);
  const lista = useRef(null);
  // Centro vertical de cada tarjeta dentro de la lista: posiciona la línea, los nodos y el conector.
  const [centros, setCentros] = useState([]);

  const actual = activo < 0 ? 0 : activo;
  const autoavance = !manual && !reducir && !movil;

  useLayoutEffect(() => {
    if (movil) return;
    const medir = () => setCentros(pestanas.current.map((t) => t.offsetTop + t.offsetHeight / 2));
    medir();
    const redimension = new ResizeObserver(medir);
    redimension.observe(lista.current);
    return () => redimension.disconnect();
  }, [movil]);

  const elegir = (i) => {
    if (i !== actual) setManual(true);
    setActivo(i);
  };

  const alTeclear = (e) => {
    const destino = { ArrowDown: actual + 1, ArrowUp: actual - 1, Home: 0, End: PASOS.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    pestanas.current[(destino + PASOS.length) % PASOS.length].focus(); // el foco activa la pestaña
  };

  const clases = ['como', (hover || focoDentro) && 'como--pausado'].filter(Boolean).join(' ');

  return (
    <section
      id="como-funciona"
      className={clases}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocoDentro(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocoDentro(false)}
    >
      <Particulas cantidad={movil ? 25 : 55} className="como__particulas" />
      <Ola lado="arriba" color="var(--crema)" colorMedio="var(--ola-medio)" />

      <div className="seccion">
        <div className="seccion__cab">
          <p className="antetitulo" data-aparecer>
            Cómo funciona
          </p>
          <h2 data-aparecer>Seis pasos, de los requisitos a la propuesta</h2>
        </div>

        {movil ? (
          <div className="como__acordeon">
            {PASOS.map((p, i) => (
              <div key={p.id} className="como__item" data-aparecer>
                <button
                  type="button"
                  id={`acordeon-${p.id}`}
                  className="como__tab"
                  aria-expanded={i === activo}
                  aria-controls={`acordeon-panel-${p.id}`}
                  onClick={() => setActivo(i === activo ? -1 : i)}
                >
                  <span className="como__num">{numero(i)}</span>
                  <span>
                    <span className="como__titulo">{p.nombre}</span>
                    <span className="como__sub">{p.subtitulo}</span>
                  </span>
                </button>
                {i === activo && (
                  <div id={`acordeon-panel-${p.id}`} role="region" aria-labelledby={`acordeon-${p.id}`} className="como__acordeon-panel">
                    <Detalle paso={p} i={i} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="como__rejilla">
            {/* La lista aparece entera: línea y nodos se colocan midiendo las tarjetas. */}
            <div className="como__lista" ref={lista} data-aparecer>
              {centros.length === PASOS.length && (
                <div aria-hidden="true">
                  <span className="como__riel" style={{ top: centros[0], height: centros[PASOS.length - 1] - centros[0] }} />
                  <span className="como__riel como__riel--lleno" style={{ top: centros[0], height: centros[actual] - centros[0] }} />
                  {centros.map((c, i) => (
                    <span key={i} className={i <= actual ? 'como__nodo como__nodo--lleno' : 'como__nodo'} style={{ top: c }} />
                  ))}
                  <span className="como__conector" style={{ transform: `translateY(${centros[actual]}px)` }} />
                </div>
              )}

              <div className="como__pestanas" role="tablist" aria-label="Pasos de la cotización" aria-orientation="vertical" onKeyDown={alTeclear}>
                {PASOS.map((p, i) => (
                  <button
                    key={p.id}
                    ref={(el) => (pestanas.current[i] = el)}
                    type="button"
                    role="tab"
                    id={`tab-${p.id}`}
                    className="como__tarjeta"
                    aria-selected={i === actual}
                    aria-controls={`panel-${p.id}`}
                    tabIndex={i === actual ? 0 : -1}
                    onClick={() => elegir(i)}
                    onFocus={() => elegir(i)}
                  >
                    <span className="como__num">{numero(i)}</span>
                    <span>
                      <span className="como__titulo">{p.nombre}</span>
                      <span className="como__sub">{p.subtitulo}</span>
                    </span>
                    {autoavance && i === actual && (
                      <span className="como__progreso" aria-hidden="true" onAnimationEnd={() => setActivo((a) => (a + 1) % PASOS.length)} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Los 6 paneles comparten celda: la caja toma la altura del más largo y no salta. */}
            <div className="como__detalle" data-aparecer>
              {PASOS.map((p, i) => (
                <div
                  key={p.id}
                  id={`panel-${p.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${p.id}`}
                  inert={i !== actual}
                  className={i === actual ? 'como__panel como__panel--activo' : 'como__panel'}
                >
                  <Detalle paso={p} i={i} conCabecera />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Salida hacia "Planes" (beige): la curva se dibuja sobre el azul, como la de entrada. */}
      <Ola lado="abajo" color="var(--crema)" colorMedio="var(--ola-medio)" />
    </section>
  );
}
