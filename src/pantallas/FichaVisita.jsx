/**
 * Ficha previa a la visita: lo que entrega el Asistente de Visita (IA o modo demostración).
 * El técnico la usa en el sitio: marca lo que ya verificó, la imprime o la copia.
 */
import { useState } from 'react';
import { Aviso, Boton, Insignia, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { ETIQUETAS, TONO_CONFIANZA, TONO_PRIORIDAD } from '../config/opciones.js';
import { TablaRequisitosPliego } from './RequisitosPliego.jsx';
import { m2Zona, requisitoDe } from '../formulario/fichaUtil.js';
import { CAMPOS_DESDE_DOCUMENTO, valorLegible } from '../formulario/desdeDocumento.js';
import { REGISTRO } from '../pasos.js';
import { estimarPresupuesto, textoRango } from '../presupuesto/estimar.js';
import { MODULOS_COTIZACION } from '../config/opciones.js';
import { rutaModulo } from '../estado/rutas.js';

/** Nombre real de la zona (del pliego o del cliente) y, debajo, su categoría. */
export function CeldaZona({ zona: z }) {
  const categoria = (ETIQUETAS.area[z.area] ?? z.area).replace(/\s*\(.*\)$/, '');
  const nombre = z.nombre ? z.nombre.charAt(0).toUpperCase() + z.nombre.slice(1) : categoria;
  return (
    <span className="zona">
      <strong>{nombre}</strong>
      {z.nombre && <span className="texto-suave zona__categoria">{categoria}</span>}
    </span>
  );
}


const TONO_RIESGO = (r) => (r >= 5 ? 'error' : r >= 3 ? 'aviso' : 'info');
const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function textoPlano(ficha, empresa) {
  const c = ficha.configuracionInicial;
  const lineas = [
    `FICHA PREVIA A LA VISITA — ${empresa || 'Cliente'}`,
    '',
    ficha.resumen,
    '',
    'CONFIGURACIÓN INICIAL (a confirmar)',
    `- Tipo de lugar: ${ETIQUETAS.tipologia[c.tipologia.valor] ?? c.tipologia.valor}`,
    `- Turnos: ${ETIQUETAS.regimen[c.regimenSugerido.valor] ?? c.regimenSugerido.valor}`,
    `- Pasadas por día: ${c.pasadasSugeridas.valor}`,
    `- Maquinaria: ${ETIQUETAS.maquinaria[c.maquinariaSugerida.valor] ?? c.maquinariaSugerida.valor}`,
    `- Tamaño de referencia: ${c.tamanoReferencia.m2 ? `${c.tamanoReferencia.m2} m²${c.tamanoReferencia.esAproximado ? ' (aproximado)' : ''}` : 'sin dato'}`,
    '',
    'ZONAS',
    ...c.zonasPropuestas.map((z) => `- ${z.nombre || ETIQUETAS.area[z.area] || z.area}${z.m2 ? ` (${z.m2} m²)` : ''}: riesgo ${z.riesgo}, ${ETIQUETAS.protocolo[z.protocolo] ?? z.protocolo}`),
    '',
    'CONTRADICCIONES',
    ...(ficha.contradicciones.length ? ficha.contradicciones.map((x) => `- ${x.descripcion} → ${x.comoResolverEnVisita}`) : ['- Ninguna']),
    '',
    'VERIFICAR EN LA VISITA',
    ...ficha.verificarEnVisita.map((x) => `- [${x.prioridad}] ${x.punto}: ${x.porQue}`),
    '',
    'PREGUNTAS PARA EL CLIENTE',
    ...ficha.preguntasParaElCliente.map((p, i) => `${i + 1}. ${p}`),
    '',
    'LLEVAR A LA VISITA',
    ...ficha.llevarALaVisita.map((x) => `- ${x}`)
  ];
  const requisitos = MODULOS_COTIZACION.map((m) => [m.etiqueta, requisitoDe(ficha, m.valor)]).filter(([, r]) => r);
  if (requisitos.length) lineas.push('', 'REQUISITOS DEL PLIEGO', ...requisitos.map(([n, r]) => `- ${n}: ${r.detalles.map((d) => `${d.texto}${d.pagina ? ` (pág. ${d.pagina})` : ''}`).join('; ') || r.resumen}`));
  if (ficha.notasComerciales) lineas.push('', 'NOTAS COMERCIALES', ficha.notasComerciales);
  return lineas.join('\n');
}

export default function FichaVisita() {
  const { ficha, meta, verificados, alternarVerificado, setVista, generarFicha, estado, error, formulario, desdeDocumento, puedeDeshacerDocumento, deshacerDesdeDocumento } = useSolicitud();
  const [copiado, setCopiado] = useState(false);
  const generando = estado === 'generando';
  const presupuesto = estimarPresupuesto(ficha, formulario);
  if (!ficha) return null;
  const c = ficha.configuracionInicial;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPlano(ficha, formulario.empresa));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  const filasConfiguracion = [
    { id: 't', dato: 'Tipo de lugar', supuesto: c.tipologia, valor: ETIQUETAS.tipologia[c.tipologia.valor] ?? c.tipologia.valor },
    { id: 'r', dato: 'Turnos', supuesto: c.regimenSugerido, valor: ETIQUETAS.regimen[c.regimenSugerido.valor] ?? c.regimenSugerido.valor },
    { id: 'p', dato: 'Pasadas por día', supuesto: c.pasadasSugeridas, valor: String(c.pasadasSugeridas.valor) },
    { id: 'm', dato: 'Maquinaria', supuesto: c.maquinariaSugerida, valor: ETIQUETAS.maquinaria[c.maquinariaSugerida.valor] ?? c.maquinariaSugerida.valor },
    {
      id: 'a',
      dato: 'Tamaño de referencia',
      supuesto: { confianza: c.tamanoReferencia.esAproximado ? 'baja' : 'alta', motivo: c.tamanoReferencia.motivo },
      valor: c.tamanoReferencia.m2 ? `${c.tamanoReferencia.m2.toLocaleString('es-EC')} m²` : 'Sin dato'
    }
  ].map((f) => ({
    id: f.id,
    dato: <strong>{f.dato}</strong>,
    valor: f.valor,
    confianza: <Insignia tono={TONO_CONFIANZA[f.supuesto.confianza]}>{ETIQUETAS.confianza[f.supuesto.confianza]}</Insignia>,
    motivo: <span className="texto-suave">{f.supuesto.motivo}</span>
  }));

  const filasZonas = c.zonasPropuestas.map((z, i) => ({
    id: `${z.area}-${i}`,
    area: <CeldaZona zona={z} />,
    m2: m2Zona(z),
    riesgo: <Insignia tono={TONO_RIESGO(z.riesgo)}>Nivel {z.riesgo}</Insignia>,
    trafico: ETIQUETAS.trafico[z.trafico] ?? z.trafico,
    protocolo: ETIQUETAS.protocolo[z.protocolo] ?? z.protocolo,
    motivo: <span className="texto-suave">{z.motivo}</span>
  }));

  const hechos = ficha.verificarEnVisita.filter((_, i) => verificados.includes(i)).length;

  return (
    <div className="ficha">
      <div className="ficha__cabecera">
        <div className="ficha__insignias">
          {meta?.origen === 'ia' ? <Insignia tono="info">Generada con IA · {meta.modelo}</Insignia> : <Insignia tono="aviso">Modo demostración · reglas locales, sin IA</Insignia>}
          {ficha.listoParaVisita ? <Insignia tono="ok">Lista para agendar la visita</Insignia> : <Insignia tono="error">Faltan datos para agendar</Insignia>}
          {meta?.conDocumento && <Insignia>Con documento</Insignia>}
          {meta?.generada && <span className="texto-suave ficha__fecha">{fechaCorta(meta.generada)}</span>}
        </div>
        <div className="ficha__acciones">
          <Boton variante="secundario" onClick={() => setVista('formulario')} disabled={generando}>
            Editar formulario
          </Boton>
          <Boton variante="secundario" onClick={() => generarFicha()} disabled={generando}>
            {generando ? 'Generando…' : 'Volver a generar'}
          </Boton>
          <Boton variante="secundario" onClick={copiar}>
            {copiado ? 'Ficha copiada' : 'Copiar ficha'}
          </Boton>
          <Boton variante="primario" onClick={() => window.print()}>
            Imprimir ficha
          </Boton>
        </div>
      </div>

      {estado === 'error' && <Aviso tono="error" titulo="No se pudo volver a generar la ficha">{error}</Aviso>}
      {meta?.motivo && meta.origen === 'demo' && <Aviso tono="aviso">{meta.motivo} La ficha se armó con las reglas del asistente, sin analizar documentos.</Aviso>}
      {meta?.problemas?.length > 0 && <Aviso tono="info" titulo="Se ajustó la respuesta de la IA">{meta.problemas.join(' ')}</Aviso>}
      {!ficha.listoParaVisita && ficha.camposFaltantes.length > 0 && (
        <Aviso tono="error" titulo="Pedir al cliente antes de agendar">
          {ficha.camposFaltantes.join(' · ')}
        </Aviso>
      )}

      {desdeDocumento.length > 0 && (
        <Aviso
          tono="ok"
          titulo={`Se completaron ${desdeDocumento.length} dato${desdeDocumento.length === 1 ? '' : 's'} del formulario con el documento`}
          acciones={
            <>
              <Boton variante="secundario" href={rutaModulo(REGISTRO.id)} target="_blank" rel="opener">
                Ver registro ↗
              </Boton>
              {puedeDeshacerDocumento && (
                <Boton variante="fantasma" onClick={deshacerDesdeDocumento}>
                  Deshacer
                </Boton>
              )}
            </>
          }
        >
          <ul className="ficha__desde-documento">
            {desdeDocumento.map((d) => (
              <li key={d.campo}>
                <strong>{CAMPOS_DESDE_DOCUMENTO[d.campo]?.etiqueta ?? d.campo}:</strong> {d.agregado ? 'se agregó ' : ''}
                {valorLegible(d.campo, d.valor)}
                {d.pagina ? <span className="texto-suave"> · pág. {d.pagina}</span> : null}
              </li>
            ))}
          </ul>
        </Aviso>
      )}

      <section className="ficha__seccion">
        <h3>Resumen</h3>
        <p className="ficha__resumen">{ficha.resumen}</p>
        <p className="texto-suave ficha__estimacion">
          {presupuesto.disponible ? (
            <>
              Presupuesto previo (orientativo): <strong>{textoRango(presupuesto.mensual)}</strong> mensuales + IVA ·{' '}
              <a href={rutaModulo('costos')}>ver el detalle</a>
            </>
          ) : (
            <>Estimación previa: {ficha.estimacionPrevia}</>
          )}
        </p>
      </section>

      <section className="ficha__seccion">
        <h3>Configuración inicial sugerida</h3>
        <p className="texto-suave">Son supuestos para confirmar en la visita; el precio se calcula después con las medidas reales.</p>
        <Tabla
          columnas={[
            { clave: 'dato', titulo: 'Dato' },
            { clave: 'valor', titulo: 'Propuesta' },
            { clave: 'confianza', titulo: 'Confianza' },
            { clave: 'motivo', titulo: 'Motivo' }
          ]}
          filas={filasConfiguracion}
        />
      </section>

      <section className="ficha__seccion">
        <h3>Zonas propuestas</h3>
        <Tabla
          columnas={[
            { clave: 'area', titulo: 'Zona' },
            { clave: 'm2', titulo: 'm²', numerica: true },
            { clave: 'riesgo', titulo: 'Riesgo' },
            { clave: 'trafico', titulo: 'Tráfico' },
            { clave: 'protocolo', titulo: 'Protocolo' },
            { clave: 'motivo', titulo: 'Motivo' }
          ]}
          filas={filasZonas}
          vacio="El asistente no propuso zonas."
        />
      </section>

      <div className="ficha__rejilla">
        <section className="ficha__seccion">
          <h3>Contradicciones a aclarar</h3>
          {ficha.contradicciones.length === 0 ? (
            <p className="texto-suave">No se detectaron contradicciones en la solicitud.</p>
          ) : (
            <ul className="ficha__lista ficha__lista--avisos">
              {ficha.contradicciones.map((x, i) => (
                <li key={i}>
                  <strong>{x.descripcion}</strong>
                  <span className="texto-suave">En la visita: {x.comoResolverEnVisita}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ficha__seccion">
          <div className="ficha__titulo-fila">
            <h3>Verificar en la visita</h3>
            <Insignia tono={hechos === ficha.verificarEnVisita.length && hechos > 0 ? 'ok' : 'neutro'}>
              {hechos} de {ficha.verificarEnVisita.length} verificados
            </Insignia>
          </div>
          <ul className="ficha__lista ficha__chequeo">
            {ficha.verificarEnVisita.map((x, i) => (
              <li key={i}>
                <label className={verificados.includes(i) ? 'ficha__hecho' : undefined}>
                  <input type="checkbox" checked={verificados.includes(i)} onChange={() => alternarVerificado(i)} />
                  <span>
                    <strong>{x.punto}</strong> <Insignia tono={TONO_PRIORIDAD[x.prioridad]}>Prioridad {x.prioridad}</Insignia>
                    <span className="texto-suave ficha__porque">{x.porQue}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="ficha__seccion">
          <h3>Preguntas para el cliente</h3>
          <ol className="ficha__lista ficha__numerada">
            {ficha.preguntasParaElCliente.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </section>

        <section className="ficha__seccion">
          <h3>Llevar a la visita</h3>
          <ul className="ficha__lista ficha__vinetas">
            {ficha.llevarALaVisita.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      {ficha.datosDelDocumento?.length > 0 && (
        <section className="ficha__seccion">
          <h3>Datos encontrados en el documento</h3>
          <Tabla
            columnas={[
              { clave: 'campo', titulo: 'Dato' },
              { clave: 'valor', titulo: 'Valor' },
              { clave: 'pagina', titulo: 'Página', numerica: true },
              { clave: 'cita', titulo: 'Cita' }
            ]}
            filas={ficha.datosDelDocumento.map((d, i) => ({ ...d, id: i, pagina: d.pagina ?? '—', cita: d.cita ? <span className="texto-suave">“{d.cita}”</span> : '—' }))}
          />
        </section>
      )}

      <TablaRequisitosPliego ficha={ficha} />

      {ficha.notasComerciales && (
        <Aviso tono="info" titulo="Notas comerciales">
          {ficha.notasComerciales}
        </Aviso>
      )}
    </div>
  );
}
