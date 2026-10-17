import { useState } from 'react';
import { Boton, Campo, Insignia, Marca, Pestanas } from '../components/ui.jsx';
import { PASOS } from '../pasos.js';
import { useSolicitud } from '../estado/contexto.js';
import { DOCUMENTO, INTAKE_TIPOS, INTAKE_TURNOS } from '../config/opciones.js';

const MODOS = [
  { valor: 'formulario', etiqueta: 'Llenar requisitos' },
  { valor: 'documento', etiqueta: 'Subir documento' }
];

const irAlFormulario = () => {
  window.location.hash = '#/app/visita';
};

export default function Portada() {
  const [modo, setModo] = useState('formulario');
  const [errorArchivo, setErrorArchivo] = useState(null);
  const { formulario, cambiarVarios, documento, adjuntarDocumento, setVista } = useSolicitud();
  const turnoActual = INTAKE_TURNOS.find((t) => t.horario.join() === formulario.horario.join())?.valor ?? 'diurno';

  // El formulario corto pre-llena el formulario completo del paso 1.
  const continuar = (e) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const turno = INTAKE_TURNOS.find((t) => t.valor === datos.get('turno'));
    cambiarVarios({ empresa: String(datos.get('cliente') ?? '').trim(), tipologia: String(datos.get('tipo') ?? ''), horario: turno?.horario ?? [] });
    setVista('formulario');
    irAlFormulario();
  };

  const empezar = () => setVista('formulario');

  const alElegirArchivo = async (e) => {
    setErrorArchivo(await adjuntarDocumento(e.target.files[0]));
    e.target.value = '';
  };

  return (
    <>
      <header className="portada-nav">
        <div className="portada-nav__interior">
          <Marca />
          <nav className="portada-nav__enlaces" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <Boton variante="destacado" href="#/app/visita" onClick={empezar}>
              Entrar a la plataforma
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
              <p className="hero__texto">Atlas te guía paso a paso, calcula todos los costos y deja la propuesta lista para presentar al cliente.</p>
              <div className="hero__acciones">
                {/* Abre el formulario detallado del Asistente de visita en una pestaña nueva del navegador. */}
                <Boton variante="destacado" href="#/app/visita/formulario" target="_blank" rel="opener">
                  Empezar una cotización ↗
                </Boton>
                <Boton variante="fantasma" href="#como-funciona">
                  Ver cómo funciona
                </Boton>
              </div>
            </div>

            <div className="intake">
              <Pestanas etiqueta="Cómo empezar" opciones={MODOS} valor={modo} alCambiar={setModo} />

              {modo === 'formulario' ? (
                <form className="intake__cuerpo" onSubmit={continuar}>
                  <div>
                    <h2>Describe el lugar</h2>
                    <p className="texto-suave">Con estos datos empieza la cotización. Luego completas el resto en el Asistente de visita.</p>
                  </div>
                  <Campo etiqueta="Empresa o entidad">{(id) => <input id={id} className="entrada" name="cliente" defaultValue={formulario.empresa} required />}</Campo>
                  <div className="intake__fila">
                    <Campo etiqueta="Tipo de sitio">
                      {(id) => (
                        <select id={id} className="entrada" name="tipo" defaultValue={INTAKE_TIPOS.some((t) => t.valor === formulario.tipologia) ? formulario.tipologia : INTAKE_TIPOS[0].valor}>
                          {INTAKE_TIPOS.map((t) => (
                            <option key={t.valor} value={t.valor}>
                              {t.etiqueta}
                            </option>
                          ))}
                        </select>
                      )}
                    </Campo>
                    <Campo etiqueta="Turnos">
                      {(id) => (
                        <select id={id} className="entrada" name="turno" defaultValue={turnoActual}>
                          {INTAKE_TURNOS.map((t) => (
                            <option key={t.valor} value={t.valor}>
                              {t.etiqueta}
                            </option>
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
                    <p className="texto-suave">PDF o texto, hasta {DOCUMENTO.limiteMb} MB. El asistente lo lee junto con el formulario.</p>
                  </div>
                  <label className="subida">
                    <input type="file" className="visualmente-oculto" accept={DOCUMENTO.tiposAceptados} onChange={alElegirArchivo} />
                    <strong>{documento?.nombre ?? 'Elige un archivo'}</strong>
                    <span className="texto-suave">{documento?.base64 ? 'Archivo listo. Haz clic para cambiarlo.' : 'Haz clic para seleccionarlo'}</span>
                  </label>
                  {errorArchivo ? <Insignia tono="error">{errorArchivo}</Insignia> : <Insignia tono="info">La IA lo analiza al generar la ficha de visita</Insignia>}
                  <Boton
                    variante="primario"
                    disabled={!documento?.base64}
                    onClick={() => {
                      setVista('formulario');
                      irAlFormulario();
                    }}
                  >
                    Continuar con el documento
                  </Boton>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="pasos-seccion">
          <div className="pasos-seccion__cab">
            <p className="antetitulo">Cómo funciona</p>
            <h2>Seis pasos, de los requisitos a la propuesta</h2>
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
