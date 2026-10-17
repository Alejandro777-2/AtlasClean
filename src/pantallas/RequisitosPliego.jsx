/**
 * Lo que el pliego del cliente exige para cada módulo de la cotización (personal, insumos, equipos, costos, propuesta).
 * Son datos del documento, con su página: NO son cálculos. El cálculo lo hace el módulo de cotización de la empresa.
 */
import { Aviso, Boton, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { MODULOS_COTIZACION } from '../config/opciones.js';
import { requisitoDe } from '../formulario/fichaUtil.js';

const filas = (detalles) =>
  detalles.map((d, i) => ({
    id: i,
    texto: <strong>{d.texto}</strong>,
    pagina: d.pagina ?? '—',
    cita: d.cita ? <span className="texto-suave">“{d.cita}”</span> : '—'
  }));

const COLUMNAS = [
  { clave: 'texto', titulo: 'Lo que exige el documento' },
  { clave: 'pagina', titulo: 'Página', numerica: true },
  { clave: 'cita', titulo: 'Cita' }
];

/** Sección de la ficha: todos los módulos en una tabla. */
export function TablaRequisitosPliego({ ficha }) {
  const conDatos = MODULOS_COTIZACION.filter((m) => requisitoDe(ficha, m.valor));
  if (!conDatos.length) return null;
  const todas = conDatos.flatMap((m) =>
    requisitoDe(ficha, m.valor).detalles.map((d, i) => ({
      id: `${m.valor}-${i}`,
      modulo: i === 0 ? <strong>{m.etiqueta}</strong> : '',
      texto: d.texto,
      pagina: d.pagina ?? '—',
      cita: d.cita ? <span className="texto-suave">“{d.cita}”</span> : '—'
    }))
  );
  return (
    <section className="ficha__seccion">
      <h3>Requisitos del pliego para la cotización</h3>
      <p className="texto-suave">Lo que el documento exige para cada módulo. Son datos del cliente, no cálculos: el precio lo calcula el módulo de cotización.</p>
      <Tabla
        columnas={[
          { clave: 'modulo', titulo: 'Módulo' },
          { clave: 'texto', titulo: 'Lo que exige el documento' },
          { clave: 'pagina', titulo: 'Página', numerica: true },
          { clave: 'cita', titulo: 'Cita' }
        ]}
        filas={todas}
      />
    </section>
  );
}

/** Contenido de los pasos 2 a 6: lo que pide el pliego para ese módulo. */
export function RequisitosModulo({ modulo }) {
  const { ficha, meta, setVista } = useSolicitud();
  const r = requisitoDe(ficha, modulo);

  if (!ficha) {
    return (
      <Aviso tono="info" titulo="Este cálculo es parte del módulo de cotización" acciones={<Boton variante="secundario" href="#/app/visita" onClick={() => setVista('formulario')}>Ir al asistente de visita</Boton>}>
        Si el cliente sube su pliego en el Asistente de visita, aquí verás lo que exige para este paso.
      </Aviso>
    );
  }
  if (!r) {
    return (
      <Aviso tono="info" titulo={meta?.conDocumento ? 'El documento no dice nada sobre este paso' : 'Sin requisitos del pliego'}>
        {meta?.conDocumento
          ? 'El pliego no trae requisitos para este paso. El cálculo se hará en el módulo de cotización con las medidas de la visita.'
          : 'La ficha se generó sin documento. Adjunta el pliego del cliente y vuelve a generarla para ver sus requisitos aquí.'}
      </Aviso>
    );
  }
  return (
    <div className="ficha">
      <Aviso tono="aviso" titulo={`Según el pliego: ${r.resumen}`} acciones={<Boton variante="secundario" href="#/app/visita" onClick={() => setVista('ficha')}>Ver la ficha completa</Boton>}>
        Es lo que exige el cliente. El cálculo de este paso lo hace el módulo de cotización.
      </Aviso>
      {r.detalles.length > 0 && <Tabla columnas={COLUMNAS} filas={filas(r.detalles)} />}
    </div>
  );
}
