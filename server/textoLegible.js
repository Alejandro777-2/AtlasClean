/**
 * Filtro de seguridad: si la IA deja un código interno dentro de un texto para personas
 * (p. ej. "hospital_grade", "24_7", "no_sabe", "2000_5000"), lo cambia por su nombre en español.
 * Los nombres salen de src/config/opciones.js, la misma fuente que usa la pantalla.
 */
import { AFLUENCIAS, AREAS, ETIQUETAS, FRECUENCIAS, HORARIOS, NIVELES_LIMPIEZA, RANGOS_TAMANO, TIPOS_CLIENTE } from '../src/config/opciones.js';

const minuscula = (t) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
const sinParentesis = (t) => t.replace(/\s*\(.*\)$/, '');

// Solo códigos que no pueden ser palabras normales: con guion bajo, con números o en inglés del motor.
const NOMBRES = {
  ...Object.fromEntries(Object.entries(ETIQUETAS.tipologia).map(([k, v]) => [k, sinParentesis(v)])),
  ...ETIQUETAS.regimen,
  ...ETIQUETAS.maquinaria,
  ...ETIQUETAS.protocolo,
  ...Object.fromEntries([...TIPOS_CLIENTE, ...RANGOS_TAMANO, ...AFLUENCIAS, ...HORARIOS, ...FRECUENCIAS, ...NIVELES_LIMPIEZA, ...AREAS].map((o) => [o.valor, sinParentesis(o.etiqueta)])),
  hospitalizacion: 'Hospitalización',
  '24_7': '24/7'
};
const CODIGOS = Object.keys(NOMBRES)
  .filter((k) => /_|\d/.test(k) || /^(standard|hospital_grade|semi_mechanized|heavy_mechanized|manual)$/.test(k))
  .filter((k) => k !== 'manual') // "manual" es también una palabra normal en español
  .sort((a, b) => b.length - a.length);
const PATRON = new RegExp(`(["'«]?)\\b(${CODIGOS.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b(["'»]?)`, 'g');

/** Devuelve el texto con los códigos internos cambiados por palabras. */
export function legible(texto) {
  if (typeof texto !== 'string' || !texto) return texto;
  return texto
    .replace(PATRON, (_, abre, codigo, cierra, pos, todo) => {
      const inicioFrase = pos === 0 || /[.!?]\s*$/.test(todo.slice(0, pos));
      const nombre = NOMBRES[codigo];
      const palabra = inicioFrase ? nombre : minuscula(nombre);
      return abre && cierra ? `«${palabra}»` : `${abre}${palabra}${cierra}`;
    })
    .replace(/\bbanos\b/g, 'baños')
    .replace(/\bcriticas\b/g, 'críticas');
}

/** Pasa el filtro por todos los textos para personas de la ficha (no toca los valores que usa el motor). */
export function fichaLegible(f) {
  const L = legible;
  const c = f.configuracionInicial;
  const supuesto = (s) => ({ ...s, motivo: L(s.motivo) });
  const req = Object.fromEntries(
    Object.entries(f.requisitosDelDocumento).map(([k, v]) => [k, { resumen: L(v.resumen), detalles: v.detalles.map((d) => ({ ...d, texto: L(d.texto) })) }])
  );
  return {
    ...f,
    resumen: L(f.resumen),
    configuracionInicial: {
      ...c,
      tipologia: supuesto(c.tipologia),
      regimenSugerido: supuesto(c.regimenSugerido),
      pasadasSugeridas: supuesto(c.pasadasSugeridas),
      maquinariaSugerida: supuesto(c.maquinariaSugerida),
      tamanoReferencia: { ...c.tamanoReferencia, motivo: L(c.tamanoReferencia.motivo) },
      zonasPropuestas: c.zonasPropuestas.map((z) => ({ ...z, nombre: L(z.nombre), motivo: L(z.motivo) }))
    },
    estimacionPrevia: L(f.estimacionPrevia),
    contradicciones: f.contradicciones.map((x) => ({ ...x, descripcion: L(x.descripcion), comoResolverEnVisita: L(x.comoResolverEnVisita) })),
    verificarEnVisita: f.verificarEnVisita.map((x) => ({ ...x, punto: L(x.punto), porQue: L(x.porQue) })),
    preguntasParaElCliente: f.preguntasParaElCliente.map(L),
    llevarALaVisita: f.llevarALaVisita.map(L),
    formularioDesdeDocumento: f.formularioDesdeDocumento,
    datosDelDocumento: f.datosDelDocumento.map((d) => ({ ...d, campo: L(d.campo), valor: L(d.valor) })),
    requisitosDelDocumento: req,
    notasComerciales: L(f.notasComerciales),
    camposFaltantes: f.camposFaltantes.map(L)
  };
}
