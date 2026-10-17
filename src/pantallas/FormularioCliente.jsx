/**
 * Formulario previo a la visita: lo llena el cliente (o quien lo atiende) con datos aproximados.
 * Con él, el Asistente de Visita genera la ficha para el técnico que irá al sitio.
 */
import { useState } from 'react';
import { Aviso, Boton, Campo, Insignia, Opciones } from '../components/ui.jsx';
import { useSolicitud } from '../estado/contexto.js';
import { validarFormulario } from '../formulario/solicitud.js';
import { CAMPOS_DESDE_DOCUMENTO } from '../formulario/desdeDocumento.js';
import { AFLUENCIAS, AREAS, DOCUMENTO, FRECUENCIAS, HORARIOS, NIVELES_LIMPIEZA, RANGOS_TAMANO, SI_NO, TIPOLOGIAS, TIPOS_CLIENTE } from '../config/opciones.js';

const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function EstadoIa() {
  const { ia } = useSolicitud();
  if (ia.cargando) return <Insignia>Comprobando IA…</Insignia>;
  if (ia.sinServidor) return <Insignia tono="error">Sin servidor local</Insignia>;
  return ia.configurado ? <Insignia tono="ok">IA conectada · {ia.modelo}</Insignia> : <Insignia tono="aviso">Modo demostración (sin clave de IA)</Insignia>;
}

export default function FormularioCliente() {
  const { desdeDocumento, formulario: f, cambiar, documento, adjuntarDocumento, quitarDocumento, generarFicha, estado, error, ficha, setVista, reiniciar, ia, leyendoPliego } = useSolicitud();
  const [errores, setErrores] = useState({});
  const [errorDocumento, setErrorDocumento] = useState(null);
  const generando = estado === 'generando';

  const texto = (campo) => ({ value: f[campo], onChange: (e) => cambiar(campo, e.target.value) });
  const err = (campo) => errores[campo];

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validarFormulario(f);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      requestAnimationFrame(() => document.querySelector('.formulario [aria-invalid="true"], .formulario .campo__error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    await generarFicha();
  };

  const alElegirArchivo = async (e) => {
    const mensaje = await adjuntarDocumento(e.target.files[0]);
    setErrorDocumento(mensaje);
    e.target.value = '';
  };

  const cantidadErrores = Object.keys(errores).length;

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="formulario__cabecera">
        <p className="texto-suave">Las medidas reales se toman en el sitio: aquí bastan datos aproximados.</p>
        <EstadoIa />
      </div>

      {leyendoPliego && documento && (
        <Aviso tono="info" titulo={`Leyendo tu pliego: ${documento.nombre}`}>
          {ia.configurado ? 'La IA está buscando los datos de tu lugar en el documento. Puede tardar uno o dos minutos.' : 'Preparando tu solicitud con el documento…'} Los campos que encuentre se llenarán solos; mientras tanto puedes ir completando el resto.
        </Aviso>
      )}

      {desdeDocumento.length > 0 && (
        <Aviso tono="ok" titulo={`${desdeDocumento.length} dato${desdeDocumento.length === 1 ? '' : 's'} de este formulario se llenaron con el documento`}>
          {desdeDocumento.map((d) => CAMPOS_DESDE_DOCUMENTO[d.campo]?.etiqueta ?? d.campo).join(' · ')}. Revísalos; si corriges uno, deja de marcarse como «del documento».
        </Aviso>
      )}

      {cantidadErrores > 0 && (
        <Aviso tono="error" titulo={`Revisa ${cantidadErrores} campo${cantidadErrores === 1 ? '' : 's'} antes de generar la ficha`}>
          Los campos marcados en rojo están incompletos o tienen un formato incorrecto.
        </Aviso>
      )}

      <fieldset className="bloque">
        <legend className="bloque__titulo">
          <span className="bloque__num">1</span> Cliente
        </legend>
        <div className="bloque__rejilla">
          <Campo etiqueta="Empresa o entidad" error={err('empresa')}>
            {(id, a) => <input id={id} className="entrada" autoComplete="organization" {...texto('empresa')} {...a} />}
          </Campo>
          <Campo etiqueta="Persona de contacto" opcional>
            {(id) => <input id={id} className="entrada" autoComplete="name" {...texto('contactoNombre')} />}
          </Campo>
          <Campo etiqueta="Teléfono" error={err('telefono')} ayuda="Teléfono o correo: al menos uno.">
            {(id, a) => <input id={id} className="entrada" type="tel" autoComplete="tel" {...texto('telefono')} {...a} />}
          </Campo>
          <Campo etiqueta="Correo" error={err('correo')}>
            {(id, a) => <input id={id} className="entrada" type="email" autoComplete="email" {...texto('correo')} {...a} />}
          </Campo>
        </div>
        <Opciones etiqueta="Tipo de cliente" opciones={TIPOS_CLIENTE} valor={f.tipoCliente} alCambiar={(v) => cambiar('tipoCliente', v)} ayuda="Cambia las reglas del precio: el sector público tiene presupuesto referencial o precio de catálogo." />
      </fieldset>

      <fieldset className="bloque">
        <legend className="bloque__titulo">
          <span className="bloque__num">2</span> Lugar
        </legend>
        <div className="bloque__rejilla">
          <Campo etiqueta="Dirección" error={err('direccion')}>
            {(id, a) => <input id={id} className="entrada" autoComplete="street-address" {...texto('direccion')} {...a} />}
          </Campo>
          <Campo etiqueta="Ciudad" opcional>
            {(id) => <input id={id} className="entrada" autoComplete="address-level2" {...texto('ciudad')} />}
          </Campo>
          <Campo etiqueta="Tipo de lugar" error={err('tipologia')}>
            {(id, a) => (
              <select id={id} className="entrada" {...texto('tipologia')} {...a}>
                <option value="">Elige una opción</option>
                {TIPOLOGIAS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          {f.tipologia === 'otro' ? (
            <Campo etiqueta="¿Qué tipo de lugar es?" error={err('tipologiaOtro')}>
              {(id, a) => <input id={id} className="entrada" {...texto('tipologiaOtro')} {...a} />}
            </Campo>
          ) : (
            <span aria-hidden="true" />
          )}
          <Campo etiqueta="Metros cuadrados" error={err('m2')} ayuda="Si no los sabe, elija un rango.">
            {(id, a) => <input id={id} className="entrada" type="number" min="1" inputMode="numeric" {...texto('m2')} {...a} />}
          </Campo>
          <Campo etiqueta="Rango aproximado" opcional>
            {(id) => (
              <select id={id} className="entrada" {...texto('rango')}>
                <option value="">Sin rango</option>
                {RANGOS_TAMANO.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.etiqueta}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo etiqueta="Número de pisos" opcional error={err('pisos')}>
            {(id, a) => <input id={id} className="entrada" type="number" min="0" inputMode="numeric" {...texto('pisos')} {...a} />}
          </Campo>
          <Campo etiqueta="Número de baños" opcional error={err('banos')}>
            {(id, a) => <input id={id} className="entrada" type="number" min="0" inputMode="numeric" {...texto('banos')} {...a} />}
          </Campo>
        </div>
        <Opciones etiqueta="¿Qué áreas tiene?" multiple opciones={AREAS} valor={f.areas} alCambiar={(v) => cambiar('areas', v)} error={err('areas')} />
        <Opciones etiqueta="Afluencia de personas" opciones={AFLUENCIAS} valor={f.afluencia} alCambiar={(v) => cambiar('afluencia', v)} />
      </fieldset>

      <fieldset className="bloque">
        <legend className="bloque__titulo">
          <span className="bloque__num">3</span> Servicio
        </legend>
        <Opciones etiqueta="Horario del servicio" multiple opciones={HORARIOS} valor={f.horario} alCambiar={(v) => cambiar('horario', v)} error={err('horario')} />
        <Opciones etiqueta="Frecuencia de limpieza" opciones={FRECUENCIAS} valor={f.frecuencia} alCambiar={(v) => cambiar('frecuencia', v)} error={err('frecuencia')} />
        <Opciones etiqueta="Nivel de limpieza que espera" opciones={NIVELES_LIMPIEZA} valor={f.nivelLimpieza} alCambiar={(v) => cambiar('nivelLimpieza', v)} error={err('nivelLimpieza')} />
        <div className="bloque__rejilla">
          <Opciones etiqueta="¿Tiene maquinaria propia?" opciones={SI_NO} valor={f.maquinariaPropia} alCambiar={(v) => cambiar('maquinariaPropia', v)} />
          <Opciones etiqueta="¿Aporta sus propios insumos?" opciones={SI_NO} valor={f.insumosPropios} alCambiar={(v) => cambiar('insumosPropios', v)} />
        </div>
      </fieldset>

      <fieldset className="bloque">
        <legend className="bloque__titulo">
          <span className="bloque__num">4</span> Documento y comentarios
        </legend>
        <div className="bloque__rejilla">
          <div className="campo">
            <span className="campo__etiqueta">
              Pliego o requerimiento <span className="campo__opcional">(opcional)</span>
            </span>
            {documento ? (
              <div className="documento">
                <div>
                  <strong>{documento.nombre}</strong>
                  <span className="texto-suave">{documento.base64 ? kb(documento.tamano) : 'Vuelve a adjuntarlo: el contenido no se guarda al recargar.'}</span>
                </div>
                <Boton variante="fantasma" onClick={quitarDocumento}>
                  Quitar
                </Boton>
              </div>
            ) : (
              <label className="subida subida--compacta">
                <input type="file" className="visualmente-oculto" accept={DOCUMENTO.tiposAceptados} onChange={alElegirArchivo} />
                <strong>Elige un archivo</strong>
                <span className="texto-suave">PDF o texto, hasta {DOCUMENTO.limiteMb} MB. La IA lo lee junto con el formulario.</span>
              </label>
            )}
            {errorDocumento && <span className="campo__error">{errorDocumento}</span>}
          </div>
          <Campo etiqueta="Comentarios o requisitos especiales" opcional ayuda="Ej.: personal mínimo, certificaciones, horarios en que no se puede limpiar.">
            {(id) => <textarea id={id} className="entrada" rows={4} {...texto('comentarios')} />}
          </Campo>
        </div>
      </fieldset>

      {estado === 'error' && (
        <Aviso
          tono="error"
          titulo="No se pudo generar la ficha"
          acciones={
            <>
              <Boton variante="secundario" onClick={() => generarFicha()}>
                Reintentar
              </Boton>
              <Boton variante="secundario" onClick={() => generarFicha({ modo: 'demo' })}>
                Generar en modo demostración
              </Boton>
            </>
          }
        >
          {error}
        </Aviso>
      )}

      <div className="formulario__acciones">
        <Boton variante="primario" type="submit" disabled={generando}>
          {generando ? 'Generando ficha…' : ia.configurado ? 'Generar ficha con IA' : 'Generar ficha de visita'}
        </Boton>
        {ficha && (
          <Boton variante="secundario" onClick={() => setVista('ficha')} disabled={generando}>
            Ver la última ficha
          </Boton>
        )}
        <Boton
          variante="fantasma"
          onClick={() => {
            reiniciar();
            setErrores({});
            setErrorDocumento(null);
          }}
          disabled={generando}
        >
          Limpiar formulario
        </Boton>
        <span className="texto-suave formulario__estado" aria-live="polite">
          {generando ? (ia.configurado ? 'La IA está leyendo la solicitud y el documento. Puede tardar uno o dos minutos.' : 'Generando la ficha…') : ''}
        </span>
      </div>
    </form>
  );
}
