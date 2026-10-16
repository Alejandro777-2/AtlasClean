# Atlas

Cotizador de servicios de limpieza por tipo de sitio. Reto 2, Expo Clean Ecuador 2026. Interfaz y textos en español.
React 19 + Vite 8, JavaScript (JSX), sin TypeScript.

## Comandos
- `npm run dev`: servidor de desarrollo en http://localhost:5173
- `npm run build`: build de producción en `dist/`
- `npm run lint`: oxlint (config en `.oxlintrc.json`)

## Estructura
- `src/index.css`: tokens (colores, tipografía, espacios, radios, sombras) y estilos de los componentes.
- `src/components/ui.jsx`: componentes compartidos (`Marca`, `Boton`, `Insignia`, `TarjetaKpi`, `Campo`, `Tabla`, `Pestanas`).
- `src/App.css`: diseño de las pantallas.
- `src/pantallas/`: `Portada` (landing + intake) y `Plataforma` (barra lateral + 6 pasos).
- `src/pasos.js`: los 6 pasos (Requisitos, Personal, Insumos, Equipos, Costos, Propuesta).
- `src/App.jsx`: rutas por hash: `#/` portada, `#/app/<paso>` plataforma.

## Reglas
- Las pantallas usan los tokens y componentes de `src/index.css` y `src/components/ui.jsx`; nada de colores o tamaños sueltos. Si falta algo, se agrega ahí.
- Sin dependencias por CDN: la app debe funcionar sin internet (la fuente va por `@fontsource-variable`).
- Nada de cifras fijas en pantalla (KPIs, porcentajes): se calculan o se rotulan como ejemplo. Sin valor, `TarjetaKpi` muestra "—".
- Parámetros de negocio (SBU, IESS, IVA, márgenes, recargos) en configuración, no en el código.

## Referencias (no son código para copiar)
- Prototipo visual: `C:\Users\flavi\Downloads\gemini-code-1792180880801.html`. Solo aspecto; no sus datos, cifras ni lógica.
- Lógica de referencia: `C:\Users\flavi\Downloads\CleanQuote-Modular\CleanQuote-Modular` (módulos m1–m6, `packages/core`).

## Terminado significa
- `npm run lint` y `npm run build` sin errores, y el cambio probado en pantalla con `npm run dev`.
