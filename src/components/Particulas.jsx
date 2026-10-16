/**
 * Fondo de partículas en <canvas> (decorativo). Puntos que derivan lento y se unen con líneas
 * cuando están cerca. Pausa fuera de pantalla o con la pestaña oculta; con prefers-reduced-motion
 * dibuja un solo fotograma. Colores: tokens --cian y --cian-claro.
 */
import { useEffect, useRef } from 'react';

const DISTANCIA = 130;

export default function Particulas({ cantidad, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const estilos = getComputedStyle(canvas);
    const cian = estilos.getPropertyValue('--cian').trim();
    const cianClaro = estilos.getPropertyValue('--cian-claro').trim();
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ancho = 0;
    let alto = 0;
    let puntos = [];
    let raf = 0;
    let visible = true;

    const crear = () => {
      const angulo = Math.random() * Math.PI * 2;
      const velocidad = 0.15 + Math.random() * 0.2;
      return {
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        r: 1 + Math.random() * 1.5,
        a: 0.15 + Math.random() * 0.45,
        color: Math.random() < 0.6 ? cian : cianClaro
      };
    };

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      ctx.lineWidth = 1;
      ctx.strokeStyle = cian;
      for (let i = 0; i < puntos.length; i++) {
        for (let j = i + 1; j < puntos.length; j++) {
          const d = Math.hypot(puntos[i].x - puntos[j].x, puntos[i].y - puntos[j].y);
          if (d >= DISTANCIA) continue;
          ctx.globalAlpha = (1 - d / DISTANCIA) * 0.15;
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

    // Deriva con reaparición por el borde opuesto.
    const mover = () => {
      for (const p of puntos) {
        p.x = (p.x + p.vx + ancho) % ancho;
        p.y = (p.y + p.vy + alto) % alto;
      }
    };

    const bucle = () => {
      mover();
      dibujar();
      raf = requestAnimationFrame(bucle);
    };
    const arrancar = () => {
      if (!raf && visible && !document.hidden && !reducir) raf = requestAnimationFrame(bucle);
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (puntos.length !== cantidad) puntos = Array.from({ length: cantidad }, crear);
      dibujar();
    };

    const redimension = new ResizeObserver(ajustar);
    redimension.observe(canvas);
    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      if (visible) arrancar();
      else parar();
    });
    observador.observe(canvas);
    const alCambiarPestana = () => (document.hidden ? parar() : arrancar());
    document.addEventListener('visibilitychange', alCambiarPestana);

    return () => {
      parar();
      redimension.disconnect();
      observador.disconnect();
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, [cantidad]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
