/**
 * Componentes compartidos de Atlas. Sin estado propio: reciben datos por props
 * y avisan cambios con `alCambiar`. Estilos en src/index.css.
 */
import { useId } from 'react';

const cx = (...c) => c.filter(Boolean).join(' ');

export function Marca() {
  return (
    <span className="marca">
      <span className="marca__simbolo" aria-hidden="true">A</span>
      Atlas
    </span>
  );
}

/** variante: 'primario' | 'destacado' | 'secundario' | 'fantasma'. Con `href` se pinta como enlace. */
export function Boton({ variante = 'secundario', href, className, ...props }) {
  const clase = cx('boton', `boton--${variante}`, className);
  return href ? <a href={href} className={clase} {...props} /> : <button type="button" className={clase} {...props} />;
}

/** tono: 'neutro' | 'ok' | 'aviso' | 'error' | 'info' */
export function Insignia({ tono = 'neutro', children }) {
  return <span className={cx('insignia', tono !== 'neutro' && `insignia--${tono}`)}>{children}</span>;
}

/** variante: 'destacada' | 'oscura'. Sin `valor` muestra un guion: nunca cifras inventadas. */
export function TarjetaKpi({ etiqueta, valor = '—', detalle, variante }) {
  return (
    <div className={cx('kpi', variante && `kpi--${variante}`)}>
      <span className="kpi__etiqueta">{etiqueta}</span>
      <span className="kpi__valor">{valor}</span>
      {detalle && <span className="kpi__detalle">{detalle}</span>}
    </div>
  );
}

/** `children` es una función que recibe el id para enlazar la etiqueta con el control. */
export function Campo({ etiqueta, ayuda, children }) {
  const id = useId();
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {children(id)}
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </div>
  );
}

/**
 * columnas: [{ clave, titulo, numerica }]
 * pie: fila de totales opcional con las mismas claves
 */
export function Tabla({ columnas, filas, pie, vacio = 'Sin datos.' }) {
  const clase = (c) => (c.numerica ? 'num' : undefined);
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={clase(c)}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="tabla__vacio">
                {vacio}
              </td>
            </tr>
          ) : (
            filas.map((f, i) => (
              <tr key={f.id ?? i}>
                {columnas.map((c) => (
                  <td key={c.clave} className={clase(c)}>
                    {f[c.clave]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {pie && (
          <tfoot>
            <tr>
              {columnas.map((c) => (
                <td key={c.clave} className={clase(c)}>
                  {pie[c.clave]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** opciones: [{ valor, etiqueta }] */
export function Pestanas({ opciones, valor, alCambiar, etiqueta }) {
  return (
    <div className="pestanas" role="tablist" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="tab" aria-selected={o.valor === valor} className="pestanas__boton" onClick={() => alCambiar(o.valor)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
