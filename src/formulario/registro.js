// Registro detallado del formulario: cada dato con su etiqueta legible, agrupado por bloque.
// La lista de campos sigue el orden del formulario; las etiquetas de los valores salen de config/opciones.js.
import { AFLUENCIAS, AREAS, FRECUENCIAS, HORARIOS, NIVELES_LIMPIEZA, RANGOS_TAMANO, SI_NO, TIPOLOGIAS, TIPOS_CLIENTE } from '../config/opciones.js';
import { validarFormulario } from './solicitud.js';

const etiqueta = (lista, valor) => lista.find((o) => o.valor === valor)?.etiqueta ?? valor;
const texto = (v) => String(v ?? '').trim();
const conAyuda = (lista, valor) => {
  const o = lista.find((x) => x.valor === valor);
  return o ? (o.ayuda ? `${o.etiqueta} (${o.ayuda.toLowerCase()})` : o.etiqueta) : valor;
};
const siNo = (v) => (v === 'si' || v === 'no' ? etiqueta(SI_NO, v) : '');

/**
 * requerido: lo exige validarFormulario. claves: campos cuyo error se muestra en esta fila.
 * valor(f) devuelve texto vacío cuando no hay dato.
 */
export const BLOQUES_REGISTRO = [
  {
    id: 'cliente',
    titulo: 'Cliente',
    campos: [
      { id: 'empresa', dato: 'Empresa o entidad', requerido: true, valor: (f) => texto(f.empresa) },
      { id: 'contacto', dato: 'Persona de contacto', valor: (f) => texto(f.contactoNombre) },
      { id: 'telefono', dato: 'Teléfono', requerido: true, claves: ['telefono'], valor: (f) => texto(f.telefono) },
      { id: 'correo', dato: 'Correo', claves: ['correo'], valor: (f) => texto(f.correo) },
      { id: 'tipoCliente', dato: 'Tipo de cliente', valor: (f) => (f.tipoCliente ? etiqueta(TIPOS_CLIENTE, f.tipoCliente) : '') }
    ]
  },
  {
    id: 'lugar',
    titulo: 'Lugar',
    campos: [
      { id: 'direccion', dato: 'Dirección', requerido: true, valor: (f) => texto(f.direccion) },
      { id: 'ciudad', dato: 'Ciudad', valor: (f) => texto(f.ciudad) },
      {
        id: 'tipologia',
        dato: 'Tipo de lugar',
        requerido: true,
        claves: ['tipologia', 'tipologiaOtro'],
        valor: (f) => (f.tipologia === 'otro' ? `Otro: ${texto(f.tipologiaOtro) || 'sin describir'}` : f.tipologia ? etiqueta(TIPOLOGIAS, f.tipologia) : '')
      },
      { id: 'm2', dato: 'Metros cuadrados', requerido: true, valor: (f) => (texto(f.m2) ? `${Number(f.m2).toLocaleString('es-EC')} m²` : '') },
      { id: 'rango', dato: 'Rango aproximado', valor: (f) => (f.rango ? etiqueta(RANGOS_TAMANO, f.rango) : '') },
      { id: 'pisos', dato: 'Número de pisos', valor: (f) => texto(f.pisos) },
      { id: 'banos', dato: 'Número de baños', valor: (f) => texto(f.banos) },
      { id: 'areas', dato: 'Áreas', requerido: true, valor: (f) => f.areas.map((a) => etiqueta(AREAS, a)).join(' · ') },
      { id: 'afluencia', dato: 'Afluencia de personas', valor: (f) => (f.afluencia ? conAyuda(AFLUENCIAS, f.afluencia) : '') }
    ]
  },
  {
    id: 'servicio',
    titulo: 'Servicio',
    campos: [
      { id: 'horario', dato: 'Horario del servicio', requerido: true, valor: (f) => f.horario.map((h) => etiqueta(HORARIOS, h)).join(' · ') },
      { id: 'frecuencia', dato: 'Frecuencia de limpieza', requerido: true, valor: (f) => (f.frecuencia ? etiqueta(FRECUENCIAS, f.frecuencia) : '') },
      { id: 'nivelLimpieza', dato: 'Nivel de limpieza', requerido: true, valor: (f) => (f.nivelLimpieza ? conAyuda(NIVELES_LIMPIEZA, f.nivelLimpieza) : '') },
      { id: 'maquinaria', dato: '¿Tiene maquinaria propia?', valor: (f) => siNo(f.maquinariaPropia) },
      { id: 'insumos', dato: '¿Aporta sus propios insumos?', valor: (f) => siNo(f.insumosPropios) }
    ]
  },
  {
    id: 'comentarios',
    titulo: 'Comentarios',
    campos: [{ id: 'comentarios', dato: 'Comentarios o requisitos especiales', valor: (f) => texto(f.comentarios) }]
  }
];

// Campo del formulario que muestra cada fila (cuando el id de la fila no coincide).
export const CAMPO_DE_FILA = { contacto: 'contactoNombre', maquinaria: 'maquinariaPropia', insumos: 'insumosPropios' };

/** Filas del registro con su estado: 'listo' | 'documento' (vino del PDF) | 'falta' | 'sin_dato' (opcional vacío). */
export function armarRegistro(formulario, desdeDocumento = []) {
  const origen = Object.fromEntries(desdeDocumento.map((d) => [d.campo, d]));
  const errores = validarFormulario(formulario);
  const bloques = BLOQUES_REGISTRO.map((b) => ({
    ...b,
    filas: b.campos.map((c) => {
      const mensaje = (c.claves ?? [c.id]).map((k) => errores[k]).find(Boolean);
      const valor = c.valor(formulario);
      const doc = origen[CAMPO_DE_FILA[c.id] ?? c.id];
      return { id: c.id, dato: c.dato, valor, requerido: Boolean(c.requerido), mensaje, pagina: doc?.pagina ?? null, estado: mensaje ? 'falta' : valor ? (doc ? 'documento' : 'listo') : 'sin_dato' };
    })
  }));
  const filas = bloques.flatMap((b) => b.filas);
  return {
    bloques,
    errores,
    completo: Object.keys(errores).length === 0,
    conDato: filas.filter((f) => f.valor).length,
    total: filas.length,
    faltan: filas.filter((f) => f.estado === 'falta').length,
    delDocumento: filas.filter((f) => f.estado === 'documento').length
  };
}
