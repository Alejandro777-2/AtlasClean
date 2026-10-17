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

/**
 * variante: 'destacada' | 'oscura'. Sin `valor` muestra un guion: nunca cifras inventadas.
 * `compacta`: para valores de texto (p. ej. un requisito del pliego) en lugar de una cifra.
 */
export function TarjetaKpi({ etiqueta, valor = '—', detalle, variante, compacta }) {
  return (
    <div className={cx('kpi', variante && `kpi--${variante}`, compacta && 'kpi--compacta')}>
      <span className="kpi__etiqueta">{etiqueta}</span>
      <span className="kpi__valor">{valor}</span>
      {detalle && <span className="kpi__detalle">{detalle}</span>}
    </div>
  );
}

/**
 * `children` es una función que recibe el id para enlazar la etiqueta con el control y, como segundo
 * argumento, los atributos de accesibilidad del error ({ 'aria-invalid', 'aria-describedby' }).
 */
export function Campo({ etiqueta, ayuda, error, opcional, children }) {
  const id = useId();
  const idError = `${id}-error`;
  const accesible = error ? { 'aria-invalid': true, 'aria-describedby': idError } : {};
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
        {opcional && <span className="campo__opcional"> (opcional)</span>}
      </label>
      {children(id, accesible)}
      {error ? (
        <span className="campo__error" id={idError}>
          {error}
        </span>
      ) : (
        ayuda && <span className="campo__ayuda">{ayuda}</span>
      )}
    </div>
  );
}

/**
 * Grupo de opciones de una sola elección (radio) o de varias (casillas), con aspecto de pastillas.
 * opciones: [{ valor, etiqueta, ayuda? }]. Con `multiple`, `valor` es una lista.
 */
export function Opciones({ etiqueta, opciones, valor, alCambiar, multiple = false, error, ayuda, nombre }) {
  const id = useId();
  const grupo = nombre ?? id;
  const marcado = (v) => (multiple ? valor.includes(v) : valor === v);
  const elegir = (v) => {
    if (!multiple) return alCambiar(v);
    alCambiar(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
  };
  return (
    <fieldset className="opciones" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="campo__etiqueta">{etiqueta}</legend>
      <div className="opciones__lista">
        {opciones.map((o) => (
          <label key={o.valor} className={cx('opcion', marcado(o.valor) && 'opcion--marcada')}>
            <input type={multiple ? 'checkbox' : 'radio'} name={grupo} value={o.valor} checked={marcado(o.valor)} onChange={() => elegir(o.valor)} className="visualmente-oculto" />
            <span className="opcion__texto">{o.etiqueta}</span>
            {o.ayuda && <span className="opcion__ayuda">{o.ayuda}</span>}
          </label>
        ))}
      </div>
      {error ? (
        <span className="campo__error" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        ayuda && <span className="campo__ayuda">{ayuda}</span>
      )}
    </fieldset>
  );
}

/** Mensaje destacado. tono: 'info' | 'ok' | 'aviso' | 'error' */
export function Aviso({ tono = 'info', titulo, children, acciones }) {
  return (
    <div className={cx('aviso', `aviso--${tono}`)} role={tono === 'error' ? 'alert' : 'status'}>
      <div>
        {titulo && <p className="aviso__titulo">{titulo}</p>}
        {children && <div className="aviso__texto">{children}</div>}
      </div>
      {acciones && <div className="aviso__acciones">{acciones}</div>}
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
        <button key={o.valor} type="button" role="tab" aria-selected={o.valor === valor} className="pestanas__boton" disabled={o.deshabilitada} title={o.ayuda} onClick={() => alCambiar(o.valor)}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
