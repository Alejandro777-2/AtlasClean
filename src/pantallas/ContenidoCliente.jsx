/**
 * MÓDULO DEL CLIENTE dentro de la plataforma.
 * - ContenidoCliente: lo que se muestra en #/app/visita (Asistente de visita) y #/app/registro (registro del formulario).
 * - AportesFicha: lo que la ficha de visita aporta a cada paso del cotizador (zonas sugeridas, requisitos del pliego,
 *   presupuesto previo y «Contáctanos»). Solo aparece si hay ficha, salvo «Contáctanos», que está siempre en Costos.
 * Se separa de Plataforma.jsx para no mezclar la lógica del cotizador con la del cliente.
 */
import { Insignia, TarjetaKpi } from '../components/ui.jsx';
import { REGISTRO } from '../pasos.js';
import { useSolicitud } from '../estado/contexto.js';
import { ETIQUETAS } from '../config/opciones.js';
import { armarRegistro } from '../formulario/registro.js';
import { requisitoDe } from '../formulario/fichaUtil.js';
import AsistenteVisita from './AsistenteVisita.jsx';
import RegistroFormulario from './RegistroFormulario.jsx';
import PasoRequisitos from './PasoRequisitos.jsx';
import PasoCostos from './PasoCostos.jsx';
import { RequisitosModulo } from './RequisitosPliego.jsx';

export function EstadoFicha() {
  const { ficha } = useSolicitud();
  if (!ficha) return <Insignia tono="info">Sin ficha de visita</Insignia>;
  return <Insignia tono={ficha.listoParaVisita ? 'ok' : 'aviso'}>{ficha.listoParaVisita ? 'Ficha lista' : 'Faltan datos'}</Insignia>;
}

/** KPIs del Asistente de visita: estado real, sin cifras fijas. */
function KpisVisita() {
  const { ia, documento, ficha, verificados, meta } = useSolicitud();
  const c = ficha?.configuracionInicial;
  return (
    <div className="kpis kpis--ficha">
      <TarjetaKpi
        etiqueta="Asistente"
        valor={ia.cargando ? undefined : ia.configurado ? 'IA conectada' : 'Demostración'}
        detalle={ia.sinServidor ? 'Sin servidor local' : ia.configurado ? ia.modelo : 'Sin clave en .env'}
        variante="destacada"
      />
      <TarjetaKpi etiqueta="Documento" valor={documento ? 'Adjunto' : undefined} detalle={documento?.nombre ?? 'Sin pliego (opcional)'} />
      <TarjetaKpi
        etiqueta="Ficha de visita"
        valor={ficha ? (ficha.listoParaVisita ? 'Lista' : 'Faltan datos') : undefined}
        detalle={ficha ? (meta?.origen === 'ia' ? 'Generada con IA' : 'Modo demostración') : 'Aún no generada'}
      />
      <TarjetaKpi
        etiqueta="Por aclarar en la visita"
        valor={ficha ? String(ficha.contradicciones.length) : undefined}
        detalle={ficha ? `${verificados.length} de ${ficha.verificarEnVisita.length} puntos verificados · ${ETIQUETAS.tipologia[c.tipologia.valor]?.split(' (')[0] ?? ''}` : 'Contradicciones detectadas'}
        variante="oscura"
      />
    </div>
  );
}

/** KPIs del registro: completitud real del formulario. */
function KpisRegistro() {
  const { formulario, documento, ficha, desdeDocumento } = useSolicitud();
  const r = armarRegistro(formulario, desdeDocumento);
  return (
    <div className="kpis kpis--ficha">
      <TarjetaKpi etiqueta="Datos registrados" valor={`${r.conDato} de ${r.total}`} detalle="Incluye los opcionales" variante="destacada" />
      <TarjetaKpi etiqueta="Obligatorios pendientes" valor={String(r.faltan)} detalle={r.completo ? 'Formulario completo' : 'Completar antes de generar'} />
      <TarjetaKpi etiqueta="Documento" valor={documento ? 'Adjunto' : undefined} detalle={documento?.nombre ?? 'Sin pliego (opcional)'} />
      <TarjetaKpi etiqueta="Ficha de visita" valor={ficha ? (ficha.listoParaVisita ? 'Lista' : 'Faltan datos') : undefined} detalle={ficha ? 'Ya generada' : 'Aún no generada'} variante="oscura" />
    </div>
  );
}

export default function ContenidoCliente({ seccion }) {
  if (seccion === REGISTRO.id) {
    return (
      <>
        <KpisRegistro />
        <RegistroFormulario />
      </>
    );
  }
  return (
    <>
      <KpisVisita />
      <AsistenteVisita />
    </>
  );
}

/** Aporte de la ficha de visita (y del pliego) a un paso del cotizador. */
export function AportesFicha({ pasoId }) {
  const { ficha } = useSolicitud();

  if (pasoId === 'costos') {
    return (
      <section className="panel aportes-ficha">
        <h2>Presupuesto previo para el cliente</h2>
        <p className="panel__desc">Rango orientativo calculado con la ficha de visita. No reemplaza la cotización del motor de costos.</p>
        <PasoCostos />
      </section>
    );
  }
  if (!ficha) return null;
  if (pasoId === 'requisitos') {
    return (
      <section className="panel aportes-ficha">
        <h2>Zonas sugeridas por la ficha de visita</h2>
        <p className="panel__desc">Supuestos del Asistente de visita para tomar como referencia al llenar el levantamiento.</p>
        <PasoRequisitos />
      </section>
    );
  }
  if (!requisitoDe(ficha, pasoId)) return null;
  return (
    <section className="panel aportes-ficha">
      <h2>Lo que exige el pliego del cliente</h2>
      <RequisitosModulo modulo={pasoId} />
    </section>
  );
}
