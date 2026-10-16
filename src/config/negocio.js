/**
 * Parámetros de negocio oficiales para Ecuador y Expo Clean 2026 (Reto 2).
 * Mantener en configuración según directrices de CLAUDE.md.
 */

export const PARAMETROS_ECUADOR = {
  sbu: 460.0, // Salario Básico Unificado Ecuador (USD)
  factorCargasSociales: 1.42, // IESS patronal (12.15%), 13vo, 14vo sueldo, fondos de reserva y vacaciones
  recargoNocturnoPct: 0.25, // Art. 49 Código de Trabajo Ecuador (25% entre 19h00 y 06h00)
  recargoFinSemanaPct: 0.50, // Jornadas extraordinarias/especiales fines de semana
  ivaPct: 0.15, // IVA vigente en Ecuador
  margenSugeridoBase: 22.0, // %
};

// Costos mensuales empresa por categoría (incluyendo provisiones de ley)
export const COSTOS_PERSONAL_BASE = {
  operario: {
    baseMensual: 680.0, // Sueldo base + IESS + provisión décimos
    titulo: 'Operario General de Limpieza',
    descripcion: 'Limpieza rutinaria, barrido, mopeado, desinfección de superficies y recolección de residuos.'
  },
  especialista: {
    baseMensual: 880.0, // Especialista con certificación de alturas o manejo de maquinaria
    titulo: 'Especialista Técnico / Maquinista / Alturas',
    descripcion: 'Operador de fregadoras automáticas hombre a bordo, lustradoras de alta velocidad o trabajo en alturas.'
  },
  supervisor: {
    baseMensual: 1100.0, // Supervisor de calidad y protocolos microbiológicos
    titulo: 'Supervisor Técnico de Operaciones',
    descripcion: 'Control microbiológico, checklists de trazabilidad, cumplimiento ARCSA/BPM y reporte al cliente.'
  }
};

// Catálogo de Tipologías y Áreas que requieren Licencia / Protocolo Especial
export const CATALOGO_INFRAESTRUCTURA = [
  {
    id: 'corporativo',
    nombre: 'Corporativo / Oficinas',
    riesgoDefecto: 'Bajo',
    normativaDefecto: 'Estándar comercial',
    areasLicencia: [
      'Data Center y Salas de Servidores (Licencia Antiestática ESD)',
      'Oficinas Ejecutivas y Directorio',
      'Áreas comunes y Recepción Principal',
      'Cafeterías y Comedores de Empleados'
    ]
  },
  {
    id: 'comercial',
    nombre: 'Comercial / Retail / Patios de comida',
    riesgoDefecto: 'Medio',
    normativaDefecto: 'BPM / HACCP (industria alimentaria)',
    areasLicencia: [
      'Patios de Comida (Trampas de grasa y desengrase pesado)',
      'Baterías Sanitarias de Alto Flujo Peatonal',
      'Pasillos Principales y Plazas Centrales',
      'Locales Comerciales y Tiendas Ancla',
      'Bodegas de Carga y Descarga de Mercadería'
    ]
  },
  {
    id: 'salud',
    nombre: 'Salud / Salas de hospitalización / Áreas críticas hospitalarias',
    riesgoDefecto: 'Crítico',
    normativaDefecto: 'ARCSA / Ministerio de Salud Pública (MSP)',
    areasLicencia: [
      'Quirófanos y Salas de Cirugía (Licencia ARCSA - Desinfección DAN)',
      'Unidad de Cuidados Intensivos (UCI)',
      'Salas de Aislamiento Infeccioso e Inmunodeprimidos',
      'Laboratorio Clínico y Banco de Sangre',
      'Salas de Hospitalización General',
      'Área de Disposición de Residuos Biopeligrosos'
    ]
  },
  {
    id: 'industrial',
    nombre: 'Industrial / Plantas de producción / Bodegas',
    riesgoDefecto: 'Alto',
    normativaDefecto: 'BPM / HACCP (industria alimentaria)',
    areasLicencia: [
      'Líneas de Producción y Envasado Estéril (Certificación BPM)',
      'Bodegas de Almacenamiento y Carga Pesada',
      'Silos y Áreas Confinadas',
      'Talleres de Mantenimiento y Áreas Químicas'
    ]
  },
  {
    id: 'educativo',
    nombre: 'Educativo / Institucional',
    riesgoDefecto: 'Bajo',
    normativaDefecto: 'Estándar comercial',
    areasLicencia: [
      'Laboratorios de Ciencias y Química',
      'Aulas de Clase y Auditorios',
      'Bibliotecas y Salas de Estudio',
      'Canchas y Patios Exteriores'
    ]
  }
];

// Niveles de riesgo sanitario microbiológico y factor de costo de insumos $/m2 al mes
export const NIVELES_RIESGO = {
  Bajo: {
    nombre: 'Bajo',
    tono: 'ok',
    descripcion: 'Áreas administrativas, oficinas, tránsito controlado. Protocolo convencional.',
    factorInsumoM2: 0.38,
    colorPano: 'Azul',
    quimicosBase: 'Detergente neutro, bactericida estándar, aromatizante biodegradable'
  },
  Medio: {
    nombre: 'Medio',
    tono: 'aviso',
    descripcion: 'Zonas comunes, baños públicos, patios de comida, pasillos comerciales.',
    factorInsumoM2: 0.72,
    colorPano: 'Amarillo',
    quimicosBase: 'Desengrasante alcalino, clorado orgánico, bactericida de amplio espectro'
  },
  Alto: {
    nombre: 'Alto',
    tono: 'error',
    descripcion: 'Salas de hospitalización, laboratorios clínicos, bodegas industriales complejas.',
    factorInsumoM2: 1.35,
    colorPano: 'Naranja / Rojo',
    quimicosBase: 'Amonio cuaternario 5ta gen, bactericida fungicida virucida certificado'
  },
  Crítico: {
    nombre: 'Crítico',
    tono: 'error',
    descripcion: 'Quirófanos, UCI, salas de aislamiento biológico, desechos bioinfecciosos.',
    factorInsumoM2: 2.25,
    colorPano: 'Rojo hospitalario estéril',
    quimicosBase: 'Desinfección de Alto Nivel (DAN), peróxido de hidrógeno acelerado, amonio 5ta gen ARCSA'
  }
};

// Factores según tráfico peatonal
export const NIVELES_TRAFICO = {
  'Bajo (< 50 personas/día)': { factor: 1.0, desgaste: 'Bajo' },
  'Medio (50 - 300 personas/día)': { factor: 1.25, desgaste: 'Moderado' },
  'Alto / Masivo (> 300 personas/día)': { factor: 1.60, desgaste: 'Intensivo' }
};

// Catálogo de Maquinarias y su costo mensual de amortización/mantenimiento
export const CATALOGO_MAQUINARIA = [
  { id: 'fregadora_bordo', nombre: 'Fregadora automática hombre a bordo', costoMensual: 450.0, m2Minimos: 3000 },
  { id: 'fregadora_pie', nombre: 'Fregadora automática hombre a pie', costoMensual: 220.0, m2Minimos: 1000 },
  { id: 'lustrasuelos_alta', nombre: 'Lustrasuelos rotativa de alta velocidad (1500 RPM)', costoMensual: 140.0, m2Minimos: 500 },
  { id: 'hidrolavadora_caliente', nombre: 'Hidrolavadora industrial agua caliente (200 Bar)', costoMensual: 190.0, m2Minimos: 800 },
  { id: 'aspiradora_hepa', nombre: 'Aspiradora hospitalaria con microfiltro HEPA H14', costoMensual: 130.0, m2Minimos: 400 },
  { id: 'vapor_seco', nombre: 'Sistema de desinfección por vapor saturado seco 180°C', costoMensual: 260.0, m2Minimos: 600 }
];

export const SUPERFICIES_DISPONIBLES = [
  'Pisos duros (porcelanato, mármol, baldosa)',
  'Hormigón pulido / epóxico industrial',
  'Pisos vinílicos hospitalarios conductivos',
  'Alfombras y revestimientos textiles',
  'Cristales y ventanales en altura',
  'Acero inoxidable y superficies asépticas'
];

export const NORMATIVAS_DISPONIBLES = [
  'Estándar comercial',
  'ARCSA / Ministerio de Salud Pública (MSP)',
  'BPM / HACCP (industria alimentaria)',
  'ISO 9001 / ISO 14001 / ISO 45001'
];

export const TIPOS_LIMPIEZA = [
  'Mantenimiento rutinario',
  'Limpieza profunda/periódica',
  'Desinfección de alto nivel',
  'Limpieza técnica/alturas'
];

export const TURNOS_DISPONIBLES = [
  'Matutino (06:00 - 14:30)',
  'Vespertino (14:00 - 22:00)',
  'Nocturno (22:00 - 06:00)',
  'Matutino y Nocturno',
  'Rotativo 24/7'
];

export const FRECUENCIAS_DISPONIBLES = [
  'Diaria',
  'Interdiaria (3 veces por semana)',
  'Semanal',
  'Quincenal',
  'Mensual'
];
