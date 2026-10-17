/**
 * Paso 5 · Costos: PRESUPUESTO PREVIO para orientar al cliente (un rango, no una cifra exacta)
 * y los datos de contacto de Atlas. La cotización final la calcula el módulo de cotización tras la visita.
 */
import { Aviso, Boton, Insignia, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { estimarPresupuesto, textoRango } from '../presupuesto/estimar.js';
import { requisitoDe, paginaDe } from '../formulario/fichaUtil.js';
import { CONTACTO_ATLAS } from '../config/contacto.js';

/** Imprime solo el presupuesto previo (y el contacto): nunca lo interno del cotizador que esté en la misma página. */
function imprimirPresupuesto() {
  document.body.classList.add('imprimiendo-presupuesto');
  const limpiar = () => {
    document.body.classList.remove('imprimiendo-presupuesto');
    window.removeEventListener('afterprint', limpiar);
  };
  window.addEventListener('afterprint', limpiar);
  window.print();
}

const fecha = () => new Date().toLocaleDateString('es-EC', { dateStyle: 'long' });
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

export function Contactanos() {
  const c = CONTACTO_ATLAS;
  const medios = [
    { id: 'correo', titulo: 'Correo', valor: c.correo, href: c.correo ? `mailto:${c.correo}` : null },
    { id: 'telefono', titulo: 'Teléfono', valor: c.telefono, href: c.telefono ? `tel:+${soloDigitos(c.telefono)}` : null },
    { id: 'whatsapp', titulo: 'WhatsApp', valor: c.whatsapp, href: c.whatsapp ? `https://wa.me/${soloDigitos(c.whatsapp)}` : null },
    { id: 'horario', titulo: 'Horario de atención', valor: c.horario },
    { id: 'ciudad', titulo: 'Ubicación', valor: c.ciudad }
  ].filter((m) => m.valor);

  return (
    <section className="contacto" aria-labelledby="contacto-titulo">
      <div className="contacto__cabecera">
        <div>
          <p className="antetitulo">Contáctanos</p>
          <h3 id="contacto-titulo">¿Dudas sobre tu presupuesto? Hablemos</h3>
          <p className="texto-suave">Agenda la visita técnica o pide la cotización final a {c.empresa}.</p>
        </div>
        {c.esEjemplo && <Insignia tono="aviso">Datos de ejemplo</Insignia>}
      </div>
      <ul className="contacto__medios">
        {medios.map((m) => (
          <li key={m.id} className="contacto__medio">
            <span className="contacto__rotulo">{m.titulo}</span>
            {m.href ? (
              <a href={m.href} target={m.id === 'whatsapp' ? '_blank' : undefined} rel={m.id === 'whatsapp' ? 'noreferrer' : undefined}>
                {m.valor}
              </a>
            ) : (
              <strong>{m.valor}</strong>
            )}
          </li>
        ))}
      </ul>
      {c.redes?.length > 0 && (
        <ul className="contacto__redes" aria-label="Redes sociales">
          {c.redes.map((r) => (
            <li key={r.red}>
              <span className="contacto__rotulo">{r.red}</span>
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.usuario}
                </a>
              ) : (
                <span>{r.usuario}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PasoCostos() {
  const { ficha, formulario, setVista } = useSolicitud();
  const est = estimarPresupuesto(ficha, formulario);
  const pliego = requisitoDe(ficha, 'costos');

  if (!est.disponible) {
    return (
      <div className="ficha">
        <Aviso
          tono="info"
          titulo="Aún no se puede estimar un presupuesto previo"
          acciones={
            <Boton variante="primario" href="#/app/visita" onClick={() => setVista('formulario')}>
              Ir al asistente de visita
            </Boton>
          }
        >
          {est.motivo} Con la ficha de visita (tamaño, zonas y turnos) se calcula un rango orientativo para el cliente.
        </Aviso>
        <Contactanos />
      </div>
    );
  }

  return (
    <div className="ficha presupuesto">
      <div className="solo-impresion presupuesto__membrete">
        <strong>{CONTACTO_ATLAS.empresa}</strong>
        <span>
          Presupuesto previo para {formulario.empresa || 'el cliente'} · {fecha()}
        </span>
      </div>

      <section className="presupuesto__resumen" aria-labelledby="presupuesto-titulo">
        <div>
          <p className="antetitulo" id="presupuesto-titulo">
            Presupuesto previo · referencial
          </p>
          <p className="presupuesto__cifra">{textoRango(est.mensual)}</p>
          <p className="presupuesto__unidad">mensuales, más IVA</p>
        </div>
        <dl className="presupuesto__extra">
          <div>
            <dt>Con IVA ({Math.round(est.iva * 100)} %)</dt>
            <dd>{textoRango(est.conIva)} al mes</dd>
          </div>
          <div>
            <dt>Referencia anual (sin IVA)</dt>
            <dd>{textoRango(est.anual)}</dd>
          </div>
        </dl>
      </section>

      <Aviso tono="aviso" titulo="Es una orientación, no una cotización">
        El valor final se calcula después de la visita técnica, con las medidas reales de cada zona, los horarios confirmados y los requisitos del cliente.
        {est.amplio ? ' Como el tamaño todavía es aproximado, el rango es más amplio.' : ''}
      </Aviso>

      <section className="ficha__seccion">
        <h3>¿De qué se compone?</h3>
        <Tabla
          columnas={[
            { clave: 'concepto', titulo: 'Concepto' },
            { clave: 'detalle', titulo: 'Detalle' },
            { clave: 'rango', titulo: 'Rango mensual', numerica: true }
          ]}
          filas={est.desglose.map((d) => ({ id: d.id, concepto: <strong>{d.concepto}</strong>, detalle: <span className="texto-suave">{d.detalle}</span>, rango: textoRango(d) }))}
        />
      </section>

      <section className="ficha__seccion">
        <h3>Se calculó con</h3>
        <ul className="ficha__lista ficha__vinetas">
          {est.supuestos.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {pliego && (
        <div className="solo-pantalla">
          <Aviso tono="info" titulo="Uso interno · referencia del pliego (no se imprime)">
            {pliego.resumen}
            {paginaDe(pliego) ? ` (${paginaDe(pliego)})` : ''}. Compárala con el rango antes de enviar el presupuesto al cliente.
          </Aviso>
        </div>
      )}

      <div className="presupuesto__acciones solo-pantalla">
        <Boton variante="primario" onClick={imprimirPresupuesto}>
          Imprimir presupuesto para el cliente
        </Boton>
        <Boton variante="secundario" href="#/app/visita" onClick={() => setVista('ficha')}>
          Ver la ficha de visita
        </Boton>
      </div>

      <Contactanos />
    </div>
  );
}
