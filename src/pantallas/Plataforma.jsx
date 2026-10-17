import { useEffect } from 'react';
import { Insignia, Marca, TarjetaKpi } from '../components/ui.jsx';
import { PASOS, REGISTRO, VISITA } from '../pasos.js';
import { useSolicitud } from '../estado/contexto.js';
import { ETIQUETAS } from '../config/opciones.js';
import AsistenteVisita from './AsistenteVisita.jsx';
import PasoRequisitos from './PasoRequisitos.jsx';
import RegistroFormulario from './RegistroFormulario.jsx';
import { RequisitosModulo } from './RequisitosPliego.jsx';
import PasoCostos from './PasoCostos.jsx';
import { estimarPresupuesto, textoRango } from '../presupuesto/estimar.js';
import { paginaDe, requisitoDe } from '../formulario/fichaUtil.js';
import { armarRegistro } from '../formulario/registro.js';

/** KPI del paso 1 a partir de la ficha (sin cifras inventadas: sin ficha, "—"). */
function kpiRequisitos(ficha, verificados) {
  if (!ficha) return { valor: undefined, detalle: 'Sin ficha de visita' };
  return { valor: ficha.listoParaVisita ? 'Ficha lista' : 'Faltan datos', detalle: `${verificados.length} de ${ficha.verificarEnVisita.length} puntos verificados` };
}

function EstadoFicha({ ficha }) {
  if (!ficha) return <Insignia tono="info">Sin ficha</Insignia>;
  return <Insignia tono={ficha.listoParaVisita ? 'ok' : 'aviso'}>{ficha.listoParaVisita ? 'Ficha lista' : 'Faltan datos'}</Insignia>;
}

/** KPIs de la sección del asistente: estado real, sin cifras fijas. */
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

export default function Plataforma({ pasoId }) {
  const esRegistro = pasoId === REGISTRO.id;
  const esVisita = pasoId === VISITA.id;
  const especial = esVisita || esRegistro;
  const indice = Math.max(0, PASOS.findIndex((p) => p.id === pasoId));
  const paso = PASOS[indice];
  const { ficha, verificados, vista, formulario } = useSolicitud();
  const presupuesto = estimarPresupuesto(ficha, formulario);

  // Con llaves: en Chrome reciente scrollTo devuelve una promesa y React exige que el efecto no devuelva nada.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pasoId, vista]);

  const kpi1 = kpiRequisitos(ficha, verificados);

  return (
    <div className="plataforma">
      <aside className="lateral">
        <a href="#/" className="lateral__marca" aria-label="Atlas, volver a la portada">
          <Marca />
        </a>
        <nav className="lateral__nav" aria-label="Secciones de la plataforma">
          <div className="lateral__grupo">
            <p className="lateral__rotulo">Antes de la visita</p>
            <ol className="lateral__pasos">
              <li>
                <a href={`#/app/${VISITA.id}`} className="lateral__paso" aria-current={esVisita ? 'page' : undefined}>
                  <span className="lateral__num lateral__num--ia">IA</span>
                  {VISITA.nombre}
                </a>
              </li>
              <li>
                <a href={`#/app/${REGISTRO.id}`} className="lateral__paso" aria-current={esRegistro ? 'page' : undefined}>
                  <span className="lateral__num lateral__num--ia" aria-hidden="true">≡</span>
                  {REGISTRO.nombre}
                </a>
              </li>
            </ol>
          </div>
          <div className="lateral__grupo">
            <p className="lateral__rotulo">Cotización</p>
            <ol className="lateral__pasos">
              {PASOS.map((p, i) => (
                <li key={p.id}>
                  <a href={`#/app/${p.id}`} className="lateral__paso" aria-current={!especial && p.id === paso.id ? 'page' : undefined}>
                    <span className="lateral__num">{i + 1}</span>
                    {p.nombre}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <a href="#/" className="lateral__volver">
          ← Volver a la portada
        </a>
      </aside>

      <header className="superior">
        <div>
          <p className="antetitulo">{especial ? 'Antes de la visita' : `Paso ${indice + 1} de ${PASOS.length}`}</p>
          <h1>{esRegistro ? REGISTRO.nombre : esVisita ? VISITA.nombre : paso.nombre}</h1>
          {esRegistro && <p className="superior__desc">{REGISTRO.descripcion}</p>}
        </div>
        {especial || paso.id === 'requisitos' ? (
          <EstadoFicha ficha={ficha} />
        ) : paso.id === 'costos' && presupuesto.disponible ? (
          <Insignia tono="info">Presupuesto previo</Insignia>
        ) : requisitoDe(ficha, paso.id) ? (
          <Insignia tono="aviso">Requisitos del pliego</Insignia>
        ) : (
          <Insignia>Módulo de cotización</Insignia>
        )}
      </header>

      <main className="contenido">
        {esRegistro ? (
          <>
            <KpisRegistro />
            <RegistroFormulario />
          </>
        ) : esVisita ? (
          <>
            <KpisVisita />
            <AsistenteVisita />
          </>
        ) : (
          <>
            <div className="kpis">
              {PASOS.map((p, i) => {
                // Pasos 2 a 6: sin cálculo propio aquí; si el pliego exige algo para ese módulo, se muestra rotulado.
                // Costos muestra el presupuesto previo (rango orientativo) cuando hay ficha.
                if (p.id === 'costos' && presupuesto.disponible) {
                  return (
                    <TarjetaKpi
                      key={p.id}
                      etiqueta={`${i + 1}. ${p.nombre}`}
                      valor={textoRango(presupuesto.mensual)}
                      detalle="Presupuesto previo · mensual + IVA"
                      variante={p.id === paso.id ? 'destacada' : undefined}
                      compacta
                    />
                  );
                }
                const r = p.id === 'requisitos' ? null : requisitoDe(ficha, p.id);
                return (
                  <TarjetaKpi
                    key={p.id}
                    etiqueta={`${i + 1}. ${p.nombre}`}
                    valor={p.id === 'requisitos' ? kpi1.valor : r?.resumen || undefined}
                    detalle={p.id === 'requisitos' ? kpi1.detalle : r ? `Según el pliego${paginaDe(r) ? ` · ${paginaDe(r)}` : ''}` : 'Sin calcular'}
                    variante={p.id === paso.id ? 'destacada' : i === PASOS.length - 1 ? 'oscura' : undefined}
                    compacta={Boolean(r)}
                  />
                );
              })}
            </div>
            <section className="panel">
              <h2>{paso.nombre}</h2>
              <p className="panel__desc">{paso.descripcion}</p>
              {paso.id === 'requisitos' ? <PasoRequisitos /> : paso.id === 'costos' ? <PasoCostos /> : <RequisitosModulo modulo={paso.id} />}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
