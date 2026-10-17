# Atlas

Cotizador de servicios de limpieza por tipo de sitio. Reto 2, Expo Clean Ecuador 2026. Interfaz y textos en español.
React 19 + Vite 8, JavaScript (JSX), sin TypeScript.

## Comandos
- `npm run dev`: servidor de desarrollo en http://localhost:5173
- `npm run build`: build de producción en `dist/`
- `npm run lint`: oxlint (config en `.oxlintrc.json`)
- `npm test`: pruebas del servidor del asistente (`node --test`, sin llamar a la IA real)

## Estructura
- `src/index.css`: tokens (colores, tipografía, espacios, radios, sombras) y estilos de los componentes.
- `src/components/ui.jsx`: componentes compartidos (`Marca`, `Boton`, `Insignia`, `TarjetaKpi`, `Campo`, `Tabla`, `Pestanas`).
- `src/App.css`: diseño de las pantallas.
- `src/pantallas/`: `Portada` (landing + intake) y `Plataforma` (barra lateral + 6 pasos).
- `src/pasos.js`: los 6 pasos (Requisitos, Personal, Insumos, Equipos, Costos, Propuesta).
- `src/App.jsx`: rutas por hash: `#/` portada, `#/app/visita` asistente de visita, `#/app/<paso>` plataforma. Envuelve todo en `ProveedorSolicitud`.
- `src/pantallas/AsistenteVisita.jsx`: sección "Antes de la visita" (barra lateral, `#/app/visita`), con pestañas `FormularioCliente` y `FichaVisita`. "Entrar a la plataforma" y "Empezar una cotización" llevan aquí.
- `src/pantallas/RegistroFormulario.jsx` (`#/app/registro`): registro detallado del formulario; se abre en ventana nueva con «Ver registro detallado ↗» y se sincroniza con la otra ventana por el evento `storage`. Campos y etiquetas en `src/formulario/registro.js`.
- `src/pantallas/PasoRequisitos.jsx`: paso 1; parte de las zonas de la ficha de visita.
- `src/config/opciones.js`: opciones y etiquetas de los formularios (no van en las pantallas).
- `src/estado/`: contexto de la solicitud (formulario, documento, ficha; borrador en `localStorage`).
- `src/formulario/solicitud.js`: validación y conversión del formulario al JSON que recibe el agente.
- `server/`: API local del Asistente de Visita, montada como plugin de Vite (`/api/asistente-visita`). Solo corre con `npm run dev` / `npm run preview`.
- `agentes/asistente-de-visita-atlas/`: el agente (prompt y modelo en `agents/*.md`). Es la única fuente del prompt: el servidor lo lee de ahí.

## Asistente de Visita (IA)
- La clave va en `.env` (copiar `.env.example`): `ANTHROPIC_API_KEY`. Opcional `ATLAS_MODELO_IA`. Nunca se sube `.env` ni se expone la clave al navegador.
- Sin clave, el servidor responde en modo demostración con reglas locales (`server/fichaDemo.js`) que imitan el prompt.
- La salida se fuerza con el esquema de `server/esquemaFicha.js`; si se cambia la SALIDA del prompt, se actualizan el esquema, `fichaDemo.js` y las pruebas.
- La ficha no calcula precios: solo prepara la visita.
- Riesgo y protocolo por zona: `src/config/reglasZonas.js` (lo usan el modo demostración y las pruebas). Si se cambia el criterio, se cambia también la sección «Protocolo POR ÁREA» del prompt.
- `server/textoLegible.js` cambia cualquier código interno que la IA deje en un texto (p. ej. `hospital_grade`) por su nombre en español.
- `requisitosDelDocumento`: lo que el pliego exige para Personal, Insumos, Equipos, Costos y Propuesta. Se muestra en las tarjetas y paneles de los pasos 2 a 6, rotulado «Según el pliego». No son cálculos: el cálculo es del módulo de cotización.
- `formularioDesdeDocumento`: datos del formulario que la IA encontró en el pliego. Se aplican solo a campos vacíos (en áreas se agregan las que falten), con «Deshacer»; el registro los marca «Del documento · pág. X». Reglas en `src/formulario/desdeDocumento.js`.
- Si la respuesta de la IA se corta por largo, el servidor lo avisa; si deja vacías las secciones del técnico, las completa con las reglas base.
- Paso 5 · Costos (`src/pantallas/PasoCostos.jsx`): PRESUPUESTO PREVIO, un rango mensual orientativo calculado con la ficha (sin IA) en `src/presupuesto/estimar.js`. Parámetros en `src/config/presupuesto.js`: los legales (SBU 2026 = 482, IESS, décimos, IVA 15 %) se revisan cada año; los operativos (rendimientos, insumos, márgenes) son de EJEMPLO y el equipo debe ajustarlos. Nunca se muestra como cifra exacta ni como cotización.
- «Contáctanos» (en Costos y en el presupuesto impreso): datos en `src/config/contacto.js`. Son de ejemplo (`esEjemplo: true`) hasta poner los reales.
- «Lista para agendar» es una regla fija del servidor (tipo de lugar, dirección y contacto), no un criterio de la IA.

## Esquema visual y distribución (fijo)
El aspecto y la distribución actuales son la norma para todo el proyecto. No se cambian sin aprobación explícita.
- Paleta, tipografía, espacios, radios y sombras: solo los tokens de `src/index.css`.
- Portada: barra de navegación marino arriba, hero marino con el texto a la izquierda y la tarjeta de intake a la derecha, y debajo la sección de pasos sobre fondo crema.
- Plataforma: barra lateral marino a la izquierda (256px) con los pasos, barra superior blanca con antetítulo y título, y debajo el contenido sobre fondo crema: fila de tarjetas KPI y luego paneles blancos.
- Toda pantalla o paso nuevo se monta dentro de esta distribución, con los componentes de `src/components/ui.jsx`, sin inventar diseños nuevos.
- En móvil se mantiene el mismo comportamiento: una sola columna y la barra lateral convertida en una fila de pasos desplazable.

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
