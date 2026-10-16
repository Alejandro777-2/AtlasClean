import { useState } from 'react';
import { Boton, Campo, Insignia, Marca, Pestanas } from '../components/ui.jsx';
import { PASOS } from '../pasos.js';

const MODOS = [
  { valor: 'formulario', etiqueta: 'Llenar requisitos' },
  { valor: 'documento', etiqueta: 'Subir documento' }
];
// ponytail: opciones fijas mientras no existan catálogos; pasarán a configuración junto con los datos.
const TIPOS_SITIO = ['Hospital o clínica', 'Centro comercial', 'Oficinas'];
const TURNOS = ['Diurno', 'Continuo 24/7'];

const irAPlataforma = (e) => {
  e.preventDefault();
  window.location.hash = '#/app/requisitos';
};

export default function Portada() {
  const [modo, setModo] = useState('formulario');
  const [archivo, setArchivo] = useState(null);

  return (
    <>
      <header className="portada-nav">
        <div className="portada-nav__interior">
          <Marca />
          <nav className="portada-nav__enlaces" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <Boton variante="destacado" href="#/app/requisitos">
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
                <Boton variante="destacado" href="#/app/requisitos">
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
                    Continuar a la plataforma
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
