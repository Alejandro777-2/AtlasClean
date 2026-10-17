/**
 * Si una pantalla falla al dibujarse, muestra el error con la estética de Atlas en vez de dejar la página en blanco.
 * React solo permite capturar estos errores con un componente de clase.
 */
import { Component } from 'react';
import { Aviso, AtlasLogo, Boton } from './ui.jsx';
import { CLAVE_BORRADOR } from '../estado/borrador.js';

export default class ErrorPantalla extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Atlas] Error al mostrar la pantalla:', error, info?.componentStack);
  }

  reiniciar = () => {
    try {
      localStorage.removeItem(CLAVE_BORRADOR);
    } catch {
      /* sin almacenamiento: no hay nada que borrar */
    }
    window.location.hash = '#/app/visita';
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-pantalla">
        <AtlasLogo height={32} letters="currentColor" />
        <Aviso
          tono="error"
          titulo="No se pudo mostrar esta pantalla"
          acciones={
            <>
              <Boton variante="secundario" onClick={() => window.location.reload()}>
                Recargar
              </Boton>
              <Boton variante="primario" onClick={this.reiniciar}>
                Borrar datos guardados y recargar
              </Boton>
            </>
          }
        >
          {String(this.state.error?.message ?? this.state.error)}
        </Aviso>
      </div>
    );
  }
}
