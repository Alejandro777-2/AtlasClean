import { useState } from 'react';
import { Boton, Campo, Insignia, Marca, Pestanas } from '../components/ui.jsx';
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

export default function Portada({ sesion }) {
  const [modo, setModo] = useState('formulario');
  const [archivo, setArchivo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');
  const [turno, setTurno] = useState('');

  const destinoApp = sesion ? '#/app/requisitos' : '#/login';

  const irAPlataforma = (e) => {
    e.preventDefault();
    // Guardar borrador inicial en sessionStorage solo si el usuario ingresó datos
    if (cliente || tipo || turno) {
      const borrador = {
        cliente: cliente || '',
        tipo_infraestructura: tipo || '',
        turnos: turno || ''
      };
      sessionStorage.setItem('atlas_borrador_inicial', JSON.stringify(borrador));
    }
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
          <Marca />
          <nav className="portada-nav__enlaces" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <Boton variante="destacado" href={destinoApp}>
              {sesion ? 'Ir a la plataforma' : 'Entrar a la plataforma'}
            </Boton>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__interior">
            <div>
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
                <Boton variante="fantasma" href="#como-funciona">
                  Ver cómo funciona
                </Boton>
              </div>
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
    </>
  );
}
