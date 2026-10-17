// Los 6 pasos de una cotización en Atlas. Se muestran en "Cómo funciona" de la landing.
export const PASOS = [
  {
    id: 'requisitos',
    nombre: 'Requisitos',
    subtitulo: 'Describe el lugar',
    descripcion: 'Cuéntanos cómo es el sitio para que Atlas pueda calcular con datos reales.',
    vinetas: ['Tipo de sitio, turnos y nivel de mecanización', 'Zonas con sus m², riesgo y tráfico', 'Protocolo de limpieza']
  },
  {
    id: 'personal',
    nombre: 'Personal',
    subtitulo: 'Cuántas personas y cuánto cuestan',
    descripcion: 'Atlas calcula el equipo que necesitas y su costo real.',
    vinetas: ['Cantidad de personas por turno', 'Sueldos de ley y recargo nocturno', 'Supervisión incluida']
  },
  {
    id: 'insumos',
    nombre: 'Insumos',
    subtitulo: 'Productos necesarios',
    descripcion: 'Calcula los productos de limpieza que vas a necesitar.',
    vinetas: ['Cálculo según los m² del lugar', 'O según la dosificación del producto', 'Cantidades listas para presupuestar']
  },
  {
    id: 'equipos',
    nombre: 'Equipos',
    subtitulo: 'Protección y maquinaria',
    descripcion: 'Define qué protección y qué máquinas requiere el trabajo.',
    vinetas: ['Protección del personal (EPP)', 'Máquinas necesarias para el sitio', 'Costo de equipos integrado al total']
  },
  {
    id: 'costos',
    nombre: 'Costos',
    subtitulo: 'El precio final',
    descripcion: 'Junta todo en un solo lugar y calcula el precio final.',
    vinetas: ['Personal, insumos y equipos en un resumen', 'Costos indirectos y utilidad', 'Total mensual claro']
  },
  {
    id: 'propuesta',
    nombre: 'Propuesta',
    subtitulo: 'Lista para el cliente',
    descripcion: 'Arma la propuesta y sigue su aprobación paso a paso.',
    vinetas: ['Propuesta lista para presentar', 'Seguimiento de aprobación', 'Historial de cambios']
  }
];

// Sección previa a la cotización: formulario del cliente + Asistente de Visita (IA). Ruta: #/app/visita.
export const VISITA = {
  id: 'visita',
  nombre: 'Asistente de visita',
  descripcion: 'El cliente describe el lugar y, si tiene, sube su pliego. La IA prepara la ficha para el técnico que hará la visita.'
};

// Registro detallado del formulario. Se abre en una ventana nueva: #/app/registro.
export const REGISTRO = {
  id: 'registro',
  nombre: 'Registro del formulario',
  descripcion: 'Todos los datos que dio el cliente, con su estado. Se actualiza solo al editar el formulario en la otra ventana.'
};

// Secciones del módulo del cliente en la barra lateral («Antes de la visita»).
export const SECCIONES_CLIENTE = [VISITA, REGISTRO];
