import { useEffect } from 'react';
import { Insignia, Marca, Tabla, TarjetaKpi } from '../components/ui.jsx';
import { PASOS } from '../pasos.js';

const COLUMNAS_ZONAS = [
  { clave: 'zona', titulo: 'Zona' },
  { clave: 'riesgo', titulo: 'Riesgo' },
  { clave: 'm2', titulo: 'Área (m²)', numerica: true },
  { clave: 'aplicaciones', titulo: 'Aplicaciones/mes', numerica: true }
];

export default function Plataforma({ pasoId }) {
  const indice = Math.max(0, PASOS.findIndex((p) => p.id === pasoId));
  const paso = PASOS[indice];

  useEffect(() => window.scrollTo(0, 0), [paso.id]);

  return (
    <div className="plataforma">
      <aside className="lateral">
        <a href="#/" className="lateral__marca" aria-label="Atlas, volver a la portada">
          <Marca />
        </a>
        <nav aria-label="Pasos de la cotización">
          <p className="lateral__rotulo">Cotización</p>
          <ol className="lateral__pasos">
            {PASOS.map((p, i) => (
              <li key={p.id}>
                <a href={`#/app/${p.id}`} className="lateral__paso" aria-current={p.id === paso.id ? 'page' : undefined}>
                  <span className="lateral__num">{i + 1}</span>
                  {p.nombre}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a href="#/" className="lateral__volver">
          ← Volver a la portada
        </a>
      </aside>

      <header className="superior">
        <div>
          <p className="antetitulo">
            Paso {indice + 1} de {PASOS.length}
          </p>
          <h1>{paso.nombre}</h1>
        </div>
        <Insignia>Sin implementar</Insignia>
      </header>

      <main className="contenido">
        <div className="kpis">
          {PASOS.map((p, i) => (
            <TarjetaKpi key={p.id} etiqueta={`${i + 1}. ${p.nombre}`} detalle="Sin calcular" variante={p.id === paso.id ? 'destacada' : i === PASOS.length - 1 ? 'oscura' : undefined} />
          ))}
        </div>

        <section className="panel">
          <h2>{paso.nombre}</h2>
          <p className="panel__desc">{paso.descripcion}</p>
          {paso.id === 'requisitos' && (
            <>
              <div className="leyenda-riesgo">
                <Insignia tono="error">Crítica · paño rojo</Insignia>
                <Insignia tono="aviso">Semicrítica · paño amarillo</Insignia>
                <Insignia tono="info">General · paño azul</Insignia>
              </div>
              <Tabla columnas={COLUMNAS_ZONAS} filas={[]} pie={{ zona: 'Total', m2: '—', aplicaciones: '—' }} vacio="Todavía no hay zonas." />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
