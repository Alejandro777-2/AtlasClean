/**
 * Los 6 pasos de la cotización tal como los ve el CLIENTE en su espacio (#/cliente/<paso>).
 * Solo lo que le sirve a él: qué incluye su servicio, lo que ya sabemos de su lugar y lo que pide su pliego.
 * Nunca muestra precios ni presupuestos, ni costos internos o márgenes: el precio llega en la propuesta formal,
 * después de la visita técnica, para no dar al cliente una cifra que luego cambie.
 */
import { Aviso, Boton, Insignia, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { ETIQUETAS } from '../config/opciones.js';
import { rutaModulo } from '../estado/rutas.js';
import PasoRequisitos from './PasoRequisitos.jsx';
import { Contactanos } from './Contactanos.jsx';
import { RequisitosModulo } from './RequisitosPliego.jsx';

/** Lo que la ficha ya dice de este paso, en palabras para el cliente (sin cifras de costo). */
function datosDeLaFicha(pasoId, ficha) {
  const c = ficha?.configuracionInicial;
  if (!c) return [];
  if (pasoId === 'personal') {
    return [
      { id: 'regimen', dato: 'Turnos del servicio', valor: ETIQUETAS.regimen[c.regimenSugerido.valor] ?? c.regimenSugerido.valor },
      { id: 'pasadas', dato: 'Limpiezas por día', valor: String(c.pasadasSugeridas.valor) }
    ];
  }
  if (pasoId === 'insumos') {
    const protocolos = [...new Set(c.zonasPropuestas.map((z) => z.protocolo))];
    return protocolos.map((p) => ({
      id: p,
      dato: ETIQUETAS.protocolo[p] ?? p,
      valor: c.zonasPropuestas
        .filter((z) => z.protocolo === p)
        .map((z) => z.nombre || ETIQUETAS.area[z.area] || z.area)
        .join(', ')
    }));
  }
  if (pasoId === 'equipos') {
    return [{ id: 'maquinaria', dato: 'Nivel de maquinaria', valor: ETIQUETAS.maquinaria[c.maquinariaSugerida.valor] ?? c.maquinariaSugerida.valor }];
  }
  return [];
}

const TITULO_DATOS = { personal: 'Lo que ya sabemos de tu servicio', insumos: 'Protocolo de limpieza por zona', equipos: 'Lo que sugiere tu solicitud' };
const COLUMNA_VALOR = { personal: 'Según tu solicitud', insumos: 'Zonas', equipos: 'Según tu solicitud' };

/** Pasos 2 a 4 (personal, insumos, equipos): qué incluye, lo que ya sabemos y lo que pide el pliego. */
function PasoIncluye({ paso }) {
  const { ficha, setVista } = useSolicitud();
  const datos = datosDeLaFicha(paso.id, ficha);

  return (
    <div className="ficha">
      <section className="ficha__seccion">
        <h3>Qué incluye</h3>
        <ul className="ficha__lista ficha__vinetas">
          {paso.incluye.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      {ficha ? (
        datos.length > 0 && (
          <section className="ficha__seccion">
            <h3>{TITULO_DATOS[paso.id]}</h3>
            <Tabla
              columnas={[
                { clave: 'dato', titulo: paso.id === 'insumos' ? 'Protocolo' : 'Dato' },
                { clave: 'valor', titulo: COLUMNA_VALOR[paso.id] }
              ]}
              filas={datos.map((d) => ({ ...d, dato: <strong>{d.dato}</strong> }))}
            />
          </section>
        )
      ) : (
        <Aviso
          tono="info"
          titulo="Aún no tenemos los datos de tu lugar"
          acciones={
            <Boton variante="secundario" href={rutaModulo('visita')} onClick={() => setVista('formulario')}>
              Ir a tu solicitud
            </Boton>
          }
        >
          Cuando llenes tu solicitud verás aquí lo que aplica a tu lugar.
        </Aviso>
      )}

      <RequisitosModulo modulo={paso.id} paraCliente />

      <Aviso tono="info" titulo="Lo confirmamos en la visita técnica">
        Las cantidades exactas se definen con las medidas reales de tu lugar. El precio llega en la propuesta formal, después de la visita.
      </Aviso>
    </div>
  );
}

/** Paso 6: en qué etapa está la solicitud y qué sigue. */
function EstadoSolicitud() {
  const { ficha } = useSolicitud();
  const etapas = [
    {
      id: 'solicitud',
      etapa: 'Tu solicitud',
      estado: ficha ? <Insignia tono="ok">Enviada</Insignia> : <Insignia tono="aviso">Por completar</Insignia>,
      detalle: ficha ? 'Recibimos los datos de tu lugar.' : 'Llena el formulario y, si tienes, sube tu pliego.'
    },
    {
      id: 'ficha',
      etapa: 'Ficha de visita',
      estado: !ficha ? <Insignia>Pendiente</Insignia> : ficha.listoParaVisita ? <Insignia tono="ok">Lista</Insignia> : <Insignia tono="aviso">Faltan datos</Insignia>,
      detalle: ficha?.listoParaVisita ? 'Ya podemos agendar la visita.' : 'Necesitamos el tipo de lugar, la dirección y un contacto.'
    },
    { id: 'visita', etapa: 'Visita técnica', estado: <Insignia>Por agendar</Insignia>, detalle: 'Un técnico mide cada zona y confirma horarios y requisitos.' },
    { id: 'final', etapa: 'Cotización', estado: <Insignia>Después de la visita</Insignia>, detalle: 'El precio se calcula con las medidas reales de tu lugar.' },
    { id: 'propuesta', etapa: 'Propuesta formal', estado: <Insignia>Después de la visita</Insignia>, detalle: 'Te la enviamos con el precio, para tu aprobación.' }
  ];

  return (
    <div className="ficha">
      <Tabla
        columnas={[
          { clave: 'etapa', titulo: 'Etapa' },
          { clave: 'estado', titulo: 'Estado' },
          { clave: 'detalle', titulo: 'Qué significa' }
        ]}
        filas={etapas.map((e) => ({ ...e, etapa: <strong>{e.etapa}</strong>, detalle: <span className="texto-suave">{e.detalle}</span> }))}
      />
      <Contactanos />
    </div>
  );
}

export default function PasoCliente({ paso }) {
  if (paso.id === 'requisitos') return <PasoRequisitos paraCliente />;
  if (paso.id === 'propuesta') return <EstadoSolicitud />;
  return <PasoIncluye paso={paso} />;
}
