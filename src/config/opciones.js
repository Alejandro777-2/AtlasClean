// Opciones del formulario del cliente y etiquetas de la ficha de visita.
// Es configuración, no lógica: si cambian los catálogos del motor, se ajusta aquí y en el prompt del agente.
// Los valores (lado izquierdo) son los mismos que entiende el agente y el motor; las etiquetas son lo que ve la persona.

export const TIPOS_CLIENTE = [
  { valor: 'privado', etiqueta: 'Privado' },
  { valor: 'publico', etiqueta: 'Público' },
  { valor: 'no_sabe', etiqueta: 'Aún no lo sé' }
];

export const TIPOLOGIAS = [
  { valor: 'hospital_critical', etiqueta: 'Hospital: áreas críticas (quirófanos, UCI)' },
  { valor: 'general_healthcare', etiqueta: 'Hospital o clínica (hospitalización general)' },
  { valor: 'food_court_retail', etiqueta: 'Centro comercial o patio de comidas' },
  { valor: 'corporate_office', etiqueta: 'Oficinas o edificio público' },
  { valor: 'industrial_logistics', etiqueta: 'Industria, bodega o áreas externas' },
  { valor: 'educational_campus', etiqueta: 'Escuela, colegio o universidad' },
  { valor: 'otro', etiqueta: 'Otro tipo de lugar' }
];

export const RANGOS_TAMANO = [
  { valor: 'menos_500', etiqueta: 'Menos de 500 m²' },
  { valor: '500_2000', etiqueta: '500 a 2.000 m²' },
  { valor: '2000_5000', etiqueta: '2.000 a 5.000 m²' },
  { valor: 'mas_5000', etiqueta: 'Más de 5.000 m²' }
];

export const AREAS = [
  { valor: 'oficinas', etiqueta: 'Oficinas' },
  { valor: 'banos', etiqueta: 'Baños' },
  { valor: 'criticas', etiqueta: 'Áreas críticas (quirófanos, laboratorios)' },
  { valor: 'cocina_comedor', etiqueta: 'Cocina o comedor' },
  { valor: 'bodegas', etiqueta: 'Bodegas' },
  { valor: 'externas', etiqueta: 'Áreas externas' },
  { valor: 'aulas', etiqueta: 'Aulas' },
  { valor: 'atencion_publico', etiqueta: 'Atención al público' }
];

export const AFLUENCIAS = [
  { valor: 'baja', etiqueta: 'Baja', ayuda: 'Menos de 25 personas por hora' },
  { valor: 'media', etiqueta: 'Media', ayuda: '25 a 100 personas por hora' },
  { valor: 'alta', etiqueta: 'Alta', ayuda: '100 a 300 personas por hora' },
  { valor: 'muy_alta', etiqueta: 'Muy alta', ayuda: 'Más de 300 personas por hora' }
];

export const HORARIOS = [
  { valor: 'diurno', etiqueta: 'Diurno' },
  { valor: 'nocturno', etiqueta: 'Nocturno' },
  { valor: '24_7', etiqueta: '24 horas, 7 días' },
  { valor: 'fines_de_semana', etiqueta: 'Fines de semana' }
];

export const FRECUENCIAS = [
  { valor: 'algunos_dias', etiqueta: 'Algunos días por semana' },
  { valor: 'diaria', etiqueta: 'Una vez al día' },
  { valor: 'varias_al_dia', etiqueta: 'Varias veces al día' }
];

export const NIVELES_LIMPIEZA = [
  { valor: 'leve', etiqueta: 'Leve', ayuda: 'Mantenimiento general' },
  { valor: 'medio', etiqueta: 'Medio', ayuda: 'Desinfección de superficies' },
  { valor: 'profundo', etiqueta: 'Profundo', ayuda: 'Desinfección de alto nivel' }
];

export const SI_NO = [
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'no', etiqueta: 'No' },
  { valor: '', etiqueta: 'No sé' }
];

// Atajo de la portada: el formulario corto pre-llena el completo.
export const INTAKE_TIPOS = [
  { valor: 'general_healthcare', etiqueta: 'Hospital o clínica' },
  { valor: 'food_court_retail', etiqueta: 'Centro comercial' },
  { valor: 'corporate_office', etiqueta: 'Oficinas' },
  { valor: 'educational_campus', etiqueta: 'Centro educativo' },
  { valor: 'industrial_logistics', etiqueta: 'Industria o bodega' }
];
export const INTAKE_TURNOS = [
  { valor: 'diurno', etiqueta: 'Diurno', horario: ['diurno'] },
  { valor: 'diurno_nocturno', etiqueta: 'Diurno y nocturno', horario: ['diurno', 'nocturno'] },
  { valor: '24_7', etiqueta: 'Continuo 24/7', horario: ['24_7'] }
];

// Documento del cliente que puede leer la IA.
export const DOCUMENTO = { tiposAceptados: '.pdf,.txt', tiposMime: ['application/pdf', 'text/plain'], limiteMb: 10 };

// Etiquetas para mostrar la configuración que propone el asistente.
const aMapa = (lista) => Object.fromEntries(lista.map((o) => [o.valor, o.etiqueta]));
export const ETIQUETAS = {
  tipologia: aMapa(TIPOLOGIAS),
  area: { ...aMapa(AREAS), hospitalizacion: 'Hospitalización', otra: 'Otra zona', general: 'Área general' },
  regimen: {
    diurno_5d: 'Diurno, lunes a viernes',
    diurno_6d: 'Diurno, lunes a sábado',
    extended_16h_7d: 'Dos turnos, 7 días (16 h)',
    continuous_24_7: 'Continuo 24/7 (tres turnos)'
  },
  maquinaria: {
    manual: 'Manual, sin maquinaria',
    semi_mechanized: 'Estándar (pulidora y aspiradora)',
    heavy_mechanized: 'Alta mecanización (fregadoras)'
  },
  protocolo: {
    standard: 'Estándar',
    food_safe: 'Grado alimentario',
    clinical_intermediate: 'Desinfección intermedia',
    hospital_grade: 'Desinfección de alto nivel',
    industrial_degreaser: 'Desengrase industrial'
  },
  trafico: { low: 'Bajo', medium: 'Medio', high: 'Alto', extreme: 'Muy alto' },
  confianza: { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja' }
};
// Módulos de la cotización para los que la IA anota lo que exige el pliego (sin calcular nada).
export const MODULOS_COTIZACION = [
  { valor: 'personal', etiqueta: 'Personal' },
  { valor: 'insumos', etiqueta: 'Insumos' },
  { valor: 'equipos', etiqueta: 'Equipos' },
  { valor: 'costos', etiqueta: 'Costos' },
  { valor: 'propuesta', etiqueta: 'Propuesta' }
];
export const TONO_CONFIANZA = { alta: 'ok', media: 'info', baja: 'aviso' };
export const TONO_PRIORIDAD = { alta: 'error', media: 'aviso', baja: 'neutro' };
