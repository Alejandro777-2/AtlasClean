import { useEffect, useRef, useState } from 'react';
import { AtlasLogo, Boton, Campo, Insignia, Pestanas } from '../components/ui.jsx';
import ComoFunciona from './ComoFunciona.jsx';

const MODOS = [
  { valor: 'formulario', etiqueta: 'Llenar requisitos' },
  { valor: 'documento', etiqueta: 'Subir documento' }
];
// ponytail: opciones fijas mientras no existan catálogos; pasarán a configuración junto con los datos.
const TIPOS_SITIO = ['Hospital o clínica', 'Centro comercial', 'Oficinas'];
const TURNOS = ['Diurno', 'Continuo 24/7'];

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
// Grupos de anillos del fondo, cada uno con su pin en el centro. Coordenadas del viewBox 1440×640;
// la deriva de cada grupo está en App.css (.hero__grupo--N).
const GRUPOS = [
  { x: 170, y: 500, rot: -12, escala: 1 },
  { x: 1290, y: 230, rot: 28, escala: 0.9 },
  { x: 290, y: 170, rot: 8, escala: 0.6 }
];

// ponytail: sin destino hasta que exista la plataforma; por ahora solo valida los campos.
const enviar = (e) => e.preventDefault();

export default function Portada() {
  const [modo, setModo] = useState('formulario');
  const [archivo, setArchivo] = useState(null);

  // Pausa las animaciones del fondo cuando el hero sale de pantalla (ahorra batería).
  const heroRef = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting));
    observador.observe(heroRef.current);
    return () => observador.disconnect();
  }, []);

  return (
    <>
      <header className="portada-nav">
        <div className="portada-nav__interior">
          <AtlasLogo height={32} />
          <nav aria-label="Principal">
            <Boton variante="contorno" href="#cotizar">
              Ingresar
            </Boton>
          </nav>
        </div>
      </header>

      <main>
        <section ref={heroRef} className={visible ? 'hero' : 'hero hero--pausado'}>
          <svg className="hero__fondo" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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
              <ul className="hero__beneficios">
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
        </section>

        <section id="cotizar" className="seccion">
          <div className="seccion__cab">
            <p className="antetitulo">Cotizar</p>
            <h2>Cuéntanos sobre el lugar</h2>
          </div>
          <div className="intake">
              <Pestanas etiqueta="Cómo empezar" opciones={MODOS} valor={modo} alCambiar={setModo} />

              {modo === 'formulario' ? (
                <form className="intake__cuerpo" onSubmit={enviar}>
                  <div>
                    <h2>Describe el lugar</h2>
                    <p className="texto-suave">Con estos datos empieza la cotización.</p>
                  </div>
                  <Campo etiqueta="Empresa o entidad">{(id) => <input id={id} className="entrada" name="cliente" required />}</Campo>
                  <div className="intake__fila">
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
                  </div>
                  <Boton variante="primario" type="submit">
                    Continuar
                  </Boton>
                </form>
              ) : (
                <div className="intake__cuerpo">
                  <div>
                    <h2>Sube el pliego o requerimiento</h2>
                    <p className="texto-suave">PDF, Word o Excel.</p>
                  </div>
                  <label className="subida">
                    <input type="file" className="visualmente-oculto" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setArchivo(e.target.files[0]?.name ?? null)} />
                    <strong>{archivo ?? 'Elige un archivo'}</strong>
                    <span className="texto-suave">Haz clic para seleccionarlo</span>
                  </label>
                  <Insignia tono="aviso">Próximamente: lectura automática</Insignia>
                </div>
              )}
          </div>
        </section>

        <ComoFunciona />
      </main>

      <footer className="portada-pie">Expo Clean Ecuador 2026</footer>
    </>
  );
}
