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

// Los 6 pasos tal como los ve el CLIENTE en su espacio (#/cliente/<paso>): qué incluye cada parte de su servicio,
// sin costos internos ni márgenes. El cálculo real lo hace el equipo después de la visita.
export const PASOS_CLIENTE = [
  {
    id: 'requisitos',
    nombre: 'Requisitos',
    descripcion: 'Las zonas de tu lugar con sus m² y el nivel de limpieza que necesita cada una.',
    incluye: ['Tipo de sitio y turnos de trabajo', 'Zonas con sus m², riesgo y tráfico', 'Protocolo de limpieza por zona']
  },
  {
    id: 'personal',
    nombre: 'Personal',
    descripcion: 'El equipo de limpieza que atenderá tu lugar. La cantidad exacta se confirma en la visita.',
    incluye: ['Personal según tus turnos y horarios', 'Supervisión del servicio', 'Personal con sueldos y afiliación de ley']
  },
  {
    id: 'insumos',
    nombre: 'Insumos',
    descripcion: 'Los productos de limpieza que usaremos, según el tipo de zona y el protocolo.',
    incluye: ['Productos adecuados para cada zona', 'Desinfección donde el protocolo lo exige', 'Reposición durante el mes']
  },
  {
    id: 'equipos',
    nombre: 'Equipos',
    descripcion: 'La maquinaria y la protección del personal que requiere tu lugar.',
    incluye: ['Maquinaria según el tamaño y el tipo de piso', 'Protección del personal (EPP)', 'Mantenimiento de los equipos a nuestro cargo']
  },
  {
    id: 'costos',
    nombre: 'Cotización previa',
    descripcion: 'Un rango orientativo del costo mensual y cómo contactarnos. La cotización final se hace tras la visita.'
  },
  {
    id: 'propuesta',
    nombre: 'Propuesta',
    descripcion: 'En qué etapa está tu solicitud y qué sigue hasta recibir la propuesta formal.'
  }
];

// Recorrido del cliente para cotizar (barra de la tarjeta «Cotizar» y del espacio del cliente).
// El primer paso cambia de nombre según si empezó llenando datos o subiendo su pliego.
export const RECORRIDO_CLIENTE = [
  { id: 'inicio', etiqueta: { formulario: 'Datos del lugar', documento: 'Tu pliego' } },
  { id: 'formulario', etiqueta: 'Tu formulario' },
  { id: 'cotizacion', etiqueta: 'Cotización previa' }
];
