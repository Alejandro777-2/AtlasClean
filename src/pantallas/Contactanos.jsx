/**
 * «Contáctanos»: datos de contacto de Atlas para el cliente (en el paso Propuesta de su espacio).
 * Datos en src/config/contacto.js. No muestra precios: la cotización se hace después de la visita técnica.
 */
import { Insignia } from '../components/ui.jsx';
import { CONTACTO_ATLAS } from '../config/contacto.js';

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
          <h3 id="contacto-titulo">¿Dudas sobre tu solicitud? Hablemos</h3>
          <p className="texto-suave">Agenda la visita técnica o resuelve tus dudas con {c.empresa}. La cotización se hace después de la visita, con las medidas reales.</p>
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
