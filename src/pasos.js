// Los 6 pasos de una cotización en Atlas. Los usan la portada y la barra lateral.
export const PASOS = [
  { id: 'requisitos', nombre: 'Requisitos', descripcion: 'Describe el lugar: tipo de sitio, turnos, nivel de mecanización y zonas, con sus m², riesgo, tráfico y protocolo.' },
  { id: 'personal', nombre: 'Personal', descripcion: 'Calcula cuántas personas hacen falta y cuánto cuestan, con sueldos de ley, recargo nocturno y supervisión.' },
  { id: 'insumos', nombre: 'Insumos', descripcion: 'Calcula los productos de limpieza necesarios, según los m² o la dosificación.' },
  { id: 'equipos', nombre: 'Equipos', descripcion: 'Calcula la protección del personal y las máquinas que se necesitan.' },
  { id: 'costos', nombre: 'Costos', descripcion: 'Junta todo en un solo lugar y calcula el precio final.' },
  { id: 'propuesta', nombre: 'Propuesta', descripcion: 'Arma la propuesta para el cliente y sigue su aprobación paso a paso, con historial de cambios.' }
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
