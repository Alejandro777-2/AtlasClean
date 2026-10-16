# CleanQuote Modular / Pro

Cotizador de servicios de limpieza por tipo de sitio. Reto 2, Expo Clean Ecuador 2026. Interfaz y textos en español.

## Comandos
- `npm install`: instala dependencias
- `npm run dev`: abre http://127.0.0.1:5173
- `npm test`: corre todas las pruebas
- `npm run nuevo-modulo`: crea un módulo que cumple el contrato

## Reglas
- Ningún módulo importa código de otro; los datos pasan por el pipeline de `packages/core`.
- Los contratos entre módulos se validan con zod. Si cambias un contrato, actualiza a los módulos que lo usan.
- Si un módulo falla, se usa su sección vacía y el resto sigue calculando.
- Los módulos se registran solo en `app/src/modulos.js`.
- Cualquier cambio de fórmulas exige actualizar las pruebas y mantener en verde `tests/paridad/paridad.test.js`.
- Sin dependencias por CDN: la app debe funcionar sin internet.
- Nada de cifras fijas en pantalla (KPIs, porcentajes): se calculan o se rotulan como ejemplo.
- Parámetros de negocio (SBU, IESS, IVA, márgenes, recargos) en configuración, no en el código.

## Referencia visual
- `docs/prototipo/cleanquote-pro-prototipo.html`: prototipo de una sola página. Es referencia, no código para copiar.

## Terminado significa
- Las pruebas pasan, la app corre con `npm run dev` y el cambio está probado en pantalla.