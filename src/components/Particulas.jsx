/**
 * Fondo de partículas en <canvas> (decorativo). Puntos que derivan lento y se unen con líneas
 * cuando están cerca; el tema claro añade unos anillos huecos que derivan igual.
 * Pausa fuera de pantalla o con la pestaña oculta (cada canvas por separado); con
 * prefers-reduced-motion dibuja un solo fotograma.
 *
 * `tema`: 'oscuro' (secciones azules) o 'claro' (secciones beige). `opciones` sobrescribe
 * cualquier parámetro del tema. Los colores son nombres de variables CSS (tokens).
 * `cantidad` / `cantidadMovil`: puntos en escritorio y por debajo de 900px.
 * El atributo data-animando ("1"/"0") indica si el bucle está corriendo.
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
    anillos: null
  },
  claro: {
    colores: ['--particula-clara'],
    colorLinea: '--particula-clara',
    opacidad: [0.08, 0.22],
    radio: [0.75, 1.5], // diámetro 1.5–3px
    velocidad: [0.1, 0.22],
    distancia: 140,
    opacidadLinea: 0.07,
    anillos: { cantidad: 3, radio: [8, 14], color: '--azul', opacidad: 0.15 }
  }
};

const entre = ([min, max]) => min + Math.random() * (max - min);

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
    const colorAnillo = cfg.anillos && color(cfg.anillos.color);
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movil = window.matchMedia('(max-width: 900px)');
    let ancho = 0;
    let alto = 0;
    let puntos = [];
    let anillos = [];
    let raf = 0;
    let visible = true;

    const deriva = () => {
      const angulo = Math.random() * Math.PI * 2;
      const v = entre(cfg.velocidad);
      return { x: Math.random() * ancho, y: Math.random() * alto, vx: Math.cos(angulo) * v, vy: Math.sin(angulo) * v };
    };
    const crearPunto = () => ({
      ...deriva(),
      r: entre(cfg.radio),
      a: entre(cfg.opacidad),
      color: colores.length > 1 && Math.random() >= 0.6 ? colores[1] : colores[0]
    });
    const crearAnillo = () => ({ ...deriva(), r: entre(cfg.anillos.radio) });

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      ctx.lineWidth = 1;
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
      if (anillos.length) {
        ctx.globalAlpha = cfg.anillos.opacidad;
        ctx.strokeStyle = colorAnillo;
        for (const a of anillos) {
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    // Deriva con reaparición por el borde opuesto.
    const mover = () => {
      for (const p of puntos) {
        p.x = (p.x + p.vx + ancho) % ancho;
        p.y = (p.y + p.vy + alto) % alto;
      }
      for (const a of anillos) {
        a.x = (a.x + a.vx + ancho) % ancho;
        a.y = (a.y + a.vy + alto) % alto;
      }
    };

    const bucle = () => {
      mover();
      dibujar();
      raf = requestAnimationFrame(bucle);
    };
    const arrancar = () => {
      if (!raf && visible && !document.hidden && !reducir) raf = requestAnimationFrame(bucle);
      canvas.dataset.animando = raf ? '1' : '0';
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.dataset.animando = '0';
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = movil.matches ? cantidadMovil : cantidad;
      if (puntos.length !== n) puntos = Array.from({ length: n }, crearPunto);
      const nAnillos = cfg.anillos?.cantidad ?? 0;
      if (anillos.length !== nAnillos) anillos = Array.from({ length: nAnillos }, crearAnillo);
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
