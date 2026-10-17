// Funciones de apoyo para mostrar la ficha (sin componentes, para que React recargue bien en desarrollo).

/** Requisito del pliego para un módulo, o null si la ficha no trae nada (o es de una versión anterior). */
export function requisitoDe(ficha, modulo) {
  const r = ficha?.requisitosDelDocumento?.[modulo];
  return r && (r.resumen || r.detalles?.length) ? r : null;
}

/** "pág. 1, 3" a partir de los detalles de un requisito. */
export function paginaDe(r) {
  const paginas = [...new Set((r?.detalles ?? []).map((d) => d.pagina).filter(Boolean))];
  return paginas.length ? `pág. ${paginas.join(', ')}` : '';
}

export const m2Zona = (z) => (z.m2 ? `${z.m2.toLocaleString('es-EC')} m²` : '—');
