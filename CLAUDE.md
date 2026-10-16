# Atlas

Cotizador de servicios de limpieza por tipo de sitio. Reto 2, Expo Clean Ecuador 2026. Interfaz y textos en español.
React 19 + Vite 8, JavaScript (JSX), sin TypeScript.

## Comandos
- `npm run dev`: servidor de desarrollo en http://localhost:5173
- `npm run build`: build de producción en `dist/`
- `npm run lint`: oxlint (config en `.oxlintrc.json`)

## Estructura
- `src/index.css`: tokens (colores, tipografía, espacios, radios, sombras) y estilos de los componentes.
- `src/components/ui.jsx`: componentes compartidos (`AtlasLogo`, `Boton`, `Insignia`, `Campo`, `Pestanas`).
- `src/App.css`: diseño de la landing.
- `src/pantallas/Portada.jsx`: la landing (encabezado, hero, sección del formulario, cómo funciona y pie).
- `src/pantallas/ComoFunciona.jsx`: la sección "Cómo funciona" (maestro-detalle / acordeón).
- `src/pasos.js`: contenido de los 6 pasos (título, subtítulo, descripción y viñetas).

## Alcance actual
Solo la landing page. No hay plataforma ni flujo después de ingresar: "Ingresar" y "Empezar una cotización" bajan a la tarjeta del formulario (`#cotizar`), y "Continuar" solo valida.

## Esquema visual y distribución (fijo)
El aspecto y la distribución actuales son la norma para todo el proyecto. No se cambian sin aprobación explícita.
- Paleta, tipografía, espacios, radios y sombras: solo los tokens de `src/index.css`.
- Landing, de arriba abajo:
  - barra de navegación marino con un solo botón ("Ingresar");
  - hero marino centrado: titular de tres líneas (la central en cian), subtítulo, botones y una franja de 3 beneficios con iconos; fondo decorativo de curvas de nivel y pines (limpio detrás del texto); sus últimos 80px se funden con el crema;
  - sección "Cotizar" con la tarjeta del formulario centrada sobre fondo crema;
  - bloque azul (los primeros 80px funden el crema con el marino) con la sección "Cómo funciona": maestro-detalle con el panel del paso activo a la izquierda y la lista de 6 pasos a la derecha (pestañas accesibles, avance automático cada 6 s); por debajo de 900px es un acordeón;
  - pie dentro del bloque azul, con texto pequeño.
- El botón "Empezar una cotización" del hero no se toca: ni texto, ni color, ni tamaño, ni posición.
- Toda sección nueva usa los componentes de `src/components/ui.jsx`, sin inventar diseños nuevos.
- En móvil se mantiene el mismo orden en una sola columna.

## Reglas
- Las pantallas usan los tokens y componentes de `src/index.css` y `src/components/ui.jsx`; nada de colores o tamaños sueltos. Si falta algo, se agrega ahí.
- Sin dependencias por CDN: la app debe funcionar sin internet (la fuente va por `@fontsource-variable`).
- Nada de cifras fijas en pantalla (KPIs, porcentajes): se calculan o se rotulan como ejemplo.- Parámetros de negocio (SBU, IESS, IVA, márgenes, recargos) en configuración, no en el código.

## Referencias (no son código para copiar)
- Prototipo visual: `C:\Users\flavi\Downloads\gemini-code-1792180880801.html`. Solo aspecto; no sus datos, cifras ni lógica.
- Lógica de referencia: `C:\Users\flavi\Downloads\CleanQuote-Modular\CleanQuote-Modular` (módulos m1–m6, `packages/core`).

## Terminado significa
- `npm run lint` y `npm run build` sin errores, y el cambio probado en pantalla con `npm run dev`.
