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

/**
 * `children(id, idError)`: id para enlazar la etiqueta con el control e id del mensaje de error
 * (solo si hay `error`), para usarlo en aria-describedby.
 */
export function Campo({ etiqueta, ayuda, error, children }) {
  const id = useId();
  const idError = error ? `${id}-error` : undefined;
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {children(id, idError)}
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
      {error && (
        <span id={idError} className="campo__error">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.5h0" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}
