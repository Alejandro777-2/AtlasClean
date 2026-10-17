import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AtlasLogo, Boton, Campo, Ola } from '../components/ui.jsx';
import ComoFunciona from './ComoFunciona.jsx';
import SubirPliego from './SubirPliego.jsx';
import Planes from './Planes.jsx';

// Dos formas de empezar la cotización (pestañas con forma de tarjeta).
const MODOS = [
  {
    valor: 'formulario',
    etiqueta: 'Llenar requisitos',
    descripcion: 'Responde unas preguntas rápidas',
    icono: <path d="M10 6h10M10 12h10M10 18h10M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
  },
  {
    valor: 'documento',
    etiqueta: 'Subir pliego con IA',
    descripcion: 'Sube el documento y Atlas lo lee',
    ia: true,
    icono: (
      <>
        <path d="M12 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
        <path d="M9 13h6M9 17h4M18 2v6M15 5h6" />
      </>
    )
  }
];
const SEGMENTOS = 6;
// Mismas tipologías y turnos que usa la plataforma.
const TIPOS_SITIO = [
  'Salud / Salas de hospitalización / Áreas críticas hospitalarias',
  'Comercial / Retail / Patios de comida',
  'Corporativo / Oficinas',
  'Industrial / Plantas de producción / Bodegas',
  'Educativo / Institucional'
];
const TURNOS = ['Matutino (06:00 - 14:30)', 'Vespertino (14:00 - 22:00)', 'Nocturno (22:00 - 06:00)', 'Rotativo 24/7'];

// Beneficios bajo los CTA del hero. Iconos lineales propios (SVG en línea, sin dependencias).
const BENEFICIOS = [
  {
    texto: '6 pasos guiados',
    icono: <path d="M10 6h10M10 12h10M10 18h10M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
  },
  {
    texto: 'Personal, insumos y equipos calculados',
    icono: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 11h1M12 11h1M16 11h0M8 15h1M12 15h1M8 18h1M12 18h1M16 14v4" />
      </>
    )
  },
  {
    texto: 'Propuesta lista para el cliente',
    icono: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    )
  }
];

// Curva de nivel base (centrada en 0,0) que el fondo del hero repite a distintas escalas.
const CURVA = 'M0,-100 C60,-104 110,-58 104,0 C99,56 52,96 0,98 C-66,100 -114,48 -108,-6 C-102,-60 -56,-97 0,-100Z';
const ESCALAS = [0.5, 0.9, 1.3, 1.7, 2.1, 2.5, 2.9];
// Grupos de anillos del fondo, cada uno con su pin en el centro. Coordenadas del viewBox 1440×900
// (proporción del hero a pantalla completa); misma x de siempre, en los bordes, lejos del texto.
// La deriva de cada grupo está en App.css (.hero__grupo--N).
const GRUPOS = [
  { x: 170, y: 700, rot: -12, escala: 1.2 },
  { x: 1290, y: 325, rot: 28, escala: 1.08 },
  { x: 150, y: 190, rot: 8, escala: 0.72 } // más al borde: el titular ahora llega casi hasta x≈200
];

export default function Portada({ sesion }) {
  const [modo, setModo] = useState('formulario');

  // Con sesión se entra directo a la plataforma; sin sesión, al login.
  const destinoApp = sesion ? '#/app/requisitos' : '#/login';

  // Único obligatorio: "Empresa o entidad" (los selectores siempre tienen una opción elegida).
  // Se valida al salir del campo y al intentar continuar.
  const [cliente, setCliente] = useState('');
  const [tocado, setTocado] = useState(false);
  const clienteRef = useRef(null);
  const valido = cliente.trim() !== '';
  const errorCliente = tocado && !valido ? 'Escribe el nombre de la empresa' : null;

  const irAPlataforma = (e) => {
    e.preventDefault();
    if (!valido) {
      setTocado(true);
      clienteRef.current?.focus();
      return;
    }
    window.location.hash = destinoApp;
  };

  // Pestañas de modo: flechas izquierda/derecha (y Home/End) mueven el foco y activan el modo.
  const modosRef = useRef([]);
  const alTeclearModos = (e) => {
    const actual = MODOS.findIndex((m) => m.valor === modo);
    const destino = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: 0, End: MODOS.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    const i = (destino + MODOS.length) % MODOS.length;
    setModo(MODOS[i].valor);
    modosRef.current[i].focus();
  };


  // Aparición al hacer scroll: los elementos con data-aparecer (también los de ComoFunciona) se
  // ocultan antes del primer pintado y aparecen al entrar en pantalla, escalonados 80 ms dentro de
  // cada sección (máx. 6 pasos). Una sola vez: después se quita el estado y se dejan de observar.
  // React no gestiona data-estado-aparicion, así que sus re-renderizados no lo pisan. Lo que se
  // monte después (p. ej. el acordeón al pasar a móvil) no se marca y se ve directamente.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elementos = [...document.querySelectorAll('[data-aparecer]')];
    const porSeccion = new Map();
    for (const el of elementos) {
      const seccion = el.closest('section');
      const i = porSeccion.get(seccion) ?? 0;
      porSeccion.set(seccion, i + 1);
      el.style.setProperty('--retraso', `${Math.min(i, 5) * 80}ms`);
      el.dataset.estadoAparicion = 'oculto';
    }
    const alTerminar = (e) => {
      if (e.target !== e.currentTarget || e.propertyName !== 'opacity') return;
      const el = e.currentTarget;
      el.removeEventListener('transitionend', alTerminar);
      el.removeAttribute('data-estado-aparicion');
      el.style.removeProperty('--retraso');
    };
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.addEventListener('transitionend', alTerminar);
          entrada.target.dataset.estadoAparicion = 'visible';
          observador.unobserve(entrada.target);
        }
      },
      { threshold: 0.15 }
    );
    elementos.forEach((el) => observador.observe(el));
    return () => {
      observador.disconnect();
      for (const el of elementos) {
        el.removeEventListener('transitionend', alTerminar);
        el.removeAttribute('data-estado-aparicion');
      }
    };
  }, []);

  // Pausa las animaciones del fondo cuando el hero sale de pantalla (ahorra batería).
  const heroRef = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting));
    observador.observe(heroRef.current);
    return () => observador.disconnect();
  }, []);

  // Nav: transparente sobre el hero y sólido pasados 40px. La barra de progreso usa
  // animation-timeline: scroll() si el navegador lo soporta; si no, se actualiza aquí con rAF.
  const [navSolido, setNavSolido] = useState(false);
  const barraRef = useRef(null);
  useEffect(() => {
    const conTimeline = CSS.supports('animation-timeline: scroll()');
    let raf = 0;
    const actualizar = () => {
      raf = 0;
      setNavSolido(window.scrollY > 40);
      if (!conTimeline && barraRef.current) {
        const recorrido = document.documentElement.scrollHeight - window.innerHeight;
        barraRef.current.style.transform = `scaleX(${recorrido > 0 ? Math.min(1, window.scrollY / recorrido) : 0})`;
      }
    };
    const alMover = () => {
      if (!raf) raf = requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', alMover);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', alMover);
      window.removeEventListener('resize', alMover);
    };
  }, []);

  return (
    <>
      <header className={navSolido ? 'portada-nav portada-nav--flotante portada-nav--solido' : 'portada-nav portada-nav--flotante'}>
        {/* La pista sube con el nav al compactarse; la barra dentro solo escala en X. */}
        <span className="portada-nav__pista" aria-hidden="true">
          <span ref={barraRef} className="portada-nav__progreso" />
        </span>
        <div className="portada-nav__interior">
          <AtlasLogo height={40} />
          <nav aria-label="Principal">
            <Boton variante="contorno" href={destinoApp}>
              {sesion ? 'Ir a la plataforma' : 'Ingresar'}
            </Boton>
          </nav>
        </div>
      </header>

      <main>
        <section ref={heroRef} className={visible ? 'hero' : 'hero hero--pausado'}>
          <svg className="hero__fondo" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {GRUPOS.map((g, i) => (
              // El <g> exterior lo anima el CSS; el interior lo posiciona (un transform CSS pisaría el atributo).
              <g key={i} className={`hero__grupo hero__grupo--${i + 1}`}>
                <g transform={`translate(${g.x} ${g.y})`}>
                  <g fill="none" stroke="#fff" strokeWidth="1" opacity="0.055">
                    {ESCALAS.map((s) => (
                      <path key={s} d={CURVA} transform={`rotate(${g.rot}) scale(${s * g.escala})`} vectorEffect="non-scaling-stroke" />
                    ))}
                  </g>
                  <circle className="hero__halo" r="22" fill="var(--cian)" />
                  <circle r="6" fill="var(--cian)" opacity="0.35" />
                </g>
              </g>
            ))}
          </svg>

          <div className="hero__interior">
            <div className="hero__contenido">
              <h1>
                Una cotización de limpieza <span className="hero__resaltado">clara, completa y a la medida</span> de cada lugar.
              </h1>
              <p className="hero__texto">Atlas te guía paso a paso, calcula todos los costos y deja la propuesta lista en minutos, sin hojas de cálculo.</p>
              <div className="hero__acciones">
                <Boton variante="destacado" href="#cotizar">
                  Empezar una cotización
                </Boton>
                <Boton variante="contorno" href="#como-funciona">
                  Ver cómo funciona <span aria-hidden="true">↓</span>
                </Boton>
              </div>
              <ul className="hero__beneficios" data-aparecer>
                {BENEFICIOS.map((b) => (
                  <li key={b.texto}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {b.icono}
                    </svg>
                    {b.texto}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Ola lado="abajo" color="var(--crema)" colorMedio="var(--ola-medio)" />
        </section>

        <section id="cotizar" className="seccion">
          <div className="seccion__cab">
            <p className="antetitulo" data-aparecer>
              Cotizar
            </p>
            <h2 data-aparecer>Cuéntanos sobre el lugar</h2>
          </div>
          <div className="intake" data-aparecer>
            <div className="intake__progreso">
              <p className="intake__paso">Paso 1 de 6 · Requisitos</p>
              <div className="intake__segmentos" aria-hidden="true">
                {Array.from({ length: SEGMENTOS }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
            </div>

            <div className="modos" role="tablist" aria-label="Cómo quieres empezar" onKeyDown={alTeclearModos}>
              {MODOS.map((m, i) => (
                <button
                  key={m.valor}
                  ref={(el) => (modosRef.current[i] = el)}
                  type="button"
                  role="tab"
                  id={`modo-${m.valor}`}
                  className="modo"
                  aria-selected={m.valor === modo}
                  aria-controls={`panel-${m.valor}`}
                  tabIndex={m.valor === modo ? 0 : -1}
                  onClick={() => setModo(m.valor)}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {m.icono}
                  </svg>
                  <span className="modo__texto">
                    <span className="modo__titulo">
                      {m.etiqueta}
                      {m.ia && <span className="modo__ia">IA</span>}
                    </span>
                    <span className="modo__desc">{m.descripcion}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Los dos paneles comparten celda: la tarjeta toma la altura del más alto y no salta al
                cambiar de modo; el inactivo queda oculto e inerte y el cambio es un fundido. */}
            <div className="intake__paneles">
                <form
                  id="panel-formulario"
                  role="tabpanel"
                  aria-labelledby="modo-formulario"
                  className={modo === 'formulario' ? 'intake__cuerpo intake__panel intake__panel--activo' : 'intake__cuerpo intake__panel'}
                  inert={modo !== 'formulario'}
                  onSubmit={irAPlataforma}
                  noValidate
                >
                  <Campo etiqueta="Empresa o entidad" error={errorCliente}>
                    {(id, idError) => (
                      <input
                        id={id}
                        ref={clienteRef}
                        className="entrada"
                        name="cliente"
                        autoComplete="organization"
                        placeholder="Ej. Clínica San Rafael"
                        required
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        onBlur={() => setTocado(true)}
                        aria-invalid={Boolean(errorCliente)}
                        aria-describedby={idError}
                      />
                    )}
                  </Campo>
                  <Campo etiqueta="Tipo de sitio">
                    {(id) => (
                      <select id={id} className="entrada" name="tipo">
                        {TIPOS_SITIO.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </Campo>
                  <Campo etiqueta="Turnos">
                    {(id) => (
                      <select id={id} className="entrada" name="turno">
                        {TURNOS.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </Campo>
                  {/* aria-disabled y no disabled: así el clic llega al formulario y muestra qué falta. */}
                  <Boton variante="destacado" type="submit" className="intake__continuar" aria-disabled={!valido}>
                    Continuar <span className="intake__flecha" aria-hidden="true">→</span>
                  </Boton>
                  <p className="intake__nota">Toma unos 2 minutos · Podrás editar después</p>
                </form>
                <div
                  id="panel-documento"
                  role="tabpanel"
                  aria-labelledby="modo-documento"
                  className={modo === 'documento' ? 'intake__cuerpo intake__panel intake__panel--activo' : 'intake__cuerpo intake__panel'}
                  inert={modo !== 'documento'}
                >
                  <SubirPliego destinoApp={destinoApp} />
                </div>
            </div>
          </div>
        </section>

        <ComoFunciona />
        <Planes />
      </main>

      <footer className="portada-pie">Expo Clean Ecuador 2026</footer>
    </>
  );
}
