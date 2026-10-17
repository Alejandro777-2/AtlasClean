/**
 * Fondo de partículas en <canvas> (decorativo). Puntos que derivan lento y se unen con líneas
 * cuando están cerca; el tema claro añade dos grupos de anillos concéntricos con un pin.
 * Pausa fuera de pantalla o con la pestaña oculta (cada canvas por separado); con
 * prefers-reduced-motion dibuja un solo fotograma. En desarrollo, ?motion=on en la URL ignora
 * reduced-motion para poder probar la animación.
 *
 * `tema`: 'oscuro' (secciones azules) o 'claro' (secciones beige). `opciones` sobrescribe
 * cualquier parámetro del tema. Los colores son nombres de variables CSS (tokens).
 * `cantidad` / `cantidadMovil`: puntos en escritorio y por debajo de 900px.
 * Atributos para diagnóstico: data-animando ("1"/"0") y data-tamano ("ancho×alto").
 */
import { useEffect, useRef } from 'react';

const TEMAS = {
  oscuro: {
    colores: ['--cian', '--cian-claro'], // el primero con probabilidad 0.6
    colorLinea: '--cian',
    opacidad: [0.15, 0.6],
    radio: [1, 2.5],
    velocidad: [0.15, 0.35],
    distancia: 130,
    opacidadLinea: 0.15,
    laterales: null,
    grupos: null
  },
  claro: {
    colores: ['--info'], // azul de acento
    colorLinea: '--info',
    opacidad: [0.25, 0.5],
    radio: [1, 2], // diámetro 2–4px
    velocidad: [0.12, 0.25],
    distancia: 160,
    opacidadLinea: 0.18,
    // 70 % de los puntos en las franjas laterales, fuera del ancho central de las tarjetas.
    laterales: { proporcion: 0.7, anchoCentral: 720 },
    // Dos grupos de anillos concéntricos en esquinas opuestas, en parte fuera de la sección.
    grupos: {
      color: '--info',
      anillos: 6,
      radioExterior: [260, 340],
      opacidad: [0.1, 0.16],
      amplitud: [60, 100], // px de deriva
      periodo: [45000, 70000], // ms por ciclo
      pin: { radio: 5, halo: 16, opacidad: 0.28 }
    }
  }
};

const entre = ([min, max]) => min + Math.random() * (max - min);
const forzarMovimiento = () => import.meta.env.DEV && new URLSearchParams(window.location.search).get('motion') === 'on';

export default function Particulas({ tema = 'oscuro', opciones, cantidad, cantidadMovil = cantidad, className }) {
  const ref = useRef(null);
  const opcionesRef = useRef(opciones);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const cfg = { ...TEMAS[tema], ...opcionesRef.current };
    const estilos = getComputedStyle(canvas);
    const color = (nombre) => estilos.getPropertyValue(nombre).trim();
    const colores = cfg.colores.map(color);
    const colorLinea = color(cfg.colorLinea);
    const colorGrupo = cfg.grupos && color(cfg.grupos.color);
    const reducir = !forzarMovimiento() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movil = window.matchMedia('(max-width: 900px)');
    let ancho = 0;
    let alto = 0;
    let puntos = [];
    let grupos = [];
    let raf = 0;
    let visible = true;
    let tiempo = 0;

    // Franja horizontal donde vive cada punto: lateral izquierda, lateral derecha o todo el ancho.
    const franja = () => {
      const lat = cfg.laterales;
      const anchoLateral = lat ? (ancho - lat.anchoCentral) / 2 : 0;
      if (!lat || anchoLateral < 40 || Math.random() >= lat.proporcion) return [0, ancho];
      return Math.random() < 0.5 ? [0, anchoLateral] : [ancho - anchoLateral, ancho];
    };
    const crearPunto = () => {
      const [x0, x1] = franja();
      const angulo = Math.random() * Math.PI * 2;
      const v = entre(cfg.velocidad);
      return {
        x0,
        x1,
        x: x0 + Math.random() * (x1 - x0),
        y: Math.random() * alto,
        vx: Math.cos(angulo) * v,
        vy: Math.sin(angulo) * v,
        r: entre(cfg.radio),
        a: entre(cfg.opacidad),
        color: colores.length > 1 && Math.random() >= 0.6 ? colores[1] : colores[0]
      };
    };
    // Esquinas opuestas: arriba a la derecha y abajo a la izquierda, con el centro algo fuera.
    const crearGrupos = () => {
      const g = cfg.grupos;
      if (!g) return [];
      return [
        { cx: ancho - 40, cy: 30 },
        { cx: 40, cy: alto - 30 }
      ].map((pos, i) => ({
        ...pos,
        rExt: entre(g.radioExterior),
        a: entre(g.opacidad),
        ax: entre(g.amplitud) * (i ? 1 : -1),
        ay: entre(g.amplitud) * 0.6,
        periodo: entre(g.periodo),
        fase: Math.random() * Math.PI * 2
      }));
    };

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      ctx.lineWidth = 1;
      for (const gr of grupos) {
        const t = (tiempo / gr.periodo) * Math.PI * 2 + gr.fase;
        const x = gr.cx + Math.sin(t) * gr.ax;
        const y = gr.cy + Math.cos(t * 0.8) * gr.ay;
        ctx.strokeStyle = colorGrupo;
        ctx.globalAlpha = gr.a;
        for (let k = 1; k <= cfg.grupos.anillos; k++) {
          ctx.beginPath();
          ctx.arc(x, y, (gr.rExt * k) / cfg.grupos.anillos, 0, Math.PI * 2);
          ctx.stroke();
        }
        const pin = cfg.grupos.pin;
        ctx.fillStyle = colorGrupo;
        ctx.globalAlpha = pin.opacidad * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, pin.halo, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = pin.opacidad;
        ctx.beginPath();
        ctx.arc(x, y, pin.radio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = colorLinea;
      for (let i = 0; i < puntos.length; i++) {
        for (let j = i + 1; j < puntos.length; j++) {
          const d = Math.hypot(puntos[i].x - puntos[j].x, puntos[i].y - puntos[j].y);
          if (d >= cfg.distancia) continue;
          ctx.globalAlpha = (1 - d / cfg.distancia) * cfg.opacidadLinea;
          ctx.beginPath();
          ctx.moveTo(puntos[i].x, puntos[i].y);
          ctx.lineTo(puntos[j].x, puntos[j].y);
          ctx.stroke();
        }
      }
      for (const p of puntos) {
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Deriva con reaparición por el borde opuesto de su franja.
    const mover = () => {
      for (const p of puntos) {
        const w = p.x1 - p.x0;
        p.x = p.x0 + ((p.x - p.x0 + p.vx + w) % w);
        p.y = (p.y + p.vy + alto) % alto;
      }
    };

    let anterior = 0;
    const bucle = (ahora) => {
      tiempo += anterior ? Math.min(ahora - anterior, 50) : 16;
      anterior = ahora;
      mover();
      dibujar();
      raf = requestAnimationFrame(bucle);
    };
    const arrancar = () => {
      if (!raf && visible && !document.hidden && !reducir) {
        anterior = 0;
        raf = requestAnimationFrame(bucle);
      }
      canvas.dataset.animando = raf ? '1' : '0';
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.dataset.animando = '0';
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cambioAncho = canvas.clientWidth !== ancho;
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      canvas.dataset.tamano = `${ancho}×${alto}`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = movil.matches ? cantidadMovil : cantidad;
      // Las franjas dependen del ancho: si cambia, se reparten de nuevo.
      if (puntos.length !== n || cambioAncho) puntos = Array.from({ length: n }, crearPunto);
      grupos = crearGrupos();
      dibujar();
    };

    const redimension = new ResizeObserver(ajustar);
    redimension.observe(canvas);
    // Visible solo si se ve algún píxel: una sección justo pegada al borde de la ventana cuenta como
    // "intersecting" con área 0. El umbral 0.001 avisa también al pasar de pegada a visible.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        visible = entrada.isIntersecting && entrada.intersectionRatio > 0;
        if (visible) arrancar();
        else parar();
      },
      { threshold: [0, 0.001] }
    );
    observador.observe(canvas);
    const alCambiarPestana = () => (document.hidden ? parar() : arrancar());
    document.addEventListener('visibilitychange', alCambiarPestana);

    return () => {
      parar();
      redimension.disconnect();
      observador.disconnect();
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, [tema, cantidad, cantidadMovil]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
