/**
 * Sección "Planes": tres tarjetas (Mensual, Semestral, Anual) a partir de CONFIG_PLANES.
 * El precio por mes y el ahorro se calculan en planes.js; aquí no se escribe ninguna cifra.
 */
import { Boton, Insignia } from '../components/ui.jsx';
import Particulas from '../components/Particulas.jsx';
import { CONFIG_PLANES, calcularPlanes, formatoMoneda, formatoPorcentaje } from '../planes.js';

const PLANES = calcularPlanes();
const TEXTO_BOTON = CONFIG_PLANES.pruebaGratis ? 'Empezar prueba gratis' : 'Elegir plan';
const NOTA = [`Precios en ${CONFIG_PLANES.moneda}.`, CONFIG_PLANES.notaIva, CONFIG_PLANES.notaPermanencia].filter(Boolean).join(' ');

export default function Planes() {
  return (
    <section id="planes" className="planes">
      {/* Las tarjetas ocupan ~1168px: las franjas laterales empiezan fuera de ellas. */}
      <Particulas
        tema="claro"
        cantidad={45}
        cantidadMovil={20}
        opciones={{ laterales: { proporcion: 0.7, anchoCentral: 1200 } }}
        className="particulas-claras particulas-claras--planes"
      />
      <div className="seccion">
        <div className="seccion__cab">
          <p className="antetitulo" data-aparecer>
            Planes
          </p>
          <h2 data-aparecer>Un solo producto, tres formas de pagar</h2>
          <p className="planes__subtitulo" data-aparecer>
            {CONFIG_PLANES.subtitulo}
          </p>
          {CONFIG_PLANES.preciosProvisionales && (
            <p className="planes__provisional">
              <Insignia tono="aviso">Precios de ejemplo</Insignia>
            </p>
          )}
        </div>

        <ul className="planes__rejilla">
          {PLANES.map((p) => {
            const idTitulo = `plan-${p.id}-titulo`;
            return (
              <li key={p.id} className={['plan', `plan--${p.id}`, p.destacado && 'plan--destacado'].filter(Boolean).join(' ')} aria-labelledby={idTitulo} data-aparecer>
                {p.etiqueta && <span className="plan__etiqueta">{p.etiqueta}</span>}
                <h3 id={idTitulo} className="plan__nombre">
                  {p.nombre}
                </h3>
                <p className="plan__precio">
                  <span className="plan__monto">{formatoMoneda(p.porMes)}</span>
                  <span className="plan__unidad">/mes</span>
                </p>
                <p className="plan__cobro">
                  Se cobra {formatoMoneda(p.total)} {p.cobro}
                </p>
                {p.ahorro > 0 && <span className="plan__ahorro">Ahorras {formatoPorcentaje(p.ahorro)}</span>}
                <ul className="plan__funciones">
                  {CONFIG_PLANES.funciones.map((f) => (
                    <li key={f}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Boton
                  variante={p.destacado ? 'destacado' : 'contorno'}
                  href={p.href}
                  className="plan__boton"
                  aria-label={`${TEXTO_BOTON} ${p.nombre.toLowerCase()}, ${formatoMoneda(p.total)} ${p.cobro}`}
                >
                  {TEXTO_BOTON}
                </Boton>
              </li>
            );
          })}
        </ul>

        <p className="planes__nota">{NOTA}</p>
      </div>
    </section>
  );
}
