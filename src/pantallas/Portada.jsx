import { useEffect, useRef, useState } from 'react';
import { AtlasLogo, Boton, Campo, Insignia, Pestanas } from '../components/ui.jsx';
import { PASOS } from '../pasos.js';

const MODOS = [
  { valor: 'formulario', etiqueta: 'Llenar requisitos' },
  { valor: 'documento', etiqueta: 'Subir pliego con IA' }
];

const TIPOS_SITIO = [
  'Salud / Salas de hospitalización / Áreas críticas hospitalarias',
  'Comercial / Retail / Patios de comida',
  'Corporativo / Oficinas',
  'Industrial / Plantas de producción / Bodegas',
  'Educativo / Institucional'
];

const TURNOS = [
  'Matutino (06:00 - 14:30)',
  'Vespertino (14:00 - 22:00)',
  'Nocturno (22:00 - 06:00)',
  'Rotativo 24/7'
];

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
const GRUPOS = [
  { x: 170, y: 500, rot: -12, escala: 1 },
  { x: 1290, y: 230, rot: 28, escala: 0.9 },
  { x: 290, y: 170, rot: 8, escala: 0.6 }
];

export default function Portada({ sesion }) {
  const [modo, setModo] = useState('formulario');
  const [archivo, setArchivo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');
  const [turno, setTurno] = useState('');

  const destinoApp = sesion ? '#/app/requisitos' : '#/login';

  // Pausa las animaciones del fondo cuando el hero sale de pantalla (ahorra batería).
  const heroRef = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting));
    observador.observe(heroRef.current);
    return () => observador.disconnect();
  }, []);

  const irAPlataforma = (e) => {
    e.preventDefault();
    window.location.hash = destinoApp;
  };

  const subirDocumentoPortada = async (file) => {
    if (!file) return;
    setArchivo(file.name);
    setAnalizando(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/analizar-documento', {
        method: 'POST',
        body: formData
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.datos) {
          sessionStorage.setItem('atlas_datos_ia_precargados', JSON.stringify(json.datos));
        }
      }
    } catch (e) {
      console.warn('Error analizando documento en portada:', e);
    } finally {
      setAnalizando(false);
      window.location.hash = destinoApp;
    }
  };

  return (
    <>
      <header className="portada-nav">
        <div className="portada-nav__interior">
          <AtlasLogo height={32} />
          <nav className="portada-nav__enlaces" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <Boton variante="destacado" href={destinoApp}>
              {sesion ? 'Ir a la plataforma' : 'Entrar a la plataforma'}
            </Boton>
          </nav>
        </div>
      </header>

      <main>
        <section ref={heroRef} className={visible ? 'hero' : 'hero hero--pausado'}>
          <svg className="hero__fondo" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {GRUPOS.map((g, i) => (
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
              <span className="hero__chip">Expo Clean Ecuador 2026 · Reto 2</span>
              <h1>
                Una cotización de limpieza <span className="hero__resaltado">clara, completa y a la medida</span> de cada lugar.
              </h1>
              <p className="hero__texto">
                Atlas analiza pliegos técnicos con Inteligencia Artificial, estructura los costos unitarios según tipología y riesgo sanitario, y guarda el levantamiento directamente en Excel local.
              </p>
              <div className="hero__acciones">
                <Boton variante="destacado" href={destinoApp}>
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

            <div className="intake">
              <Pestanas etiqueta="Cómo empezar" opciones={MODOS} valor={modo} alCambiar={setModo} />

              {modo === 'formulario' ? (
                <form className="intake__cuerpo" onSubmit={irAPlataforma}>
                  <div>
                    <h2>Describe el lugar</h2>
                    <p className="texto-suave">Con estos datos empieza la cotización.</p>
                  </div>
                  <Campo etiqueta="Empresa o entidad">
                    {(id) => (
                      <input
                        id={id}
                        className="entrada"
                        name="cliente"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        placeholder="Ej. Hospital Metropolitano / Mall El Recreo"
                        required
                      />
                    )}
                  </Campo>
                  <div className="intake__fila">
                    <Campo etiqueta="Tipo de sitio">
                      {(id) => (
                        <select
                          id={id}
                          className="entrada"
                          name="tipo"
                          value={tipo}
                          onChange={(e) => setTipo(e.target.value)}
                        >
                          <option value="">Elige un tipo de sitio...</option>
                          {TIPOS_SITIO.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      )}
                    </Campo>
                    <Campo etiqueta="Turnos">
                      {(id) => (
                        <select
                          id={id}
                          className="entrada"
                          name="turno"
                          value={turno}
                          onChange={(e) => setTurno(e.target.value)}
                        >
                          <option value="">Elige los turnos...</option>
                          {TURNOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      )}
                    </Campo>
                  </div>
                  <Boton variante="primario" type="submit">
                    Continuar a la plataforma
                  </Boton>
                </form>
              ) : (
                <div className="intake__cuerpo">
                  <div>
                    <h2>Sube el pliego o requerimiento</h2>
                    <p className="texto-suave">PDF, Word o TXT. La IA extraerá metraje, riesgo y personal sugerido.</p>
                  </div>
                  <label className="subida">
                    <input
                      type="file"
                      className="visualmente-oculto"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => subirDocumentoPortada(e.target.files[0])}
                    />
                    <strong>{archivo ?? 'Elige un pliego o TDR (PDF/Word)'}</strong>
                    <span className="texto-suave">
                      {analizando ? 'Analizando pliego con IA...' : 'Haz clic o arrastra para procesar con IA'}
                    </span>
                  </label>
                  <Insignia tono="ok">✦ Asistente IA activo: extracción instantánea</Insignia>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="pasos-seccion">
          <div className="pasos-seccion__cab">
            <p className="antetitulo">Cómo funciona</p>
            <h2>Seis pasos, de los requisitos a la propuesta en Excel</h2>
          </div>
          <ol className="pasos-rejilla">
            {PASOS.map((p, i) => (
              <li key={p.id} className="panel">
                <span className="paso-num">{i + 1}</span>
                <h3>{p.nombre}</h3>
                <p className="texto-suave">{p.descripcion}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="portada-pie">Expo Clean Ecuador 2026</footer>
    </>
  );
}
