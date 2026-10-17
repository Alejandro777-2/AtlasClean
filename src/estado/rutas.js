// Rutas del módulo del cliente. Las mismas pantallas viven en dos espacios:
// - #/cliente/<sección>: espacio público del cliente (sin login), al que se entra desde la landing.
// - #/app/<sección>: dentro de la plataforma del equipo (con login).
// Los enlaces internos usan rutaModulo() para quedarse en el espacio en el que está la persona.

export const enEspacioCliente = () => typeof window !== 'undefined' && window.location.hash.startsWith('#/cliente');

/** seccion: 'visita' | 'registro' | 'costos' (en el espacio del cliente, costos es «presupuesto»). */
export function rutaModulo(seccion) {
  if (enEspacioCliente()) return `#/cliente/${seccion === 'costos' ? 'presupuesto' : seccion}`;
  return `#/app/${seccion}`;
}
