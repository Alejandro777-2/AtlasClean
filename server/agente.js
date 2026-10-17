/**
 * Lee la definición del agente desde agentes/asistente-de-visita-atlas/agents/asistente-de-visita-atlas.md.
 * Ese archivo es la ÚNICA fuente del prompt: el mismo que se publica en la consola con `ant apply`.
 * Si alguien mejora el prompt, la app usa la versión nueva sin tocar código.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUTA_AGENTE = path.join(RAIZ, 'agentes', 'asistente-de-visita-atlas', 'agents', 'asistente-de-visita-atlas.md');

/** Separa el encabezado YAML del cuerpo. Solo lee los campos simples que la app necesita. */
export function leerAgente(ruta = RUTA_AGENTE) {
  const texto = readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');
  const coincide = texto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!coincide) throw new Error(`El archivo del agente no tiene encabezado YAML: ${ruta}`);
  const [, encabezado, cuerpo] = coincide;
  const nombre = encabezado.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? 'Asistente de Visita Atlas';
  // model puede ser "model: id" o un bloque con "id: ..."
  const modelo = encabezado.match(/^model:[ \t]*(\S.*)$/m)?.[1]?.trim() || encabezado.match(/^\s+id:\s*(.+)$/m)?.[1]?.trim() || 'claude-sonnet-5-5';
  const prompt = cuerpo.trim();
  if (prompt.length < 200) throw new Error('El prompt del agente está vacío o incompleto.');
  return { nombre, modelo, prompt };
}
