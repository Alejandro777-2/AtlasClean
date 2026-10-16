import { useEffect, useState, useMemo } from 'react';
import { Insignia, AtlasLogo, TarjetaKpi, Campo, Boton } from '../components/ui.jsx';
import { PASOS } from '../pasos.js';
import AsistenteIA from '../components/AsistenteIA.jsx';
import {
  CATALOGO_INFRAESTRUCTURA,
  NIVELES_RIESGO,
  NIVELES_TRAFICO,
  SUPERFICIES_DISPONIBLES,
  NORMATIVAS_DISPONIBLES,
  TIPOS_LIMPIEZA,
  TURNOS_DISPONIBLES,
  FRECUENCIAS_DISPONIBLES,
  CATALOGO_MAQUINARIA,
  COSTOS_PERSONAL_BASE
} from '../config/negocio.js';
import { calcularCostosLevantamiento } from '../utils/motorCostos.js';

export default function Plataforma({ pasoId, sesion, alCerrarSesion }) {
  const indice = Math.max(0, PASOS.findIndex((p) => p.id === pasoId));
  const paso = PASOS[indice];

  // Estado del Levantamiento - Inicia 100% en blanco para que el usuario llene todo desde cero
  const ESTADO_INICIAL_EN_BLANCO = {
    cliente: '',
    ruc: '',
    ciudad: '',
    sector: '',
    direccion: '',
    m2_total: '',
    m2_cubierta: '',
    m2_exterior: '',
    tipo_infraestructura: '',
    areas_licencia: [],
    riesgo_sanitario: '',
    trafico_peatonal: '',
    superficies: [],
    tipo_limpieza: '',
    normativa: '',
    frecuencia: '',
    turnos: '',
    horario: '',
    operarios: 0,
    especialistas: 0,
    supervisores: 0,
    maquinaria: [],
    margen_rentabilidad: 20.0,
    recomendaciones_ia_resumen: ''
  };

  const [formulario, setFormulario] = useState(() => ({ ...ESTADO_INICIAL_EN_BLANCO }));

  const [guardandoExcel, setGuardandoExcel] = useState(false);
  const [mensajeExcel, setMensajeExcel] = useState(null);
  const [historialCotizaciones, setHistorialCotizaciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [fechaHoy] = useState(() => new Date().toLocaleDateString());

  const cargarHistorialExcel = async () => {
    setCargandoHistorial(true);
    try {
      const resp = await fetch('/api/listar-cotizaciones');
      if (resp.ok) {
        const data = await resp.json();
        setHistorialCotizaciones(data.registros || []);
      }
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [paso.id]);

  useEffect(() => {
    let cancelado = false;
    if (paso.id === 'propuesta') {
      fetch('/api/listar-cotizaciones')
        .then((r) => r.json())
        .then((data) => {
          if (!cancelado && data.registros) {
            setHistorialCotizaciones(data.registros);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelado = true;
    };
  }, [paso.id]);

  // Cálculo en tiempo real de todos los costos
  const calculos = useMemo(() => calcularCostosLevantamiento(formulario), [formulario]);

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const aplicarRecomendacionesIA = (datosIA) => {
    setFormulario((prev) => ({
      ...prev,
      ...datosIA,
      recomendaciones_ia_resumen: datosIA.recomendaciones_ia?.resumen_ejecutivo || ''
    }));
    setMensajeExcel({
      tipo: 'ok',
      texto: '✓ Recomendaciones de la IA aplicadas exitosamente al formulario.'
    });
  };

  const toggleArrayItem = (campo, item) => {
    setFormulario((prev) => {
      const arr = Array.isArray(prev[campo]) ? [...prev[campo]] : [];
      const idx = arr.indexOf(item);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(item);
      return { ...prev, [campo]: arr };
    });
  };

  const limpiarFormulario = () => {
    sessionStorage.removeItem('atlas_datos_ia_precargados');
    sessionStorage.removeItem('atlas_borrador_inicial');
    setFormulario({ ...ESTADO_INICIAL_EN_BLANCO });
    setMensajeExcel({
      tipo: 'ok',
      texto: 'Formulario limpiado. Todos los campos están en blanco para que los llenes desde cero.'
    });
  };

  // Buscar áreas según la tipología seleccionada
  const tipologiaActual = CATALOGO_INFRAESTRUCTURA.find(
    (t) => t.nombre === formulario.tipo_infraestructura
  ) || null;

  // Acciones con Excel Backend
  const guardarEnExcel = async () => {
    setGuardandoExcel(true);
    setMensajeExcel(null);
    try {
      const payload = {
        cliente: formulario.cliente,
        ruc: formulario.ruc,
        ciudad: formulario.ciudad,
        sector: formulario.sector,
        direccion: formulario.direccion,
        m2_total: calculos.m2Total,
        m2_cubierta: parseFloat(formulario.m2_cubierta) || 0,
        m2_exterior: parseFloat(formulario.m2_exterior) || 0,
        tipo_infraestructura: formulario.tipo_infraestructura,
        areas_licencia: formulario.areas_licencia,
        riesgo_sanitario: formulario.riesgo_sanitario,
        trafico_peatonal: formulario.trafico_peatonal,
        superficies: formulario.superficies,
        tipo_limpieza: formulario.tipo_limpieza,
        normativa: formulario.normativa,
        frecuencia: formulario.frecuencia,
        turnos: formulario.turnos,
        horario: formulario.horario,
        operarios: formulario.operarios,
        especialistas: formulario.especialistas,
        supervisores: formulario.supervisores,
        maquinaria: formulario.maquinaria,
        costo_mano_obra: calculos.costoManoObra,
        costo_insumos: calculos.costoInsumos,
        costo_maquinaria: calculos.costoMaquinaria,
        costo_directo_total: calculos.costoDirectoTotal,
        margen_rentabilidad: calculos.margenPct,
        precio_oferta_final: calculos.precioOfertaFinal,
        costo_unitario_m2: calculos.costoUnitarioM2,
        recomendaciones_ia_resumen: formulario.recomendaciones_ia_resumen || ''
      };

      const resp = await fetch('/api/guardar-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error('Error al guardar en el servidor');
      const data = await resp.json();
      setMensajeExcel({
        tipo: 'ok',
        texto: `✓ Registro ${data.id_cotizacion} guardado exitosamente en base_datos_levantamientos.xlsx (Total: ${data.total_registros} registros)`
      });
      cargarHistorialExcel();
    } catch (err) {
      console.error(err);
      setMensajeExcel({
        tipo: 'error',
        texto: `Error al guardar en Excel: ${err.message}`
      });
    } finally {
      setGuardandoExcel(false);
    }
  };

  const descargarExcel = () => {
    window.location.href = '/api/descargar-excel';
  };

  const abrirExcelLocal = async () => {
    try {
      const resp = await fetch('/api/abrir-excel', { method: 'POST' });
      const data = await resp.json();
      setMensajeExcel({
        tipo: data.exito ? 'ok' : 'error',
        texto: data.mensaje
      });
    } catch (e) {
      console.error(e);
      descargarExcel();
    }
  };

  return (
    <div className="plataforma">
      {/* Barra Lateral Marino (256px fijo) */}
      <aside className="lateral">
        <a href="#/" className="lateral__marca" aria-label="Atlas, volver a la portada">
          <AtlasLogo height={32} />
        </a>
        <nav aria-label="Pasos de la cotización">
          <p className="lateral__rotulo">Cotización Reto 2</p>
          <ol className="lateral__pasos">
            {PASOS.map((p, i) => (
              <li key={p.id}>
                <a
                  href={`#/app/${p.id}`}
                  className="lateral__paso"
                  aria-current={p.id === paso.id ? 'page' : undefined}
                >
                  <span className="lateral__num">{i + 1}</span>
                  {p.nombre}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 8px', fontSize: '12px', color: 'var(--texto-sobre-marino-suave)' }}>
            Usuario: <strong>{sesion?.usuario || 'admin@expoclean.com'}</strong>
          </div>
          <button
            type="button"
            onClick={alCerrarSesion}
            className="lateral__volver"
            style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}
          >
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra Superior Blanca */}
      <header className="superior">
        <div>
          <p className="antetitulo">
            Paso {indice + 1} de {PASOS.length} · Reto 2 Expo Clean
          </p>
          <h1>{paso.nombre}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={limpiarFormulario}
            className="boton boton--secundario boton--pequeno"
            title="Limpiar todos los campos para llenar desde cero"
          >
            🗑️ Limpiar Todo
          </button>
          <Boton variante="secundario" onClick={descargarExcel} className="boton--pequeno">
            📥 Descargar Excel
          </Boton>
          <Boton variante="destacado" onClick={abrirExcelLocal} className="boton--pequeno">
            🖥️ Abrir Excel en Vivo
          </Boton>
          <Insignia tono="ok">Sistema Dinámico Activo</Insignia>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="contenido">
        {/* Banner de notificación Excel / IA */}
        {mensajeExcel && (
          <div className={mensajeExcel.tipo === 'ok' ? 'banner-exito' : 'alerta-error'}>
            <span>{mensajeExcel.texto}</span>
            <button
              type="button"
              onClick={() => setMensajeExcel(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Fila de 6 Tarjetas KPI Dinámicas en Tiempo Real */}
        <div className="kpis">
          <TarjetaKpi
            etiqueta="1. Metraje y Riesgo"
            valor={calculos.m2Total > 0 ? `${calculos.m2Total.toLocaleString()} m²` : '—'}
            detalle={formulario.riesgo_sanitario ? `Riesgo ${formulario.riesgo_sanitario}` : 'Sin ingresar'}
            variante={paso.id === 'requisitos' ? 'destacada' : undefined}
          />
          <TarjetaKpi
            etiqueta="2. Dotación Personal"
            valor={(formulario.operarios + formulario.especialistas + formulario.supervisores > 0) ? `${formulario.operarios + formulario.especialistas + formulario.supervisores} pers.` : '—'}
            detalle={calculos.costoManoObra > 0 ? `Mano Obra: $${calculos.costoManoObra.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Sin asignar'}
            variante={paso.id === 'personal' ? 'destacada' : undefined}
          />
          <TarjetaKpi
            etiqueta="3. Insumos Químicos"
            valor={calculos.costoInsumos > 0 ? `$${calculos.costoInsumos.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            detalle={formulario.riesgo_sanitario ? `Paño ${calculos.riesgoInfo.colorPano}` : 'Sin calcular'}
            variante={paso.id === 'insumos' ? 'destacada' : undefined}
          />
          <TarjetaKpi
            etiqueta="4. Maquinaria"
            valor={calculos.costoMaquinaria > 0 ? `$${calculos.costoMaquinaria.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            detalle={formulario.maquinaria?.length ? `${formulario.maquinaria.length} equipos esp.` : 'Sin equipos'}
            variante={paso.id === 'equipos' ? 'destacada' : undefined}
          />
          <TarjetaKpi
            etiqueta="5. Costo Directo Total"
            valor={calculos.costoDirectoTotal > 0 ? `$${calculos.costoDirectoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            detalle={calculos.costoDirectoTotal > 0 ? `Margen: ${calculos.margenPct}%` : 'Sin costos'}
            variante={paso.id === 'costos' ? 'destacada' : undefined}
          />
          <TarjetaKpi
            etiqueta="6. Precio Oferta / m²"
            valor={calculos.precioOfertaFinal > 0 ? `$${calculos.precioOfertaFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            detalle={calculos.costoUnitarioM2 > 0 ? `$${calculos.costoUnitarioM2.toFixed(3)} / m²` : 'Sin calcular'}
            variante="oscura"
          />
        </div>

        {/* ========================================================
            PASO 1: REQUISITOS (Core del Reto 2 y Asistente IA)
           ======================================================== */}
        {paso.id === 'requisitos' && (
          <div className="formulario-bloques">
            {/* Módulo Asistente IA con lectura de documentos */}
            <AsistenteIA alAplicarRecomendacion={aplicarRecomendacionesIA} />

            {/* A. Datos del Cliente y Ubicación */}
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>A. Datos del Cliente y Ubicación Geográfica</h3>
                <Insignia tono="info">Identificación & Costos Logísticos</Insignia>
              </div>
              <div className="form-grid-3">
                <Campo etiqueta="Razón Social / Nombre del Cliente">
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.cliente}
                      onChange={(e) => actualizarCampo('cliente', e.target.value)}
                      placeholder="Ej. Clínica Santa Inés / Banco Central"
                      required
                    />
                  )}
                </Campo>
                <Campo etiqueta="RUC del Cliente (Ecuador)">
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.ruc}
                      onChange={(e) => actualizarCampo('ruc', e.target.value)}
                      placeholder="Ej. 1790012458001"
                    />
                  )}
                </Campo>
                <Campo etiqueta="Ciudad">
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.ciudad}
                      onChange={(e) => actualizarCampo('ciudad', e.target.value)}
                      placeholder="Ej. Quito / Guayaquil / Cuenca"
                    />
                  )}
                </Campo>
              </div>
              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <Campo etiqueta="Sector / Zona Geográfica">
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.sector}
                      onChange={(e) => actualizarCampo('sector', e.target.value)}
                      placeholder="Ej. Norte / Sur / Valle de los Chillos"
                    />
                  )}
                </Campo>
                <Campo etiqueta="Dirección Exacta (Influye en ruta y supervisión)">
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.direccion}
                      onChange={(e) => actualizarCampo('direccion', e.target.value)}
                      placeholder="Ej. Av. Naciones Unidas y Shyris"
                    />
                  )}
                </Campo>
              </div>
            </section>

            {/* B. Variables de Infraestructura y Riesgo (Core del Reto 2) */}
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>B. Variables de Infraestructura y Riesgo (Core Reto 2)</h3>
                <Insignia tono="aviso">Cálculo Diferenciado</Insignia>
              </div>

              {/* Metraje Total, Cubierta y Exterior */}
              <div className="form-grid-3">
                <Campo etiqueta="Metraje Total (m²)" ayuda="Área total a intervenir">
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      className="entrada"
                      value={formulario.m2_total}
                      onChange={(e) => actualizarCampo('m2_total', e.target.value)}
                      placeholder="Ej. 1500"
                      min="1"
                    />
                  )}
                </Campo>
                <Campo etiqueta="Área Cubierta (m²)" ayuda="Interiores, pisos y salas">
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      className="entrada"
                      value={formulario.m2_cubierta}
                      onChange={(e) => actualizarCampo('m2_cubierta', e.target.value)}
                      placeholder="Ej. 1000"
                    />
                  )}
                </Campo>
                <Campo etiqueta="Área Exterior (m²)" ayuda="Patios, accesos y veredas">
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      className="entrada"
                      value={formulario.m2_exterior}
                      onChange={(e) => actualizarCampo('m2_exterior', e.target.value)}
                      placeholder="Ej. 500"
                    />
                  )}
                </Campo>
              </div>

              {/* Tipología de Infraestructura */}
              <div style={{ marginTop: '16px' }}>
                <Campo etiqueta="Tipología de Infraestructura" ayuda="Selecciona el sector para habilitar las áreas con requerimiento de licencia">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.tipo_infraestructura}
                      onChange={(e) => {
                        actualizarCampo('tipo_infraestructura', e.target.value);
                      }}
                    >
                      <option value="">-- Elige una tipología de infraestructura --</option>
                      {CATALOGO_INFRAESTRUCTURA.map((t) => (
                        <option key={t.id} value={t.nombre}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
              </div>

              {/* Áreas específicas con Licencia / Acreditación */}
              <div className="areas-licencia-caja">
                {tipologiaActual ? (
                  <>
                    <strong style={{ fontSize: '13px' }}>
                      Áreas críticas que requieren Licencia / Acreditación específica ({tipologiaActual.nombre}):
                    </strong>
                    <p className="texto-suave" style={{ fontSize: '12px', margin: '4px 0 8px' }}>
                      Marca las áreas intervenibles que exigen protocolos especiales (ej. ARCSA, BPM, trabajo en alturas, trampas de grasa).
                    </p>
                    <div className="areas-licencia-lista">
                      {tipologiaActual.areasLicencia.map((area, i) => (
                        <label key={i} className="checkbox-licencia">
                          <input
                            type="checkbox"
                            checked={formulario.areas_licencia?.includes(area)}
                            onChange={() => toggleArrayItem('areas_licencia', area)}
                          />
                          <span>{area}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="texto-suave" style={{ fontSize: '13px', margin: 0, textAlign: 'center', padding: '8px 0' }}>
                    Selecciona una tipología de infraestructura arriba para ver las áreas que requieren licencia o acreditación.
                  </p>
                )}
              </div>

              {/* Nivel de Riesgo Sanitario / Microbiológico */}
              <div style={{ marginTop: '20px' }}>
                <label className="campo__etiqueta">
                  Nivel de Riesgo Sanitario / Microbiológico (Exigencia Reto 2)
                </label>
                <p className="texto-suave" style={{ fontSize: '12px', marginBottom: '8px' }}>
                  Define la rigurosidad química, el código de color de paño y el factor de insumo $/m².
                </p>
                <div className="selector-riesgo-grid">
                  {Object.entries(NIVELES_RIESGO).map(([clave, nivel]) => {
                    const activa = formulario.riesgo_sanitario === clave;
                    return (
                      <button
                        key={clave}
                        type="button"
                        onClick={() => actualizarCampo('riesgo_sanitario', clave)}
                        className={`opcion-riesgo ${activa ? 'opcion-riesgo--activa' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Insignia tono={nivel.tono}>Riesgo {clave}</Insignia>
                          <small style={{ fontWeight: 'bold' }}>${nivel.factorInsumoM2}/m²</small>
                        </div>
                        <strong>Paño: {nivel.colorPano}</strong>
                        <span>{nivel.descripcion}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tráfico Peatonal y Superficies */}
              <div className="form-grid-2" style={{ marginTop: '20px' }}>
                <Campo etiqueta="Nivel de Tráfico Peatonal (Reto 2)" ayuda="Impacta en la reposición y desgaste operativo">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.trafico_peatonal}
                      onChange={(e) => actualizarCampo('trafico_peatonal', e.target.value)}
                    >
                      <option value="">-- Elige nivel de tráfico peatonal --</option>
                      {Object.keys(NIVELES_TRAFICO).map((k) => (
                        <option key={k} value={k}>
                          {k} (Desgaste {NIVELES_TRAFICO[k].desgaste})
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>

                <Campo etiqueta="Tipo de Limpieza Principal">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.tipo_limpieza}
                      onChange={(e) => actualizarCampo('tipo_limpieza', e.target.value)}
                    >
                      <option value="">-- Elige tipo de limpieza principal --</option>
                      {TIPOS_LIMPIEZA.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
              </div>

              {/* Superficies Predominantes */}
              <div style={{ marginTop: '16px' }}>
                <label className="campo__etiqueta">Tipos de Superficie Predominantes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {SUPERFICIES_DISPONIBLES.map((sup, i) => {
                    const sel = formulario.superficies?.includes(sup);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleArrayItem('superficies', sup)}
                        className={`boton ${sel ? 'boton--destacado' : 'boton--secundario'} boton--pequeno`}
                      >
                        {sel ? '✓ ' : '+ '} {sup}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* C. Variables Operativas y Normativas */}
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>C. Variables Operativas y Normativas Exigidas</h3>
                <Insignia tono="info">Regulaciones & Turnos</Insignia>
              </div>
              <div className="form-grid-3">
                <Campo etiqueta="Normativas de Desinfección Exigidas">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.normativa}
                      onChange={(e) => actualizarCampo('normativa', e.target.value)}
                    >
                      <option value="">-- Elige normativa de desinfección --</option>
                      {NORMATIVAS_DISPONIBLES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo etiqueta="Frecuencia de Limpieza">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.frecuencia}
                      onChange={(e) => actualizarCampo('frecuencia', e.target.value)}
                    >
                      <option value="">-- Elige frecuencia del servicio --</option>
                      {FRECUENCIAS_DISPONIBLES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <Campo etiqueta="Turnos Requeridos">
                  {(id) => (
                    <select
                      id={id}
                      className="entrada"
                      value={formulario.turnos}
                      onChange={(e) => actualizarCampo('turnos', e.target.value)}
                    >
                      <option value="">-- Elige turnos requeridos --</option>
                      {TURNOS_DISPONIBLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
              </div>

              <div style={{ marginTop: '12px' }}>
                <Campo
                  etiqueta="Horario de Atención y Días"
                  ayuda="Clave para recargos legales (Art. 49 Código del Trabajo 25% nocturno y 100% extraordinarias)"
                >
                  {(id) => (
                    <input
                      id={id}
                      className="entrada"
                      value={formulario.horario}
                      onChange={(e) => actualizarCampo('horario', e.target.value)}
                      placeholder="Ej. Lunes a Viernes 07:00 - 15:30 / Sábado 08:00 - 12:00"
                    />
                  )}
                </Campo>
              </div>
            </section>

            {/* Botón de Guardado Rápido en Excel */}
            <div className="barra-acciones-excel">
              <div className="barra-acciones-excel__info">
                <h4>Persistencia Inmediata en Excel Local</h4>
                <p>Guarda el levantamiento actual con todas sus variables y cálculos en base_datos_levantamientos.xlsx</p>
              </div>
              <div className="barra-acciones-excel__botones">
                <Boton
                  variante="destacado"
                  onClick={guardarEnExcel}
                  disabled={guardandoExcel}
                >
                  {guardandoExcel ? 'Guardando en Excel...' : '💾 Guardar Levantamiento en Excel'}
                </Boton>
                <Boton variante="secundario" href="#/app/personal">
                  Continuar al Paso 2: Personal →
                </Boton>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PASO 2: PERSONAL (Dotación y Leyes Laborales Ecuador)
           ======================================================== */}
        {paso.id === 'personal' && (
          <div className="formulario-bloques">
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>Dotación y Costo de Personal (Código de Trabajo Ecuador)</h3>
                <Insignia tono="ok">SBU $460 + IESS 12.15% + Décimos</Insignia>
              </div>
              <p className="panel__desc">
                Calcula la dotación óptima de personal según el metraje intervenible ({calculos.m2Total.toLocaleString()} m²)
                y el nivel de riesgo ({formulario.riesgo_sanitario}). El costo base mensual incluye el Salario Básico Unificado de Ecuador,
                la aportación patronal al IESS, 13vo, 14vo sueldo y provisión de fondos de reserva (factor 1.42).
              </p>

              <div className="form-grid-3">
                {/* Operarios Generales */}
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Operación Rutinaria</span>
                  <h4>{COSTOS_PERSONAL_BASE.operario.titulo}</h4>
                  <p className="texto-suave" style={{ fontSize: '12px', margin: '4px 0 12px' }}>
                    {COSTOS_PERSONAL_BASE.operario.descripcion}
                  </p>
                    <div className="contador-grupo">
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('operarios', Math.max(0, formulario.operarios - 1))}
                    >
                      -
                    </button>
                    <span className="contador-valor">{formulario.operarios}</span>
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('operarios', formulario.operarios + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    Subtotal: ${(formulario.operarios * COSTOS_PERSONAL_BASE.operario.baseMensual).toLocaleString()} / mes
                  </div>
                </div>

                {/* Especialistas Técnicos */}
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Maquinistas / Alturas</span>
                  <h4>{COSTOS_PERSONAL_BASE.especialista.titulo}</h4>
                  <p className="texto-suave" style={{ fontSize: '12px', margin: '4px 0 12px' }}>
                    {COSTOS_PERSONAL_BASE.especialista.descripcion}
                  </p>
                  <div className="contador-grupo">
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('especialistas', Math.max(0, formulario.especialistas - 1))}
                    >
                      -
                    </button>
                    <span className="contador-valor">{formulario.especialistas}</span>
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('especialistas', formulario.especialistas + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    Subtotal: ${(formulario.especialistas * COSTOS_PERSONAL_BASE.especialista.baseMensual).toLocaleString()} / mes
                  </div>
                </div>

                {/* Supervisores */}
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Control Calidad</span>
                  <h4>{COSTOS_PERSONAL_BASE.supervisor.titulo}</h4>
                  <p className="texto-suave" style={{ fontSize: '12px', margin: '4px 0 12px' }}>
                    {COSTOS_PERSONAL_BASE.supervisor.descripcion}
                  </p>
                  <div className="contador-grupo">
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('supervisores', Math.max(0, formulario.supervisores - 1))}
                    >
                      -
                    </button>
                    <span className="contador-valor">{formulario.supervisores}</span>
                    <button
                      type="button"
                      className="contador-boton"
                      onClick={() => actualizarCampo('supervisores', formulario.supervisores + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                    Subtotal: ${(formulario.supervisores * COSTOS_PERSONAL_BASE.supervisor.baseMensual).toLocaleString()} / mes
                  </div>
                </div>
              </div>

              {/* Recargos Legales de Turnos */}
              <div className="panel" style={{ marginTop: '16px', background: '#fff' }}>
                <h4>Impacto del Turno y Horario de Atención ({formulario.turnos || 'Por definir'})</h4>
                <p className="texto-suave">
                  Factor multiplicador legal aplicado por recargo nocturno y rotativo: <strong>{calculos.factorTurno}x</strong>.
                  {formulario.turnos?.includes('24/7') && ' (Aplica 3 turnos rotativos continuos y recargo nocturno Art. 49).'}
                </p>
                <div style={{ marginTop: '12px', fontSize: '16px', fontWeight: '800', color: 'var(--marino)' }}>
                  Costo Total de Mano de Obra Mensual: {calculos.costoManoObra > 0 ? `$${calculos.costoManoObra.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '— (Sin dotación asignada)'}
                </div>
              </div>

              <div className="hero__acciones" style={{ marginTop: '20px' }}>
                <Boton variante="secundario" href="#/app/requisitos">
                  ← Volver a Requisitos
                </Boton>
                <Boton variante="destacado" href="#/app/insumos">
                  Continuar a Insumos →
                </Boton>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            PASO 3: INSUMOS (Químicos, Paños y Factores por Riesgo)
           ======================================================== */}
        {paso.id === 'insumos' && (
          <div className="formulario-bloques">
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>Cálculo de Insumos Químicos y Consumibles</h3>
                <Insignia tono={calculos.riesgoInfo.tono}>
                  {formulario.riesgo_sanitario ? `Riesgo ${formulario.riesgo_sanitario} · Paño ${calculos.riesgoInfo.colorPano}` : 'Riesgo sin definir'}
                </Insignia>
              </div>
              <p className="panel__desc">
                El costo mensual de insumos se estructura según el metraje intervenible ({calculos.m2Total > 0 ? `${calculos.m2Total.toLocaleString()} m²` : '0 m²'}),
                el factor microbiológico de riesgo (${calculos.riesgoInfo.factorInsumoM2}/m²), el multiplicador de tráfico peatonal ({formulario.trafico_peatonal || 'Por definir'}) y la frecuencia del servicio.
              </p>

              <div className="form-grid-2">
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <h4>Protocolo Químico Exigido ({formulario.normativa || 'Por definir'})</h4>
                  <p style={{ margin: '8px 0' }}>{calculos.riesgoInfo.quimicosBase || 'Selecciona un nivel de riesgo en Requisitos.'}</p>
                  <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--texto-suave)' }}>
                    <li>Código cromático obligatorio: microfibra color {calculos.riesgoInfo.colorPano}.</li>
                    <li>Registro sanitario obligatorio ante ARCSA / Agencia de Regulación.</li>
                    <li>Fichas de datos de seguridad (FDS / SDS) disponibles in situ.</li>
                  </ul>
                </div>

                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <h4>Resumen Matemático del Insumo</h4>
                  <table style={{ width: '100%', fontSize: '13px', marginTop: '8px' }}>
                    <tbody>
                      <tr>
                        <td>Área total intervenible:</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{calculos.m2Total > 0 ? `${calculos.m2Total.toLocaleString()} m²` : '0 m²'}</td>
                      </tr>
                      <tr>
                        <td>Factor base por riesgo:</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${calculos.riesgoInfo.factorInsumoM2} / m²</td>
                      </tr>
                      <tr>
                        <td>Impacto tráfico peatonal:</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formulario.trafico_peatonal ? formulario.trafico_peatonal.split('(')[0] : 'Por definir'}</td>
                      </tr>
                      <tr style={{ borderTop: '2px solid var(--marino)', fontSize: '15px' }}>
                        <td><strong>Costo Total Insumos:</strong></td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--marino)' }}>
                          {calculos.costoInsumos > 0 ? `$${calculos.costoInsumos.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mes` : '— (Sin m² o riesgo)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hero__acciones" style={{ marginTop: '20px' }}>
                <Boton variante="secundario" href="#/app/personal">
                  ← Volver a Personal
                </Boton>
                <Boton variante="destacado" href="#/app/equipos">
                  Continuar a Equipos →
                </Boton>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            PASO 4: EQUIPOS (Maquinaria Especial y Amortización)
           ======================================================== */}
        {paso.id === 'equipos' && (
          <div className="formulario-bloques">
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>Equipos de Protección Personal (EPP) y Maquinaria Especializada</h3>
                <Insignia tono="info">Amortización & Rendimiento</Insignia>
              </div>
              <p className="panel__desc">
                Selecciona la maquinaria necesaria para la tipología ({formulario.tipo_infraestructura}).
                Cada equipo incluye su costo mensual de amortización, mantenimiento preventivo y consumibles de desgaste.
              </p>

              <div className="form-grid-3">
                {CATALOGO_MAQUINARIA.map((maq) => {
                  const sel = formulario.maquinaria?.includes(maq.nombre);
                  return (
                    <div
                      key={maq.id}
                      onClick={() => toggleArrayItem('maquinaria', maq.nombre)}
                      className={`panel ${sel ? 'tarjeta-opcion--activa' : ''}`}
                      style={{
                        cursor: 'pointer',
                        border: sel ? '2px solid var(--azul)' : '1px solid var(--linea)',
                        background: sel ? 'var(--info-suave)' : 'var(--superficie)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong>{maq.nombre}</strong>
                        <input type="checkbox" checked={sel} readOnly style={{ accentColor: 'var(--azul)' }} />
                      </div>
                      <p className="texto-suave" style={{ fontSize: '12px', margin: '8px 0' }}>
                        Recomendado a partir de {maq.m2Minimos.toLocaleString()} m².
                      </p>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--marino)' }}>
                        ${maq.costoMensual.toFixed(2)} / mes
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hero__acciones" style={{ marginTop: '20px' }}>
                <Boton variante="secundario" href="#/app/insumos">
                  ← Volver a Insumos
                </Boton>
                <Boton variante="destacado" href="#/app/costos">
                  Continuar a Costos →
                </Boton>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            PASO 5: COSTOS (Motor Financiero y Rentabilidad)
           ======================================================== */}
        {paso.id === 'costos' && (
          <div className="formulario-bloques">
            <section className="formulario-bloque">
              <div className="formulario-bloque__cab">
                <h3>Motor Dinámico de Costos Unitarios y Margen de Rentabilidad</h3>
                <Insignia tono="ok">Reto 2: Oferta Diferenciada</Insignia>
              </div>

              {/* Slider de Margen de Rentabilidad */}
              <div className="panel" style={{ background: 'var(--superficie-2)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>Margen de Rentabilidad Deseado (%)</h4>
                    <p className="texto-suave">Ajusta el porcentaje de utilidad bruta esperada sobre el costo directo.</p>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--info)' }}>
                    {formulario.margen_rentabilidad}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="0.5"
                  value={formulario.margen_rentabilidad}
                  onChange={(e) => actualizarCampo('margen_rentabilidad', parseFloat(e.target.value))}
                  style={{ width: '100%', margin: '14px 0', accentColor: 'var(--info)' }}
                />
              </div>

              {/* Tabla Comparativa de Costos */}
              <table className="propuesta-tabla">
                <thead>
                  <tr>
                    <th>Componente de Costo</th>
                    <th style={{ textAlign: 'right' }}>Total Mensual ($)</th>
                    <th style={{ textAlign: 'right' }}>Costo Directo / m²</th>
                    <th style={{ textAlign: 'right' }}>Participación (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Mano de Obra ({formulario.operarios + formulario.especialistas + formulario.supervisores} personas · Turno {formulario.turnos || 'Por definir'})</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {calculos.costoManoObra > 0 ? `$${calculos.costoManoObra.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.m2Total > 0 && calculos.costoManoObra > 0 ? `$${(calculos.costoManoObra / calculos.m2Total).toFixed(3)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.costoDirectoTotal > 0 ? `${((calculos.costoManoObra / calculos.costoDirectoTotal) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Insumos Químicos y Desinfectantes (Riesgo {formulario.riesgo_sanitario || 'Por definir'})</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {calculos.costoInsumos > 0 ? `$${calculos.costoInsumos.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.m2Total > 0 && calculos.costoInsumos > 0 ? `$${(calculos.costoInsumos / calculos.m2Total).toFixed(3)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.costoDirectoTotal > 0 ? `${((calculos.costoInsumos / calculos.costoDirectoTotal) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td>Maquinaria y Equipos Especializados</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {calculos.costoMaquinaria > 0 ? `$${calculos.costoMaquinaria.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.m2Total > 0 && calculos.costoMaquinaria > 0 ? `$${(calculos.costoMaquinaria / calculos.m2Total).toFixed(3)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.costoDirectoTotal > 0 ? `${((calculos.costoMaquinaria / calculos.costoDirectoTotal) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                  <tr style={{ background: 'var(--superficie-2)', fontWeight: 'bold' }}>
                    <td>Costo Directo Mensual Acumulado:</td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.costoDirectoTotal > 0 ? `$${calculos.costoDirectoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {calculos.m2Total > 0 && calculos.costoDirectoTotal > 0 ? `$${calculos.costoDirectoUnitarioM2.toFixed(3)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{calculos.costoDirectoTotal > 0 ? '100.0%' : '—'}</td>
                  </tr>
                  <tr>
                    <td>Margen Bruto de Utilidad ({calculos.margenPct}%):</td>
                    <td style={{ textAlign: 'right', color: 'var(--ok)', fontWeight: 'bold' }}>
                      {calculos.margenBrutoDolares > 0 ? `+ $${calculos.margenBrutoDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--ok)' }}>
                      {calculos.m2Total > 0 && calculos.margenBrutoDolares > 0 ? `+ $${(calculos.margenBrutoDolares / calculos.m2Total).toFixed(3)}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>—</td>
                  </tr>
                  <tr className="propuesta-total-fila">
                    <td><strong>PRECIO DE VENTA OFERTA MENSUAL:</strong></td>
                    <td style={{ textAlign: 'right', color: 'var(--marino)' }}>
                      {calculos.precioOfertaFinal > 0 ? `$${calculos.precioOfertaFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--marino)' }}>
                      <strong>{calculos.costoUnitarioM2 > 0 ? `$${calculos.costoUnitarioM2.toFixed(3)} / m²` : '—'}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>—</td>
                  </tr>
                </tbody>
              </table>

              {/* Barra de Acciones con Excel */}
              <div className="barra-acciones-excel">
                <div className="barra-acciones-excel__info">
                  <h4>¿Listo para consolidar?</h4>
                  <p>Guarda esta estructura directamente en el libro Excel local para la evaluación del jurado.</p>
                </div>
                <div className="barra-acciones-excel__botones">
                  <Boton
                    variante="destacado"
                    onClick={guardarEnExcel}
                    disabled={guardandoExcel}
                  >
                    {guardandoExcel ? 'Guardando...' : '💾 Guardar en base_datos_levantamientos.xlsx'}
                  </Boton>
                  <Boton variante="secundario" href="#/app/propuesta">
                    Ir a Ficha de Propuesta →
                  </Boton>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            PASO 6: PROPUESTA & EXCEL (Entrega Oficial Reto 2)
           ======================================================== */}
        {paso.id === 'propuesta' && (
          <div className="formulario-bloques">
            <section className="propuesta-tarjeta">
              <div className="propuesta-cabecera">
                <div>
                  <span className="antetitulo">Oferta Técnica y Financiera Oficial · Expo Clean 2026</span>
                  <h2>{formulario.cliente || 'Nombre del Cliente por definir'}</h2>
                  <p className="texto-suave">
                    RUC: {formulario.ruc || '—'} · {formulario.ciudad || 'Ciudad por definir'} ({formulario.sector || 'Sector por definir'}) · {formulario.direccion || 'Dirección por definir'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Insignia tono={calculos.precioOfertaFinal > 0 ? 'ok' : 'neutro'}>
                    {calculos.precioOfertaFinal > 0 ? 'Propuesta Calculada' : 'Borrador sin completar'}
                  </Insignia>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--texto-suave)' }}>
                    Fecha: {fechaHoy}
                  </div>
                </div>
              </div>

              <div className="form-grid-3" style={{ marginBottom: '20px' }}>
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Infraestructura</span>
                  <strong>{formulario.tipo_infraestructura || 'Por definir'}</strong>
                  <p className="texto-suave" style={{ fontSize: '12px', marginTop: '4px' }}>
                    Área Total: {calculos.m2Total > 0 ? `${calculos.m2Total.toLocaleString()} m²` : '0 m²'} ({formulario.m2_cubierta || 0} m² cubierta / {formulario.m2_exterior || 0} m² exterior)
                  </p>
                </div>
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Riesgo & Normativa</span>
                  <strong>{formulario.riesgo_sanitario ? `Riesgo ${formulario.riesgo_sanitario} · Paño ${calculos.riesgoInfo.colorPano}` : 'Riesgo por definir'}</strong>
                  <p className="texto-suave" style={{ fontSize: '12px', marginTop: '4px' }}>
                    Norma: {formulario.normativa || 'Por definir'} · Tráfico: {formulario.trafico_peatonal ? formulario.trafico_peatonal.split('(')[0] : 'Por definir'}
                  </p>
                </div>
                <div className="panel" style={{ background: 'var(--superficie-2)' }}>
                  <span className="antetitulo">Operación & Turnos</span>
                  <strong>{formulario.turnos || 'Por definir'}</strong>
                  <p className="texto-suave" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {formulario.horario || 'Horario por definir'}
                  </p>
                </div>
              </div>

              {/* Resumen Económico */}
              <div className="panel" style={{ background: 'var(--marino)', color: '#fff', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--cian)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Valor Mensual Propuesto (Sin IVA)
                    </span>
                    <h2 style={{ fontSize: '36px', color: '#fff', margin: '4px 0' }}>
                      {calculos.precioOfertaFinal > 0 ? `$${calculos.precioOfertaFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </h2>
                    <span style={{ color: 'var(--texto-sobre-marino)' }}>
                      Costo Unitario Diferenciado: <strong>{calculos.costoUnitarioM2 > 0 ? `$${calculos.costoUnitarioM2.toFixed(3)} por m²` : '—'}</strong>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: 'var(--texto-sobre-marino)' }}>
                      Costo Directo Mensual: {calculos.costoDirectoTotal > 0 ? `$${calculos.costoDirectoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--cian)' }}>
                      Margen Bruto de Utilidad: {calculos.margenBrutoDolares > 0 ? `$${calculos.margenBrutoDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${calculos.margenPct}%)` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Acciones de Demostración para el Jurado */}
              <div className="barra-acciones-excel" style={{ marginTop: '24px' }}>
                <div className="barra-acciones-excel__info">
                  <h4>Base de Datos Local de Levantamientos (Excel)</h4>
                  <p>Guarda y abre en vivo el archivo base_datos_levantamientos.xlsx estructurado con openpyxl.</p>
                </div>
                <div className="barra-acciones-excel__botones">
                  <Boton
                    variante="destacado"
                    onClick={guardarEnExcel}
                    disabled={guardandoExcel}
                  >
                    {guardandoExcel ? 'Guardando...' : '💾 1. Guardar en Excel'}
                  </Boton>
                  <Boton
                    variante="destacado"
                    onClick={abrirExcelLocal}
                  >
                    🖥️ 2. Abrir en Excel Local (Demo Jurado)
                  </Boton>
                  <Boton
                    variante="secundario"
                    onClick={descargarExcel}
                  >
                    📥 3. Descargar Archivo .xlsx
                  </Boton>
                </div>
              </div>

              {/* Historial de Registros en la Base de Datos Excel */}
              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4>Historial de Cotizaciones en Base de Datos Excel</h4>
                  <button
                    type="button"
                    onClick={cargarHistorialExcel}
                    className="boton boton--secundario boton--pequeno"
                  >
                    🔄 Actualizar Historial
                  </button>
                </div>

                {cargandoHistorial ? (
                  <p className="texto-suave">Cargando registros desde base_datos_levantamientos.xlsx...</p>
                ) : historialCotizaciones.length === 0 ? (
                  <p className="texto-suave">Todavía no hay cotizaciones guardadas en el libro Excel.</p>
                ) : (
                  <div className="tabla-contenedor">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Área</th>
                          <th>Riesgo</th>
                          <th style={{ textAlign: 'right' }}>Costo Directo</th>
                          <th style={{ textAlign: 'right' }}>Precio Oferta</th>
                          <th style={{ textAlign: 'right' }}>$/m²</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialCotizaciones.map((cot, i) => (
                          <tr key={cot.id_cotizacion || i}>
                            <td style={{ fontWeight: 'bold' }}>{cot.id_cotizacion}</td>
                            <td>{cot.fecha_registro}</td>
                            <td>{cot.cliente}</td>
                            <td>{Number(cot.m2_total).toLocaleString()} m²</td>
                            <td>
                              <Insignia
                                tono={
                                  cot.riesgo_sanitario === 'Crítico' || cot.riesgo_sanitario === 'Alto'
                                    ? 'error'
                                    : cot.riesgo_sanitario === 'Medio'
                                    ? 'aviso'
                                    : 'ok'
                                }
                              >
                                {cot.riesgo_sanitario}
                              </Insignia>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              ${Number(cot.costo_directo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                              ${Number(cot.precio_oferta).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                              ${Number(cot.costo_unitario_m2).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
