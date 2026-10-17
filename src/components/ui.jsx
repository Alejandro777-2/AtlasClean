/**
 * Componentes compartidos de Atlas. Sin estado propio: reciben datos por props
 * y avisan cambios con `alCambiar`. Estilos en src/index.css.
 */
import { useId } from 'react';

const cx = (...c) => c.filter(Boolean).join(' ');

/** Logotipo de Atlas en SVG (sin dependencias). Letras blancas: pensado para fondo marino. */
export function AtlasLogo({ height = 44, letters = '#FFFFFF', orb = '#3DC8FF', glow = true, className = 'logo', title = 'Atlas' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -36 288 100" height={height} className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <g fill={letters}>
        <polygon points="0.00,60.00 27.00,0.00 54.00,60.00 45.56,60.00 27.00,18.76 8.44,60.00" />
        <polygon points="60.00,0.00 106.00,0.00 106.00,7.00 86.85,7.00 86.85,60.00 79.15,60.00 79.15,7.00 60.00,7.00" />
        <polygon points="120.00,0.00 127.70,0.00 127.70,53.00 158.00,53.00 158.00,60.00 120.00,60.00" />
        <polygon points="168.00,60.00 195.00,0.00 222.00,60.00 213.56,60.00 195.00,18.76 176.44,60.00" />
      </g>
      <g stroke={letters}>
        <path
          transform="translate(238.0 0)"
          d="M34 14 C34 6 27 3.7 19 3.7 C10 3.7 4.5 8.5 4.5 15.5 C4.5 23.5 11 26.5 19 29.5 C28 32.8 34 36 34 44.5 C34 52 28 56.3 19 56.3 C10 56.3 4 52.5 3.5 45"
          fill="none"
          strokeWidth="7.4"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </g>
      {glow && <circle cx="27" cy="-11.5" r="21" fill={orb} opacity="0.28" />}
      <circle cx="27" cy="-11.5" r="12" fill={orb} />
    </svg>
  );
}

/** variante: 'primario' | 'destacado' | 'secundario' | 'contorno' | 'fantasma'. Con `href` se pinta como enlace. */
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

/** Tabla con columnas declarativas: columnas [{ clave, titulo, numerica? }], filas [{ id, ...valores }]. */
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
