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
- `src/components/ui.jsx`: componentes compartidos (`AtlasLogo`, `Boton`, `Insignia`, `TarjetaKpi`, `Campo`, `Opciones`, `Tabla`, `Aviso`, `Pestanas`).
- `src/App.css`: diseño de la landing, de la plataforma y del módulo del cliente.
- `src/App.jsx`: rutas por hash: `#/` landing, `#/login`, `#/app/<paso>` plataforma del equipo (requiere sesión; incluye `#/app/visita` y `#/app/registro`) y `#/cliente/<sección>` espacio del cliente sin login (`visita`, `registro` y los 6 pasos en versión cliente; `presupuesto` es alias de `costos`). Envuelve todo en `ErrorPantalla` y `ProveedorSolicitud`.
- `src/pantallas/Portada.jsx`: la landing (encabezado, hero, sección del formulario, cómo funciona y pie).
- `src/pantallas/ComoFunciona.jsx`: la sección "Cómo funciona" (maestro-detalle / acordeón).
- `src/pantallas/Login.jsx`: acceso a la plataforma (credenciales demo).
- `src/pantallas/Plataforma.jsx`: barra lateral + los 6 pasos del cotizador (levantamiento, personal, insumos, equipos, costos, propuesta). Motor en `src/utils/motorCostos.js`, parámetros en `src/config/negocio.js`; guarda y lista cotizaciones en Excel a través del backend.
- `backend/main.py`: API FastAPI en el puerto 8000 (análisis de documentos, Excel). Vite reenvía `/api` a este backend; `/api/asistente-visita` lo atiende el servidor local del asistente.
- `src/pasos.js`: contenido de los 6 pasos (título, subtítulo, descripción y viñetas) y las secciones del cliente (`VISITA`, `REGISTRO`).

### Módulo del cliente (antes de la visita)
- Entrada del cliente: en la landing, tarjeta «Cotizar» → «Continuar». Lleva a `#/cliente/visita/formulario` con la empresa, el tipo de sitio y el turno de la tarjeta ya puestos (traducción en `DESDE_LANDING` de `src/config/opciones.js`).
- Pestaña «Subir pliego con IA» de la tarjeta: el pliego (PDF o TXT) se adjunta a la solicitud y lleva al mismo formulario; la IA lo lee ahí (`leerPliegoDesdeLanding` en `ProveedorSolicitud`) y llena solo los campos vacíos, sin pisar lo que el cliente escriba mientras tanto. También se envía, sin esperar, al backend de análisis para la plataforma del equipo.
- `src/pantallas/EspacioCliente.jsx`: espacio del cliente sin login, con la misma distribución que la plataforma: su solicitud, el registro y «Tu cotización paso a paso» (los 6 pasos en versión cliente, `src/pantallas/PasoCliente.jsx`, textos en `PASOS_CLIENTE` de `src/pasos.js`). Nunca muestra costos internos, sueldos ni márgenes: los componentes compartidos reciben `paraCliente`. `src/estado/rutas.js` hace que los enlaces del módulo se queden en el espacio en que está la persona (`#/cliente` o `#/app`).
- `src/pantallas/ContenidoCliente.jsx`: lo que la plataforma muestra en `#/app/visita` y `#/app/registro` (grupo «Antes de la visita» de la barra lateral).
- `src/pantallas/AsistenteVisita.jsx`: pestañas `FormularioCliente` y `FichaVisita`.
- `src/pantallas/RegistroFormulario.jsx` (`#/app/registro`): registro detallado del formulario; se abre en ventana nueva y se sincroniza con la otra ventana por el evento `storage`. Campos en `src/formulario/registro.js`.
- `src/pantallas/PasoRequisitos.jsx`, `RequisitosPliego.jsx` y `PasoCostos.jsx`: lo que la ficha aporta a los pasos de la cotización (zonas sugeridas, requisitos del pliego, presupuesto previo y «Contáctanos»). Solo aparecen cuando hay ficha de visita.
- `src/config/opciones.js`: opciones y etiquetas del formulario del cliente.
- `src/estado/`: contexto de la solicitud (formulario, documento, ficha; borrador en `localStorage`).
- `src/formulario/solicitud.js`: validación y conversión del formulario al JSON que recibe el agente.
- `server/`: API local del Asistente de visita, montada como plugin de Vite (`/api/asistente-visita`). Solo corre con `npm run dev` / `npm run preview`.
- `agentes/asistente-de-visita-atlas/`: el agente (prompt y modelo en `agents/*.md`). Es la única fuente del prompt: el servidor lo lee de ahí.

## Alcance actual
- Landing (Flavio), login y plataforma con los 6 pasos del cotizador (Alex), y el módulo del cliente con el Asistente de visita (Matías).
- Para usar todo: `npm run dev` y, en otra terminal, el backend (`python backend/main.py`). El Asistente de visita funciona sin el backend.

## Asistente de visita (IA)
- La clave va en `.env` (copiar `.env.example`): `ANTHROPIC_API_KEY`. Opcional `ATLAS_MODELO_IA`. Nunca se sube `.env` ni se expone la clave al navegador.
- Sin clave, el servidor responde en modo demostración con reglas locales (`server/fichaDemo.js`) que imitan el prompt.
- La salida se fuerza con el esquema de `server/esquemaFicha.js`; si se cambia la SALIDA del prompt, se actualizan el esquema, `fichaDemo.js` y las pruebas.
- La ficha no calcula precios: solo prepara la visita.
- Riesgo y protocolo por zona: `src/config/reglasZonas.js`. Si se cambia el criterio, se cambia también la sección «Protocolo POR ÁREA» del prompt.
- `server/textoLegible.js` cambia cualquier código interno que la IA deje en un texto (p. ej. `hospital_grade`) por su nombre en español.
- `requisitosDelDocumento`: lo que el pliego exige para Personal, Insumos, Equipos, Costos y Propuesta, rotulado «Según el pliego». No son cálculos.
- `formularioDesdeDocumento`: datos del formulario que la IA encontró en el pliego. Se aplican solo a campos vacíos, con «Deshacer»; el registro los marca «Del documento · pág. X». Reglas en `src/formulario/desdeDocumento.js`.
- Si la respuesta de la IA se corta por largo, el servidor lo avisa; si deja vacías las secciones del técnico, las completa con las reglas base.
- Presupuesto previo (en Costos): rango mensual orientativo calculado con la ficha (sin IA) en `src/presupuesto/estimar.js`, parámetros en `src/config/presupuesto.js` (los operativos son de EJEMPLO). Nunca se muestra como cifra exacta ni como cotización; la cotización real es la del motor de costos.
- «Contáctanos»: datos en `src/config/contacto.js`. Son de ejemplo (`esEjemplo: true`) hasta poner los reales.
- «Lista para agendar» es una regla fija del servidor (tipo de lugar, dirección y contacto), no un criterio de la IA.

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
- Nada de cifras fijas en pantalla (KPIs, porcentajes): se calculan o se rotulan como ejemplo.
- Parámetros de negocio (SBU, IESS, IVA, márgenes, recargos) en configuración, no en el código.

## Referencias (no son código para copiar)
- Prototipo visual: `C:\Users\flavi\Downloads\gemini-code-1792180880801.html`. Solo aspecto; no sus datos, cifras ni lógica.
- Lógica de referencia: `C:\Users\flavi\Downloads\CleanQuote-Modular\CleanQuote-Modular` (módulos m1–m6, `packages/core`).

## Terminado significa
- `npm run lint` y `npm run build` sin errores, y el cambio probado en pantalla con `npm run dev`.
