/**
 * Barra del recorrido del cliente (3 pasos con nombre). La usan la tarjeta «Cotizar» de la landing (paso 1)
 * y el espacio del cliente (paso 2 en el formulario, paso 3 «Visita técnica» al tener la ficha).
 * Pasos hechos en verde con ✓, el actual en cian (su línea se llena al llegar) y los siguientes en gris.
 */
import { RECORRIDO_CLIENTE } from '../pasos.js';

const nombre = (p, modo) => (typeof p.etiqueta === 'string' ? p.etiqueta : p.etiqueta[modo] ?? p.etiqueta.formulario);

/** actual: índice del paso actual (0, 1 o 2). modo: 'formulario' | 'documento'. titulo: texto de arriba (opcional). */
export default function Recorrido({ actual, modo = 'formulario', titulo }) {
  const total = RECORRIDO_CLIENTE.length;
  return (
    <div className="recorrido">
      <p className="recorrido__titulo">{titulo ?? `Paso ${actual + 1} de ${total} · ${nombre(RECORRIDO_CLIENTE[actual], modo)}`}</p>
      <ol className="recorrido__pasos" aria-label="Tu recorrido para cotizar">
        {RECORRIDO_CLIENTE.map((p, i) => {
          const estado = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
          return (
            // key con el estado: al cambiar de paso el elemento se vuelve a montar y su línea se llena de nuevo.
            <li key={`${p.id}-${estado}`} className={`recorrido__paso recorrido__paso--${estado}`} aria-current={estado === 'actual' ? 'step' : undefined}>
              <span className="recorrido__barra" aria-hidden="true">
                <span className="recorrido__relleno" />
              </span>
              <span className="recorrido__nombre">
                {estado === 'hecho' && <span aria-hidden="true">✓ </span>}
                {nombre(p, modo)}
                {estado === 'hecho' && <span className="visualmente-oculto"> (listo)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
