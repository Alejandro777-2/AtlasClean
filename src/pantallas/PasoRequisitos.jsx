/**
 * Paso 1 de la cotización. Parte de la ficha del Asistente de visita (supuestos a confirmar);
 * las medidas reales del técnico se cargarán aquí más adelante.
 */
import { Aviso, Boton, Insignia, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { ETIQUETAS } from '../config/opciones.js';
import { CeldaZona } from './FichaVisita.jsx';
import { m2Zona } from '../formulario/fichaUtil.js';

const TONO_RIESGO = (r) => (r >= 5 ? 'error' : r >= 3 ? 'aviso' : 'info');

export default function PasoRequisitos() {
  const { ficha, setVista } = useSolicitud();
  const abrir = (vista) => () => setVista(vista);

  if (!ficha) {
    return (
      <Aviso
        tono="info"
        titulo="Primero prepara la visita"
        acciones={
          <Boton variante="primario" href="#/app/visita" onClick={abrir('formulario')}>
            Ir al asistente de visita
          </Boton>
        }
      >
        Llena el formulario del cliente en el Asistente de visita. La ficha que genera es el punto de partida de este paso.
      </Aviso>
    );
  }

  const c = ficha.configuracionInicial;
  return (
    <div className="ficha">
      <Aviso
        tono="aviso"
        titulo="Punto de partida: supuestos de la ficha de visita"
        acciones={
          <Boton variante="secundario" href="#/app/visita" onClick={abrir('ficha')}>
            Ver la ficha completa
          </Boton>
        }
      >
        Se confirman con las medidas reales que tome el técnico en el sitio.
      </Aviso>
      <Tabla
        columnas={[
          { clave: 'area', titulo: 'Zona' },
          { clave: 'm2', titulo: 'm²', numerica: true },
          { clave: 'riesgo', titulo: 'Riesgo' },
          { clave: 'trafico', titulo: 'Tráfico' },
          { clave: 'protocolo', titulo: 'Protocolo' }
        ]}
        filas={c.zonasPropuestas.map((z, i) => ({
          id: `${z.area}-${i}`,
          area: <CeldaZona zona={z} />,
          m2: m2Zona(z),
          riesgo: <Insignia tono={TONO_RIESGO(z.riesgo)}>Nivel {z.riesgo}</Insignia>,
          trafico: ETIQUETAS.trafico[z.trafico] ?? z.trafico,
          protocolo: ETIQUETAS.protocolo[z.protocolo] ?? z.protocolo
        }))}
        vacio="La ficha no propuso zonas."
      />
    </div>
  );
}
