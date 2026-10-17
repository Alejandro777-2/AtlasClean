/**
 * Registro detallado del formulario del cliente. Se abre en una ventana nueva (#/app/registro)
 * y se actualiza solo cuando se edita el formulario en la otra ventana.
 */
import { Aviso, Boton, Insignia, Tabla } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { aSolicitud } from '../formulario/solicitud.js';
import { armarRegistro } from '../formulario/registro.js';

const ESTADO = {
  listo: { tono: 'ok', texto: 'Listo' },
  documento: { tono: 'info', texto: 'Del documento' },
  falta: { tono: 'error', texto: 'Falta' },
  sin_dato: { tono: 'neutro', texto: 'Sin dato' }
};

const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Vuelve a la ventana del formulario si sigue abierta; si no, navega aquí mismo. */
function irAlFormulario(setVista) {
  setVista('formulario');
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.location.hash = '#/app/visita';
      window.opener.focus();
      return;
    }
  } catch {
    /* la otra ventana no es accesible: se navega en esta */
  }
  window.location.hash = '#/app/visita';
}

export default function RegistroFormulario() {
  const { formulario, documento, ficha, meta, setVista, desdeDocumento } = useSolicitud();
  const r = armarRegistro(formulario, desdeDocumento);

  return (
    <div className="registro">
      <div className="registro__acciones">
        <Boton variante="secundario" onClick={() => irAlFormulario(setVista)}>
          Editar el formulario
        </Boton>
        <Boton variante="primario" onClick={() => window.print()}>
          Imprimir registro
        </Boton>
      </div>

      {r.delDocumento > 0 && (
        <Aviso tono="info" titulo={`${r.delDocumento} dato${r.delDocumento === 1 ? '' : 's'} se tomaron del documento del cliente`}>
          Están marcados como «Del documento», con su página. Confírmalos en la visita.
        </Aviso>
      )}

      {r.completo ? (
        <Aviso tono="ok" titulo="Formulario completo">
          Tiene todos los datos obligatorios para generar la ficha de visita.
        </Aviso>
      ) : (
        <Aviso tono="aviso" titulo={`Faltan ${r.faltan} dato${r.faltan === 1 ? '' : 's'} obligatorio${r.faltan === 1 ? '' : 's'}`}>
          Están marcados como «Falta» en las tablas. Complétalos en el formulario.
        </Aviso>
      )}

      {r.bloques.map((b, i) => (
        <section key={b.id} className="panel registro__bloque">
          <h2>
            <span className="bloque__num">{i + 1}</span> {b.titulo}
          </h2>
          <Tabla
            columnas={[
              { clave: 'dato', titulo: 'Dato' },
              { clave: 'valor', titulo: 'Valor registrado' },
              { clave: 'estado', titulo: 'Estado' }
            ]}
            filas={b.filas.map((f) => ({
              id: f.id,
              dato: (
                <>
                  <strong>{f.dato}</strong>
                  {!f.requerido && <span className="texto-suave"> (opcional)</span>}
                </>
              ),
              valor: f.valor ? <span className="registro__valor">{f.valor}</span> : <span className="texto-suave">{f.mensaje ?? '—'}</span>,
              estado: (
                <Insignia tono={ESTADO[f.estado].tono}>
                  {ESTADO[f.estado].texto}
                  {f.estado === 'documento' && f.pagina ? ` · pág. ${f.pagina}` : ''}
                </Insignia>
              )
            }))}
          />
        </section>
      ))}

      <section className="panel registro__bloque">
        <h2>
          <span className="bloque__num">{r.bloques.length + 1}</span> Documento y ficha
        </h2>
        <Tabla
          columnas={[
            { clave: 'dato', titulo: 'Dato' },
            { clave: 'valor', titulo: 'Valor registrado' },
            { clave: 'estado', titulo: 'Estado' }
          ]}
          filas={[
            {
              id: 'documento',
              dato: <strong>Pliego o requerimiento</strong>,
              valor: documento ? `${documento.nombre}${documento.tamano ? ` · ${kb(documento.tamano)}` : ''}` : <span className="texto-suave">Sin documento</span>,
              estado: documento ? <Insignia tono={documento.base64 || meta?.conDocumento ? 'ok' : 'aviso'}>{documento.base64 || meta?.conDocumento ? 'Adjunto' : 'Volver a adjuntar'}</Insignia> : <Insignia>Opcional</Insignia>
            },
            {
              id: 'ficha',
              dato: <strong>Ficha de visita</strong>,
              valor: ficha ? `${meta?.origen === 'ia' ? `Generada con IA (${meta.modelo})` : 'Generada en modo demostración'}${meta?.generada ? ` · ${new Date(meta.generada).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}` : <span className="texto-suave">Aún no generada</span>,
              estado: ficha ? <Insignia tono={ficha.listoParaVisita ? 'ok' : 'aviso'}>{ficha.listoParaVisita ? 'Lista' : 'Faltan datos'}</Insignia> : <Insignia>Pendiente</Insignia>
            }
          ]}
        />
      </section>

      <details className="panel registro__tecnico">
        <summary>Datos que recibe el asistente (JSON)</summary>
        <pre>{JSON.stringify(aSolicitud(formulario), null, 2)}</pre>
      </details>
    </div>
  );
}
